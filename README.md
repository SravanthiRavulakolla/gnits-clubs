# GNITS Clubs Website

A modern clubs management website for GNITS college with authentication system for students and club admins.

# Link to the ppt: https://www.canva.com/design/DAG1NMoXSEM/2jQXYThv5b-4ln17oKwkmA/edit

## Features

### 🎓 For Students
- Register and login with roll number and department
- Browse all clubs (CSI, GDSC, Aptnus Gana)
- View club details and upcoming events
- Register for events and apply to clubs
- Track registrations and applications

### 👨‍💼 For Club Admins
- Register as admin for a specific club
- Manage club events and recruitment drives
- View student registrations and applications


## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express Validator for input validation

### Frontend
- React 19 with Hooks
- React Router for navigation
- Context API for state management
- Modern CSS with animations

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (already configured)
- npm or yarn package manager

### Backend Setup
1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are already configured in `.env` file

4. Start the backend server:
   ```bash
   npm run dev
   ```
   Server will run on http://localhost:5000

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if needed):
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```
   Frontend will run on http://localhost:3000


## Project Structure
```
gnits-clubs/
├── backend/
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Authentication middleware
│   ├── .env           # Environment variables
│   ├── server.js      # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # Context providers
│   │   └── ...
│   ├── .env              # Frontend environment
│   └── package.json
└── README.md
```
