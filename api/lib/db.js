import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

async function getDb() {
  if (!db) {
    try {
      db = await open({
        filename: '/tmp/beacon.db',
        driver: sqlite3.Database
      });
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database unavailable');
    }

    // Initialize tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS coffee_shops (
        place_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT,
        zipCode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS batch_jobs (
        batch_id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'submitted',
        shop_ids TEXT,
        shop_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        output_file_id TEXT,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        cost_estimate REAL DEFAULT 0.0
      );

      CREATE TABLE IF NOT EXISTS enriched_scores (
        place_id TEXT PRIMARY KEY,
        decoration INTEGER,
        coffee INTEGER,
        study_suitable INTEGER,
        parking TEXT,
        evidence TEXT,
        sources TEXT,
        model TEXT,
        batch_id TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (place_id) REFERENCES coffee_shops(place_id),
        FOREIGN KEY (batch_id) REFERENCES batch_jobs(batch_id)
      );
    `);
  }
  return db;
}

export async function dbPickShopsNeedingScore(limit = 250) {
  const database = await getDb();

  // First, ensure we have shops in the database from the existing JSON data
  await initializeCoffeeShops();

  // Get shops that either have no scores or scores older than 7 days
  const shops = await database.all(`
    SELECT cs.place_id, cs.name, cs.address, cs.city, cs.zipCode
    FROM coffee_shops cs
    LEFT JOIN enriched_scores es ON cs.place_id = es.place_id
    WHERE es.place_id IS NULL
       OR es.updated_at < datetime('now', '-7 days')
    LIMIT ?
  `, [limit]);

  return shops;
}

export async function dbRecordBatchStart(batchId, shopIds) {
  const database = await getDb();

  await database.run(`
    INSERT INTO batch_jobs (batch_id, shop_ids, shop_count, status)
    VALUES (?, ?, ?, 'submitted')
  `, [batchId, JSON.stringify(shopIds), shopIds.length]);
}

export async function dbPendingBatches() {
  const database = await getDb();

  return await database.all(`
    SELECT batch_id, shop_ids FROM batch_jobs
    WHERE status = 'submitted'
  `);
}

export async function dbUpsertScores(placeId, scores) {
  const database = await getDb();

  await database.run(`
    INSERT OR REPLACE INTO enriched_scores
    (place_id, decoration, coffee, study_suitable, parking, evidence, sources, model, batch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    placeId,
    scores.decoration,
    scores.coffee,
    scores.study_suitable,
    scores.parking,
    JSON.stringify(scores.evidence),
    JSON.stringify(scores.sources),
    scores.model,
    scores.batch_id
  ]);
}

export async function dbCompleteBatch(batchId, metadata) {
  const database = await getDb();

  await database.run(`
    UPDATE batch_jobs
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, output_file_id = ?,
        success_count = ?, error_count = ?, total_tokens = ?, cost_estimate = ?
    WHERE batch_id = ?
  `, [
    metadata.output_file_id,
    metadata.success_count || 0,
    metadata.error_count || 0,
    metadata.total_tokens || 0,
    metadata.cost_estimate || 0.0,
    batchId
  ]);
}

export async function dbGetBatchLogs(limit = 50) {
  const database = await getDb();

  return await database.all(`
    SELECT
      batch_id,
      status,
      shop_count,
      success_count,
      error_count,
      total_tokens,
      cost_estimate,
      created_at,
      completed_at,
      CASE
        WHEN completed_at IS NOT NULL
        THEN ROUND((julianday(completed_at) - julianday(created_at)) * 24, 2)
        ELSE NULL
      END as duration_hours
    FROM batch_jobs
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit]);
}

export async function dbGetEnrichedShops(city = 'atlanta') {
  const database = await getDb();

  const shops = await database.all(`
    SELECT
      cs.place_id,
      cs.name,
      cs.address,
      cs.city,
      cs.zipCode,
      es.decoration,
      es.coffee,
      es.study_suitable,
      es.parking,
      es.evidence,
      es.sources,
      es.updated_at
    FROM coffee_shops cs
    LEFT JOIN enriched_scores es ON cs.place_id = es.place_id
    WHERE cs.city = ? OR ? IS NULL
  `, [city, city]);

  return shops.map(shop => ({
    type: "Coffee Shop",
    place_id: shop.place_id,
    name: shop.name,
    location: shop.address,
    zipCode: shop.zipCode,
    ratings: {
      decoration: shop.decoration || 0,
      coffee: shop.coffee || 0,
      studySuitable: shop.study_suitable || 0
    },
    parking: shop.parking || "unknown",
    evidence: shop.evidence ? JSON.parse(shop.evidence) : [],
    sources: shop.sources ? JSON.parse(shop.sources) : [],
    lastUpdated: shop.updated_at
  }));
}

async function initializeCoffeeShops() {
  const database = await getDb();

  // Check if we already have shops
  const count = await database.get('SELECT COUNT(*) as count FROM coffee_shops');
  if (count.count > 0) return;

  // Load from existing JSON data and populate database
  try {
    // In serverless environment, we'll need to import the data directly
    const data = {
      "atlanta": [
        {
          "type": "Coffee Shop",
          "name": "Starbucks Reserve",
          "location": "999 Peachtree St NE",
          "zipCode": "30309",
          "ratings": { "decoration": 3, "coffee": 2, "studySuitable": 2 },
          "parking": "paid"
        },
        {
          "type": "Coffee Shop",
          "name": "Octane Coffee",
          "location": "1009 Marietta St NW",
          "zipCode": "30318",
          "ratings": { "decoration": 3, "coffee": 3, "studySuitable": 3 },
          "parking": "free"
        }
      ]
    };

    const stmt = await database.prepare(`
      INSERT OR IGNORE INTO coffee_shops (place_id, name, address, city, zipCode)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const [city, shops] of Object.entries(data)) {
      for (const shop of shops) {
        const placeId = `${shop.name.toLowerCase().replace(/\s+/g, '_')}_${shop.zipCode}`;
        await stmt.run([placeId, shop.name, shop.location, city, shop.zipCode]);
      }
    }

    await stmt.finalize();
  } catch (error) {
    console.error('Failed to initialize coffee shops:', error);
  }
}