const { DateTimeTypeDefinition } = require('graphql-scalars');
const typeDefs = `
    scalar DateTime

    type Prediction {
        status: String
        message: String
        predicted_roi: Float
        predictedRoi: Float
        predictedClicks: Int
        predictedConversions: Int
        confidenceScore: Float
    }

    type Campaign {
        id: ID!
        name: String!
        platform: String!
        budget: Float!
        status: String!
        created_at: DateTime!
    }

    type User {
        id: ID!
        email: String!
        role: String!
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

    type Query {
        getAllCampaigns: [Campaign!]!
        getDailyMetrics(campaignId: ID): [DailyMetric!]!
        me: User
        getCampaignPrediction(platform: String!, budget: Float!, status: String!): Prediction!
    }

    type Mutation {
        createCampaign(name: String!, platform: String!, budget: Float!): Campaign!
        updateCampaign(id: ID!, name: String, platform: String, budget: Float, status: String): Campaign
        deleteCampaign(id: ID!): Boolean!

        register(email: String!, password: String!): User!
        login(email: String!, password: String!): User!
        resetPassword(email: String!, newPassword: String!): Boolean!
        logout: Boolean!
    }
`;

module.exports = { typeDefs };

