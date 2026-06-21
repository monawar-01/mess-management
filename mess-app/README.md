# 🍽️ Mess Management System

A full-stack mess/canteen management application with role-based access control, persistent authentication, and complete meal/deposit/expense tracking.

## Features

- **Role-based access**: Manager and Member roles with strict permission enforcement
- **Deposits**: Manager can add/edit/delete deposits for any member; members see only their own
- **Meals**: Track breakfast, lunch, dinner per member per day
- **Expenses**: Shared expense tracking with categories
- **Summary**: Auto-calculated meal rate, per-member balance (no "Who Pays Whom" section)
- **Persistent login**: JWT stored in localStorage — survives page refresh
- **Responsive**: Mobile and desktop friendly

## Default Accounts

| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Manager | manager@mess.com   | manager123  |
| Member  | rahim@mess.com     | member123   |
| Member  | karim@mess.com     | member123   |

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3, JWT, bcryptjs
- **Frontend**: React 18, React Router v6
- **Database**: SQLite (file-based, zero config)

---

## Local Development

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/mess-management.git
cd mess-management
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
npm install
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend setup
```bash
cd frontend
cp .env.example .env
# .env should contain: REACT_APP_API_URL=http://localhost:5000
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

## Production Deployment

### Option A — Render.com (Recommended, Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set these settings:
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && node server.js`
5. Add environment variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a random 64-char string)
   - `DB_PATH` = `/opt/render/project/src/backend/mess.db`
   - `FRONTEND_URL` = your Render URL (e.g. `https://your-app.onrender.com`)
6. Deploy!

The `render.yaml` file in the root handles this automatically if you use Render's Blueprint deployment.

### Option B — Railway.app

1. Push to GitHub
2. New Project → Deploy from GitHub repo
3. Add the same environment variables as above
4. Set `DB_PATH` = `/app/backend/mess.db`
5. Deploy

### Option C — VPS / Ubuntu Server

```bash
git clone https://github.com/YOUR_USERNAME/mess-management.git
cd mess-management

# Build frontend
cd frontend && npm install && npm run build && cd ..

# Setup backend
cd backend
cp .env.example .env
nano .env   # Set JWT_SECRET and NODE_ENV=production
npm install
node server.js
```

For process management use PM2:
```bash
npm install -g pm2
pm2 start backend/server.js --name mess-app
pm2 save && pm2 startup
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable       | Description                              | Example                        |
|----------------|------------------------------------------|--------------------------------|
| `PORT`         | Server port                              | `5000`                         |
| `JWT_SECRET`   | Secret for signing JWTs (**change this**) | `supersecretkey123`            |
| `DB_PATH`      | Path to SQLite database file             | `./mess.db`                    |
| `NODE_ENV`     | Environment                              | `production`                   |
| `FRONTEND_URL` | Allowed CORS origin                      | `https://your-app.onrender.com`|

### Frontend (`frontend/.env`)
| Variable              | Description          | Example                          |
|-----------------------|----------------------|----------------------------------|
| `REACT_APP_API_URL`   | Backend API base URL | `https://your-api.onrender.com`  |

---

## API Endpoints

| Method | Endpoint                   | Auth         | Description              |
|--------|----------------------------|--------------|--------------------------|
| POST   | /api/auth/login            | Public       | Login                    |
| GET    | /api/auth/me               | Any          | Get current user         |
| PUT    | /api/auth/profile          | Any          | Update profile           |
| GET    | /api/members               | Any          | List members             |
| POST   | /api/members               | Manager      | Add member               |
| PUT    | /api/members/:id           | Manager      | Update member            |
| DELETE | /api/members/:id           | Manager      | Delete member            |
| GET    | /api/deposits              | Any*         | Get deposits (role-scoped)|
| POST   | /api/deposits              | Manager      | Add deposit              |
| PUT    | /api/deposits/:id          | Manager      | Edit deposit             |
| DELETE | /api/deposits/:id          | Manager      | Delete deposit           |
| GET    | /api/meals                 | Any*         | Get meals (role-scoped)  |
| POST   | /api/meals                 | Manager      | Add/update meal          |
| PUT    | /api/meals/:id             | Manager      | Edit meal                |
| DELETE | /api/meals/:id             | Manager      | Delete meal              |
| GET    | /api/expenses              | Any          | List expenses            |
| POST   | /api/expenses              | Manager      | Add expense              |
| PUT    | /api/expenses/:id          | Manager      | Edit expense             |
| DELETE | /api/expenses/:id          | Manager      | Delete expense           |
| GET    | /api/summary               | Any*         | Summary (role-scoped)    |

*Role-scoped: members only see their own data; managers see all.

---

## Security

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens expire after 30 days
- All deposit/meal endpoints enforce role checks server-side
- Members cannot access other members' data even via direct API calls
- SQL injection protected via parameterized queries (better-sqlite3)

## License

MIT
