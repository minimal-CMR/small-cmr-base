import os
import pathlib

_DB_FILE = pathlib.Path(__file__).parent / "test_base.db"
if _DB_FILE.exists():
    _DB_FILE.unlink()

os.environ["DATABASE_URL"]   = f"sqlite:///{_DB_FILE}"
os.environ["SECRET_KEY"]     = "test-only-secret-do-not-use-in-prod"
os.environ["ADMIN_EMAIL"]    = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "testpass123"
os.environ["ADMIN_NOME"]     = "Admin"
os.environ["ADMIN_COGNOME"]  = "Test"
os.environ["ADMIN_AZIENDA"]  = "TestCo"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event

from database import engine
from main import app


@event.listens_for(engine, "connect")
def _fk_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session", autouse=True)
def _cleanup():
    yield
    try:
        _DB_FILE.unlink(missing_ok=True)
    except PermissionError:
        pass


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post("/api/auth/login", data={"username": "admin@example.com", "password": "testpass123"})
    assert r.status_code == 200
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def make_user(client, headers, *, nome, cognome, email, ruolo="opts", password="pass123"):
    r = client.post("/api/users/", json={
        "nome": nome, "cognome": cognome, "email": email,
        "password": password, "ruolo": ruolo, "azienda": "TestCo",
    }, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def make_ditta(client, headers, *, nome):
    r = client.post("/api/ditte", json={"nome": nome}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def login_as(client, email, password="pass123") -> dict:
    r = client.post("/api/auth/login", data={"username": email, "password": password})
    assert r.status_code == 200, f"Login fallito per {email}: {r.text}"
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
