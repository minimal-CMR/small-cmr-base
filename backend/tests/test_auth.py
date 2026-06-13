def test_login_success(client):
    r = client.post("/api/auth/login", data={"username": "admin@example.com", "password": "testpass123"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client):
    assert client.post("/api/auth/login", data={"username": "admin@example.com", "password": "sbagliata"}).status_code == 401


def test_login_unknown_user(client):
    assert client.post("/api/auth/login", data={"username": "nessuno@example.com", "password": "x"}).status_code == 401


def test_login_returns_jwt(client):
    r = client.post("/api/auth/login", data={"username": "admin@example.com", "password": "testpass123"})
    assert len(r.json()["access_token"].split(".")) == 3


def test_me_authenticated(client, admin_headers):
    r = client.get("/api/auth/me", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "admin@example.com"
    assert "admin" in r.json()["ruoli"]


def test_me_returns_ruoli_list(client, admin_headers):
    assert isinstance(client.get("/api/auth/me", headers=admin_headers).json()["ruoli"], list)


def test_me_no_token(client):
    assert client.get("/api/auth/me").status_code == 401


def test_me_invalid_token(client):
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer token.non.valido"}).status_code == 401


def test_me_tampered_token(client, admin_token):
    parts = admin_token.split(".")
    parts[1] = parts[1][:-1] + ("A" if parts[1][-1] != "A" else "B")
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {'.'.join(parts)}"})
    assert r.status_code == 401


def test_no_put_me_endpoint(client, admin_headers):
    """PUT /api/users/me appartiene al servizio password, non a base.
    FastAPI restituisce 422 perché /api/users/{user_id} accetta solo interi."""
    r = client.put("/api/users/me", json={"nome": "Test"}, headers=admin_headers)
    assert r.status_code in (404, 422)
