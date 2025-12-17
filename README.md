# Campass

Campass is a comprehensive academic planner and scheduling application designed for students. It helps manages class schedules, tasks, exams, and events in a clean, responsive interface.

## Features

- **Dashboard**: Overview of today's schedule, upcoming tasks, and quick stats.
- **Timetable**: Manage weekly class schedules with period customization.
- **Calendar**: Visual monthly/weekly view of all academic events.
- **Task & Exam Management**: Track assignments and exams with status and deadlines.
- **Responsive Design**: distinct mobile and desktop experiences.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Radix UI
- **Backend**: Hono, tRPC
- **Database**: PostgreSQL (Neon), Drizzle ORM
- **Authentication**: Better Auth
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- pnpm
- PostgreSQL Database (Neon recommended)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root directory and add your database connection string and auth secret:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   BETTER_AUTH_SECRET="your_random_secret"
   ```
4. Push database schema:
   ```bash
   pnpm run db:push
   ```

### Running the App

Start the development server:

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173` (client) and `http://localhost:3000` (server).

## Scripts

- `pnpm run dev`: Start both client and server in development mode
- `pnpm run build`: Build for production
- `pnpm run start`: Start production server
- `pnpm run check`: Type check
- `pnpm run test`: Run tests
