# RU Pickups – Backend

This directory contains the FastAPI backend for the RU Pickups application.

The backend is responsible for:
- Connecting to the Supabase PostgreSQL database
- Handling business logic (lobbies, matches, stats, notifications)
- Managing secure server-side operations using the Supabase service role key
- Exposing API endpoints for the mobile application

## Tech Stack

- FastAPI
- Uvicorn
- Supabase (PostgreSQL)
- Python 3.9+
- python-dotenv

## Setup Instructions (Mac)

**1. Navigate to the backend directory**
```bash
cd backend
```

**2. Create a virtual environment**
```bash
python3 -m venv venv
```

Activate it:
```bash
source venv/bin/activate
```

You should now see `(venv)` in your terminal.

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Configure environment variables**

Create a `.env` file inside the `backend/` directory:
```
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Do not commit this file. It is ignored via `.gitignore`.

## Running the Backend

Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```

Open in your browser:
```
http://127.0.0.1:8000/health
```

You should see:
```json
{"status": "ok"}
```

## Testing Database Connection

To verify Supabase connectivity:
```bash
python -m scripts.db_check
```

If successful, you should see a confirmation message with sample data.

## Project Structure

```
backend/
│
├── app/
│   ├── main.py
│   ├── db/
│   │   └── supabase_client.py
│   └── services/
│
├── scripts/
│   └── db_check.py
│
├── requirements.txt
├── .env.example
└── README.md
```