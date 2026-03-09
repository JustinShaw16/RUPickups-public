# RUPickups

RU Pickups is a mobile app + FastAPI backend for organizing and joining pickup games at Rutgers, backed by Supabase.

This root `README` explains how to set up the entire project (backend + frontend) on a Mac and get it running locally.

---

## 1. Clone the repository

```bash
git clone git@github.com:jsoncruzsipiran/RUPickups.git
cd RUPickups
```

---

## 2. One-command setup & run (recommended)

The easiest way to get everything running is to use the provided `start.sh` script from the project root:

```bash
chmod +x start.sh        # only needed once
./start.sh
```

What `./start.sh` does:

- **Backend**
  - Creates a Python virtual environment in `backend/venv` (if it does not exist).
  - Installs backend dependencies from `backend/requirements.txt`.
  - Ensures `backend/.env` exists (copies from `.env.example` if present, otherwise creates an empty file).
- **Frontend (Expo app)**
  - Ensures `frontend/.env` exists (copies from `.env.example` if present, otherwise creates an empty file).
  - Installs frontend dependencies in `frontend/node_modules` (if missing) via `npm install`.
- **Run**
  - Starts the FastAPI backend with Uvicorn at `http://127.0.0.1:8000`.
  - Starts the Expo dev server in the `frontend/` directory.

### Important: first-run environment variables

On first run, if `.env` files are missing, the script will:

- Create `backend/.env` and `frontend/.env`.
- Print a message telling you to edit them and then **exit**.

You must then:

1. Open `backend/.env` and fill in your Supabase values:
  ```env
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
  ```
2. Open `frontend/.env` and fill in the Expo/Supabase values, for example:
  ```env
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  ```
3. Re-run:
  ```bash
   ./start.sh
  ```

Once everything is configured correctly, the backend and frontend will start automatically.

---

## 3. Running backend and frontend manually (optional)

If you prefer not to use `start.sh`, you can manage each part yourself.

### Backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

Run the server:

```bash
uvicorn app.main:app --reload
```

Verify it is working:

- Health check: `http://127.0.0.1:8000/health`
- DB check: `http://127.0.0.1:8000/health/db`

### Frontend (Expo)

```bash
cd frontend
npm install
```

Create `frontend/.env` (if not already created by `start.sh`):

```env
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Start the Expo dev server:

```bash
npx expo start
```

Then connect using:

- The web (localhost:8081)
- iOS simulator (TBD)
- Android emulator (TBD)
- A physical device via Expo Go (TBD)

---

## 4. Useful references

- **Backend docs**: see `backend/README.md` for more detailed backend setup and architecture.
- **Frontend docs**: see `frontend/README.md` for Expo-specific workflows.

Once both backend and frontend are running, you can develop features under `backend/app` and `frontend/app` as usual.