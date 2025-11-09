# 🧩 Distributed Notification System — Monorepo

This project is a distributed notification system built using a **microservices architecture**.  
It consists of independent services communicating via **RabbitMQ**, with **PostgreSQL** as each service’s database, **Redis** for caching, and **Swagger/OpenAPI** for documentation.

---

## 🏗️ Tech Stack

| Component        | Tech                       |
| ---------------- | -------------------------- |
| Gateway          | NestJS                     |
| User Service     | NestJS                     |
| Template Service | Flask                      |
| Worker Service   | Spring Boot                |
| Message Broker   | RabbitMQ                   |
| Databases        | PostgreSQL (1 per service) |
| Cache            | Redis                      |
| API Docs         | Swagger / OpenAPI          |
| Orchestration    | Docker Compose             |

---

## 🧭 Monorepo Structure

```
/notification-system
├── docker-compose.yml
├── README.md
├── .env
│
├── gateway/                # NestJS - Entry point (API Gateway)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── user-service/           # NestJS - Handles users
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── template-service/       # Flask - Handles message templates
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
│
├── worker-service/         # Spring Boot - Background tasks / delivery
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
│
└── infra/
    ├── postgres/           # Volume configs for Postgres DBs
    ├── redis/
    └── rabbitmq/
```

---

## ⚙️ Environment Setup

### 1️⃣ Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- Git

Clone the repository:

```bash
git clone https://github.com/<your-org>/notification-system.git
cd notification-system
```

### 2️⃣ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Shared
RABBITMQ_USER=admin
RABBITMQ_PASS=admin
REDIS_PORT=6379

# Gateway Service
GATEWAY_DB_USER=gateway_user
GATEWAY_DB_PASS=gateway_pass
GATEWAY_DB_NAME=gateway_db

# User Service
USER_DB_USER=user_user
USER_DB_PASS=user_pass
USER_DB_NAME=user_db

# Template Service
TEMPLATE_DB_USER=template_user
TEMPLATE_DB_PASS=template_pass
TEMPLATE_DB_NAME=template_db

# Worker Service
STATUS_DB_HOST=postgres_worker
STATUS_DB_NAME=worker_db
```

### 3️⃣ Database Connection Examples

Each service connects to its own DB using the variables above.

#### 🧱 Gateway (NestJS)

```env
DATABASE_URL=postgresql://${GATEWAY_DB_USER}:${GATEWAY_DB_PASS}@postgres_gateway:5432/${GATEWAY_DB_NAME}
RABBITMQ_URL=amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@rabbitmq:5672/
REDIS_URL=redis://redis:6379
```

#### 👤 User Service (NestJS)

```env
DATABASE_URL=postgresql://${USER_DB_USER}:${USER_DB_PASS}@postgres_user:5432/${USER_DB_NAME}
```

#### 🧩 Template Service (Flask)

```env
SQLALCHEMY_DATABASE_URI=postgresql://${TEMPLATE_DB_USER}:${TEMPLATE_DB_PASS}@postgres_template:5432/${TEMPLATE_DB_NAME}
```

#### ⚙️ Worker Service (Spring Boot)

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://${STATUS_DB_HOST}:5432/${STATUS_DB_NAME}
SPRING_RABBITMQ_HOST=rabbitmq
```

---

## 🐳 Docker Compose

All services are orchestrated through Docker Compose.

To start everything:

```bash
docker compose up --build
```

To stop all containers:

```bash
docker compose down
```

---

## 🧰 Developer Workflow

### 1. Upon cloning

Each developer should:

1. Clone the repo
2. Create a `.env` file as shown above
3. Ensure Docker is running
4. Run the system using:
   ```bash
   docker compose up --build
   ```
5. Verify their service starts up correctly

### 2. Adding a new dependency

If you modify any service dependencies:

Rebuild only that service:

```bash
docker compose build <service_name>
```

Example:

```bash
docker compose build gateway
```

### 3. Checking Logs

To see logs of a specific service:

```bash
docker compose logs -f gateway
```

### 4. Access Points

| Service             | URL                    |
| ------------------- | ---------------------- |
| Gateway (NestJS)    | http://localhost:3000  |
| User Service        | http://localhost:3001  |
| Template Service    | http://localhost:5000  |
| Worker Service      | Depends on config      |
| RabbitMQ Management | http://localhost:15672 |
| Redis               | localhost:6379         |

---

## 🔧 Future Steps

- Add Swagger documentation for each service
- Set up message queues for communication
- Add proper error handling and retry mechanisms
- Create a shared proto or schema folder for message contracts

---

## 👨‍💻 Contributors

| Role             | Tech        | Developer |
| ---------------- | ----------- | --------- |
| Gateway          | NestJS      | Dev A     |
| User Service     | NestJS      | Dev B     |
| Template Service | Flask       | Dev C     |
| Worker Service   | Spring Boot | Dev D     |
