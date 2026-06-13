from conftest import make_ditta, make_user, login_as


def test_list_ditte_requires_auth(client):
    assert client.get("/api/ditte").status_code == 401


def test_list_ditte_authenticated(client, admin_headers):
    assert client.get("/api/ditte", headers=admin_headers).status_code == 200


def test_create_ditta(client, admin_headers):
    r = client.post("/api/ditte", json={"nome": "Acme Srl"}, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["nome"] == "Acme Srl"


def test_create_ditta_full(client, admin_headers):
    r = client.post("/api/ditte", json={
        "nome": "Beta SpA", "ragione_sociale": "Beta SpA", "partita_iva": "12345678901",
        "stato": "attiva", "zip": "20100", "citta": "Milano", "via": "Via Roma 1",
    }, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["partita_iva"] == "12345678901"


def test_create_ditta_non_admin_forbidden(client, admin_headers):
    u = make_user(client, admin_headers, nome="Opts", cognome="Ditta", email="opts.ditta@example.com")
    r = client.post("/api/ditte", json={"nome": "Forbidden"}, headers=login_as(client, u["email"]))
    assert r.status_code == 403


def test_update_ditta(client, admin_headers):
    d = make_ditta(client, admin_headers, nome="Gamma Srl")
    r = client.put(f"/api/ditte/{d['id']}", json={"nome": "Gamma Aggiornata"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["nome"] == "Gamma Aggiornata"


def test_update_ditta_not_found(client, admin_headers):
    assert client.put("/api/ditte/999999", json={"nome": "X"}, headers=admin_headers).status_code == 404


def test_delete_ditta(client, admin_headers):
    d = make_ditta(client, admin_headers, nome="Da Cancellare")
    assert client.delete(f"/api/ditte/{d['id']}", headers=admin_headers).status_code == 204


def test_delete_ditta_not_found(client, admin_headers):
    assert client.delete("/api/ditte/999999", headers=admin_headers).status_code == 404
