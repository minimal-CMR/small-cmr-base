# small-cmr-base — Guida al servizio

Servizio base (sempre deployato). Gestisce autenticazione, utenti e ditte.

## Porte

| Servizio | Porta |
|----------|-------|
| Backend  | 8001  |
| Frontend | 5173  |

## Setup iniziale

**Prima di avviare il backend è obbligatorio creare il file `.env`:**

```bash
cd backend
cp .env.example .env
```

Variabili da personalizzare in `backend/.env`:

| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Stringa di connessione MySQL (porta 3307 in locale) |
| `SECRET_KEY` | Chiave JWT — deve essere uguale in tutti i servizi |
| `ADMIN_EMAIL` | Email dell'utente admin creato all'avvio |
| `ADMIN_PASSWORD` | Password dell'utente admin |

## Avvio locale

```bash
# Database (condiviso — avviare una sola volta da small-cmr-infra)
cd ../small-cmr-infra
docker compose up db -d

# Backend
cd backend
python -m uvicorn main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## API Routes

| Metodo | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | — |
| GET  | `/api/auth/me` | JWT |
| GET  | `/api/users/` | admin/validatore/gestore_commesse |
| POST | `/api/users/` | admin |
| PUT  | `/api/users/{id}` | admin |
| DELETE | `/api/users/{id}` | admin |
| GET/POST/PUT/DELETE | `/api/ditte/` | admin |
| GET | `/health` | — |

**`PUT /api/users/me` NON è in questo servizio** — appartiene a `small-cmr-password`, il gestionale password dedicato (audit + bcrypt + verifica). La pagina "Il mio Profilo" del frontend base chiama quell'endpoint via proxy.

## Test

```bash
cd backend
pytest tests/ -v
```

## Migrazioni DB

```bash
cd backend
alembic upgrade head
```

Gestisce le tabelle: `users`, `ditte`.
