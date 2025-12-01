# TechMate AI - API Usage Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Code Examples](#code-examples)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)

## Getting Started

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.techmate.ai/api`

### API Documentation
Interactive API documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://api.techmate.ai/api/docs`

### Content Type
All requests should use `Content-Type: application/json` unless uploading files.

## Authentication

### Overview
TechMate AI uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header.

### Authentication Flow

#### 1. Register a New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "developer@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Developer",
  "role": "developer"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "developer@example.com",
    "role": "developer"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "developer@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "developer@example.com",
    "role": "developer"
  }
}
```

#### 3. Using the Access Token
Include the access token in the Authorization header for all protected endpoints:

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Refresh Token
When the access token expires (after 1 hour), use the refresh token to get a new one:

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Two-Factor Authentication (2FA)

#### Enable 2FA
```http
POST /api/auth/2fa/enable
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

#### Verify 2FA Setup
```http
POST /api/auth/2fa/verify-setup
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Login with 2FA
1. First, login with credentials:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "developer@example.com",
  "password": "SecurePassword123!"
}
```

**Response (when 2FA is enabled):**
```json
{
  "requires2FA": true,
  "tempToken": "temp_token_here"
}
```

2. Then verify with 2FA code:
```http
POST /api/auth/2fa/verify
Content-Type: application/json

{
  "tempToken": "temp_token_here",
  "token": "123456"
}
```

## API Endpoints

### Learning Module

#### Generate Learning Roadmap
```http
POST /api/learning/roadmap
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "goals": ["Learn React", "Master TypeScript", "Build Full-Stack Apps"],
  "skillLevel": "intermediate"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Full-Stack Development Roadmap",
  "milestones": [
    {
      "id": "uuid",
      "title": "React Fundamentals",
      "description": "Learn core React concepts",
      "topics": ["Components", "Props", "State", "Hooks"],
      "resources": [
        {
          "title": "React Official Docs",
          "url": "https://react.dev",
          "type": "documentation"
        }
      ],
      "order": 1,
      "completed": false
    }
  ]
}
```

#### Explain a Concept
```http
POST /api/learning/explain
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "concept": "React Hooks",
  "context": "I'm learning React and want to understand useState"
}
```

#### Update Progress
```http
PUT /api/learning/progress/{milestoneId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "completed"
}
```

#### Get Tech News
```http
POST /api/learning/news
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "topics": ["React", "TypeScript", "Node.js"],
  "limit": 5
}
```

### Projects Module

#### Generate Project Ideas
```http
POST /api/projects/ideas
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "difficulty": "intermediate",
  "technologies": ["React", "Node.js", "PostgreSQL"],
  "count": 3
}
```

**Response:**
```json
{
  "ideas": [
    {
      "id": "uuid",
      "title": "Task Management SaaS",
      "description": "Build a collaborative task management application",
      "difficulty": "intermediate",
      "technologies": ["React", "Node.js", "PostgreSQL"],
      "estimatedHours": 40
    }
  ]
}
```

#### Generate Architecture
```http
POST /api/projects/architecture
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "projectIdeaId": "uuid"
}
```

#### Generate Starter Code
```http
POST /api/projects/code
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "architectureId": "uuid"
}
```

#### Export to GitHub
```http
POST /api/projects/export/github
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "architectureId": "uuid",
  "githubToken": "ghp_...",
  "repositoryName": "my-awesome-project",
  "description": "A task management application",
  "isPrivate": false
}
```

### Interview Module

#### Start Interview Session
```http
POST /api/interview/session
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "dsa",
  "difficulty": "medium",
  "questionCount": 5
}
```

#### Get Next Question
```http
GET /api/interview/session/{sessionId}/question
Authorization: Bearer <access_token>
```

#### Submit Answer
```http
POST /api/interview/session/{sessionId}/answer
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "questionId": "uuid",
  "answer": "My solution is to use a hash map..."
}
```

#### Complete Session
```http
POST /api/interview/session/{sessionId}/complete
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "summary": {
    "overallScore": 85,
    "strengths": [
      "Clear problem-solving approach",
      "Good time complexity analysis"
    ],
    "improvements": [
      "Consider edge cases more thoroughly",
      "Practice explaining your thought process"
    ],
    "questionResults": [
      {
        "question": "Two Sum",
        "score": 90,
        "feedback": "Excellent solution with optimal time complexity"
      }
    ]
  }
}
```

#### Get Practice Questions
```http
GET /api/interview/practice?type=dsa&difficulty=medium
Authorization: Bearer <access_token>
```

### Jobs Module

#### Upload Resume
```http
POST /api/jobs/resume/upload
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <resume.pdf>
```

**Response:**
```json
{
  "id": "uuid",
  "fileName": "resume.pdf",
  "parsedData": {
    "name": "Jane Developer",
    "email": "jane@example.com",
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Software Engineer",
        "duration": "2020-2023"
      }
    ]
  }
}
```

#### Score Resume
```http
POST /api/jobs/resume/{resumeId}/score
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "overallScore": 78,
  "atsCompatibility": 85,
  "contentQuality": 72,
  "suggestions": [
    "Add more quantifiable achievements",
    "Use industry-standard keywords",
    "Improve formatting for ATS compatibility"
  ]
}
```

#### Optimize Resume
```http
POST /api/jobs/resume/{resumeId}/optimize
Authorization: Bearer <access_token>
```

#### Match Jobs
```http
POST /api/jobs/match
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "skills": ["JavaScript", "React", "Node.js"],
  "interests": ["Full-Stack Development", "SaaS"],
  "experienceLevel": "mid",
  "location": "Remote"
}
```

### Productivity Module

#### Create Task
```http
POST /api/productivity/tasks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API",
  "priority": "high",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

#### Get Tasks
```http
GET /api/productivity/tasks?status=todo&priority=high
Authorization: Bearer <access_token>
```

#### Update Task
```http
PUT /api/productivity/tasks/{taskId}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "status": "in_progress"
}
```

#### Start Focus Timer
```http
POST /api/productivity/timer/start
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "duration": 1500,
  "taskId": "uuid"
}
```

#### Create Note
```http
POST /api/productivity/notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "React Best Practices",
  "content": "# React Best Practices\n\n1. Use functional components...",
  "tags": ["react", "javascript", "best-practices"]
}
```

#### Summarize Note
```http
POST /api/productivity/notes/{noteId}/summarize
Authorization: Bearer <access_token>
```

#### Create Reminder
```http
POST /api/productivity/reminders
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "message": "Review pull requests",
  "scheduledFor": "2024-12-01T09:00:00Z"
}
```

### Subscription Module

#### Get Subscription
```http
GET /api/subscription
Authorization: Bearer <access_token>
```

#### Get Usage Stats
```http
GET /api/subscription/usage
Authorization: Bearer <access_token>
```

#### Upgrade Subscription
```http
POST /api/subscription/upgrade
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "tier": "premium",
  "paymentMethodId": "pm_..."
}
```

#### Cancel Subscription
```http
DELETE /api/subscription/cancel
Authorization: Bearer <access_token>
```

## Code Examples

### JavaScript/TypeScript (axios)

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Redirect to login
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Usage examples
async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return data;
}

async function generateRoadmap(goals: string[], skillLevel: string) {
  const { data } = await api.post('/learning/roadmap', {
    goals,
    skillLevel,
  });
  return data;
}

async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/jobs/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}
```

### Python (requests)

```python
import requests
from typing import Dict, Any

API_BASE_URL = "http://localhost:3000/api"

class TechMateClient:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
    
    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        
        self.access_token = data["accessToken"]
        self.refresh_token = data["refreshToken"]
        return data
    
    def generate_roadmap(self, goals: list, skill_level: str) -> Dict[str, Any]:
        response = requests.post(
            f"{API_BASE_URL}/learning/roadmap",
            json={"goals": goals, "skillLevel": skill_level},
            headers=self._headers()
        )
        response.raise_for_status()
        return response.json()
    
    def upload_resume(self, file_path: str) -> Dict[str, Any]:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = requests.post(
                f"{API_BASE_URL}/jobs/resume/upload",
                files=files,
                headers=headers
            )
        response.raise_for_status()
        return response.json()

# Usage
client = TechMateClient()
client.login("developer@example.com", "password123")
roadmap = client.generate_roadmap(["Learn Python", "Master Django"], "beginner")
```

### cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"developer@example.com","password":"SecurePassword123!"}'

# Generate roadmap
curl -X POST http://localhost:3000/api/learning/roadmap \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"goals":["Learn React"],"skillLevel":"beginner"}'

# Upload resume
curl -X POST http://localhost:3000/api/jobs/resume/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@resume.pdf"
```

## Error Handling

### Error Response Format
All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource already exists |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 502 | EXTERNAL_SERVICE_ERROR | External service failure |
| 504 | TIMEOUT | Request timeout |

### Error Handling Example

```typescript
try {
  const response = await api.post('/learning/roadmap', data);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data?.error;
    
    switch (error.response?.status) {
      case 400:
        console.error('Validation error:', errorData.details);
        break;
      case 401:
        console.error('Authentication required');
        // Redirect to login
        break;
      case 429:
        console.error('Rate limit exceeded, please try again later');
        break;
      case 500:
        console.error('Server error:', errorData.message);
        break;
      default:
        console.error('Unexpected error:', errorData);
    }
  }
  throw error;
}
```

## Rate Limiting

### Limits by Tier

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Premium | 1,000 | 10,000 |
| Enterprise | Unlimited | Unlimited |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

```typescript
api.interceptors.response.use(
  (response) => {
    // Log rate limit info
    const remaining = response.headers['x-ratelimit-remaining'];
    const reset = response.headers['x-ratelimit-reset'];
    console.log(`Rate limit: ${remaining} requests remaining`);
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      const waitTime = resetTime - Date.now() / 1000;
      console.error(`Rate limit exceeded. Retry after ${waitTime} seconds`);
    }
    return Promise.reject(error);
  }
);
```

## Best Practices

### 1. Token Management
- Store tokens securely (httpOnly cookies or secure storage)
- Implement automatic token refresh
- Clear tokens on logout
- Never expose tokens in URLs or logs

### 2. Error Handling
- Always handle errors gracefully
- Display user-friendly error messages
- Log errors for debugging
- Implement retry logic for transient failures

### 3. Performance
- Use pagination for large datasets
- Cache responses when appropriate
- Implement request debouncing
- Use WebSockets for real-time updates

### 4. Security
- Always use HTTPS in production
- Validate and sanitize all inputs
- Implement CSRF protection
- Use secure password requirements

### 5. API Versioning
- Current version: v1 (implicit in /api/)
- Future versions will use /api/v2/, /api/v3/, etc.
- Deprecated endpoints will be marked in documentation

### 6. Testing
- Test with various input combinations
- Test error scenarios
- Test rate limiting behavior
- Use the Swagger UI for manual testing

## Support

For questions or issues:
- **Documentation**: https://docs.techmate.ai
- **API Status**: https://status.techmate.ai
- **Support Email**: support@techmate.ai
- **GitHub Issues**: https://github.com/techmate/platform/issues
