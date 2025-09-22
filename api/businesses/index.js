import { dbGetEnrichedShops } from "../lib/db.js";

export default async function handler(req, res) {
  try {
    const { city = 'atlanta' } = req.query;

    let enrichedShops = [];
    try {
      enrichedShops = await dbGetEnrichedShops(city);
    } catch (dbError) {
      console.log('Database not available, returning empty data:', dbError.message);
      // Return empty array when database is not available
      enrichedShops = [];
    }

    return res.status(200).json({
      success: true,
      data: enrichedShops,
      count: enrichedShops.length,
      city: city
    });

  } catch (error) {
    console.error('Error fetching enriched businesses:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch business data',
      details: error.message
    });
  }
}