# Plaasstop (FarmStop)

A geospatial marketplace connecting local farmers directly to buyers.

Plaasstop is a full-stack cloud application that allows users to discover farms based on geolocation, claim farm profiles, and connect with vendors. It leverages AWS cloud-native architecture for high availability and scalability.

---

## Architecture
### The system is built on a 3-Tier AWS Architecture:

- Frontend: React (Vite) hosted on S3 + CloudFront.
- Backend: Node.js/Express API running on EC2 (Auto Scaling Group) behind an Application Load Balancer.
- Database: Amazon RDS PostgreSQL with PostGIS extension for geospatial queries.
- Worker: Python-based Web Scraper running on AWS Lambda (Container Image) to populate farm leads.
- Auth: AWS Cognito (User Pools) synchronized with the Relational Database.

---

## Repository Structure
```text
/backend          # Node.js Express API
/plaasstop        # React Frontend (Vite)
/scraper          # Python/Docker Scraper for AWS Lambda
/infrastructure   # Terraform IaC for AWS deployment
```

---
## Getting Started
### Prerequisites
- Node.js (v18+)
- Python 3.11+
- Docker (for Scraper)
- PostgreSQL 14+ (Local) or access to RDS
- AWS CLI (configured)


### 1. Database Setup (Local)
Ensure you have PostgreSQL installed and the PostGIS extension enabled.
``` text
CREATE DATABASE farmstop;
\c farmstop
CREATE EXTENSION postgis;
-- Run the schema migration found in backend/init-db.js or migration scripts
```

### 2. Backend Setup
Navigate to the /backend directory.
```
cd backend
npm i #install dependencies
```
Create a .env file in /backend:
```
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/farmstop
# AWS Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_xxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
```
Run the server:

``` 
npm start 
```

### 3. Frontend Setup
Navigate to the /plaasstop directory.
```
cd plaasstop
npm install
```

Create a .env file in /plaasstop:
```
VITE_API_URL=http://localhost:5000
# Must match the Backend Cognito Config
VITE_COGNITO_POOL_ID=us-east-1_xxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxx
```
Run dev server:
```
npm run dev
```
### 4. Scraper Setup (Docker/Lambda)
The scraper is designed to run as a containerized AWS Lambda function to resolve dependency issues (psycopg2 / geopy).

To build and test locally:
```
cd scraper
docker build -t farm-scraper .
docker run --env-file .env farm-scraper
```
Required .env for Scraper:

```
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/farmstop
```
## API Endpoints

| Method | Endpoint                      | Description                             | Access |
|--------|-------------------------------|-----------------------------------------|--------|
| GET    | /health/ready                 | Health check for Load Balancer          | Public |
| POST   | /api/farms/search             | Geospatial search by radius             | Public |
| POST   | /api/auth/sync                | Sync Cognito User to Postgres           | Auth   |
| GET    | /api/auth/me                  | Get User Profile & Farm status          | Auth   |
| POST   | /api/farms/:id/claim          | Claim a "Lead" farm as a Vendor         | Auth   |


## Infrastructure (IaC)
Infrastructure is managed via Terraform in the /infrastructure directory.

### Provisioned Resources:

- VPC: Custom VPC with Public/Private Subnets across 2 AZs.
- Networking: NAT Gateways, Internet Gateway, Route Tables.
- Compute: Launch Templates, Auto Scaling Groups (EC2), ALB.
- Storage: RDS (Postgres), S3 (Static Website).
- Security: IAM Roles, Security Groups (Least Privilege).

#### Deployment:
```
cd infrastructure
terraform init
terraform plan
terraform apply
```
### Tech Stack
- Frontend: React, TailwindCSS, Lucide Icons, React-Leaflet, AWS Amplify Gen 2.
- Backend: Node.js, Express, pg (node-postgres), aws-jwt-verify.
- Database: PostgreSQL + PostGIS.
- DevOps: Docker, Terraform, GitHub Actions.
### License
Distributed under the MIT License. See LICENSE for more information.