from sqlalchemy import text

from app.db.session import get_engine


def main() -> int:
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
        print("Database connection successful.")
        return 0
    except Exception as error:
        print("Database connection failed.")
        print("Error type:", type(error).__name__)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())