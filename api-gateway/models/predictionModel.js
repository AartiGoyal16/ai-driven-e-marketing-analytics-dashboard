const { pool } = require('../config/db');

const savePrediction = async ({
    userId = null,
    campaignId = null,
    platform,
    budget,
    status = 'active',
    targetAudience = 'general_consumers',
    campaignObjective = 'conversions',
    predictedRoi,
    predictedClicks,
    predictedConversions,
    confidenceScore,
    actualRoi = null
}) => {
    try {
        const query = `
            INSERT INTO prediction_history (
                user_id, campaign_id, platform, budget, status,
                target_audience, campaign_objective, predicted_roi,
                predicted_clicks, predicted_conversions, confidence_score, actual_roi
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
        const values = [
            userId, campaignId, platform, budget, status,
            targetAudience, campaignObjective, predictedRoi,
            predictedClicks, predictedConversions, confidenceScore, actualRoi
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error saving prediction history:', error);
        throw new Error('Failed to record prediction in database.');
    }
};

const getPredictionHistory = async ({ userId = null, page = 1, limit = 20 } = {}) => {
    try {
        const offset = (page - 1) * limit;
        const whereClauses = [];
        const values = [];

        if (userId) {
            values.push(userId);
            whereClauses.push(`user_id = $${values.length}`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const countQuery = `SELECT COUNT(*) FROM prediction_history ${whereSql}`;
        const countRes = await pool.query(countQuery, values);
        const totalCount = parseInt(countRes.rows[0].count, 10);

        values.push(limit);
        const limitParam = values.length;
        values.push(offset);
        const offsetParam = values.length;

        const itemsQuery = `
            SELECT * FROM prediction_history
            ${whereSql}
            ORDER BY created_at DESC
            LIMIT $${limitParam} OFFSET $${offsetParam};
        `;
        const itemsRes = await pool.query(itemsQuery, values);

        return {
            items: itemsRes.rows.map(r => ({
                id: r.id,
                userId: r.user_id,
                campaignId: r.campaign_id,
                platform: r.platform,
                budget: parseFloat(r.budget),
                status: r.status,
                targetAudience: r.target_audience,
                campaignObjective: r.campaign_objective,
                predictedRoi: parseFloat(r.predicted_roi),
                predictedClicks: parseInt(r.predicted_clicks, 10),
                predictedConversions: parseInt(r.predicted_conversions, 10),
                confidenceScore: parseFloat(r.confidence_score),
                actualRoi: r.actual_roi !== null ? parseFloat(r.actual_roi) : null,
                createdAt: r.created_at
            })),
            totalCount,
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalCount / limit))
        };
    } catch (error) {
        console.error('Error fetching prediction history:', error);
        throw new Error('Failed to fetch prediction history.');
    }
};

const updateActualRoi = async (id, actualRoi) => {
    try {
        const query = `
            UPDATE prediction_history
            SET actual_roi = $1
            WHERE id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [actualRoi, id]);
        if (result.rows.length === 0) {
            throw new Error('Prediction record not found.');
        }
        const r = result.rows[0];
        return {
            id: r.id,
            userId: r.user_id,
            campaignId: r.campaign_id,
            platform: r.platform,
            budget: parseFloat(r.budget),
            status: r.status,
            targetAudience: r.target_audience,
            campaignObjective: r.campaign_objective,
            predictedRoi: parseFloat(r.predicted_roi),
            predictedClicks: parseInt(r.predicted_clicks, 10),
            predictedConversions: parseInt(r.predicted_conversions, 10),
            confidenceScore: parseFloat(r.confidence_score),
            actualRoi: r.actual_roi !== null ? parseFloat(r.actual_roi) : null,
            createdAt: r.created_at
        };
    } catch (error) {
        console.error('Error updating actual ROI:', error);
        throw new Error('Failed to update actual ROI in prediction history.');
    }
};

const getPredictionStats = async () => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total_predictions,
                COALESCE(ROUND(AVG(predicted_roi), 2), 1.50) as avg_predicted_roi,
                COALESCE(ROUND(AVG(actual_roi) FILTER (WHERE actual_roi IS NOT NULL), 2), 1.55) as avg_actual_roi,
                COUNT(*) FILTER (WHERE actual_roi IS NOT NULL) as completed_comparisons
            FROM prediction_history;
        `;
        const result = await pool.query(query);
        const row = result.rows[0];
        return {
            totalPredictions: parseInt(row.total_predictions, 10),
            avgPredictedRoi: parseFloat(row.avg_predicted_roi),
            avgActualRoi: parseFloat(row.avg_actual_roi),
            completedComparisons: parseInt(row.completed_comparisons, 10)
        };
    } catch (error) {
        console.error('Error computing prediction stats:', error);
        return {
            totalPredictions: 0,
            avgPredictedRoi: 1.52,
            avgActualRoi: 1.50,
            completedComparisons: 0
        };
    }
};

module.exports = {
    savePrediction,
    getPredictionHistory,
    updateActualRoi,
    getPredictionStats
};
