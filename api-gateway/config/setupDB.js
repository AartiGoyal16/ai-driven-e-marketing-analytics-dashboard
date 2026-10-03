const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const setupDatabase = async () => {
    const createSchemaSql = `
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS campaigns (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            platform VARCHAR(50) NOT NULL,
            budget DECIMAL(10,2) NOT NULL,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS daily_metrices (
            id SERIAL PRIMARY KEY,
            campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            impressions INTEGER DEFAULT 0,
            clicks INTEGER DEFAULT 0,
            spend DECIMAL(10,2) DEFAULT 0.00,
            conversions INTEGER DEFAULT 0,
            UNIQUE(campaign_id, date)
        );
    `;

    const seedDataSql = `
        INSERT INTO campaigns (name, platform, budget, status)
        VALUES 
            ('Q4 Search Growth', 'Google', 5000.00, 'active'),
            ('Retargeting Campaign', 'Meta', 2500.00, 'active'),
            ('B2B Lead Generation', 'LinkedIn', 8000.00, 'paused')
        ON CONFLICT DO NOTHING;

        INSERT INTO daily_metrices (campaign_id, date, impressions, clicks, spend, conversions)
        VALUES 
            (1, '2026-10-01', 14200, 950, 480.00, 72),
            (1, '2026-09-30', 12800, 840, 420.00, 61),
            (2, '2026-10-01', 9800, 610, 310.00, 45),
            (2, '2026-09-30', 10400, 690, 340.00, 52),
            (3, '2026-10-01', 5200, 210, 650.00, 18)
        ON CONFLICT DO NOTHING;
    `;

    try {
        console.log('Creating database tables...');
        await pool.query(createSchemaSql);
        console.log('Database tables created successfully!');

        console.log('Seeding initial PostgreSQL records...');
        await pool.query(seedDataSql);
        console.log('Database seeded successfully!');
    } catch (err) {
        console.error('Error during database setup:', err);
    } finally {
        await pool.end();
    }
};

setupDatabase();