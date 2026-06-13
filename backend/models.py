from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Boolean, UniqueConstraint, func
from sqlalchemy.orm import relationship
from database import Base


class Ditta(Base):
    __tablename__ = "ditte"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    nome            = Column(String(255), nullable=False)
    ragione_sociale = Column(String(255), nullable=True)
    partita_iva     = Column(String(50), nullable=True)
    stato           = Column(String(100), nullable=True)
    zip             = Column(String(20), nullable=True)
    citta           = Column(String(150), nullable=True)
    via             = Column(String(255), nullable=True)
    created_at      = Column(TIMESTAMP, server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    nome          = Column(String(100), nullable=False)
    cognome       = Column(String(100), nullable=False)
    email         = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    azienda       = Column(String(255), default="")
    ditta_id      = Column(Integer, ForeignKey("ditte.id", ondelete="SET NULL"), nullable=True)
    ruolo         = Column(String(200), nullable=False, default="opts")
    created_at    = Column(TIMESTAMP, server_default=func.now())

    def get_ruoli(self) -> list:
        return [r.strip() for r in (self.ruolo or "opts").split(",") if r.strip()]

    def is_admin(self) -> bool:
        return "admin" in self.get_ruoli()

    def has_role(self, *roles: str) -> bool:
        if self.is_admin():
            return True
        return any(r in self.get_ruoli() for r in roles)


class Team(Base):
    __tablename__ = "teams"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    name          = Column(String(255), nullable=False)
    description   = Column(Text, nullable=True)
    is_active     = Column(Boolean, nullable=False, default=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at    = Column(TIMESTAMP, server_default=func.now())

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_member"),)

    id       = Column(Integer, primary_key=True, autoincrement=True)
    team_id  = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    team = relationship("Team", back_populates="members")
    user = relationship("User")
