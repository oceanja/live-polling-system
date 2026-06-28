# Live Polling System — Session-Based Quiz Platform

A **real-time, session-based classroom quiz platform**. A teacher runs a live session (one per chapter/topic), asks questions one at a time, and students join with a short code to answer on their own devices. Answers stream in live, the correct answer is revealed when each question's timer ends, and every session finishes with a **leaderboard** and per-student **scorecard**.

Built around a single principle: **the server is the only source of truth** — for the countdown, for vote counts, and for which answer is correct (clients never receive the correct answer until a question closes, so it can't be cheated by inspecting network traffic).

---

## Demo

<!-- 📹 DEMO VIDEO -->
> _Demo video coming soon — placeholder below._

<!--
Paste your demo video link or embed here, e.g.:
[![Watch the demo](docs/thumbnail.png)](https://your-video-link)
-->

**Live app:** _add your deployed URL here_

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [How to Use](#how-to-use)
- [API Reference](#api-reference)
- [Socket Events](#socket-events)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

---

## Features

### Accounts & Roles
- Email/password **registration and login** with hashed passwords (bcrypt) and **JWT** auth.
- Two roles — **Teacher** and **Student** — with role-based access control on both REST routes and socket events.

### Teacher
- Create a **session** per topic (e.g. "Chapter 5: Photosynthesis"); each session gets a unique **6-character join code**.
- A **dashboard** listing all your sessions with their status, join code, question count, and participant count.
- Run questions **live**, one at a time, at your own pace — set a per-question timer (30 / 45 / 60s) and mark the correct option(s).
- Watch a **live lobby** as students join, and **live result bars** as votes arrive.
- End the session to get a **report**: a leaderboard plus per-question accuracy.

### Student
- Join a session by entering the teacher's **join code**.
- Receive each question in real time and answer within the time limit (one answer per question, enforced server-side).
- See the **correct answer revealed** and whether you got it right when the timer ends.
- Track a **running score** during the session and get a final **scorecard** (correct / total + rank) at the end.

### Real-time & Resilience
- **Server-authoritative timer** — the countdown lives on the server and is broadcast every second; clients never trust their own clock. Joining late shows the correct remaining time.
- **Per-session isolation** — each session is its own Socket.IO room with its own timer, so multiple sessions run concurrently without interfering.
- **Refresh-safe** — reconnecting re-syncs the current question and remaining time from the server.
- **One answer per student per question** — enforced by a database unique constraint, not just the UI.
- **Restart recovery** — on server startup, timers for any still-active questions are re-armed.

---

## Tech Stack

| Layer        | Technology |
|--------------|-----------|
| Frontend     | React 19 + TypeScript + Vite |
| Styling      | Tailwind CSS v4 |
| Animation    | Framer Motion |
| Backend      | Node.js + Express 5 + TypeScript |
| Real-time    | Socket.IO 4 |
| Database     | PostgreSQL + Prisma ORM |
| Auth         | JWT (jsonwebtoken) + bcrypt |

---

## Architecture

**Controller → Service pattern.** HTTP controllers and socket handlers stay thin; all business logic and database access live in services (`AuthService`, `SessionService`, `PollService`).

**Authentication everywhere.** A JWT is issued at login/registration. REST requests send it as a `Bearer` token; sockets send it in the connection handshake (`auth.token`). Middleware verifies the token and enforces roles.

**Socket.IO rooms per session.** When a user opens a session, their socket joins the room `session:<sessionId>`. Every real-time event (`POLL_STARTED`, `TIMER_UPDATE`, `VOTE_UPDATE`, `POLL_ENDED`, `SESSION_ENDED`) is emitted only to that room. The server keeps a `Map<sessionId, timer>` so each live question has its own independent countdown — this is what makes the platform horizontally meaningful (many classes at once) rather than a single global poll.

**Correctness is gated.** Option correctness is stored in the DB but **stripped from every live payload**. It is only included once a question ends (`POLL_ENDED`) and in the final report — so a student cannot read the answer key off the wire mid-question.

---

## Data Model

```
User         id, name, email (unique), passwordHash, role (TEACHER | STUDENT)
Session      id, title, joinCode (unique), status (LOBBY | LIVE | ENDED), teacherId
Participant  sessionId, userId            (a student's enrollment in a session)
Poll         id, question, duration, order, startedAt, status, sessionId   (one question)
Option       id, text, isCorrect, pollId
Vote         pollId, userId, optionId     (unique on [pollId, userId])
```

Relationships: a `User` (teacher) owns many `Session`s; a `Session` has many `Poll`s (questions) and many `Participant`s; a `Poll` has many `Option`s and `Vote`s. Scoring is derived by counting each participant's votes that landed on a correct option.

---

## Getting Started

### Prerequisites
- **Node.js 18+**
- **PostgreSQL** running locally (or a hosted Postgres URL). A `docker-compose.yml` is included to start Postgres quickly.

### 1. Clone & install
```bash
git clone <your-repo-url>
cd live-polling-system

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

**backend/.env**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/poll_db
PORT=5001
JWT_SECRET=replace_with_a_long_random_string
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5001
```

### 3. Start the database (optional, if using Docker)
```bash
cd backend
docker compose up -d        # starts Postgres on localhost:5432
```

### 4. Apply database migrations
```bash
cd backend
npx prisma migrate deploy   # applies migrations
npx prisma generate         # generates the Prisma client
```

### 5. Run the app (two terminals)

**Terminal 1 — backend**
```bash
cd backend
npm run dev      # http://localhost:5001
```

**Terminal 2 — frontend**
```bash
cd frontend
npm run dev      # http://localhost:5173
```

Open **http://localhost:5173**.

---

## How to Use

1. **Register** two accounts (in two browser windows — use one normal and one incognito so the logins stay separate): one **Teacher**, one **Student**.
2. **Teacher:** create a session → a **join code** appears.
3. **Student:** enter the join code to join the session's lobby.
4. **Teacher:** type a question, fill in options, mark the correct one, pick a timer, and click **Ask**.
5. **Student:** answer before the timer runs out.
6. Watch results fill in live; when the timer ends the **correct answer is revealed**.
7. Repeat for more questions, then **End session** to see the **leaderboard** (teacher) and **scorecard** (student).

---

## API Reference

All session routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register; returns `{ token, user }` |
| `POST` | `/api/auth/login` | — | Log in; returns `{ token, user }` |
| `GET`  | `/api/auth/me` | any | Current user from token |
| `POST` | `/api/sessions` | Teacher | Create a session (returns join code) |
| `GET`  | `/api/sessions` | Teacher | List the teacher's sessions |
| `POST` | `/api/sessions/join` | Student | Join a session by `{ joinCode }` |
| `GET`  | `/api/sessions/:id` | member | Session info + participants |
| `POST` | `/api/sessions/:id/end` | Teacher | End the session |
| `GET`  | `/api/sessions/:id/report` | member | Leaderboard + per-question breakdown |
| `GET`  | `/health` | — | Health check |

---

## Socket Events

All sockets authenticate with a JWT in the handshake. Events are scoped to the `session:<id>` room.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `JOIN_SESSION` | Client → Server | `{ sessionId }` | Join a session room; replies with `SESSION_STATE` |
| `START_QUESTION` | Teacher → Server | `{ sessionId, question, options[], duration }` | Start a new question |
| `SUBMIT_VOTE` | Student → Server | `{ pollId, optionId }` | Submit an answer |
| `END_SESSION` | Teacher → Server | `{ sessionId }` | End the session |
| `SESSION_STATE` | Server → Client | `{ activePoll, participants }` | Current state on join/refresh |
| `PARTICIPANT_JOINED` | Server → Room | `{ id, name }` | A student joined the lobby |
| `POLL_STARTED` | Server → Room | `{ poll, remainingTime }` | A new question began |
| `TIMER_UPDATE` | Server → Room | `number` | Countdown tick (per second) |
| `VOTE_UPDATE` | Server → Room | `{ pollId, results }` | Live vote counts (no correctness) |
| `POLL_ENDED` | Server → Room | `{ pollId, results }` | Final results **with** correct answer revealed |
| `SESSION_ENDED` | Server → Room | `report` | Final leaderboard + breakdown |
| `SESSION_ERROR` | Server → Client | `string` | Error message |

---

## Project Structure

```
live-polling-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # User, Session, Participant, Poll, Option, Vote
│   │   └── migrations/
│   └── src/
│       ├── server.ts             # HTTP + Socket.IO bootstrap, timer recovery
│       ├── app.ts                # Express app + route mounting
│       ├── socket.ts             # Shared io singleton
│       ├── config/               # prisma client, env (JWT secret)
│       ├── middleware/auth.ts    # requireAuth / requireRole
│       ├── controllers/          # auth + session controllers (thin)
│       ├── services/             # AuthService, SessionService, PollService
│       ├── routes/               # auth + session routes
│       └── sockets/poll.socket.ts# socket auth + room/session event handlers
└── frontend/
    └── src/
        ├── main.tsx              # app bootstrap + AuthProvider
        ├── auth/AuthContext.tsx  # auth state, token persistence
        ├── api/client.ts         # axios instance with token interceptor
        ├── socket.ts             # socket client (token in handshake)
        ├── ui/playful.tsx        # design-system primitives (buttons, motion, colors)
        ├── components/           # ProtectedRoute, TopBar, ResultBars, Leaderboard, QuestionForm
        └── pages/
            ├── auth/             # Login, Register
            ├── teacher/          # Dashboard, Session (lobby → ask → live → report)
            └── student/          # Join, Session (lobby → answer → result → scorecard)
```

---

## Deployment

The frontend is a static Vite build; the backend is a Node server needing a Postgres database. A common free-tier setup:

- **Database:** Neon or Railway (managed PostgreSQL) → copy its connection string into `DATABASE_URL`.
- **Backend:** Render / Railway as a Node web service. Build `npm install && npx prisma migrate deploy && npm run build`, start `npm start`. Set `DATABASE_URL` and a strong `JWT_SECRET`.
- **Frontend:** Vercel / Netlify as a static site. Set `VITE_API_URL` to the deployed backend URL.

After deploying, point the frontend's `VITE_API_URL` at the backend, and make sure the backend's CORS origin allows the frontend URL.

---

> Originally built for the Intervue.io SDE Intern assignment, then extended into a full session-based quiz platform.