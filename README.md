# Live Polling System —  SDE Intern Assignment

A **resilient real-time live polling system** where The system supports **Teacher (Admin)** and **Student (User)** personas
with real-time interaction, server-synchronized timers, persistent state recovery, and database-backed results.

---

## 🚀 Project Overview

This application allows a teacher to create live polls with a configurable timer.  
Students receive the poll in real time, submit their answers within the time limit, and instantly view live results.

The system is designed to be **resilient**:
- Refreshing the page does **not** reset an active poll
- Late-joining students see the **correct remaining time**
- Server is the **single source of truth** for poll state and timers
- Duplicate votes are prevented at the database level

---

## 🧑‍🏫 Teacher Persona (Admin)

### Features
- Create a poll with:
  - Question
  - Multiple options
  - Configurable duration (e.g., 30s / 60s / 90s)
- View live polling results in real time
- View poll history (stored in database)
- Create a new poll only when:
  - No poll is active, or
  - Previous poll has ended

---

## 🧑‍🎓 Student Persona (User)

### Features
- Enter name on first visit (unique per browser tab/session)
- Receive poll instantly via Socket.io
- Server-synchronized countdown timer
- Submit vote once per poll
- View live results after submission or when poll ends

---

## 🧠 Key System Behaviors (Resilience)

- **State Recovery**
  - Refreshing the browser resumes the poll state
  - Remaining time is recalculated using server timestamps
- **Timer Synchronization**
  - Timer is controlled only by the server
  - Late joiners see the correct remaining time
- **Data Integrity**
  - Votes stored in DB with unique constraints
  - Duplicate votes prevented even if client is manipulated

---

## 🛠 Tech Stack

### Frontend
- React.js (Hooks)
- TypeScript
- Socket.io Client
- Vite

### Backend
- Node.js
- Express.js
- TypeScript
- Socket.io
- Prisma ORM

### Database & Cache
- PostgreSQL (Persistent storage)
- Redis (Active poll state + timer recovery)

---

## 🏗 Architecture Overview

### Backend Architecture :
```
src/
├── controllers/        # HTTP controllers
├── services/           # Business logic (PollService)
├── sockets/            # Socket event handlers
├── config/             # Prisma, Redis config
├── app.ts              # Express app
└── server.ts           # HTTP + Socket server
```
### Frontend Architecture:
```
src/
├── pages/
│   ├── Teacher/
│   ├── Student/
├── socket.ts           # Socket.io client
├── api/                # REST helpers
└── hooks/              # Custom hooks (optional)
```
---

## 🔁 Real-Time Flow:

1. Teacher creates a poll
2. Backend:
   - Stores poll in DB
   - Stores active poll ID + timestamps in Redis
   - Starts server-side timer
3. Students receive poll instantly via Socket.io
4. Votes are submitted:
   - Stored in DB
   - Aggregated results emitted in real time
5. Poll ends:
   - Final results emitted
   - Poll archived for history

---

## 🧪 How to Run Locally

### Backend
```bash
cd backend
npm install
npm run dev
```
## ✅ Assignment Requirements Coverage:
Teacher can create polls
1. Students can answer polls
2. Live polling results
3.Poll history from database
4. Server-synchronized timers
5. Refresh-safe state recovery
6. One vote per student enforced
7. Socket.io real-time communication
8. TypeScript used end-to-end

---

### Design reference provided by Intervue.io via Figma.
This project was built strictly following the shared design and technical guidelines.
