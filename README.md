# AI-Powered Marketing Analytics Dashboard

A robust, hybrid microservices application that merges full-stack engineering with data science to predict marketing campaign ROI and analyze performance metrics.

## Architecture
This project isolates the web traffic layer from the heavy data-processing layer, utilizing industry-standard orchestration:
* **Frontend:** Next.js, React (Pending)
* **API Gateway:** Node.js, Express, Apollo GraphQL
* **AI Engine:** Python, FastAPI, Scikit-Learn (Pending)
* **Database & Caching:** PostgreSQL, Redis (Dockerized)

## Current Progress
- [x] Dockerized PostgreSQL and Redis infrastructure
- [x] Node.js API Gateway initialized with Apollo GraphQL
- [x] Modular database connections established
- [x] Relational schema designed for campaigns and daily metrics
- [ ] SQL Repositories/Models
- [ ] GraphQL Mutations and Queries
- [ ] Python Machine Learning Microservice
- [ ] Next.js Frontend Implementation

## How to Run Locally
1. Ensure Docker Desktop is running.
2. Start the infrastructure: `docker compose up -d`
3. Navigate to the API gateway: `cd api-gateway`
4. Install dependencies: `npm install`
5. Start the server: `npm run dev`