const { DateTimeTypeDefinition } = require('graphql-scalars');

const typeDefs = `
    scalar DateTime

    type ConfidenceInterval {
        lower: Float
        upper: Float
    }

    type Prediction {
        status: String
        message: String
        modelUsed: String
        predicted_roi: Float
        predictedRoi: Float
        predictedClicks: Int
        predictedConversions: Int
        confidenceScore: Float
        confidenceInterval: ConfidenceInterval
    }

    type Campaign {
        id: ID!
        name: String!
        platform: String!
        budget: Float!
        status: String!
        created_at: DateTime!
    }

    type CampaignConnection {
        items: [Campaign!]!
        totalCount: Int!
        currentPage: Int!
        totalPages: Int!
    }

    type User {
        id: ID!
        email: String!
        role: String!
        created_at: DateTime
    }

    type DailyMetric {
        id: ID!
        campaign_id: ID!
        date: String!
        impressions: Int!
        clicks: Int!
        spend: Float!
        conversions: Int!
    }

    type PlatformComparison {
        platform: String!
        totalBudget: Float!
        totalSpend: Float!
        totalImpressions: Int!
        totalClicks: Int!
        totalConversions: Int!
        avgCtr: Float!
        avgCpc: Float!
        avgRoi: Float!
    }

    type PredictionHistory {
        id: ID!
        userId: ID
        campaignId: ID
        platform: String!
        budget: Float!
        status: String!
        targetAudience: String
        campaignObjective: String
        predictedRoi: Float!
        predictedClicks: Int!
        predictedConversions: Int!
        confidenceScore: Float!
        actualRoi: Float
        createdAt: DateTime!
    }

    type PredictionHistoryConnection {
        items: [PredictionHistory!]!
        totalCount: Int!
        currentPage: Int!
        totalPages: Int!
    }

    type PredictionStats {
        totalPredictions: Int!
        avgPredictedRoi: Float!
        avgActualRoi: Float!
        completedComparisons: Int!
    }

    type ModelMetric {
        mae: Float!
        mse: Float!
        rmse: Float!
        r2_score: Float!
    }

    type ModelComparisonItem {
        name: String!
        mae: Float!
        mse: Float!
        rmse: Float!
        r2_score: Float!
    }

    type ModelEvaluation {
        selectedBestModel: String!
        models: [ModelComparisonItem!]!
        roiMetrics: ModelMetric
        clicksMetrics: ModelMetric
        conversionsMetrics: ModelMetric
    }

    type WhatIfScenario {
        budget: Float!
        predicted_roi: Float!
        predicted_clicks: Int!
        predicted_conversions: Int!
        marginal_efficiency: Float!
    }

    type WhatIfResult {
        platform: String!
        optimal_budget: Float!
        optimal_roi: Float!
        scenarios: [WhatIfScenario!]!
    }

    type PlatformRanking {
        platform: String!
        predicted_roi: Float!
        predicted_clicks: Int!
        predicted_conversions: Int!
    }

    type RecommendationResult {
        recommendedPlatform: String!
        recommendedBudgetRange: String!
        bestPredictedRoi: Float!
        comparativeAdvantage: String!
        platformRankings: [PlatformRanking!]!
    }

    type CacheStats {
        isConnected: Boolean!
        totalKeys: Int!
        hits: Int!
        misses: Int!
        writes: Int!
        hitRate: String!
    }

    type SystemStats {
        totalUsers: Int!
        totalCampaigns: Int!
        totalPredictions: Int!
        cache: CacheStats!
        mlEngineStatus: String!
        bestModel: String!
    }

    type Query {
        getAllCampaigns: [Campaign!]!
        getCampaignsPaged(page: Int, limit: Int, search: String, platform: String, status: String): CampaignConnection!
        getCampaignById(id: ID!): Campaign
        getDailyMetrics(campaignId: ID, startDate: String, endDate: String, range: String): [DailyMetric!]!
        getPlatformComparison(range: String): [PlatformComparison!]!
        me: User
        getCampaignPrediction(
            platform: String!
            budget: Float!
            status: String
            campaign_duration: Int
            target_audience: String
            campaign_objective: String
            geography: String
            seasonality: String
        ): Prediction!
        getPredictionHistory(page: Int, limit: Int): PredictionHistoryConnection!
        getPredictionStats: PredictionStats!
        getModelEvaluation: ModelEvaluation!
        getWhatIfAnalysis(platform: String!, baseBudget: Float, status: String, campaignObjective: String): WhatIfResult!
        getRecommendation(budget: Float!, campaignObjective: String, targetAudience: String): RecommendationResult!
        getAllUsers: [User!]!
        getSystemStats: SystemStats!
    }

    type Mutation {
        createCampaign(name: String!, platform: String!, budget: Float!, status: String): Campaign!
        updateCampaign(id: ID!, name: String, platform: String, budget: Float, status: String): Campaign
        deleteCampaign(id: ID!): Boolean!

        savePrediction(
            platform: String!
            budget: Float!
            status: String
            targetAudience: String
            campaignObjective: String
            predictedRoi: Float!
            predictedClicks: Int!
            predictedConversions: Int!
            confidenceScore: Float!
            actualRoi: Float
        ): PredictionHistory!
        updateActualRoi(id: ID!, actualRoi: Float!): PredictionHistory!

        updateUserRole(id: ID!, role: String!): User!

        register(email: String!, password: String!): User!
        login(email: String!, password: String!): User!
        resetPassword(email: String!, newPassword: String!): Boolean!
        logout: Boolean!
    }
`;

module.exports = { typeDefs };
