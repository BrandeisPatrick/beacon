import OpenAI from "openai";
import { dbPendingBatches, dbUpsertScores, dbCompleteBatch } from "../../lib/db.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function parseStructured(lineObj) {
  const body = lineObj?.response?.body;
  // Responses API often includes a shortcut:
  const txt = body?.output_text
           // fallback: first output item text
           ?? body?.output?.[0]?.content?.[0]?.text;

  if (!txt) {
    throw new Error("No output_text in response body");
  }

  return JSON.parse(txt); // structured outputs returns strict JSON string
}

export default async function handler(req, res) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const batches = await dbPendingBatches();

    if (!batches.length) {
      return res.status(200).json({ message: "No pending batches" });
    }

    let processedCount = 0;

    for (const batch of batches) {
      const info = await client.batches.retrieve(batch.batch_id);

      if (info.status !== "completed") {
        console.log(`Batch ${batch.batch_id} still ${info.status}`);
        continue;
      }

      console.log(`Processing completed batch: ${batch.batch_id}`);

      // Download results file (JSONL)
      const file = await client.files.content(info.output_file_id);
      const text = await file.text();

      let successCount = 0;
      let errorCount = 0;

      for (const line of text.trim().split("\n")) {
        try {
          const obj = JSON.parse(line);
          const placeId = String(obj.custom_id).replace(/^shop_/, "");

          if (obj.response?.status_code !== 200) {
            console.error(`Failed request for ${placeId}:`, obj.response?.body);
            errorCount++;
            continue;
          }

          const parsed = parseStructured(obj);

          await dbUpsertScores(placeId, {
            decoration: parsed.decoration,
            coffee: parsed.coffee,
            study_suitable: parsed.studySuitable,
            parking: parsed.parking,
            evidence: parsed.evidence,
            sources: parsed.sources_used,
            model: info.request_counts?.model ?? "gpt-4o-mini",
            batch_id: batch.batch_id
          });

          successCount++;
        } catch (error) {
          console.error(`Error processing line for batch ${batch.batch_id}:`, error);
          errorCount++;
        }
      }

      // Calculate cost estimate (rough approximation)
      const totalTokens = info.request_counts?.total_tokens || (successCount * 200); // Estimate
      const costEstimate = (totalTokens / 1000) * 0.0015; // Rough GPT-4o-mini pricing

      await dbCompleteBatch(batch.batch_id, {
        output_file_id: info.output_file_id,
        success_count: successCount,
        error_count: errorCount,
        total_tokens: totalTokens,
        cost_estimate: costEstimate
      });

      console.log(`Batch ${batch.batch_id}: ${successCount} success, ${errorCount} errors, ~$${costEstimate.toFixed(3)}`);
      processedCount++;
    }

    return res.status(200).json({
      message: `Processed ${processedCount} completed batches`,
      processed_batches: processedCount
    });

  } catch (error) {
    console.error('Check batch error:', error);
    return res.status(500).json({
      error: 'Failed to check batches',
      details: error.message
    });
  }
}