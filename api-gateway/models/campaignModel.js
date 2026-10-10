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

const getCampaignsPaged = async ({ page = 1, limit = 10, search = '', platform = 'All', status = 'All' } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const values = [];

        if (search && search.trim() !== '') {
            values.push(`%${search.trim().toLowerCase()}%`);
            whereClauses.push(`LOWER(name) LIKE $${values.length}`);
        }

        if (platform && platform !== 'All') {
            values.push(platform.toLowerCase());
            whereClauses.push(`LOWER(platform) = $${values.length}`);
        }

        if (status && status !== 'All') {
            values.push(status.toLowerCase());
            whereClauses.push(`LOWER(status) = $${values.length}`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Total count
        const countQuery = `SELECT COUNT(*) FROM campaigns ${whereSql}`;
        const countResult = await pool.query(countQuery, values);
        const totalCount = parseInt(countResult.rows[0].count, 10);

        // Paged items
        values.push(limit);
        const limitParam = values.length;
        values.push(offset);
        const offsetParam = values.length;

        const itemsQuery = `
            SELECT * FROM campaigns
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${limitParam} OFFSET $${offsetParam};
        `;
        const itemsResult = await pool.query(itemsQuery, values);

        return {
            items: itemsResult.rows,
            totalCount,
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalCount / limit))
        };
    } catch (error) {
        console.error('Error in getCampaignsPaged:', error);
        throw new Error('Failed to fetch paginated campaigns.');
    }
};

const getCampaignById = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM campaigns WHERE id = $1', [id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error in getCampaignById:', error);
        throw new Error('Failed to fetch campaign by ID.');
    }
};

const createCampaign = async (name, platform, budget, status = 'active') => {
    try {
        const query = `
            INSERT INTO campaigns (name, platform, budget, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [name, platform, budget, status];

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

const getDailyMetrics = async (campaignId, startDate, endDate, range) => {
    try {
        const conditions = [];
        const values = [];

        if (campaignId) {
            values.push(campaignId);
            conditions.push(`campaign_id = $${values.length}`);
        }

        if (startDate && endDate) {
            values.push(startDate);
            conditions.push(`date >= $${values.length}`);
            values.push(endDate);
            conditions.push(`date <= $${values.length}`);
        } else if (range) {
            const days = range === 'today' ? 0 : range === '7d' ? 7 : range === '30d' ? 30 : null;
            if (days !== null) {
                conditions.push(`date >= CURRENT_DATE - INTERVAL '${days} day'`);
            }
        }

        const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `SELECT * FROM daily_metrics ${whereSql} ORDER BY date DESC, id DESC`;

        const result = await pool.query(query, values);
        return result.rows;
    } catch (error) {
        console.error('Error fetching daily_metrics from PostgreSQL:', error);
        throw new Error('Database Error: Failed to fetch daily metrics from PostgreSQL.');
    }
};

const getPlatformComparison = async (range) => {
    try {
        let dateCondition = '';
        if (range === 'today') {
            dateCondition = `AND m.date = CURRENT_DATE`;
        } else if (range === '7d') {
            dateCondition = `AND m.date >= CURRENT_DATE - INTERVAL '7 day'`;
        } else if (range === '30d') {
            dateCondition = `AND m.date >= CURRENT_DATE - INTERVAL '30 day'`;
        }

        const query = `
            SELECT 
                c.platform,
                COALESCE(SUM(c.budget), 0) as total_budget,
                COALESCE(SUM(m.spend), 0) as total_spend,
                COALESCE(SUM(m.impressions), 0) as total_impressions,
                COALESCE(SUM(m.clicks), 0) as total_clicks,
                COALESCE(SUM(m.conversions), 0) as total_conversions,
                CASE 
                    WHEN COALESCE(SUM(m.impressions), 0) > 0 
                    THEN ROUND((SUM(m.clicks)::numeric / SUM(m.impressions)::numeric) * 100, 2)
                    ELSE 0.00
                END as avg_ctr,
                CASE 
                    WHEN COALESCE(SUM(m.clicks), 0) > 0 
                    THEN ROUND(SUM(m.spend)::numeric / SUM(m.clicks)::numeric, 2)
                    ELSE 0.00
                END as avg_cpc,
                CASE 
                    WHEN COALESCE(SUM(m.spend), 0) > 0 
                    THEN ROUND((SUM(m.conversions)::numeric * 45.0 / SUM(m.spend)::numeric), 2)
                    ELSE 1.45
                END as avg_roi
            FROM campaigns c
            LEFT JOIN daily_metrics m ON c.id = m.campaign_id ${dateCondition}
            GROUP BY c.platform
            ORDER BY total_spend DESC;
        `;
        const result = await pool.query(query);
        return result.rows.map(r => ({
            platform: r.platform,
            totalBudget: parseFloat(r.total_budget),
            totalSpend: parseFloat(r.total_spend),
            totalImpressions: parseInt(r.total_impressions, 10),
            totalClicks: parseInt(r.total_clicks, 10),
            totalConversions: parseInt(r.total_conversions, 10),
            avgCtr: parseFloat(r.avg_ctr),
            avgCpc: parseFloat(r.avg_cpc),
            avgRoi: parseFloat(r.avg_roi)
        }));
    } catch (error) {
        console.error('Error calculating platform comparison:', error);
        throw new Error('Failed to compute platform comparison metrics.');
    }
};

module.exports = {
    getAllCampaigns,
    getCampaignsPaged,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getDailyMetrics,
    getPlatformComparison
};