# Notification Service Gateway

A scalable notification gateway service built with NestJS that handles email and push notifications through message queues.

## 🏗️ Architecture

```
Client → Gateway (NestJS) → RabbitMQ → Workers (Spring Boot)
                    ↓
                  Redis (Status Cache)
                    ↓
                PostgreSQL (Persistence)
```

## ✨ Features

- **Multi-channel notifications** (Email & Push)
- **Idempotency** with request ID tracking
- **Rate limiting** per user
- **Status tracking** via Redis cache
- **Message queuing** with RabbitMQ
- **Template support** for notifications
- **RESTful API** with Swagger documentation

---

## 📚 Documentation

### For Gateway Development

- [Gateway Roadmap](./agteway_roadmap.md) - Development plan and features

### For Worker Development (Spring Boot)

- **[Quick Start Checklist](./QUICK_START.md)** ⭐ Start here!
- **[Worker Integration Guide](./WORKER_INTEGRATION_GUIDE.md)** - Complete implementation guide
- [Message Schemas](./message-schemas.json) - JSON schema definitions
- [Test Script](./test-gateway.js) - Send test notifications

---

## 🚀 Quick Start (Gateway)

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, RabbitMQ)
docker compose up -d

# Start development server
pnpm run start:dev
```

The gateway will be available at:

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

### Testing

```bash
# Run test script
node test-gateway.js
```

---

## 🔌 API Endpoints

### Send Notification

```http
POST /api/v1/notifications/send
Headers:
  x-request-id: {uuid}
  Content-Type: application/json

Body:
{
  "user_id": "12345",
  "channel": "email",
  "template_code": "password_reset",
  "data": {
    "name": "John Doe",
    "reset_link": "https://app.com/reset?token=xyz"
  }
}
```

### Check Status

```http
GET /api/v1/notifications/status?request_id={uuid}
```

---

## 🏃‍♂️ For Worker Developers

If you're building the Email or Push notification workers:

1. **Start here:** [QUICK_START.md](./QUICK_START.md)
2. **Read the guide:** [WORKER_INTEGRATION_GUIDE.md](./WORKER_INTEGRATION_GUIDE.md)
3. **Check schemas:** [message-schemas.json](./message-schemas.json)
4. **Test it:** Run `node test-gateway.js` to send test messages

### What You Need to Know

**Queue Names:**

- `email.queue` - Email notifications
- `push.queue` - Push notifications
- `status.queue` - Status updates (send back to gateway)

**Redis Status Keys:**

- Format: `status:{request_id}`
- Values: `processing`, `delivered`, `failed`
- TTL: 3600 seconds

**Connection Details:**

```properties
# RabbitMQ
Host: localhost:5672
User: guest
Pass: guest

# Redis
Host: localhost:6379
```

---

## 🛠️ Development

### Project Structure

```
src/
├── app.module.ts          # Main module
├── notifications/         # Notification handling
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   └── notifications.dto.ts
├── rabbitmq/             # Message queue service
├── redis/                # Cache service
├── guards/               # Rate limiting
└── middleware/           # Idempotency

```

### Environment Variables

See `.env` file for configuration.

---

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov

# Integration test
node test-gateway.js
```

---

## 📊 Monitoring

### RabbitMQ Management

- URL: http://localhost:15672
- User: guest / guest

### Redis CLI

```bash
docker exec redis redis-cli
```

---

## 🐛 Troubleshooting

**Gateway won't start?**

- Check Docker services are running: `docker ps`
- Verify ports 3000, 5672, 6379, 5433 are available

**Messages not in queue?**

- Check RabbitMQ connection in logs
- Verify queue names match in config

**Status not updating?**

- Check Redis connection
- Verify key format: `status:{request_id}`

---

## 📝 License

[MIT licensed](LICENSE)
