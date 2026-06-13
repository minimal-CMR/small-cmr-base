from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Team, TeamMember, User
from schemas import TeamCreate, TeamUpdate, TeamOut, UserPublic
from auth import get_current_user, require_admin

router = APIRouter(prefix="/api/teams", tags=["teams"])


def _to_out(team: Team) -> dict:
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "is_active": team.is_active,
        "created_by_id": team.created_by_id,
        "created_at": team.created_at,
        "members": [m.user for m in team.members if m.user is not None],
    }


@router.get("", response_model=List[TeamOut])
def list_teams(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    """Admin vede tutti i team; gli altri vedono i team di cui sono membri."""
    if current.is_admin():
        teams = db.query(Team).order_by(Team.name).all()
    else:
        teams = (
            db.query(Team)
            .join(TeamMember, TeamMember.team_id == Team.id)
            .filter(TeamMember.user_id == current.id)
            .order_by(Team.name)
            .all()
        )
    return [_to_out(t) for t in teams]


@router.get("/{team_id}", response_model=TeamOut)
def get_team(team_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")
    if not current.is_admin() and not any(m.user_id == current.id for m in team.members):
        raise HTTPException(status_code=403, detail="Non sei membro di questo team")
    return _to_out(team)


@router.post("", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
def create_team(payload: TeamCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    team = Team(
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
        created_by_id=admin.id,
    )
    db.add(team)
    db.flush()
    for uid in (payload.member_ids or []):
        user = db.query(User).filter(User.id == uid).first()
        if user:
            db.add(TeamMember(team_id=team.id, user_id=uid))
    db.commit()
    db.refresh(team)
    return _to_out(team)


@router.put("/{team_id}", response_model=TeamOut)
def update_team(team_id: int, payload: TeamUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")

    if payload.name is not None:
        team.name = payload.name
    if payload.description is not None:
        team.description = payload.description
    if payload.is_active is not None:
        team.is_active = payload.is_active

    if payload.member_ids is not None:
        wanted = set(payload.member_ids)
        existing = {m.user_id: m for m in team.members}
        for uid in wanted - set(existing.keys()):
            if db.query(User).filter(User.id == uid).first():
                db.add(TeamMember(team_id=team.id, user_id=uid))
        for uid in set(existing.keys()) - wanted:
            db.delete(existing[uid])

    db.commit()
    db.refresh(team)
    return _to_out(team)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team non trovato")
    db.delete(team)
    db.commit()
