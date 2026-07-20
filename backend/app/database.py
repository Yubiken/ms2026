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


def ensure_default_competition():
    inspector = inspect(engine)

    if not inspector.has_table("competitions"):
        return

    with engine.begin() as connection:
        result = connection.execute(
            text("SELECT id FROM competitions WHERE slug = :slug"),
            {"slug": "ms-2026"},
        ).first()

        if result:
            default_competition_id = result[0]
        else:
            connection.execute(
                text(
                    "INSERT INTO competitions (name, slug, is_active) "
                    "VALUES (:name, :slug, :is_active)"
                ),
                {
                    "name": "MŚ 2026",
                    "slug": "ms-2026",
                    "is_active": True,
                },
            )
            default_competition_id = connection.execute(
                text("SELECT id FROM competitions WHERE slug = :slug"),
                {"slug": "ms-2026"},
            ).scalar_one()

        connection.execute(
            text("UPDATE competitions SET is_active = CASE WHEN id = :id THEN TRUE ELSE FALSE END"),
            {"id": default_competition_id},
        )


def ensure_match_competition_column():
    inspector = inspect(engine)

    if not inspector.has_table("matches") or not inspector.has_table("competitions"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("matches")}

    with engine.begin() as connection:
        if "competition_id" not in existing_columns:
            connection.execute(text("ALTER TABLE matches ADD COLUMN competition_id INTEGER"))

        default_competition_id = connection.execute(
            text("SELECT id FROM competitions WHERE slug = :slug"),
            {"slug": "ms-2026"},
        ).scalar_one_or_none()

        if default_competition_id is not None:
            connection.execute(
                text("UPDATE matches SET competition_id = :id WHERE competition_id IS NULL"),
                {"id": default_competition_id},
            )

        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_matches_competition_id ON matches (competition_id)")
        )


def ensure_competition_participants():
    inspector = inspect(engine)

    if (
        not inspector.has_table("competition_participants")
        or not inspector.has_table("competitions")
        or not inspector.has_table("users")
    ):
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_competition_participants_competition_user "
                "ON competition_participants (competition_id, user_id)"
            )
        )

        default_competition_id = connection.execute(
            text("SELECT id FROM competitions WHERE slug = :slug"),
            {"slug": "ms-2026"},
        ).scalar_one_or_none()

        if default_competition_id is None:
            return

        users = connection.execute(text("SELECT id FROM users")).fetchall()

        for user in users:
            user_id = user[0]
            exists = connection.execute(
                text(
                    "SELECT id FROM competition_participants "
                    "WHERE competition_id = :competition_id AND user_id = :user_id"
                ),
                {
                    "competition_id": default_competition_id,
                    "user_id": user_id,
                },
            ).first()

            if not exists:
                connection.execute(
                    text(
                        "INSERT INTO competition_participants (competition_id, user_id) "
                        "VALUES (:competition_id, :user_id)"
                    ),
                    {
                        "competition_id": default_competition_id,
                        "user_id": user_id,
                    },
                )


# Dependency do FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
