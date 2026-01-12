# Task Submission API

A RESTful API built with Node.js, Express, and MongoDB for managing task submissions and tracking intern progress.

## Features

- ✅ Submit tasks with intern tracking
- ✅ Retrieve all tasks with filtering and pagination
- ✅ Get tasks by intern ID
- ✅ Update task information
- ✅ Delete task records
- ✅ Update task status (Pending → Submitted → Reviewed → Approved/Rejected)
- ✅ Add reviewer comments and scores
- ✅ Task statistics and analytics
- ✅ Priority levels (Low, Medium, High)
- ✅ Due date tracking with overdue detection
- ✅ Input validation
- ✅ Error handling
- ✅ CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Update the `.env` file with your MongoDB connection string
   - Default port is 3001 (to avoid conflict with other APIs)

3. **Start MongoDB (if using local):**
   ```bash
   mongod
   ```

4. **Run the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:3001`

## API Endpoints

### 1. Submit New Task
**POST** `/api/tasks/submit`

**Request Body:**
```json
{
  "title": "Build REST API",
  "description": "Create a RESTful API using Node.js and Express",
  "internId": "INTERN001",
  "internName": "John Doe",
  "submissionUrl": "https://github.com/user/repo",
  "dueDate": "2024-01-20",
  "priority": "High"
}
```

### 2. Get All Tasks
**GET** `/api/tasks`

**Query Parameters:**
- `status` - Filter by status
- `internId` - Filter by intern ID
- `priority` - Filter by priority
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:** `GET /api/tasks?status=Submitted&priority=High&page=1`

### 3. Get Tasks by Intern
**GET** `/api/tasks/intern/:internId`

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

### 4. Get Task by ID
**GET** `/api/tasks/:id`

### 5. Update Task
**PUT** `/api/tasks/:id`

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "submissionUrl": "https://github.com/user/updated-repo",
  "status": "Submitted"
}
```

### 6. Delete Task
**DELETE** `/api/tasks/:id`

### 7. Update Task Status
**PATCH** `/api/tasks/:id/status`

**Request Body:**
```json
{
  "status": "Approved"
}
```

### 8. Review Task
**PATCH** `/api/tasks/:id/review`

**Request Body:**
```json
{
  "reviewerComments": "Great work! Well implemented.",
  "score": 95,
  "status": "Approved"
}
```

### 9. Get Task Statistics
**GET** `/api/tasks/stats/summary`

**Query Parameters:**
- `internId` - Filter stats by intern (optional)

## Data Model

### Task Schema
- `title` (String, required) - Task title
- `description` (String, optional) - Task description
- `internId` (String, required) - Intern's ID
- `internName` (String, optional) - Intern's name
- `submissionUrl` (String, optional) - Link to submission
- `submissionDate` (Date) - When task was submitted
- `dueDate` (Date, optional) - Task deadline
- `status` (String, enum) - Pending, Submitted, Reviewed, Approved, Rejected
- `reviewerComments` (String, optional) - Feedback from reviewer
- `score` (Number, 0-100) - Task score
- `priority` (String, enum) - Low, Medium, High
- `createdAt` (Date) - Automatically generated
- `updatedAt` (Date) - Automatically updated
- `isOverdue` (Virtual) - Calculated field for overdue status

## Task Workflow

```
Pending → Submitted → Reviewed → Approved/Rejected
```

1. **Pending**: Task assigned but not yet submitted
2. **Submitted**: Intern has submitted the task
3. **Reviewed**: Reviewer has evaluated the task
4. **Approved**: Task accepted
5. **Rejected**: Task needs revision

## Usage Examples

### Submit a Task
```bash
POST http://localhost:3001/api/tasks/submit
Content-Type: application/json

{
  "title": "Complete MongoDB Tutorial",
  "description": "Learn CRUD operations",
  "internId": "INTERN001",
  "internName": "John Doe",
  "dueDate": "2024-01-25",
  "priority": "High"
}
```

### Get All Tasks for an Intern
```bash
GET http://localhost:3001/api/tasks/intern/INTERN001?status=Submitted
```

### Review a Task
```bash
PATCH http://localhost:3001/api/tasks/:id/review
Content-Type: application/json

{
  "reviewerComments": "Excellent implementation with good error handling",
  "score": 92,
  "status": "Approved"
}
```

## Error Handling

Consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Server Error

## Project Structure

```
Task Submission API/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── Task.js
│   ├── routes/
│   │   └── taskRoutes.js
│   ├── controllers/
│   │   └── taskController.js
│   └── middleware/
│       └── errorHandler.js
├── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## License

ISC
