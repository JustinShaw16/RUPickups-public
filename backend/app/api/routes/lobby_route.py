from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_user_id
from app.services import lobby_service
from app.models.lobby import LobbyCreate, LobbyResponse, LobbyUpdate


router = APIRouter()


@router.get("", response_model=list[LobbyResponse])
def get_all_lobbies():
    return lobby_service.get_all_lobbies()


@router.get("/{lobby_id}", response_model=LobbyResponse)
def get_lobby(lobby_id: UUID, user_id: str = Depends(require_user_id)):
    lobby = lobby_service.get_lobby_by_id(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    return lobby


@router.get("/{lobby_id}/participants")
def get_lobby_participants(lobby_id: UUID, user_id: str = Depends(require_user_id)):
    lobby = lobby_service.get_lobby_by_id(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    return lobby_service.get_lobby_participants(lobby_id)


@router.post("/{lobby_id}/join", status_code=status.HTTP_201_CREATED)
def join_lobby(lobby_id: UUID, user_id: str = Depends(require_user_id)):
    lobby = lobby_service.get_lobby_by_id(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    try:
        return lobby_service.join_lobby(lobby_id=lobby_id, user_id=user_id)
    except RuntimeError as e:
        if "duplicate" in str(e).lower() or "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="Already in this lobby") from e
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/{lobby_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_lobby(lobby_id: UUID, user_id: str = Depends(require_user_id)):
    lobby = lobby_service.get_lobby_by_id(lobby_id)
    if not lobby:
        raise HTTPException(status_code=404, detail="Lobby not found")
    lobby_service.leave_lobby(lobby_id=lobby_id, user_id=user_id)


@router.patch("/{lobby_id}", response_model=LobbyResponse)
def update_lobby(
    lobby_id: UUID,
    payload: LobbyUpdate,
    user_id: str = Depends(require_user_id),
):
    result = lobby_service.update_lobby(lobby_id=lobby_id, user_id=user_id, payload=payload)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can update this lobby",
        )
    return result


@router.delete("/{lobby_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lobby(lobby_id: UUID, user_id: str = Depends(require_user_id)):
    if not lobby_service.delete_lobby(lobby_id=lobby_id, user_id=user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can delete this lobby",
        )


@router.post("", response_model=LobbyResponse, status_code=status.HTTP_201_CREATED)
def create_lobby(payload: LobbyCreate, user_id: str = Depends(require_user_id)):
    return lobby_service.create_lobby(user_id=user_id, payload=payload)

