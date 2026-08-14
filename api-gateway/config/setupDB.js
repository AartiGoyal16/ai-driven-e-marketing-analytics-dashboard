const {Pool}=require('pg');
require('dotenv').config();

const pool=new Pool({
    connectionString:process.env.DATABASE_URL,
});

const createTables=async()=>{
    const sql=`
        CREATE TABLE IF NOT EXISTS campaigns (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            platform VARCHAR(50) not null,
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
            UNIQUE(campaign_id,date)
        );
    `;

    try{
        console.log('Creating tables...');
        await pool.query(sql);
        console.log('Tables created successfully!');
    }
    catch(err){
        console.error('Error creating tables:',err);
    }
    finally{
        await pool.end();
    }
};

createTables();