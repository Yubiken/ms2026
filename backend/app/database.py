from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL")

# Jeśli działa na Render → użyj Postgresa
if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300
    )
# Jeśli działa lokalnie → użyj SQLite
else:
    engine = create_engine(
        "sqlite:///./app.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def ensure_match_external_columns():
    inspector = inspect(engine)

    if not inspector.has_table("matches"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("matches")}

    with engine.begin() as connection:
        if "external_source" not in existing_columns:
            connection.execute(text("ALTER TABLE matches ADD COLUMN external_source VARCHAR"))

        if "external_id" not in existing_columns:
            connection.execute(text("ALTER TABLE matches ADD COLUMN external_id VARCHAR"))

        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_matches_external_id ON matches (external_id)")
        )


def ensure_prediction_beers_column():
    inspector = inspect(engine)

    if not inspector.has_table("predictions"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("predictions")}

    if "beers_count" in existing_columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE predictions ADD COLUMN beers_count INTEGER DEFAULT 0 NOT NULL")
        )


def ensure_prediction_unique_user_match_index():
    inspector = inspect(engine)

    if not inspector.has_table("predictions"):
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_predictions_user_match "
                "ON predictions (user_id, match_id)"
            )
        )


# Dependency do FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
