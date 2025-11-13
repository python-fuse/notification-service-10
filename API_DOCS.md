# HNG Notification Service - API Documentation

Complete API documentation for all endpoints in the notification service.

---

## 🚀 Quick Start

### Start All Services

```bash
docker compose up -d
```

### Verify Services Are Running

```bash
docker compose ps
```

### Check Service Health

```bash
# Gateway
curl http://localhost:3000/health

# Email Service
curl http://localhost:8080/health

# Push Service
curl http://localhost:9090/health

# Template Service
curl http://localhost:5000/api/v1/templates/
```

---

## 📡 Gateway Service (Port 3000)

### Send Notification

**Endpoint:** `POST /api/v1/notifications/send`

**Headers:**

- `Content-Type: application/json`
- `x-request-id: unique-request-id` (Required for idempotency)

**Request Body:**

```json
{
  "user_id": "caed963c-686d-4fce-ac4a-4452e02324ce",
  "channel": "email",
  "template_code": "password_reset",
  "data": {
    "name": "John Doe",
    "company_name": "HNG Notification Service",
    "reset_link": "https://app.hng.tech/reset?token=abc123",
    "expiry_minutes": "30",
    "ip_address": "192.168.1.100",
    "location": "Lagos, Nigeria",
    "timestamp": "2025-11-13 14:30:00 UTC",
    "support_email": "support@hng.tech"
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Notification queued",
  "error": null,
  "data": {
    "status": "queued",
    "request_id": "unique-request-id"
  },
  "meta": {
    "user_contact": {
      "email": "user@example.com",
      "push_token": null
    },
    "template": {
      "body": "<!DOCTYPE html>...",
      "subject": "Reset Your Password",
      "version_number": 1
    }
  }
}
```

**Idempotent Response (Already Delivered):**

```json
{
  "success": true,
  "message": "Notification delivered successfully",
  "error": null,
  "data": {
    "status": "delivered",
    "request_id": "unique-request-id"
  },
  "meta": {
    "note": "This notification was already delivered successfully."
  }
}
```

**Re-Queue Response (Stuck in Queue):**

```json
{
  "success": true,
  "message": "Notification re-queued successfully",
  "error": null,
  "data": {
    "status": "queued",
    "request_id": "unique-request-id"
  },
  "meta": {
    "note": "Request was still in queue and has been re-queued for processing."
  }
}
```

**Error Responses:**

- `400`: Missing `x-request-id` header
- `404`: User or template not found
- `429`: Rate limit exceeded

**Example cURL:**

```bash
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-request-id: req-$(date +%s)" \
  -d '{
    "user_id": "caed963c-686d-4fce-ac4a-4452e02324ce",
    "channel": "email",
    "template_code": "password_reset",
    "data": {
      "name": "John Doe",
      "company_name": "HNG",
      "reset_link": "https://app.com/reset?token=abc",
      "expiry_minutes": "30"
    }
  }'
```

---

### Get Notification Status

**Endpoint:** `GET /api/v1/notifications/status/:request_id`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Status retrieved successfully",
  "error": null,
  "data": {
    "request_id": "unique-request-id",
    "status": "delivered",
    "user_id": "caed963c-686d-4fce-ac4a-4452e02324ce",
    "channel": "email"
  },
  "meta": {
    "requested_at": "2025-11-13T10:00:00Z",
    "last_updated": "2025-11-13T10:00:05Z"
  }
}
```

**Status Values:**

- `queued`: Message in RabbitMQ queue, waiting to be processed
- `processing`: Currently being sent
- `delivered`: Successfully delivered
- `failed`: Delivery failed

**Error Response (404):**

```json
{
  "success": false,
  "message": "Status not found for this request id",
  "error": "NOT_FOUND",
  "data": null,
  "meta": null
}
```

**Example cURL:**

```bash
curl http://localhost:3000/api/v1/notifications/status/req-1234567890
```

---

## 👤 User Service (Port 3001)

### Get User by ID

**Endpoint:** `GET /users/:user_id`

**Success Response (200):**

```json
{
  "id": "caed963c-686d-4fce-ac4a-4452e02324ce",
  "email": "user@example.com",
  "push_token": "onesignal-player-id",
  "name": "John Doe",
  "created_at": "2025-11-01T10:00:00Z",
  "updated_at": "2025-11-13T10:00:00Z"
}
```

**Error Response (404):**

```json
{
  "error": "User not found"
}
```

**Example cURL:**

```bash
curl http://localhost:3001/users/caed963c-686d-4fce-ac4a-4452e02324ce
```

---

## 📧 Template Service (Port 5000)

### Create Template

**Endpoint:** `POST /api/v1/templates/`

**Request Body:**

```json
{
  "code": "welcome_email",
  "name": "Welcome Email",
  "description": "Sent to new users on registration",
  "language": "en",
  "subject": "Welcome to {{ company_name }}!",
  "body": "<!DOCTYPE html><html><body><h1>Hi {{ name }}</h1><p>Welcome to {{ company_name }}!</p></body></html>"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "code": "welcome_email",
    "version_number": 1
  }
}
```

**Error Response (409):**

```json
{
  "success": false,
  "error": "Template code already exists"
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/templates/ \
  -H "Content-Type: application/json" \
  -d '{
    "code": "welcome_email",
    "name": "Welcome Email",
    "subject": "Welcome {{ name }}!",
    "body": "<p>Hello {{ name }}, welcome!</p>"
  }'
```

---

### List All Templates

**Endpoint:** `GET /api/v1/templates/`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "code": "welcome_email",
      "name": "Welcome Email",
      "language": "en",
      "is_active": true,
      "latest_version": 3
    },
    {
      "code": "password_reset",
      "name": "Password Reset Email",
      "language": "en",
      "is_active": true,
      "latest_version": 1
    }
  ],
  "message": "Templates fetched"
}
```

**Example cURL:**

```bash
curl http://localhost:5000/api/v1/templates/
```

---

### Get Template Details

**Endpoint:** `GET /api/v1/templates/:template_code`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "code": "welcome_email",
    "name": "Welcome Email",
    "language": "en",
    "description": "Sent to new users",
    "is_active": true,
    "latest_version": {
      "version_number": 3,
      "subject": "Welcome to {{ company_name }}!",
      "body": "<html>...</html>"
    }
  },
  "message": "Template fetched successfully"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "error": "Template not found"
}
```

**Example cURL:**

```bash
curl http://localhost:5000/api/v1/templates/welcome_email
```

---

### Get Specific Template Version

**Endpoint:** `GET /api/v1/templates/:template_code/:version_number`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "code": "welcome_email",
    "name": "Welcome Email",
    "language": "en",
    "description": "Sent to new users",
    "is_active": true,
    "version": {
      "version_number": 2,
      "subject": "Old subject",
      "body": "<html>Old body</html>",
      "created_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-01T10:00:00Z"
    }
  },
  "message": "Template version fetched successfully"
}
```

**Example cURL:**

```bash
curl http://localhost:5000/api/v1/templates/welcome_email/2
```

---

### Update Template (Create New Version)

**Endpoint:** `PUT /api/v1/templates/:template_code`

**Request Body:**

```json
{
  "subject": "Updated subject with {{ variable }}",
  "body": "<html>Updated body with {{ variable }}</html>"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "New version 4 created for template 'welcome_email'",
  "data": {
    "version_number": 4
  }
}
```

**Example cURL:**

```bash
curl -X PUT http://localhost:5000/api/v1/templates/welcome_email \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Updated Welcome!",
    "body": "<p>New version</p>"
  }'
```

---

### Render Template

**Endpoint:** `POST /api/v1/templates/render`

Render a template with variables. Supports both inline templates and stored templates.

**Request Body (Stored Template):**

```json
{
  "template_code": "welcome_email",
  "variables": {
    "name": "John Doe",
    "company_name": "HNG"
  },
  "version_number": 2
}
```

**Request Body (Inline Template):**

```json
{
  "template_str": "<p>Hello {{ name }}, you have {{ count }} messages</p>",
  "variables": {
    "name": "John",
    "count": 5
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "rendered": "<p>Hello John Doe, welcome to HNG!</p>",
    "template_code": "welcome_email",
    "version_number": 2,
    "variables": {
      "name": "John Doe",
      "company_name": "HNG"
    }
  },
  "message": "Template rendered successfully from database"
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/templates/render \
  -H "Content-Type: application/json" \
  -d '{
    "template_code": "welcome_email",
    "variables": {
      "name": "John",
      "company_name": "HNG"
    }
  }'
```

---

### Rollback Template

**Endpoint:** `POST /api/v1/templates/:template_code/rollback`

Creates a new version by copying content from a previous version.

**Request Body:**

```json
{
  "target_version": 2
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Template rolled back to version 2 successfully",
  "data": {
    "code": "welcome_email",
    "previous_version": 5,
    "rolled_back_to": 2,
    "new_version": 6
  }
}
```

**Example cURL:**

```bash
curl -X POST http://localhost:5000/api/v1/templates/welcome_email/rollback \
  -H "Content-Type: application/json" \
  -d '{"target_version": 2}'
```

---

### Delete Template (Soft Delete)

**Endpoint:** `DELETE /api/v1/templates/:template_code`

Deactivates a template (sets `is_active` to false). Does not delete data.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Template 'welcome_email' deactivated successfully"
}
```

**Example cURL:**

```bash
curl -X DELETE http://localhost:5000/api/v1/templates/welcome_email
```

---

## 🔑 Key Features

### 1. Idempotency

Every notification request requires a unique `x-request-id` header. The system guarantees:

- Duplicate requests return cached results
- Prevents duplicate email sends
- Safe retries without side effects

**Smart Retry Logic:**

- If status is `queued`: Re-queues the message
- If status is `processing`: Returns "currently being processed"
- If status is `delivered`: Returns "already delivered"
- If status is `failed`: Returns failure details

### 2. Status Lifecycle

```
queued → processing → delivered
                   ↘ failed
```

All status changes tracked in Redis with TTL.

### 3. Template Versioning

- Every template update creates a new version
- Rollback creates a new version (copy of old)
- Version history preserved
- Supports A/B testing

### 4. Message Acknowledgment

- **Manual acknowledgment** (not auto)
- Messages only removed after successful delivery
- Failed messages sent to dead-letter queue
- Prevents message loss

---

## 🧪 Complete Testing Flow

### 1. Create a Template

```bash
curl -X POST http://localhost:5000/api/v1/templates/ \
  -H "Content-Type: application/json" \
  -d '{
    "code": "password_reset",
    "name": "Password Reset",
    "subject": "Reset Password - {{ company_name }}",
    "body": "<h1>Hi {{ name }}</h1><p>Click here: {{ reset_link }}</p>"
  }'
```

### 2. Send Email Notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-request-id: test-$(date +%s)" \
  -d '{
    "user_id": "caed963c-686d-4fce-ac4a-4452e02324ce",
    "channel": "email",
    "template_code": "password_reset",
    "data": {
      "name": "John Doe",
      "company_name": "HNG",
      "reset_link": "https://app.com/reset?token=abc123"
    }
  }'
```

### 3. Check Status

```bash
# Replace with actual request_id from step 2
curl http://localhost:3000/api/v1/notifications/status/test-1234567890
```

### 4. Retry Same Request (Idempotency Test)

```bash
# Use same x-request-id - should return cached result
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "x-request-id: test-1234567890" \
  -d '{...same payload...}'
```

---

## 📊 Monitoring

### RabbitMQ Management

- URL: http://localhost:15672
- Username: `guest`
- Password: `guest`
- Queues:
  - `email.queue`: Email notifications
  - `push.queue`: Push notifications
  - `failed.queue`: Failed deliveries
  - `status.queue`: Status updates

### Redis Keys

```bash
docker exec -it redis redis-cli

# List all status keys
KEYS status:*

# Get specific status
GET status:req-123

# Get TTL
TTL status:req-123
```

### Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f email_service
docker compose logs -f push_service
docker compose logs -f gateway
```

---

## 🐛 Common Errors

### 400 - Missing x-request-id

```json
{
  "success": false,
  "message": "x-request-id header is required for idempotency",
  "error": "MISSING_REQUEST_ID"
}
```

**Solution:** Add `x-request-id` header with unique value

### 404 - User Not Found

```json
{
  "success": false,
  "message": "User not found",
  "error": "NOT_FOUND"
}
```

**Solution:** Verify user_id exists in user service

### 404 - Template Not Found

```json
{
  "success": false,
  "message": "Template not found",
  "error": "NOT_FOUND"
}
```

**Solution:** Create template first or check template_code spelling

### 429 - Rate Limit Exceeded

```json
{
  "success": false,
  "message": "Too many requests",
  "error": "RATE_LIMIT_EXCEEDED"
}
```

**Solution:** Wait and retry (rate limit: 10 requests per minute)

---

## 🔐 Environment Variables

### Required for Email Service

```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name
```

### Required for Push Service

```env
ONESIGNAL_API_KEY=your-onesignal-api-key
ONESIGNAL_APP_ID=your-onesignal-app-id
```

### Optional Configuration

```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## 📝 Best Practices

1. **Always use unique x-request-id** - UUID or timestamp-based
2. **Check status endpoint** before considering a request failed
3. **Monitor RabbitMQ queues** - ensure messages are being consumed
4. **Use template versioning** - never delete old versions
5. **Test templates** with `/render` endpoint before using in production
6. **Set up alerts** for `failed.queue` messages
7. **Use descriptive template codes** - e.g., `user_welcome_v2` not `template1`

---

## 🆘 Support

- Check logs: `docker compose logs <service-name>`
- Verify RabbitMQ: http://localhost:15672
- Check Redis: `docker exec -it redis redis-cli`
- View queue status: RabbitMQ Management UI

For persistent issues, check:

1. Service is running: `docker compose ps`
2. Network connectivity between services
3. Environment variables are set correctly
4. Database migrations have run
