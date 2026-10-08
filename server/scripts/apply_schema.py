from pathlib import Path

from app.db.session import get_engine


SCHEMA_FILE = Path(__file__).resolve().parents[1] / "supabase" / "schema.sql"
MIGRATION_FILES = sorted((SCHEMA_FILE.parent / "migrations").glob("*.sql"))


def apply_schema() -> None:
    with get_engine().begin() as connection:
        for migration_file in MIGRATION_FILES:
            connection.exec_driver_sql(migration_file.read_text(encoding="utf-8"))
        statements = [
            statement.strip()
            for statement in SCHEMA_FILE.read_text(encoding="utf-8").split(";")
            if statement.strip()
        ]
        for statement in statements:
            connection.exec_driver_sql(statement)


if __name__ == "__main__":
    apply_schema()
    print("Supabase schema applied successfully.")