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

export const GET_DAILY_METRICS = gql`
  query GetDailyMetrics($campaignId: ID) {
    getDailyMetrics(campaignId: $campaignId) {
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

export const CREATE_CAMPAIGN_MUTATION = gql`
  mutation CreateCampaign($name: String!, $platform: String!, $budget: Float!) {
    createCampaign(name: $name, platform: $platform, budget: $budget) {
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
