from pydantic import BaseModel, EmailStr, computed_field
from typing import Optional, List
from datetime import datetime

RUOLI_VALIDI = {"admin", "validatore", "gestore_commesse", "opts"}


def _validate_ruoli(ruoli: list) -> list:
    valid = [r for r in ruoli if r in RUOLI_VALIDI]
    if not valid:
        return ["opts"]
    if "admin" in valid:
        return ["admin"]
    return list(dict.fromkeys(valid))


class Token(BaseModel):
    access_token: str
    token_type: str


class DittaCreate(BaseModel):
    nome: str
    ragione_sociale: Optional[str] = None
    partita_iva: Optional[str] = None
    stato: Optional[str] = None
    zip: Optional[str] = None
    citta: Optional[str] = None
    via: Optional[str] = None


class DittaOut(BaseModel):
    id: int
    nome: str
    ragione_sociale: Optional[str] = None
    partita_iva: Optional[str] = None
    stato: Optional[str] = None
    zip: Optional[str] = None
    citta: Optional[str] = None
    via: Optional[str] = None
    model_config = {"from_attributes": True}


class UserBase(BaseModel):
    nome: str
    cognome: str
    email: EmailStr
    azienda: Optional[str] = ""
    ditta_id: Optional[int] = None
    ruolo: str = "opts"


class UserCreate(UserBase):
    password: str
    ruoli: Optional[List[str]] = None


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    cognome: Optional[str] = None
    email: Optional[EmailStr] = None
    azienda: Optional[str] = None
    ditta_id: Optional[int] = None
    ruoli: Optional[List[str]] = None
    password: Optional[str] = None


class UserOut(UserBase):
    id: int
    email: str
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def ruoli(self) -> List[str]:
        return [r.strip() for r in (self.ruolo or "opts").split(",") if r.strip()]

    model_config = {"from_attributes": True}


class ImportResult(BaseModel):
    creati: int
    saltati: int
    errori: List[str]


class UserPublic(BaseModel):
    id: int
    nome: str
    cognome: str
    email: str
    ditta_id: Optional[int] = None
    model_config = {"from_attributes": True}


class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    member_ids: Optional[List[int]] = None


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    member_ids: Optional[List[int]] = None


class TeamOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_by_id: Optional[int] = None
    created_at: Optional[datetime] = None
    members: List[UserPublic] = []
    model_config = {"from_attributes": True}
