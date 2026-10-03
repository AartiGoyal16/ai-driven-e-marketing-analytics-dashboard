const { pool } = require('../config/db');

const getAllCampaigns = async () => {
    try {
        const result = await pool.query('SELECT * FROM campaigns ORDER BY created_at DESC');
        return result.rows;
    } catch (error) {
        console.error('Error fetching campaigns from PostgreSQL:', error);
        throw new Error('Failed to fetch campaigns from database.');
    }
};

const createCampaign = async (name, platform, budget) => {
    try {
        const query = `
            INSERT INTO campaigns (name, platform, budget)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, platform, budget];

        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw new Error('Failed to create campaign in database.');
    }
};

const updateCampaign = async (id, name, platform, budget, status) => {
    try {
        const query = `
            UPDATE campaigns
            SET
                name = COALESCE($1, name),
                platform = COALESCE($2, platform),
                budget = COALESCE($3, budget),
                status = COALESCE($4, status)
            WHERE id = $5
            RETURNING *;
        `;

        const values = [
            name !== undefined ? name : null,
            platform !== undefined ? platform : null,
            budget !== undefined ? budget : null,
            status !== undefined ? status : null,
            id
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating campaign:', error);
        throw new Error('Failed to update campaign in database.');
    }
};

const deleteCampaign = async (id) => {
    try {
        const query = `
            DELETE FROM campaigns
            WHERE id = $1
            RETURNING id;
        `;

        const result = await pool.query(query, [id]);
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error deleting campaign:', error);
        throw new Error('Failed to delete campaign from database.');
    }
};

const getDailyMetrics = async (campaignId) => {
    try {
        let query = 'SELECT * FROM daily_metrices ORDER BY date DESC';
        let values = [];
        if (campaignId) {
            query = 'SELECT * FROM daily_metrices WHERE campaign_id = $1 ORDER BY date DESC';
            values = [campaignId];
        }
        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error fetching daily_metrices from PostgreSQL:', error);
        throw new Error('Database Error: Failed to fetch daily metrics from PostgreSQL.');
    }
};

module.exports = { getAllCampaigns, createCampaign, updateCampaign, deleteCampaign, getDailyMetrics };