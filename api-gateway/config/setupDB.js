const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const setupDatabase = async () => {
    try {
        console.log('--- Initiating Database Migration & Schema Setup ---');

        // Step 1: Safely rename legacy daily_metrices table if it exists and daily_metrics does not
        const checkLegacyTableQuery = `
            SELECT to_regclass('public.daily_metrices') as legacy_table,
                   to_regclass('public.daily_metrics') as modern_table;
        `;
        const tableCheckRes = await pool.query(checkLegacyTableQuery);
        const { legacy_table, modern_table } = tableCheckRes.rows[0];

        if (legacy_table && !modern_table) {
            console.log('Renaming legacy daily_metrices table to daily_metrics...');
            await pool.query(`ALTER TABLE daily_metrices RENAME TO daily_metrics;`);
            console.log('Table successfully renamed to daily_metrics!');
        }

        // Step 2: Create or verify tables
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
                budget DECIMAL(12,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS daily_metrics (
                id SERIAL PRIMARY KEY,
                campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
                date DATE NOT NULL,
                impressions INTEGER DEFAULT 0,
                clicks INTEGER DEFAULT 0,
                spend DECIMAL(12,2) DEFAULT 0.00,
                conversions INTEGER DEFAULT 0,
                UNIQUE(campaign_id, date)
            );

            CREATE TABLE IF NOT EXISTS prediction_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
                platform VARCHAR(50) NOT NULL,
                budget DECIMAL(12,2) NOT NULL,
                status VARCHAR(50) NOT NULL,
                target_audience VARCHAR(100),
                campaign_objective VARCHAR(100),
                predicted_roi DECIMAL(6,2) NOT NULL,
                predicted_clicks INTEGER NOT NULL,
                predicted_conversions INTEGER NOT NULL,
                confidence_score DECIMAL(5,2) NOT NULL,
                actual_roi DECIMAL(6,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createSchemaSql);
        console.log('Schema verified/created.');

        // Step 3: Add database indexes
        const createIndexesSql = `
            CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON campaigns(platform);
            CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
            CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
            CREATE INDEX IF NOT EXISTS idx_daily_metrics_campaign_id ON daily_metrics(campaign_id);
            CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
            CREATE INDEX IF NOT EXISTS idx_prediction_history_user_id ON prediction_history(user_id);
            CREATE INDEX IF NOT EXISTS idx_prediction_history_created_at ON prediction_history(created_at);
        `;
        await pool.query(createIndexesSql);
        console.log('Database indexes applied successfully.');

        // Step 4: Seed initial campaigns if empty
        const campaignCountRes = await pool.query('SELECT COUNT(*) FROM campaigns');
        if (parseInt(campaignCountRes.rows[0].count) === 0) {
            console.log('Seeding initial campaigns...');
            await pool.query(`
                INSERT INTO campaigns (name, platform, budget, status)
                VALUES 
                    ('Q4 Search Growth', 'Google', 5000.00, 'active'),
                    ('Retargeting Campaign', 'Meta', 2500.00, 'active'),
                    ('B2B Lead Generation', 'LinkedIn', 8000.00, 'paused'),
                    ('Gen-Z TikTok Launch', 'TikTok', 3500.00, 'active'),
                    ('Brand Video Story', 'YouTube', 4000.00, 'active');
            `);
        }

        // Step 5: Seed 14-day daily metrics for realistic charts
        const metricsCountRes = await pool.query('SELECT COUNT(*) FROM daily_metrics');
        if (parseInt(metricsCountRes.rows[0].count) < 10) {
            console.log('Seeding 14-day dynamic performance metrics across platforms...');
            
            // Get all campaigns
            const camps = await pool.query('SELECT id, platform FROM campaigns');
            const dates = [];
            const now = new Date();
            for (let i = 14; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                dates.push(d.toISOString().slice(0, 10));
            }

            for (const camp of camps.rows) {
                for (const dt of dates) {
                    const baseImp = camp.platform === 'TikTok' ? 25000 : camp.platform === 'Google' ? 14000 : camp.platform === 'Meta' ? 18000 : 7000;
                    const jitter = 0.85 + Math.random() * 0.3;
                    const imp = Math.round(baseImp * jitter);
                    const ctr = camp.platform === 'TikTok' ? 0.042 : camp.platform === 'Google' ? 0.038 : camp.platform === 'Meta' ? 0.024 : 0.018;
                    const clicks = Math.round(imp * ctr * (0.9 + Math.random() * 0.2));
                    const cpc = camp.platform === 'LinkedIn' ? 3.8 : camp.platform === 'Google' ? 1.8 : camp.platform === 'TikTok' ? 0.85 : 1.25;
                    const spend = Math.round(clicks * cpc * 100) / 100;
                    const cr = camp.platform === 'LinkedIn' ? 0.085 : camp.platform === 'Google' ? 0.075 : 0.055;
                    const conversions = Math.round(clicks * cr * (0.9 + Math.random() * 0.2));

                    await pool.query(`
                        INSERT INTO daily_metrics (campaign_id, date, impressions, clicks, spend, conversions)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (campaign_id, date) DO UPDATE 
                        SET impressions = EXCLUDED.impressions,
                            clicks = EXCLUDED.clicks,
                            spend = EXCLUDED.spend,
                            conversions = EXCLUDED.conversions;
                    `, [camp.id, dt, imp, clicks, spend, conversions]);
                }
            }
            console.log('Daily performance metrics successfully seeded!');
        }

        // Step 6: Seed initial prediction history if empty
        const predCountRes = await pool.query('SELECT COUNT(*) FROM prediction_history');
        if (parseInt(predCountRes.rows[0].count) === 0) {
            console.log('Seeding initial prediction history with predicted vs actual ROI...');
            await pool.query(`
                INSERT INTO prediction_history 
                    (platform, budget, status, target_audience, campaign_objective, predicted_roi, predicted_clicks, predicted_conversions, confidence_score, actual_roi)
                VALUES 
                    ('Google', 5000.00, 'completed', 'ecommerce_shoppers', 'conversions', 1.65, 1890, 176, 0.93, 1.72),
                    ('Meta', 2500.00, 'completed', 'general_consumers', 'conversions', 1.45, 1420, 92, 0.89, 1.38),
                    ('LinkedIn', 8000.00, 'completed', 'b2b_professionals', 'lead_generation', 1.35, 1580, 142, 0.91, 1.40),
                    ('TikTok', 3500.00, 'active', 'gen_z_tech', 'engagement', 1.40, 2900, 130, 0.88, NULL),
                    ('YouTube', 4000.00, 'active', 'young_adults', 'brand_awareness', 1.55, 1600, 110, 0.90, NULL);
            `);
            console.log('Prediction history seeded successfully!');
        }

        console.log('--- Database Setup & Migration Completed Successfully ---');
    } catch (err) {
        console.error('Error during database setup:', err);
        throw err;
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase };