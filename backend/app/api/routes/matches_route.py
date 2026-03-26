from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.matches import MatchCreateRequest, MatchResponse
from app.services.matches_service import create_match, get_match_by_id, get_matches

router = APIRouter()


@router.get("/match_manifest", response_model=list[MatchResponse])
def get_list_of_matches():
    return get_matches()


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: UUID):
    match = get_match_by_id(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")
    return match


@router.post("/", response_model=MatchResponse, status_code=201)
def create_new_match(payload: MatchCreateRequest):
    try:
        return create_match(payload.lobby_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))