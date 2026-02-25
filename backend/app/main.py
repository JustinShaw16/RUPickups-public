from fastapi import FastAPI

from app.api.routes import users_route

app = FastAPI(title="RU Pickups API")

app.include_router(users_route.router, prefix="/users", tags=["Users"])