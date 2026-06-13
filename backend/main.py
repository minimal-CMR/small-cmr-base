import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from jose import JWTError, jwt

from database import engine, SessionLocal
from models import Base, User
from auth import hash_password, SECRET_KEY, ALGORITHM
from audit import init_audit_logging, log_access, log_app, log_password_event
from routers import auth, users, ditte, teams


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_audit_logging()
    log_app("base startup")
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    yield
    log_app("base shutdown")


def _seed_admin():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    if not email or not password:
        return
    db = SessionLocal()
    try:
        if not db.query(User).first():
            admin = User(
                nome=os.getenv("ADMIN_NOME", ""),
                cognome=os.getenv("ADMIN_COGNOME", ""),
                email=email,
                password_hash=hash_password(password),
                azienda=os.getenv("ADMIN_AZIENDA", ""),
                ruolo="admin",
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            log_password_event(
                action="seed", actor_id=None, actor_email="system",
                target_id=admin.id, target_email=admin.email,
            )
    finally:
        db.close()


app = FastAPI(title="Small CMR — Base API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _user_id_from_request(request: Request) -> int | None:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None
    token = auth_header.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        return int(sub) if sub is not None else None
    except (JWTError, ValueError):
        return None


@app.middleware("http")
async def access_log_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    log_access(
        method=request.method, path=request.url.path,
        status_code=response.status_code, duration_ms=duration_ms,
        user_id=_user_id_from_request(request), request=request,
    )
    return response


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "base"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(ditte.router)
app.include_router(teams.router)
