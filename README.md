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
   Create a `.env` file in the root directory and add the following variables:

   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   BETTER_AUTH_SECRET="your_random_secret"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   ```

   **Google OAuth Setup:**

   To enable Google authentication, you need to set up OAuth 2.0 credentials in Google Cloud Platform:

   a. Go to [Google Cloud Console](https://console.cloud.google.com/)

   b. Create a new project or select an existing one

   c. Navigate to **APIs & Services** > **Credentials**

   d. Click **Create Credentials** > **OAuth client ID**

   e. Configure the OAuth consent screen if you haven't already:
   - Select **External** user type
   - Fill in the required app information
   - Add authorized domains if needed

   f. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: Your app name (e.g., "Campass")
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-domain.com/api/auth/callback/google` (for production)

   g. Copy the **Client ID** and **Client Secret** and add them to your `.env` file

   **Note for Production:**
   - The redirect URI must point to your **backend server** URL, not the frontend
   - Example: If your frontend is at `https://app.example.com` and backend is at `https://api.example.com`, use `https://api.example.com/api/auth/callback/google`
   - The application automatically redirects users to the frontend after successful authentication

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
