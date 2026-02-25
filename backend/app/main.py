from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    users_route,
    lobby_route,
    lobbyparticipant_route,
    location_route,
    matches_route,
    matchplayers_route,
    notifications_route,
    playerstats_route,
)

app = FastAPI(title="RU Pickups API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(users_route.router, prefix="/users", tags=["Users"])
app.include_router(lobby_route.router, prefix="/lobby", tags=["Lobby"])
app.include_router(
    lobbyparticipant_route.router,
    prefix="/lobby_participant",
    tags=["Lobby Participant"],
)
app.include_router(location_route.router, prefix="/location", tags=["Location"])
app.include_router(matches_route.router, prefix="/matches", tags=["Matches"])
app.include_router(
    matchplayers_route.router,
    prefix="/matchplayers",
    tags=["Match Players"],
)
app.include_router(
    notifications_route.router,
    prefix="/notifications",
    tags=["Notifications"],
)
app.include_router(
    playerstats_route.router,
    prefix="/playerstats",
    tags=["Player Stats"],
)