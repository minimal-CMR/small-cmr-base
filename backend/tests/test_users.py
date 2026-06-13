"""Test CRUD utenti, import, validazione ruoli."""
import csv
import io
from conftest import make_user, login_as


def test_list_users_requires_auth(client):
    assert client.get("/api/users/").status_code == 401


def test_list_users_admin(client, admin_headers):
    r = client.get("/api/users/", headers=admin_headers)
    assert r.status_code == 200
    assert any(u["email"] == "admin@example.com" for u in r.json())


def test_list_users_opts_forbidden(client, admin_headers):
    u = make_user(client, admin_headers, nome="Opts", cognome="NoList", email="opts.nolist@example.com")
    assert client.get("/api/users/", headers=login_as(client, u["email"])).status_code == 403


def test_list_users_validatore_allowed(client, admin_headers):
    u = make_user(client, admin_headers, nome="Val", cognome="List", email="val.list@example.com", ruolo="validatore")
    assert client.get("/api/users/", headers=login_as(client, u["email"])).status_code == 200


def test_create_user_minimal(client, admin_headers):
    r = client.post("/api/users/", json={
        "nome": "Giulia", "cognome": "Bianchi", "email": "giulia.bianchi@example.com",
        "password": "pass123", "ruolo": "opts",
    }, headers=admin_headers)
    assert r.status_code == 201
    assert "opts" in r.json()["ruoli"]


def test_create_user_duplicate_email_rejected(client, admin_headers):
    make_user(client, admin_headers, nome="Dup", cognome="Email", email="dup.email@example.com")
    r = client.post("/api/users/", json={
        "nome": "Dup2", "cognome": "Email2", "email": "dup.email@example.com",
        "password": "pass123", "ruolo": "opts",
    }, headers=admin_headers)
    assert r.status_code == 400


def test_create_user_multi_role(client, admin_headers):
    r = client.post("/api/users/", json={
        "nome": "Multi", "cognome": "Ruolo", "email": "multi.ruolo@example.com",
        "password": "pass123", "ruoli": ["validatore", "gestore_commesse"],
    }, headers=admin_headers)
    assert r.status_code == 201
    assert "validatore" in r.json()["ruoli"]
    assert "gestore_commesse" in r.json()["ruoli"]


def test_create_user_admin_exclusive(client, admin_headers):
    r = client.post("/api/users/", json={
        "nome": "AdminEx", "cognome": "Test", "email": "adminex@example.com",
        "password": "pass123", "ruoli": ["admin", "validatore"],
    }, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["ruoli"] == ["admin"]


def test_update_user_roles(client, admin_headers):
    u = make_user(client, admin_headers, nome="Role", cognome="Upd", email="role.upd@example.com")
    r = client.put(f"/api/users/{u['id']}", json={"ruoli": ["validatore"]}, headers=admin_headers)
    assert r.status_code == 200
    assert "validatore" in r.json()["ruoli"]


def test_update_user_password(client, admin_headers):
    u = make_user(client, admin_headers, nome="PwdUpd", cognome="Admin", email="pwdupd.admin@example.com", password="oldpass")
    client.put(f"/api/users/{u['id']}", json={"password": "newpass456"}, headers=admin_headers)
    login_as(client, u["email"], "newpass456")


def test_update_user_not_found(client, admin_headers):
    assert client.put("/api/users/999999", json={"nome": "X"}, headers=admin_headers).status_code == 404


def test_delete_user(client, admin_headers):
    u = make_user(client, admin_headers, nome="Da", cognome="Eliminare", email="da.eliminare@example.com")
    assert client.delete(f"/api/users/{u['id']}", headers=admin_headers).status_code == 204


def test_cannot_delete_self(client, admin_headers):
    me = client.get("/api/auth/me", headers=admin_headers).json()
    assert client.delete(f"/api/users/{me['id']}", headers=admin_headers).status_code == 400


def test_import_template_download(client, admin_headers):
    r = client.get("/api/users/import/template", headers=admin_headers)
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    reader = csv.DictReader(io.StringIO(r.content.decode("utf-8-sig")))
    assert {"nome", "cognome", "email", "ruolo", "password"}.issubset(set(reader.fieldnames))


def test_import_csv_creates_users(client, admin_headers):
    csv_content = (
        "nome,cognome,email,azienda,ruolo,password\r\n"
        "Import,Uno,importuno@example.com,Acme,opts,pass123\r\n"
        "Import,Due,importdue@example.com,Acme,validatore,pass456\r\n"
    )
    r = client.post("/api/users/import", files={"file": ("u.csv", csv_content.encode(), "text/csv")}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["creati"] == 2
    assert r.json()["errori"] == []


def test_import_csv_invalid_role(client, admin_headers):
    csv_content = "nome,cognome,email,azienda,ruolo,password\r\nBad,Role,badrole@example.com,Acme,superuser,pass123\r\n"
    r = client.post("/api/users/import", files={"file": ("u.csv", csv_content.encode(), "text/csv")}, headers=admin_headers)
    assert r.json()["creati"] == 0
    assert len(r.json()["errori"]) == 1


def test_import_unsupported_format(client, admin_headers):
    assert client.post("/api/users/import", files={"file": ("f.txt", b"text", "text/plain")}, headers=admin_headers).status_code == 400
