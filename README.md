PPT LINK - https://www.canva.com/design/DAG1NMoXSEM/50xb_4uoJvLgT4hKkT49dQ/view?utm_content=DAG1NMoXSEM&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h3b604ce686
# GNITS Clubs Website

A modern clubs management website for GNITS college with authentication system for students and club admins.

## Features

### 🎓 For Students
- Register and login with roll number and department
- Browse all clubs (CSI, GDSC, Aptnus Gana)
- View club details and upcoming events
- Register for events
- Track event registrations

### 👨‍💼 For Club Admins
- Register as admin for a specific club
- Manage club events
- View student event registrations

### 🎨 Modern UI/UX
- Beautiful gradient backgrounds and animations
- Glass-morphism design with backdrop blur effects
- Responsive design for all screen sizes
- Role-based dashboard views
- Smooth transitions and hover effects

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
- Responsive design

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

## Usage

### First Time Setup
1. Start both backend and frontend servers
2. Open http://localhost:3000 in your browser
3. You'll be redirected to the authentication page

### Creating Accounts

#### For Students:
- Click "Create Account"
- Fill in your details including roll number and department
- Select "Student" as your role
- Login and explore clubs

#### For Club Admins:
- Click "Create Account"
- Fill in your details
- Select "Club Admin" as your role
- Choose your club (CSI, GDSC, or Aptnus Gana)
- Login and manage your club

### Features Available Now
- ✅ User registration and authentication
- ✅ Role-based dashboards with beautiful UI
- ✅ Modern, responsive design with animations
- ✅ Club browsing for students
- ✅ **Event Management System**
  - Club admins can create, edit, and delete events
  - Complete event forms with dates, venues, participants limits
  - Event categorization and tagging
- ✅ **Student Event Registration**
  - Browse and filter events by club and type
  - Real-time event registration
  - Registration deadline management
- ✅ **Navigation System**
  - Sticky navigation bar
  - Role-based menu items
  - User info display
- ✅ **Search and Filter**
  - Event search by title and description
  - Filter by club and event type
  - Date sorting



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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request


