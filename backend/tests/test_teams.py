"""Test del router teams (CRUD + permessi + member management)."""
import pytest
from tests.conftest import make_user, login_as


@pytest.fixture(scope="module")
def opts_user(client, admin_headers):
    return make_user(client, admin_headers, nome="Tom", cognome="Team",
                     email="tom.team@example.com", ruolo="opts")


@pytest.fixture(scope="module")
def opts_user2(client, admin_headers):
    return make_user(client, admin_headers, nome="Sam", cognome="Team",
                     email="sam.team@example.com", ruolo="opts")


@pytest.fixture(scope="module")
def opts_headers(client, opts_user):
    return login_as(client, opts_user["email"])


# ── List / Get ────────────────────────────────────────────────────

def test_list_teams_requires_auth(client):
    r = client.get("/api/teams")
    assert r.status_code == 401


def test_list_teams_admin_empty_or_existing(client, admin_headers):
    r = client.get("/api/teams", headers=admin_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_list_teams_opts_only_own(client, admin_headers, opts_headers, opts_user, opts_user2):
    # admin crea due team, opts_user solo membro del primo
    r1 = client.post("/api/teams", json={"name": "Team Alpha",
                                          "member_ids": [opts_user["id"]]},
                     headers=admin_headers)
    assert r1.status_code == 201
    r2 = client.post("/api/teams", json={"name": "Team Beta",
                                          "member_ids": [opts_user2["id"]]},
                     headers=admin_headers)
    assert r2.status_code == 201

    seen = client.get("/api/teams", headers=opts_headers).json()
    names = [t["name"] for t in seen]
    assert "Team Alpha" in names
    assert "Team Beta" not in names


# ── Create ────────────────────────────────────────────────────────

def test_create_team_admin(client, admin_headers):
    r = client.post("/api/teams", json={
        "name": "DevOps",
        "description": "Team interno",
        "is_active": True,
    }, headers=admin_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "DevOps"
    assert body["is_active"] is True
    assert body["created_by_id"] == 1
    assert body["members"] == []


def test_create_team_with_members(client, admin_headers, opts_user, opts_user2):
    r = client.post("/api/teams", json={
        "name": "Backend Squad",
        "member_ids": [opts_user["id"], opts_user2["id"]],
    }, headers=admin_headers)
    assert r.status_code == 201
    body = r.json()
    member_ids = sorted(m["id"] for m in body["members"])
    assert member_ids == sorted([opts_user["id"], opts_user2["id"]])


def test_create_team_opts_forbidden(client, opts_headers):
    r = client.post("/api/teams", json={"name": "Hack"}, headers=opts_headers)
    assert r.status_code == 403


def test_create_team_ignores_unknown_member_ids(client, admin_headers, opts_user):
    r = client.post("/api/teams", json={
        "name": "Filtra Ignoti",
        "member_ids": [opts_user["id"], 99_999],
    }, headers=admin_headers)
    assert r.status_code == 201
    members = r.json()["members"]
    assert len(members) == 1
    assert members[0]["id"] == opts_user["id"]


# ── Get ───────────────────────────────────────────────────────────

def test_get_team_admin(client, admin_headers):
    created = client.post("/api/teams", json={"name": "Mgmt"},
                           headers=admin_headers).json()
    r = client.get(f"/api/teams/{created['id']}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Mgmt"


def test_get_team_member_allowed(client, admin_headers, opts_headers, opts_user):
    created = client.post("/api/teams", json={
        "name": "Visibili",
        "member_ids": [opts_user["id"]],
    }, headers=admin_headers).json()
    r = client.get(f"/api/teams/{created['id']}", headers=opts_headers)
    assert r.status_code == 200


def test_get_team_non_member_forbidden(client, admin_headers, opts_headers):
    created = client.post("/api/teams", json={"name": "Riservato"},
                           headers=admin_headers).json()
    r = client.get(f"/api/teams/{created['id']}", headers=opts_headers)
    assert r.status_code == 403


def test_get_team_not_found(client, admin_headers):
    r = client.get("/api/teams/999999", headers=admin_headers)
    assert r.status_code == 404


# ── Update ────────────────────────────────────────────────────────

def test_update_team_rename(client, admin_headers):
    created = client.post("/api/teams", json={"name": "OldName"},
                           headers=admin_headers).json()
    r = client.put(f"/api/teams/{created['id']}", json={"name": "NewName"},
                    headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "NewName"


def test_update_team_deactivate(client, admin_headers):
    created = client.post("/api/teams", json={"name": "Attivo"},
                           headers=admin_headers).json()
    r = client.put(f"/api/teams/{created['id']}", json={"is_active": False},
                    headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False


def test_update_team_add_remove_members(client, admin_headers, opts_user, opts_user2):
    created = client.post("/api/teams", json={
        "name": "Membri",
        "member_ids": [opts_user["id"]],
    }, headers=admin_headers).json()

    # Sostituisce membri (rimuove opts_user, aggiunge opts_user2)
    r = client.put(f"/api/teams/{created['id']}",
                    json={"member_ids": [opts_user2["id"]]},
                    headers=admin_headers)
    assert r.status_code == 200
    member_ids = [m["id"] for m in r.json()["members"]]
    assert member_ids == [opts_user2["id"]]


def test_update_team_opts_forbidden(client, opts_headers, admin_headers):
    created = client.post("/api/teams", json={"name": "Protetto"},
                           headers=admin_headers).json()
    r = client.put(f"/api/teams/{created['id']}", json={"name": "hijack"},
                    headers=opts_headers)
    assert r.status_code == 403


def test_update_team_not_found(client, admin_headers):
    r = client.put("/api/teams/999999", json={"name": "x"},
                    headers=admin_headers)
    assert r.status_code == 404


# ── Delete ────────────────────────────────────────────────────────

def test_delete_team_admin(client, admin_headers):
    created = client.post("/api/teams", json={"name": "Sacrificale"},
                           headers=admin_headers).json()
    r = client.delete(f"/api/teams/{created['id']}", headers=admin_headers)
    assert r.status_code == 204
    # Verifica eliminato
    g = client.get(f"/api/teams/{created['id']}", headers=admin_headers)
    assert g.status_code == 404


def test_delete_team_opts_forbidden(client, opts_headers, admin_headers):
    created = client.post("/api/teams", json={"name": "Resistente"},
                           headers=admin_headers).json()
    r = client.delete(f"/api/teams/{created['id']}", headers=opts_headers)
    assert r.status_code == 403


def test_delete_team_not_found(client, admin_headers):
    r = client.delete("/api/teams/999999", headers=admin_headers)
    assert r.status_code == 404
