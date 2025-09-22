import OpenAI from "openai";
import { writeFileSync, unlinkSync, createReadStream } from "node:fs";
import { buildBatchJsonl } from "../../lib/build-jsonl.js";
import { dbPickShopsNeedingScore, dbRecordBatchStart } from "../../lib/db.js";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch a slice of shops you want to (re)score
    const shops = await dbPickShopsNeedingScore(50); // Keep small for cost control

    if (!shops.length) {
      return res.status(200).json({ message: "No shops need scoring" });
    }

    console.log(`Found ${shops.length} shops needing scores`);

    // 1) Build JSONL
    const jsonl = buildBatchJsonl(shops);
    const path = `/tmp/batch-${Date.now()}.jsonl`;
    writeFileSync(path, jsonl);

    // 2) Upload file for Batch
    const file = await client.files.create({
      file: createReadStream(path),
      purpose: "batch"
    });
    unlinkSync(path);

    console.log(`Uploaded batch file: ${file.id}`);

    // 3) Create the batch job
    const batch = await client.batches.create({
      input_file_id: file.id,
      endpoint: "/v1/responses",
      completion_window: "24h"
    });

    console.log(`Created batch: ${batch.id}`);

    // Record batch id + which shops are in it
    await dbRecordBatchStart(batch.id, shops.map(s => s.place_id));

    return res.status(200).json({
      message: `Created batch ${batch.id}`,
      batch_id: batch.id,
      shops_count: shops.length
    });

  } catch (error) {
    console.error('Submit batch error:', error);
    return res.status(500).json({
      error: 'Failed to submit batch',
      details: error.message
    });
  }
}