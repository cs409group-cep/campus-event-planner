# EventEase - Campus Event Planner

A centralized platform for discovering and managing campus events at UIUC. Built with React, Express, MongoDB, and Tailwind CSS.

## Features

- **Event Discovery**: Browse a visually appealing feed of all campus events
- **Advanced Filtering**: Filter events by category and date, search by keywords
- **Event Creation**: Organizers can easily create and post new events
- **RSVP System**: One-click RSVP functionality with personal event calendar
- **User Profiles**: View your RSVP'd events and created events
- **Authentication**: Secure JWT-based authentication system

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Icons**: React Icons

## Project Structure

```
eventease/
├── backend/          # Express API server
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Auth middleware
│   └── server.js     # Entry point
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth)
│   │   └── App.jsx      # Main app component
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eventease
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

4. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Events
- `GET /api/events` - Get all events (with optional filters: category, date, search)
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event (protected, organizer only)
- `POST /api/events/:id/rsvp` - RSVP to event (protected)
- `DELETE /api/events/:id/rsvp` - Cancel RSVP (protected)
- `DELETE /api/events/:id` - Delete event (protected, organizer only)

### Users
- `GET /api/users/profile` - Get user profile with events (protected)

## User Roles

- Any user can browse events and view event details. A logged in user can additionally RSVP, set reminders, view their profile&calendar, create and delete events.

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `EMAIL_HOST` - SMTP server host (e.g., smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (default: 587)
- `EMAIL_SECURE` - Use secure connection (true/false, default: false)
- `EMAIL_USER` - Email address for sending reminders
- `EMAIL_PASS` - Email password or app-specific password

**Email Configuration Example (Gmail):**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Note: For Gmail, you'll need to use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

## Development

### Backend Development
- Uses nodemon for auto-restart on file changes
- MongoDB connection with Mongoose
- Express middleware for CORS and JSON parsing

### Frontend Development
- Vite for fast development and hot module replacement
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```
The build output will be in the `dist/` directory.

### Backend
```bash
cd backend
npm start
```

## Features Implementation

### Event Discovery
- Main feed displays all upcoming events
- Event cards show key information (title, date, time, location, RSVP count)
- Responsive grid layout

### Filtering & Search
- Filter by category (academic, social, sports, cultural, etc.)
- Filter by date
- Keyword search across title, description, and location

### Event Creation
- Simple form for organizers to create events
- Required fields: title, description, category, date, time, location
- Optional image URL

### RSVP System
- One-click RSVP/cancel RSVP
- RSVP count displayed on event cards
- Personal calendar in user profile

### User Profile
- View all RSVP'd events
- View all created events (for organizers)
- User information display

## License

ISC

## Contributing

This is a project for UIUC. Feel free to extend and improve!

