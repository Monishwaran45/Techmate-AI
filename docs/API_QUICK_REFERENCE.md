# TechMate AI - API Quick Reference

## Base URLs
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.techmate.ai/api`
- **API Docs**: `http://localhost:3000/api/docs`

## Authentication

### Register
```http
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "role": "developer"
}
```

### Login
```http
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Learning

### Generate Roadmap
```http
POST /api/learning/roadmap
Authorization: Bearer <token>
{
  "goals": ["Learn React", "Master TypeScript"],
  "skillLevel": "intermediate"
}
```

### Explain Concept
```http
POST /api/learning/explain
Authorization: Bearer <token>
{
  "concept": "React Hooks",
  "context": "I'm learning React"
}
```

### Update Progress
```http
PUT /api/learning/progress/{milestoneId}
Authorization: Bearer <token>
{
  "status": "completed"
}
```

## Projects

### Generate Ideas
```http
POST /api/projects/ideas
Authorization: Bearer <token>
{
  "difficulty": "intermediate",
  "technologies": ["React", "Node.js"],
  "count": 3
}
```

### Generate Architecture
```http
POST /api/projects/architecture
Authorization: Bearer <token>
{
  "projectIdeaId": "uuid"
}
```

### Generate Code
```http
POST /api/projects/code
Authorization: Bearer <token>
{
  "architectureId": "uuid"
}
```

### Export to GitHub
```http
POST /api/projects/export/github
Authorization: Bearer <token>
{
  "architectureId": "uuid",
  "githubToken": "ghp_...",
  "repositoryName": "my-project",
  "isPrivate": false
}
```

## Interview

### Start Session
```http
POST /api/interview/session
Authorization: Bearer <token>
{
  "type": "dsa",
  "difficulty": "medium",
  "questionCount": 5
}
```

### Get Next Question
```http
GET /api/interview/session/{sessionId}/question
Authorization: Bearer <token>
```

### Submit Answer
```http
POST /api/interview/session/{sessionId}/answer
Authorization: Bearer <token>
{
  "questionId": "uuid",
  "answer": "My solution..."
}
```

### Complete Session
```http
POST /api/interview/session/{sessionId}/complete
Authorization: Bearer <token>
```

## Jobs

### Upload Resume
```http
POST /api/jobs/resume/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <resume.pdf>
```

### Score Resume
```http
POST /api/jobs/resume/{resumeId}/score
Authorization: Bearer <token>
```

### Optimize Resume
```http
POST /api/jobs/resume/{resumeId}/optimize
Authorization: Bearer <token>
```

### Match Jobs
```http
POST /api/jobs/match
Authorization: Bearer <token>
{
  "skills": ["JavaScript", "React"],
  "interests": ["Full-Stack"],
  "experienceLevel": "mid"
}
```

## Productivity

### Create Task
```http
POST /api/productivity/tasks
Authorization: Bearer <token>
{
  "title": "Implement feature",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

### Get Tasks
```http
GET /api/productivity/tasks?status=todo&priority=high
Authorization: Bearer <token>
```

### Start Timer
```http
POST /api/productivity/timer/start
Authorization: Bearer <token>
{
  "duration": 1500,
  "taskId": "uuid"
}
```

### Create Note
```http
POST /api/productivity/notes
Authorization: Bearer <token>
{
  "title": "Meeting Notes",
  "content": "# Notes\n\n...",
  "tags": ["meeting", "important"]
}
```

### Summarize Note
```http
POST /api/productivity/notes/{noteId}/summarize
Authorization: Bearer <token>
```

### Create Reminder
```http
POST /api/productivity/reminders
Authorization: Bearer <token>
{
  "message": "Review PRs",
  "scheduledFor": "2024-12-01T09:00:00Z"
}
```

## Subscription

### Get Subscription
```http
GET /api/subscription
Authorization: Bearer <token>
```

### Get Usage Stats
```http
GET /api/subscription/usage
Authorization: Bearer <token>
```

### Upgrade
```http
POST /api/subscription/upgrade
Authorization: Bearer <token>
{
  "tier": "premium",
  "paymentMethodId": "pm_..."
}
```

### Cancel
```http
DELETE /api/subscription/cancel
Authorization: Bearer <token>
```

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Rate Limit Exceeded |
| 500 | Server Error |

## Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {},
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## Rate Limits

| Tier | Requests/Hour |
|------|---------------|
| Free | 100 |
| Premium | 1,000 |
| Enterprise | Unlimited |

## Headers

### Request Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Response Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Full Documentation

For complete documentation with examples, see:
- [API Usage Guide](API_USAGE_GUIDE.md)
- [Developer Guide](DEVELOPER_GUIDE.md)
- [Swagger UI](http://localhost:3000/api/docs)
