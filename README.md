# Predictive ROI Modeling & Marketing Analytics Platform

A distributed, AI-powered marketing analytics platform built using a modern microservices architecture. The platform decouples fast web traffic routing from heavy machine learning computations, providing predictive ROI modeling, campaign CRUD operations, daily performance tracking, secure JWT authentication, and intelligent Redis caching.

---

## 🎓 Project Details

- **Project Title:** Predictive ROI Modeling and Marketing Analytics Platform via Distributed Microservices
- **Department:** Computer Science and Engineering, Chitkara University, Himachal Pradesh
- **Submitted By:** Aarti (University ID: 2311981007)
- **Degree:** BE(CSE)

---

## 🏗️ Microservices Architecture & Port Mapping

```text
[ Next.js Frontend ]  --->  [ Node.js API Gateway ]  <--->  [ Python ML Engine ]
   (Port 3000)                  (Port 4000)                   (Port 8000)
                                    |                              |
                                    v                              v
                           [ PostgreSQL DB ]               [ Redis Cache ]
                              (Port 5432)                    (Port 6379)
```

| Service | Technology Stack | Port | Description |
| :--- | :--- | :--- | :--- |
| **`frontend/`** | Next.js (App Router), React 19, TypeScript, Tailwind CSS, Apollo Client | **`3000`** | User Interface for campaign CRUD, AI ROI prediction dashboard, and daily metrics visualization. |
| **`api-gateway/`** | Node.js, Express, Apollo Server, GraphQL, JWT, Redis Client, `pg` | **`4000`** | Central entry point processing GraphQL queries, managing auth cookies, DB persistence, and Redis caching. |
| **`ml-engine/`** | Python 3, FastAPI, Scikit-Learn, Pandas, Uvicorn | **`8000`** | AI microservice training Scikit-Learn Random Forest Regression models to predict campaign ROI and performance metrics. |
| **Redis** | Redis 7 Alpine (Docker) | **`6379`** | In-Memory cache storing AI prediction results (`prediction:{platform}:{budget}:{status}`) with 3600s TTL. |
| **PostgreSQL** | PostgreSQL 15 Alpine (Docker) | **`5432`** | Primary relational database storing Users, Campaigns, and Daily Performance Metrics tables. |

---

## ✨ Key Features & Technical Highlights

1. **AI-Driven Predictive Analytics**:
   - Uses Scikit-Learn `RandomForestRegressor` and `ColumnTransformer` pipelines trained on campaign features (`platform`, `budget`, `status`).
   - Automatically normalizes input platform strings (case-insensitive handling for `Google`, `Meta`/`Facebook`, `LinkedIn`, `TikTok`).
   - Predicts ROI multipliers, estimated clicks, estimated conversions, and confidence scores.

2. **Decoupled Architecture & Redis Caching**:
   - Isolates heavy machine learning model inference from high-speed web traffic.
   - Node.js Gateway checks Redis cache first before querying the Python ML microservice, reducing latency on repeated queries.

3. **Secure Authentication & RBAC**:
   - JWT-based authentication issued via HTTP-only secure cookies (`token`).
   - Password hashing with `bcryptjs` and role-based access control resolvers.

4. **Campaign CRUD & Daily Metrics Management**:
   - Full campaign creation, search/filtering by platform, live status updates (`active`, `paused`, `draft`), and soft/hard deletion.
   - Aggregated daily performance metrics tracking spend, impressions, clicks, conversions, CTR %, and CPC $.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Python** (v3.9+ recommended)
- **Docker Desktop** (for PostgreSQL and Redis)

---

### Step-by-Step Setup Guide

#### 1. Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
```

#### 2. Configure & Start API Gateway (Node.js)
```bash
cd api-gateway
npm install

# Initialize PostgreSQL Database Tables
node config/setupDB.js

# Start API Gateway in Development Mode
npm run dev
```

#### 3. Start AI/ML Engine (Python FastAPI)
```bash
cd ml-engine
# Activate Virtual Environment (Windows)
venv\Scripts\activate

# Install requirements if needed, then run Uvicorn server:
uvicorn main:app --reload --port 8000
```

#### 4. Start Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```

The web application will be accessible at: **`http://localhost:3000`**

---

## 📡 Key GraphQL API Endpoints

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

#### Get Daily Metrics
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

#### User Registration & Login
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

---

## 🛡️ License & Acknowledgments

Developed as part of the BE(CSE) degree at Chitkara University, Himachal Pradesh.