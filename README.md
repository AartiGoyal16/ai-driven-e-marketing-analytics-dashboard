# AI-Driven Marketing Analytics & Predictive ROI Platform

A distributed marketing analytics and predictive ROI platform built on a decoupled microservices architecture. The platform isolates high-throughput web traffic from heavy machine learning computations, providing real-time campaign ROI forecasting, daily performance metrics tracking, campaign CRUD management, secure JWT authentication, and high-speed Redis caching.

---

## 🏗️ Architecture & System Design

```text
                               ┌──────────────────────────┐
                               │     Next.js Frontend     │
                               │        (Port 3000)       │
                               └────────────┬─────────────┘
                                            │
                                            │ GraphQL / Cookie Auth
                                            v
                               ┌──────────────────────────┐
                               │    Node.js API Gateway   │
                               │        (Port 4000)       │
                               └──────┬────────────┬──────┘
                                      │            │
                    Redis Cache (TTL) │            │ Internal REST API
                                      v            v
                           ┌─────────────┐    ┌──────────────────────────┐
                           │ Redis Cache │    │    Python AI/ML Engine   │
                           │ (Port 6379) │    │        (Port 8000)       │
                           └─────────────┘    └──────────────────────────┘
                                      │
                                      │ SQL Persistence
                                      v
                           ┌─────────────────────┐
                           │    PostgreSQL DB    │
                           │     (Port 5432)     │
                           └─────────────────────┘
```

---

## 🚀 Repository Architecture & Microservices Breakdown

| Service | Tech Stack | Port | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **`frontend/`** | Next.js (App Router), React 19, TypeScript, Tailwind CSS, Apollo Client | **`3000`** | Responsive single-page dashboard featuring campaign CRUD management, interactive AI ROI prediction tool, and daily metrics visualization. |
| **`api-gateway/`** | Node.js, Express, Apollo Server, GraphQL, JWT, Redis Client, `pg` | **`4000`** | Central API entry point managing GraphQL schemas, JWT auth via HTTP-only cookies, SQL persistence, and 1-hour Redis prediction caching. |
| **`ml-engine/`** | Python 3, FastAPI, Scikit-Learn, Pandas, NumPy, Uvicorn | **`8000`** | Machine learning microservice using a synthetically generated dataset of 1,500 campaign observations using Random Forest Regressors for multi-metric regression forecasting. |
| **Redis** | Redis 7 Alpine (Dockerized) | **`6379`** | In-memory cache key store (`prediction:{platform}:{budget}:{status}`) with 3600s TTL to prevent duplicate ML computations. |
| **PostgreSQL** | PostgreSQL 15 Alpine (Dockerized) | **`5432`** | Relational data persistence storing Users, Campaigns, and Daily Performance Metrics tables. |

---

## ✨ Core Engineering Features

1. **Decoupled Machine Learning Inference**:
   - Heavy data-science calculations (Scikit-Learn Random Forest Regressors) are isolated inside a Python FastAPI microservice, preventing event loop blocking on the Node.js API Gateway.
   - Computes ML predictions for **Predicted ROI**, **Estimated Clicks**, **Estimated Conversions**, and a **Dynamic Model Confidence Score** based on tree ensemble variance across 100 decision trees.
   - Case-insensitive platform normalization for `Google`, `Meta`/`Facebook`, `Instagram`, `LinkedIn`, `TikTok`, `Twitter`, and `YouTube`.

2. **Intelligent Redis Caching Layer**:
   - Node.js API Gateway checks Redis before forwarding calls to the ML Engine.
   - Identical campaign parameter queries return instantly from cache with a 3,600-second (1-hour) TTL.

3. **Secure Cookie-Based Authentication**:
   - JWT tokens issued via `httpOnly`, `sameSite` secure cookies for seamless cross-origin request authentication with Apollo GraphQL.

4. **Campaign CRUD & Performance Analytics**:
   - Full campaign management (Create, Read, Search/Filter, Update, Delete).
   - Daily performance metrics tracking spend, impressions, clicks, conversions, CTR %, and CPC $.

---

## 🛠️ Quick Start & Local Development

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **Docker & Docker Compose**

---

### Step-by-Step Setup

#### 1. Launch Infrastructure Containers
```bash
docker compose up -d
```

#### 2. Start Node.js API Gateway
```bash
cd api-gateway
npm install

# Initialize PostgreSQL Schema & Seed Data
node config/setupDB.js

# Start API Gateway in Development Mode
npm run dev
```

#### 3. Start Python ML Engine
```bash
cd ml-engine

# Activate Virtual Environment (Windows)
venv\Scripts\activate

# Launch FastAPI Server
uvicorn main:app --reload --port 8000
```

#### 4. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit the dashboard at **`http://localhost:3000`**

---

## 📡 GraphQL API Reference

### Queries

#### Get All Campaigns
```graphql
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
```

#### Get AI Campaign ROI Prediction
```graphql
query GetCampaignPrediction($platform: String!, $budget: Float!, $status: String!) {
  getCampaignPrediction(platform: $platform, budget: $budget, status: $status) {
    status
    message
    predictedRoi
    predictedClicks
    predictedConversions
    confidenceScore
  }
}
```

#### Get Daily Performance Metrics
```graphql
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
```

### Mutations

#### Create Campaign
```graphql
mutation CreateCampaign($name: String!, $platform: String!, $budget: Float!) {
  createCampaign(name: $name, platform: $platform, budget: $budget) {
    id
    name
    platform
    budget
    status
  }
}
```

#### User Auth (Register & Login)
```graphql
mutation Register($email: String!, $password: String!) {
  register(email: $email, password: $password) {
    id
    email
    role
  }
}

mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    id
    email
    role
  }
}
```
