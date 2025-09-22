import { dbGetBatchLogs } from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const { limit = 50 } = req.query;

    const logs = await dbGetBatchLogs(parseInt(limit));

    // Calculate totals for summary
    const summary = logs.reduce((acc, log) => {
      acc.totalBatches++;
      if (log.status === 'completed') {
        acc.completedBatches++;
        acc.totalShops += log.shop_count || 0;
        acc.totalSuccesses += log.success_count || 0;
        acc.totalErrors += log.error_count || 0;
        acc.totalTokens += log.total_tokens || 0;
        acc.totalCost += log.cost_estimate || 0;
      } else if (log.status === 'submitted') {
        acc.pendingBatches++;
      }
      return acc;
    }, {
      totalBatches: 0,
      completedBatches: 0,
      pendingBatches: 0,
      totalShops: 0,
      totalSuccesses: 0,
      totalErrors: 0,
      totalTokens: 0,
      totalCost: 0
    });

    return res.status(200).json({
      success: true,
      logs,
      summary,
      count: logs.length
    });

  } catch (error) {
    console.error('Error fetching batch logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch batch logs',
      details: error.message
    });
  }
}