# AI Marketing Analytics Platform

A distributed, AI-powered marketing analytics platform with microservices architecture.

## Repository Architecture & Port Mapping

- **`frontend/`**: Next.js (App Router, TypeScript, Tailwind CSS, Apollo Client) — **Port 3000**
- **`api-gateway/`**: Node.js (Express, Apollo Server, GraphQL, JWT, Redis Client) — **Port 4000**
- **`ml-engine/`**: Python (FastAPI, Scikit-Learn, Pandas, Uvicorn) — **Port 8000**
- **Infrastructure**:
  - Redis (In-Memory Cache) — **Port 6379**
  - PostgreSQL (Primary Relational Database) — **Port 5432**

## Authentication & Security

- JWT-based authentication using `httpOnly` cookies (`token`).
- Gateway resolvers enforce authorization via `requireAuth(context)`.
- Apollo Client in `frontend` communicates with `credentials: 'include'` to pass cookies across origins.

## Caching Strategy

- Node.js API Gateway checks Redis first (`prediction:${platform}:${budget}:${status}`) before querying the Python ML Engine.
- Cache TTL is set to 3600 seconds (1 hour).

## Engineering Conventions

- Type Safety: Frontend uses strict TypeScript (.tsx/.ts).
- Dynamic Configuration: Never hardcode service URLs; pull from process.env.
- GraphQL First: Client-to-Backend operations must flow through Apollo Server on api-gateway.

## Key Environment Variables

### `api-gateway/.env`
- `PORT=4000`
- `REDIS_URL=redis://127.0.0.1:6379`
- `ML_ENGINE_URL=http://127.0.0.1:8000`
- `JWT_SECRET=<secret_key>`
- `DATABASE_URL=<postgres_connection_string>`

### `ml-engine/.env`
- `PORT=8000`

## Development Commands

```bash
# Start Redis
docker run -d --name redis-cache -p 6379:6379 redis

# Start API Gateway (Node.js)
cd api-gateway && npm run dev

# Start ML Engine (Python)
cd ml-engine && venv\Scripts\activate && uvicorn main:app --reload --port 8000

# Start Frontend (Next.js)
cd frontend && npm run dev

