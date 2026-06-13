"""initial schema — ditte e users

Revision ID: 001
Revises:
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ditte",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(255), nullable=False),
        sa.Column("ragione_sociale", sa.String(255), nullable=True),
        sa.Column("partita_iva", sa.String(50), nullable=True),
        sa.Column("stato", sa.String(100), nullable=True),
        sa.Column("zip", sa.String(20), nullable=True),
        sa.Column("citta", sa.String(150), nullable=True),
        sa.Column("via", sa.String(255), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP, server_default=sa.func.now()),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("nome", sa.String(100), nullable=False),
        sa.Column("cognome", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("azienda", sa.String(255), server_default=""),
        sa.Column("ditta_id", sa.Integer, sa.ForeignKey("ditte.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ruolo", sa.String(200), nullable=False, server_default="opts"),
        sa.Column("created_at", sa.TIMESTAMP, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("users")
    op.drop_table("ditte")
