# Intern Registration API

A RESTful API built with Node.js, Express, and MongoDB for managing intern registrations.

## Features

- ✅ Register new interns
- ✅ Retrieve all interns with filtering and pagination
- ✅ Get individual intern details
- ✅ Update intern information
- ✅ Delete intern records
- ✅ Update intern status
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
   - For local MongoDB: `mongodb://localhost:27017/intern_registration`
   - For MongoDB Atlas: Use your cluster connection string

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

The server will start on `http://localhost:3000`

## API Endpoints

### 1. Register New Intern
**POST** `/api/interns/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "skills": ["JavaScript", "React", "Node.js"],
  "startDate": "2024-01-15",
  "department": "Engineering",
  "mentor": "Jane Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Intern registered successfully",
  "data": {
    "_id": "...",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "status": "Active",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### 2. Get All Interns
**GET** `/api/interns`

**Query Parameters:**
- `status` - Filter by status (Active/Inactive/Completed)
- `department` - Filter by department
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:** `GET /api/interns?status=Active&page=1&limit=10`

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 25,
  "page": 1,
  "pages": 3,
  "data": [...]
}
```

### 3. Get Intern by ID
**GET** `/api/interns/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "John Doe",
    ...
  }
}
```

### 4. Update Intern
**PUT** `/api/interns/:id`

**Request Body:** (all fields optional)
```json
{
  "name": "John Updated",
  "phone": "+9876543210",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB"]
}
```

### 5. Delete Intern
**DELETE** `/api/interns/:id`

**Response:**
```json
{
  "success": true,
  "message": "Intern deleted successfully",
  "data": {}
}
```

### 6. Update Intern Status
**PATCH** `/api/interns/:id/status`

**Request Body:**
```json
{
  "status": "Completed"
}
```

## Data Model

### Intern Schema
- `name` (String, required) - Intern's full name
- `email` (String, required, unique) - Email address
- `phone` (String, optional) - Phone number
- `skills` (Array, optional) - List of skills
- `startDate` (Date, default: now) - Internship start date
- `department` (String, enum) - Engineering, Marketing, HR, Sales, Design, Other
- `mentor` (String, optional) - Assigned mentor's name
- `status` (String, enum) - Active, Inactive, Completed
- `createdAt` (Date) - Automatically generated
- `updatedAt` (Date) - Automatically updated

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Server Error

## Testing with cURL

### Register an intern:
```bash
curl -X POST http://localhost:3000/api/interns/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "skills": ["Python", "Django"],
    "department": "Engineering"
  }'
```

### Get all interns:
```bash
curl http://localhost:3000/api/interns
```

### Get active interns:
```bash
curl http://localhost:3000/api/interns?status=Active
```

## Project Structure

```
Intern Registration API/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   └── Intern.js
│   ├── routes/
│   │   └── internRoutes.js
│   ├── controllers/
│   │   └── internController.js
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
