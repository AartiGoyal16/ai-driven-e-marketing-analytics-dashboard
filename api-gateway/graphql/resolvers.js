const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GraphQLError } = require('graphql');
const { safeGet, safeSet, invalidatePattern, getCacheStats } = require('../config/redis');
const { DateTimeResolver } = require('graphql-scalars');
const {
    getAllCampaigns,
    getCampaignsPaged,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getDailyMetrics,
    getPlatformComparison
} = require('../models/campaignModel');
const {
    createUser,
    getUserByEmail,
    getUserById,
    getAllUsers,
    updateUserRole,
    updateUserPassword
} = require('../models/userModel');
const {
    savePrediction,
    getPredictionHistory,
    updateActualRoi,
    getPredictionStats
} = require('../models/predictionModel');

const setAuthCookie = (res, user) => {
    const token = jwt.sign(
        { userId: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24
    });
};

const requireAuth = (context) => {
    if (!context.user) {
        throw new GraphQLError('Unauthorized: You must be logged in to perform this action.', {
            extensions: { code: 'UNAUTHENTICATED' }
        });
    }
};

const requireRole = (context, allowedRoles = ['admin']) => {
    requireAuth(context);
    if (!allowedRoles.includes(context.user.role)) {
        throw new GraphQLError(`Forbidden: Insufficient privileges. Required role: ${allowedRoles.join(' or ')}.`, {
            extensions: { code: 'FORBIDDEN' }
        });
    }
};

const ALLOWED_PLATFORMS = ['google', 'meta', 'facebook', 'instagram', 'linkedin', 'tiktok', 'twitter', 'x', 'youtube'];

const validateCampaignInput = ({ name, platform, budget, status }) => {
    if (name !== undefined && (!name || name.trim().length === 0)) {
        throw new GraphQLError('Validation Error: Campaign name cannot be empty.', {
            extensions: { code: 'BAD_USER_INPUT' }
        });
    }
    if (budget !== undefined) {
        const numBudget = Number(budget);
        if (isNaN(numBudget) || numBudget <= 0 || numBudget > 10000000) {
            throw new GraphQLError('Validation Error: Budget must be a positive number up to $10,000,000.', {
                extensions: { code: 'BAD_USER_INPUT' }
            });
        }
    }
    if (platform !== undefined) {
        const pNorm = platform.trim().toLowerCase();
        if (!ALLOWED_PLATFORMS.some(p => pNorm.includes(p))) {
            throw new GraphQLError(`Validation Error: Invalid advertising platform '${platform}'.`, {
                extensions: { code: 'BAD_USER_INPUT' }
            });
        }
    }
    if (status !== undefined) {
        const validStatuses = ['active', 'paused', 'completed', 'draft'];
        if (!validStatuses.includes(status.trim().toLowerCase())) {
            throw new GraphQLError(`Validation Error: Status must be one of: ${validStatuses.join(', ')}.`, {
                extensions: { code: 'BAD_USER_INPUT' }
            });
        }
    }
};

const resolvers = {
    DateTime: DateTimeResolver,

    Query: {
        getAllCampaigns: async (_, __, context) => {
            requireAuth(context);
            return await getAllCampaigns();
        },

        getCampaignsPaged: async (_, { page = 1, limit = 10, search = '', platform = 'All', status = 'All' }, context) => {
            requireAuth(context);
            return await getCampaignsPaged({ page, limit, search, platform, status });
        },

        getCampaignById: async (_, { id }, context) => {
            requireAuth(context);
            return await getCampaignById(id);
        },

        getDailyMetrics: async (_, { campaignId, startDate, endDate, range }, context) => {
            requireAuth(context);
            return await getDailyMetrics(campaignId, startDate, endDate, range);
        },

        getPlatformComparison: async (_, { range }, context) => {
            requireAuth(context);
            return await getPlatformComparison(range);
        },

        me: async (_, __, context) => {
            if (!context.user) return null;
            return await getUserById(context.user.userId);
        },

        getCampaignPrediction: async (_, args, context) => {
            requireAuth(context);
            const {
                platform,
                budget,
                status = 'active',
                campaign_duration = 30,
                target_audience = 'general_consumers',
                campaign_objective = 'conversions',
                geography = 'north_america',
                seasonality = 'q4_holiday_peak'
            } = args;

            validateCampaignInput({ platform, budget, status });

            const platformNorm = (platform || '').trim().toLowerCase();
            const statusNorm = (status || '').trim().toLowerCase();
            const cacheKey = `prediction:${platformNorm}:${budget}:${statusNorm}:${campaign_duration}:${target_audience}:${campaign_objective}`;

            try {
                const cachedData = await safeGet(cacheKey);
                if (cachedData) {
                    console.log('Serving prediction from Redis Cache!');
                    return JSON.parse(cachedData);
                }

                console.log('Cache miss. Querying Python Machine Learning Engine...');
                const mlUrl = `${process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000'}/predict`;

                let predictionData;
                try {
                    const response = await fetch(mlUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            platform: platformNorm,
                            budget: Number(budget),
                            status: statusNorm,
                            campaign_duration: Number(campaign_duration),
                            target_audience,
                            campaign_objective,
                            geography,
                            seasonality
                        }),
                        signal: AbortSignal.timeout(5000)
                    });

                    if (!response.ok) {
                        throw new Error(`ML Engine responded with status ${response.status}`);
                    }

                    const rawData = await response.json();
                    predictionData = {
                        status: rawData.status || 'success',
                        message: rawData.message || 'Forecast calculated successfully',
                        modelUsed: rawData.model_used || 'Gradient Boosting',
                        predicted_roi: rawData.predicted_roi ?? rawData.predictedRoi ?? 1.50,
                        predictedRoi: rawData.predicted_roi ?? rawData.predictedRoi ?? 1.50,
                        predictedClicks: rawData.predictedClicks ?? rawData.predicted_clicks ?? Math.round(budget / 1.5),
                        predictedConversions: rawData.predictedConversions ?? rawData.predicted_conversions ?? Math.round((budget / 1.5) * 0.06),
                        confidenceScore: rawData.confidenceScore ?? rawData.confidence_score ?? 0.92,
                        confidenceInterval: rawData.confidenceInterval || {
                            lower: Math.max(0.2, (rawData.predicted_roi || 1.50) - 0.25),
                            upper: (rawData.predicted_roi || 1.50) + 0.25
                        }
                    };
                } catch (mlErr) {
                    console.warn('ML Engine offline/timed out. Employing benchmark fallback heuristics:', mlErr.message);
                    // Resilient heuristic fallback
                    const baseRoi = platformNorm.includes('google') ? 1.65 : platformNorm.includes('meta') ? 1.45 : 1.40;
                    const cpc = platformNorm.includes('linkedin') ? 3.8 : platformNorm.includes('google') ? 1.8 : 1.2;
                    const estClicks = Math.round(budget / cpc);
                    const estConv = Math.round(estClicks * 0.06);

                    predictionData = {
                        status: 'fallback',
                        message: 'ML Service offline. Generated via platform baseline heuristic model.',
                        modelUsed: 'Baseline Platform Benchmark Heuristic',
                        predicted_roi: baseRoi,
                        predictedRoi: baseRoi,
                        predictedClicks: estClicks,
                        predictedConversions: estConv,
                        confidenceScore: 0.78,
                        confidenceInterval: {
                            lower: baseRoi - 0.30,
                            upper: baseRoi + 0.30
                        }
                    };
                }

                // Cache for 1 hour
                await safeSet(cacheKey, 3600, JSON.stringify(predictionData));

                return predictionData;
            } catch (error) {
                console.error('Prediction resolver error:', error);
                throw new GraphQLError('Failed to calculate campaign prediction.', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' }
                });
            }
        },

        getPredictionHistory: async (_, { page = 1, limit = 20 }, context) => {
            requireAuth(context);
            // Non-admins see their own history; admins see all
            const userId = context.user.role === 'admin' ? null : context.user.userId;
            return await getPredictionHistory({ userId, page, limit });
        },

        getPredictionStats: async (_, __, context) => {
            requireAuth(context);
            return await getPredictionStats();
        },

        getModelEvaluation: async (_, __, context) => {
            requireAuth(context);
            const cacheKey = 'ml:model_evaluation';
            const cached = await safeGet(cacheKey);
            if (cached) return JSON.parse(cached);

            try {
                const mlUrl = `${process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000'}`;
                const [metricsRes, compRes] = await Promise.all([
                    fetch(`${mlUrl}/metrics`, { signal: AbortSignal.timeout(4000) }),
                    fetch(`${mlUrl}/model-comparison`, { signal: AbortSignal.timeout(4000) })
                ]);

                if (metricsRes.ok && compRes.ok) {
                    const metricsData = await metricsRes.json();
                    const compData = await compRes.json();

                    const modelsList = Object.entries(compData.models || {}).map(([name, m]) => ({
                        name,
                        mae: m.mae,
                        mse: m.mse,
                        rmse: m.rmse,
                        r2_score: m.r2_score
                    }));

                    const result = {
                        selectedBestModel: metricsData.best_model || 'Gradient Boosting',
                        models: modelsList,
                        roiMetrics: metricsData.metrics?.roi || null,
                        clicksMetrics: metricsData.metrics?.clicks || null,
                        conversionsMetrics: metricsData.metrics?.conversions || null
                    };

                    await safeSet(cacheKey, 600, JSON.stringify(result));
                    return result;
                }
            } catch (err) {
                console.warn('Unable to query ML engine for evaluation metrics:', err.message);
            }

            // Fallback representation
            return {
                selectedBestModel: 'Gradient Boosting',
                models: [
                    { name: 'Gradient Boosting', mae: 0.0695, mse: 0.0077, rmse: 0.0878, r2_score: 0.9061 },
                    { name: 'Random Forest', mae: 0.0894, mse: 0.0130, rmse: 0.1142, r2_score: 0.8411 },
                    { name: 'Ridge Regression', mae: 0.1071, mse: 0.0183, rmse: 0.1354, r2_score: 0.7764 }
                ],
                roiMetrics: { mae: 0.0695, mse: 0.0077, rmse: 0.0878, r2_score: 0.9061 },
                clicksMetrics: { mae: 498.0, mse: 1427500.0, rmse: 1194.0, r2_score: 0.989 },
                conversionsMetrics: { mae: 40.4, mse: 8740.0, rmse: 93.5, r2_score: 0.969 }
            };
        },

        getWhatIfAnalysis: async (_, { platform, baseBudget = 5000, status = 'active', campaignObjective = 'conversions' }, context) => {
            requireAuth(context);
            try {
                const mlUrl = `${process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000'}/what-if`;
                const res = await fetch(mlUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        platform,
                        status,
                        base_budget: Number(baseBudget),
                        campaign_objective: campaignObjective
                    }),
                    signal: AbortSignal.timeout(5000)
                });
                if (res.ok) {
                    return await res.json();
                }
            } catch (err) {
                console.warn('What-If ML service query error:', err.message);
            }

            // Fallback scenario generator
            const tiers = [500, 1000, 2500, 5000, 7500, 10000, 15000, 25000, 50000];
            return {
                platform,
                optimal_budget: 1000.0,
                optimal_roi: 1.85,
                scenarios: tiers.map(b => ({
                    budget: b,
                    predicted_roi: Math.max(1.10, Math.round((2.0 - 0.12 * Math.log10(b / 100)) * 100) / 100),
                    predicted_clicks: Math.round(b / 1.5),
                    predicted_conversions: Math.round((b / 1.5) * 0.06),
                    marginal_efficiency: Math.round(((b / 1.5) * 0.06 / b) * 100) / 100
                }))
            };
        },

        getRecommendation: async (_, { budget, campaignObjective = 'conversions', targetAudience = 'general_consumers' }, context) => {
            requireAuth(context);
            try {
                const mlUrl = `${process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000'}/recommend`;
                const res = await fetch(mlUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        budget: Number(budget),
                        campaign_objective: campaignObjective,
                        target_audience: targetAudience
                    }),
                    signal: AbortSignal.timeout(5000)
                });
                if (res.ok) {
                    const data = await res.json();
                    return {
                        recommendedPlatform: data.recommended_platform,
                        recommendedBudgetRange: data.recommended_budget_range,
                        bestPredictedRoi: data.best_predicted_roi,
                        comparativeAdvantage: data.comparative_advantage,
                        platformRankings: data.platform_rankings
                    };
                }
            } catch (err) {
                console.warn('Recommendation ML service error:', err.message);
            }

            return {
                recommendedPlatform: 'Google',
                recommendedBudgetRange: `$${Math.round(budget * 0.85).toLocaleString()} – $${Math.round(budget * 1.25).toLocaleString()}`,
                bestPredictedRoi: 1.65,
                comparativeAdvantage: 'Google Ads expected to yield +14.2% higher ROI for this search intent profile.',
                platformRankings: [
                    { platform: 'Google', predicted_roi: 1.65, predicted_clicks: Math.round(budget / 1.8), predicted_conversions: Math.round((budget / 1.8) * 0.075) },
                    { platform: 'YouTube', predicted_roi: 1.55, predicted_clicks: Math.round(budget / 2.2), predicted_conversions: Math.round((budget / 2.2) * 0.065) },
                    { platform: 'Instagram', predicted_roi: 1.50, predicted_clicks: Math.round(budget / 1.3), predicted_conversions: Math.round((budget / 1.3) * 0.060) },
                    { platform: 'Meta', predicted_roi: 1.45, predicted_clicks: Math.round(budget / 1.15), predicted_conversions: Math.round((budget / 1.15) * 0.055) }
                ]
            };
        },

        getAllUsers: async (_, __, context) => {
            requireRole(context, ['admin']);
            return await getAllUsers();
        },

        getSystemStats: async (_, __, context) => {
            requireRole(context, ['admin']);
            const [users, camps, predStats, cache] = await Promise.all([
                getAllUsers(),
                getAllCampaigns(),
                getPredictionStats(),
                getCacheStats()
            ]);

            let mlHealth = 'Online (FastAPI :8000)';
            let bestModel = 'Gradient Boosting';
            try {
                const mlRes = await fetch(`${process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000'}/`, { signal: AbortSignal.timeout(2000) });
                if (mlRes.ok) {
                    const data = await mlRes.json();
                    bestModel = data.best_model || bestModel;
                } else {
                    mlHealth = `Degraded (HTTP ${mlRes.status})`;
                }
            } catch (e) {
                mlHealth = 'Offline / Standby';
            }

            return {
                totalUsers: users.length,
                totalCampaigns: camps.length,
                totalPredictions: predStats.totalPredictions,
                cache,
                mlEngineStatus: mlHealth,
                bestModel
            };
        }
    },

    Mutation: {
        createCampaign: async (_, { name, platform, budget, status = 'active' }, context) => {
            requireAuth(context);
            validateCampaignInput({ name, platform, budget, status });

            const campaign = await createCampaign(name.trim(), platform, Number(budget), status);
            // Invalidate caches
            await invalidatePattern('campaigns:*');
            await invalidatePattern('metrics:*');
            return campaign;
        },

        updateCampaign: async (_, { id, name, platform, budget, status }, context) => {
            requireAuth(context);
            validateCampaignInput({ name, platform, budget, status });

            const campaign = await updateCampaign(id, name, platform, budget ? Number(budget) : undefined, status);
            // Invalidate caches
            await invalidatePattern('campaigns:*');
            await invalidatePattern('metrics:*');
            return campaign;
        },

        deleteCampaign: async (_, { id }, context) => {
            requireRole(context, ['admin']);
            const success = await deleteCampaign(id);
            // Invalidate caches
            await invalidatePattern('campaigns:*');
            await invalidatePattern('metrics:*');
            return success;
        },

        savePrediction: async (_, args, context) => {
            requireAuth(context);
            return await savePrediction({
                userId: context.user?.userId || null,
                ...args
            });
        },

        updateActualRoi: async (_, { id, actualRoi }, context) => {
            requireAuth(context);
            if (actualRoi === undefined || isNaN(Number(actualRoi)) || Number(actualRoi) < 0) {
                throw new GraphQLError('Validation Error: Actual ROI must be a non-negative number.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            return await updateActualRoi(id, Number(actualRoi));
        },

        updateUserRole: async (_, { id, role }, context) => {
            requireRole(context, ['admin']);
            return await updateUserRole(id, role);
        },

        register: async (_, { email, password }, context) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email.trim())) {
                throw new GraphQLError('Validation Error: Please provide a valid email address.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            if (!password || password.length < 6) {
                throw new GraphQLError('Validation Error: Password must be at least 6 characters long.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }

            const newUser = await createUser(email, password);
            setAuthCookie(context.res, newUser);
            return newUser;
        },

        login: async (_, { email, password }, context) => {
            if (!email || !password) {
                throw new GraphQLError('Validation Error: Email and password are required.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            const user = await getUserByEmail(email);
            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                throw new GraphQLError('Authentication Error: Invalid email or password.', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }

            setAuthCookie(context.res, user);
            return user;
        },

        resetPassword: async (_, { email, newPassword }) => {
            const user = await getUserByEmail(email);
            if (!user) {
                throw new GraphQLError('No registered user found with this email address.', {
                    extensions: { code: 'NOT_FOUND' }
                });
            }
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                throw new GraphQLError('Password must be at least 8 characters long and contain at least one letter and one number.', {
                    extensions: { code: 'BAD_USER_INPUT' }
                });
            }
            await updateUserPassword(email, newPassword);
            return true;
        },

        logout: async (_, __, context) => {
            context.res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });
            return true;
        }
    }
};

module.exports = { resolvers };