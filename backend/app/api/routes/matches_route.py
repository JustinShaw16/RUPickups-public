from fastapi import APIRouter

from app.services.matches_service import get_matches
from app.models.matches import MatchResponse

router = APIRouter()

@router.get("/match_manifest", response_model=list[MatchResponse])
def get_list_of_matches():
    return get_matches()