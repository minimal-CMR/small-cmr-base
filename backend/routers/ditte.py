from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Ditta, User
from schemas import DittaCreate, DittaOut
from auth import get_current_user, require_admin

router = APIRouter(prefix="/api/ditte", tags=["ditte"])


@router.get("", response_model=List[DittaOut])
def list_ditte(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Ditta).order_by(Ditta.nome).all()


@router.post("", response_model=DittaOut, status_code=status.HTTP_201_CREATED)
def create_ditta(payload: DittaCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    d = Ditta(**payload.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.put("/{ditta_id}", response_model=DittaOut)
def update_ditta(ditta_id: int, payload: DittaCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    d = db.query(Ditta).filter(Ditta.id == ditta_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Ditta non trovata")
    for k, v in payload.model_dump().items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{ditta_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ditta(ditta_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    d = db.query(Ditta).filter(Ditta.id == ditta_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Ditta non trovata")
    db.delete(d)
    db.commit()
