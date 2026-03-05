# Live Polling System

A **resilient real-time live polling application** built for the **Intervue.io SDE Intern Assignment**. Supports two personas — **Teacher** and **Student** — with server-synchronized timers, full state recovery on refresh, and database-backed results.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Node.js + Express 5 + TypeScript |
| Real-time | Socket.IO 4 |
| Database | PostgreSQL + Prisma ORM |
| Dev Server | ts-node-dev |

---

## Features

### Teacher (Admin)
- Create a poll with a question, multiple options, and a configurable timer (30 / 45 / 60 seconds)
- View live vote counts and percentages updating in real-time as students vote
- View full poll history with final results — fetched from DB, not local state
- Ask a new question at any time

### Student (User)
- Enter a name on first visit (unique per browser tab via UUID session)
- Instantly receives the poll question when teacher asks it via Socket.IO
- **Timer is server-synced** — joining 20 seconds into a 60-second poll shows 40 seconds, not 60
- Submit an answer within the time limit (one vote per student per poll)
- View live results after submitting; see final results when the poll ends

### Resilience (The "Resilience Factor")
- **Teacher refreshes** mid-poll → UI recovers the current poll and live results from DB
- **Student refreshes** mid-poll → Timer resumes from the server-calculated remaining time
- **Duplicate vote protection** → Server rejects duplicate votes even if the client is manipulated
- **Server is the single source of truth** for both timer and vote counts

---

## Project Structure

```
live-polling-system/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # DB models: Poll, Option, Vote
│   ├── socket.ts                  # Shared io instance (singleton)
│   └── src/
│       ├── server.ts              # HTTP + Socket.IO bootstrap
│       ├── app.ts                 # Express app + routes
│       ├── controllers/
│       │   ├── poll.controller.ts
│       │   └── answer.controller.ts
│       ├── services/
│       │   └── poll.service.ts    # All business logic + DB queries
│       ├── sockets/
│       │   └── poll.socket.ts     # Socket event handlers + server-side timer
│       └── routes/
│           ├── poll.routes.ts
│           ├── student.ts
│           └── answer.ts
└── frontend/
    └── src/
        ├── socket.ts              # Shared socket client (singleton)
        ├── api/                   # REST API helpers
        ├── pages/
        │   ├── RoleSelect/
        │   ├── Teacher/
        │   │   ├── TeacherCreatePollPage.tsx
        │   │   ├── TeacherLivePollPage.tsx
        │   │   └── TeacherPollHistoryPage.tsx
        │   └── Student/
        │       ├── StudentLogin.tsx
        │       └── StudentPollPage.tsx
        └── app/
            ├── App.tsx
            └── routes.tsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (default: `localhost:5432`)

### 1. Clone & Install

```bash
git clone https://github.com/oceanja/live-polling-system.git
cd live-polling-system

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

**backend/.env**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/poll_db
PORT=5001
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5001
```

### 3. Set Up the Database

```bash
cd backend
npx prisma db push
```

### 4. Run the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running on port 5001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/polls/create` | Create a new poll |
| `GET` | `/api/polls/active` | Get current active poll + remaining time |
| `GET` | `/api/polls/history` | Get all ended polls with results |
| `GET` | `/api/polls/:pollId/results` | Get results for a specific poll |
| `POST` | `/api/student/join` | Register a student (returns UUID) |
| `POST` | `/api/answer/submit` | Submit a vote |

## Socket Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `JOIN_POLL` | Client → Server | — | Request current poll state (used on page load/refresh) |
| `CREATE_POLL` | Client → Server | `{ question, options[], duration }` | Teacher creates a poll |
| `SUBMIT_VOTE` | Client → Server | `{ pollId, optionId, studentId }` | Student submits a vote via socket |
| `ACTIVE_POLL` | Server → Client | `{ poll, remainingTime }` | Response to JOIN_POLL |
| `POLL_STARTED` | Server → All | `{ poll, remainingTime }` | Broadcast when a new poll begins |
| `TIMER_UPDATE` | Server → All | `number` | Countdown tick every second |
| `VOTE_UPDATE` | Server → All | `result[]` | Live vote counts after each vote |
| `POLL_ENDED` | Server → All | `result[]` | Final results when timer hits 0 |

---

## Architecture Notes

- **Controller-Service pattern** — socket handlers and route handlers both delegate logic to `PollService`; no business logic lives in routes or socket listeners
- **Server-side timer** — `poll.socket.ts` runs a `setInterval` countdown and broadcasts `TIMER_UPDATE` every second; clients never trust their own clock
- **Single `io` instance** — `backend/socket.ts` exports a shared `io` singleton so both socket handlers and REST controllers can emit events
- **Duplicate vote guard** — `PollService.submitVote` checks for an existing vote before inserting, preventing race conditions from client-side manipulation

---

## Assignment Requirements Coverage

| Requirement | Status |
|-------------|--------|
| Teacher can create polls | ✅ |
| Students can answer polls | ✅ |
| Live polling results | ✅ |
| Poll history from database | ✅ |
| Server-synchronized timers | ✅ |
| Refresh-safe state recovery | ✅ |
| One vote per student enforced | ✅ |
| Socket.IO real-time communication | ✅ |
| TypeScript end-to-end | ✅ |
| Controller-Service architecture | ✅ |

---

> Design reference provided by Intervue.io via Figma. Built strictly following the shared design and technical guidelines.
