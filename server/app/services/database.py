import logging

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import get_engine


logger = logging.getLogger("pulsegrid")


def check_database() -> bool:
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except (SQLAlchemyError, RuntimeError) as error:
        logger.error("Database connection failed: %s", type(error).__name__)
        return False


def check_logistics_schema() -> list[str]:
    required_columns = {
        "inventory_batches": {"reserved_quantity"},
        "transfer_requests": {"assigned_driver_id", "assigned_vehicle_id"},
    }
    missing: list[str] = []
    try:
        with get_engine().connect() as connection:
            for table_name, column_names in required_columns.items():
                rows = connection.execute(
                    text(
                        """
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_schema = 'public'
                          AND table_name = :table_name
                        """
                    ),
                    {"table_name": table_name},
                )
                existing_columns = {row[0] for row in rows}
                missing.extend(
                    f"{table_name}.{column_name}"
                    for column_name in column_names
                    if column_name not in existing_columns
                )
            status_constraint = connection.execute(
                text(
                    """
                    SELECT pg_get_constraintdef(oid)
                    FROM pg_constraint
                    WHERE conrelid = to_regclass('public.transfer_requests')
                      AND contype = 'c'
                      AND conname = 'ck_transfer_status'
                    """
                )
            ).scalar_one_or_none()
            required_statuses = {
                "requested",
                "approved",
                "pending_pickup",
                "in_transit",
                "arrived_awaiting_inspection",
                "completed",
                "rejected",
                "returned",
                "exception",
                "canceled",
            }
            if status_constraint is None or not all(
                f"'{status}'" in status_constraint for status in required_statuses
            ):
                missing.append(
                    "transfer_requests.status constraint "
                    "(run 008_transfer_status_workflow.sql)"
                )
    except (SQLAlchemyError, RuntimeError) as error:
        logger.error("Logistics schema check failed: %s", type(error).__name__)
        return ["database connection"]
    return missing