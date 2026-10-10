import { gql } from '@apollo/client';

export const GET_ALL_CAMPAIGNS = gql`
  query GetAllCampaigns {
    getAllCampaigns {
      id
      name
      platform
      budget
      status
      created_at
    }
  }
`;

export const GET_CAMPAIGNS_PAGED = gql`
  query GetCampaignsPaged($page: Int, $limit: Int, $search: String, $platform: String, $status: String) {
    getCampaignsPaged(page: $page, limit: $limit, search: $search, platform: $platform, status: $status) {
      items {
        id
        name
        platform
        budget
        status
        created_at
      }
      totalCount
      currentPage
      totalPages
    }
  }
`;

export const GET_DAILY_METRICS = gql`
  query GetDailyMetrics($campaignId: ID, $startDate: String, $endDate: String, $range: String) {
    getDailyMetrics(campaignId: $campaignId, startDate: $startDate, endDate: $endDate, range: $range) {
      id
      campaign_id
      date
      impressions
      clicks
      spend
      conversions
    }
  }
`;

export const GET_PLATFORM_COMPARISON = gql`
  query GetPlatformComparison($range: String) {
    getPlatformComparison(range: $range) {
      platform
      totalBudget
      totalSpend
      totalImpressions
      totalClicks
      totalConversions
      avgCtr
      avgCpc
      avgRoi
    }
  }
`;

export const GET_PREDICTION_STATS = gql`
  query GetPredictionStats {
    getPredictionStats {
      totalPredictions
      avgPredictedRoi
      avgActualRoi
      completedComparisons
    }
  }
`;

export const GET_PREDICTION_HISTORY = gql`
  query GetPredictionHistory($page: Int, $limit: Int) {
    getPredictionHistory(page: $page, limit: $limit) {
      items {
        id
        userId
        campaignId
        platform
        budget
        status
        targetAudience
        campaignObjective
        predictedRoi
        predictedClicks
        predictedConversions
        confidenceScore
        actualRoi
        createdAt
      }
      totalCount
      currentPage
      totalPages
    }
  }
`;

export const GET_CAMPAIGN_PREDICTION = gql`
  query GetCampaignPrediction(
    $platform: String!
    $budget: Float!
    $status: String
    $campaign_duration: Int
    $target_audience: String
    $campaign_objective: String
    $geography: String
    $seasonality: String
  ) {
    getCampaignPrediction(
      platform: $platform
      budget: $budget
      status: $status
      campaign_duration: $campaign_duration
      target_audience: $target_audience
      campaign_objective: $campaign_objective
      geography: $geography
      seasonality: $seasonality
    ) {
      status
      message
      modelUsed
      predicted_roi
      predictedRoi
      predictedClicks
      predictedConversions
      confidenceScore
      confidenceInterval {
        lower
        upper
      }
    }
  }
`;

export const GET_MODEL_EVALUATION = gql`
  query GetModelEvaluation {
    getModelEvaluation {
      selectedBestModel
      models {
        name
        mae
        mse
        rmse
        r2_score
      }
      roiMetrics {
        mae
        mse
        rmse
        r2_score
      }
      clicksMetrics {
        mae
        mse
        rmse
        r2_score
      }
      conversionsMetrics {
        mae
        mse
        rmse
        r2_score
      }
    }
  }
`;

export const GET_WHAT_IF_ANALYSIS = gql`
  query GetWhatIfAnalysis($platform: String!, $baseBudget: Float, $status: String, $campaignObjective: String) {
    getWhatIfAnalysis(platform: $platform, baseBudget: $baseBudget, status: $status, campaignObjective: $campaignObjective) {
      platform
      optimal_budget
      optimal_roi
      scenarios {
        budget
        predicted_roi
        predicted_clicks
        predicted_conversions
        marginal_efficiency
      }
    }
  }
`;

export const GET_RECOMMENDATION = gql`
  query GetRecommendation($budget: Float!, $campaignObjective: String, $targetAudience: String) {
    getRecommendation(budget: $budget, campaignObjective: $campaignObjective, targetAudience: $targetAudience) {
      recommendedPlatform
      recommendedBudgetRange
      bestPredictedRoi
      comparativeAdvantage
      platformRankings {
        platform
        predicted_roi
        predicted_clicks
        predicted_conversions
      }
    }
  }
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      email
      role
      created_at
    }
  }
`;

export const GET_SYSTEM_STATS = gql`
  query GetSystemStats {
    getSystemStats {
      totalUsers
      totalCampaigns
      totalPredictions
      mlEngineStatus
      bestModel
      cache {
        isConnected
        totalKeys
        hits
        misses
        writes
        hitRate
      }
    }
  }
`;

export const CREATE_CAMPAIGN_MUTATION = gql`
  mutation CreateCampaign($name: String!, $platform: String!, $budget: Float!, $status: String) {
    createCampaign(name: $name, platform: $platform, budget: $budget, status: $status) {
      id
      name
      platform
      budget
      status
      created_at
    }
  }
`;

export const UPDATE_CAMPAIGN_MUTATION = gql`
  mutation UpdateCampaign($id: ID!, $name: String, $platform: String, $budget: Float, $status: String) {
    updateCampaign(id: $id, name: $name, platform: $platform, budget: $budget, status: $status) {
      id
      name
      platform
      budget
      status
      created_at
    }
  }
`;

export const DELETE_CAMPAIGN_MUTATION = gql`
  mutation DeleteCampaign($id: ID!) {
    deleteCampaign(id: $id)
  }
`;

export const SAVE_PREDICTION_MUTATION = gql`
  mutation SavePrediction(
    $platform: String!
    $budget: Float!
    $status: String
    $targetAudience: String
    $campaignObjective: String
    $predictedRoi: Float!
    $predictedClicks: Int!
    $predictedConversions: Int!
    $confidenceScore: Float!
    $actualRoi: Float
  ) {
    savePrediction(
      platform: $platform
      budget: $budget
      status: $status
      targetAudience: $targetAudience
      campaignObjective: $campaignObjective
      predictedRoi: $predictedRoi
      predictedClicks: $predictedClicks
      predictedConversions: $predictedConversions
      confidenceScore: $confidenceScore
      actualRoi: $actualRoi
    ) {
      id
      platform
      budget
      status
      predictedRoi
      predictedClicks
      predictedConversions
      confidenceScore
      actualRoi
      createdAt
    }
  }
`;

export const UPDATE_ACTUAL_ROI_MUTATION = gql`
  mutation UpdateActualRoi($id: ID!, $actualRoi: Float!) {
    updateActualRoi(id: $id, actualRoi: $actualRoi) {
      id
      actualRoi
      predictedRoi
    }
  }
`;

export const UPDATE_USER_ROLE_MUTATION = gql`
  mutation UpdateUserRole($id: ID!, $role: String!) {
    updateUserRole(id: $id, role: $role) {
      id
      email
      role
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;
