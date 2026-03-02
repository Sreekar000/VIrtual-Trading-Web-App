# VirtualTrade Pro

VirtualTrade Pro is a modern, full-stack paper trading application that allows users to practice stock trading with virtual money ($100,000 starting balance).

## Features
- **Real-time Stock Data**: Integrated with Finnhub.io API (with mock fallback).
- **Portfolio Management**: Track current holdings, P&L, and total value.
- **Trading System**: Buy and sell stocks at real-time prices.
- **Social**: Competitive leaderboard and transaction history.
- **Premium UI**: Dark-mode-first fintech design with responsive layout.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, JWT, Sequelize.
- **Database**: SQLite (Zero-config, portable).

## Getting Started

### Prerequisites
- Node.js (v18+)

### Installation

1. **Clone the repository** (or navigate to the folder).
2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   JWT_SECRET=your_secret_key
   FINNHUB_API_KEY=your_api_key_from_finnhub.io
   ```
   Note: The database (`database.sqlite`) will be created automatically on the first run.
3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Running with Docker

```bash
docker-compose up --build
```

## License
MIT
