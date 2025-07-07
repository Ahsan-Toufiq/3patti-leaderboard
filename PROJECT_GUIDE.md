# 3 Patti Leaderboard - Project Guide

## 🎯 Project Overview

This is a **3 Patti (Teen Patti) Leaderboard System** - a full-stack web application for tracking and ranking players in the Indian card game Teen Patti. The system provides comprehensive analytics, leaderboards, and game management features.

### What is 3 Patti/Teen Patti?
A popular Indian card game similar to poker, where players compete for the best hand. Players are ranked by their finishing positions in each game.

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js + Express + TypeScript + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Deployment**: Railway (Backend) + Vercel (Frontend)
- **Database**: PostgreSQL with complex analytics queries

### Project Structure
```
3patti_Leaderboard/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── db/            # Database schema & migrations
│   │   └── types/         # TypeScript type definitions
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # API integration
│   │   └── types/         # TypeScript types
└── package.json           # Root dependencies
```

## 🎮 Core Features

### 1. Game Management
- **Add Games**: Record new games with player positions and scores
- **Game History**: View all past games with detailed results
- **Player Management**: Add/edit player profiles

### 2. Leaderboard System
- **Dynamic Rankings**: Real-time leaderboard based on performance
- **Scoring Algorithm**: 
  - 1st Place: 10 points
  - 2nd Place: 5 points  
  - 3rd Place: 3 points
  - 4th Place: 1 point
  - **Consistency Bonus**: `(10 - Average Position) × Games Played ÷ 10`

### 3. Analytics Dashboard
- **Player Analytics**: Individual performance metrics
- **Competitive Insights**: Head-to-head comparisons
- **Position Timeline**: Track player positions over time
- **Performance Ratings**: Visual performance indicators

### 4. Authentication
- **Password Protection**: Secure game deletion with password confirmation
- **Session Management**: Protected routes and actions

## 📊 Database Schema

### Key Tables
- **players**: Player profiles and statistics
- **games**: Game records with timestamps
- **game_results**: Individual player results per game
- **analytics**: Pre-computed analytics data

### Important Relationships
- `games` → `game_results` (one-to-many)
- `players` → `game_results` (one-to-many)
- Analytics computed from `game_results` aggregation

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Railway CLI (for deployment)

### Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Configure database connection in .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Run migrations
cd backend
npm run migrate
```

## 🚀 Deployment

### Backend (Railway)
```bash
railway login --browserless
railway link
railway up
```

### Frontend (Vercel)
```bash
# Connected to GitHub, auto-deploys on push
# Manual deployment via Vercel dashboard
```

## 📈 Key API Endpoints

### Analytics
- `GET /api/analytics/leaderboard` - Main leaderboard data
- `GET /api/analytics/player/:id` - Individual player analytics
- `GET /api/analytics/positions-timeline` - Position history for all players

### Games
- `POST /api/games` - Add new game
- `GET /api/games` - List all games
- `DELETE /api/games/:id` - Delete game (password protected)

### Players
- `GET /api/players` - List all players
- `POST /api/players` - Add new player

## 🎨 UI/UX Features

### Design System
- **Dark/Light Theme**: Automatic theme switching
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Tailwind CSS with custom components
- **Visual Feedback**: Toast notifications, loading states

### Key Components
- **Layout**: Consistent navigation and structure
- **Modal**: Reusable modal system for confirmations
- **LoadingSpinner**: Loading states throughout app
- **StatsCard**: Analytics display components

## 🔍 Analytics Implementation

### Backend Analytics
- **Complex SQL Queries**: CTEs for performance optimization
- **Real-time Calculations**: Leaderboard scores computed on-demand
- **Caching Strategy**: Efficient data retrieval patterns

### Frontend Analytics
- **Chart.js Integration**: Interactive charts and graphs
- **Data Visualization**: Position timelines, performance metrics
- **Responsive Charts**: Mobile-friendly chart displays

## 🛡️ Security Features

### Authentication
- **Password Protection**: Secure deletion operations
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API protection against abuse

### Data Protection
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **CORS Configuration**: Proper cross-origin handling

## 🧪 Testing & Debugging

### Common Issues
1. **API Timeouts**: Increased timeout to 30s for complex queries
2. **TypeScript Errors**: Proper type definitions throughout
3. **Chart Rendering**: Conditional rendering for data availability
4. **Database Connections**: Connection pooling and error handling

### Debugging Tips
- Check browser console for frontend errors
- Monitor Railway logs for backend issues
- Verify database connections and migrations
- Test API endpoints directly with tools like Postman

## 📝 Development Workflow

### Making Changes
1. **Feature Development**: Create feature branch
2. **Testing**: Test locally with sample data
3. **Commit**: Descriptive commit messages
4. **Push**: Deploy to staging/production
5. **Verify**: Test live functionality

### Code Standards
- **TypeScript**: Strict typing throughout
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Component Structure**: Reusable, modular components

## 🎯 Key Business Logic

### Ranking Algorithm
```typescript
// Position Points
const positionPoints = {
  1: 10, 2: 5, 3: 3, 4: 1
};

// Consistency Bonus
const consistencyBonus = (10 - avgPosition) * gamesPlayed / 10;

// Final Score
const rankingScore = totalPositionPoints + consistencyBonus;
```

### Analytics Calculations
- **Win Rate**: `(games_won / total_games) * 100`
- **Average Position**: `SUM(position) / COUNT(games)`
- **Best Position**: `MIN(position)` per player
- **Total Games**: `COUNT(DISTINCT game_id)`

## 🔄 Data Flow

### Game Addition Flow
1. User adds game with player positions
2. Backend validates and stores data
3. Analytics recalculated automatically
4. Frontend updates leaderboard and charts

### Analytics Flow
1. Frontend requests analytics data
2. Backend queries database with optimized SQL
3. Data processed and formatted
4. Charts and tables updated with new data

## 🚨 Troubleshooting

### Common Problems
1. **"game.players is undefined"**: Use `game.results` instead
2. **"avg_position.toFixed is not a function"**: Convert string to number first
3. **API timeouts**: Check backend performance and query optimization
4. **Chart rendering errors**: Ensure data exists before rendering

### Performance Optimization
- **Database Indexes**: Optimized for analytics queries
- **Query Optimization**: CTEs for complex aggregations
- **Frontend Caching**: Efficient state management
- **API Rate Limiting**: Prevent abuse and ensure stability

## 📚 Learning Resources

### Technologies Used
- **Express.js**: Backend framework
- **React**: Frontend framework
- **PostgreSQL**: Database
- **Tailwind CSS**: Styling
- **Chart.js**: Data visualization
- **Railway/Vercel**: Deployment platforms

### Key Concepts
- **Full-stack Development**: Backend + Frontend integration
- **Real-time Analytics**: Dynamic data processing
- **Responsive Design**: Mobile-first approach
- **Type Safety**: TypeScript throughout
- **Modern Deployment**: Cloud platforms with CI/CD

## 🎉 Success Metrics

### Technical Metrics
- **Performance**: Sub-second API responses
- **Reliability**: 99.9% uptime
- **Scalability**: Handles 1000+ games efficiently
- **User Experience**: Intuitive, responsive interface

### Business Metrics
- **Player Engagement**: Active leaderboard participation
- **Data Accuracy**: Reliable analytics and rankings
- **User Satisfaction**: Clean, informative interface
- **Feature Adoption**: Analytics and competitive insights usage

---

**Note**: This project demonstrates modern full-stack development practices with a focus on performance, user experience, and maintainable code. The analytics system is particularly sophisticated, using complex SQL queries and real-time calculations to provide meaningful insights into player performance. 