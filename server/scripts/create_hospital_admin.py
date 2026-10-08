import argparse
from getpass import getpass
from uuid import UUID

from sqlalchemy import func, select

from app.db.session import get_session_factory
from app.models import Hospital, HospitalAdminAccount
from app.services.auth import hash_terminal_access_key


def main() -> int:
    parser = argparse.ArgumentParser(description="Provision a hospital administrator login")
    parser.add_argument("--hospital-id", required=True, type=UUID)
    parser.add_argument("--administrator-id", required=True)
    args = parser.parse_args()

    administrator_id = args.administrator_id.strip()
    if not 3 <= len(administrator_id) <= 80:
        parser.error("administrator ID must be between 3 and 80 characters")

    access_key = getpass("Terminal access key (minimum 8 characters): ")
    confirmation = getpass("Confirm terminal access key: ")
    if len(access_key) < 8:
        parser.error("terminal access key must contain at least 8 characters")
    if access_key != confirmation:
        parser.error("terminal access keys do not match")

    session = get_session_factory()()
    try:
        hospital = session.get(Hospital, args.hospital_id)
        if hospital is None:
            parser.error("hospital does not exist")
        if hospital.status != "active":
            parser.error("hospital is suspended")
        duplicate = session.scalar(
            select(HospitalAdminAccount.id).where(
                func.lower(HospitalAdminAccount.administrator_id) == administrator_id.lower()
            )
        )
        if duplicate:
            parser.error("administrator ID already exists")

        account = HospitalAdminAccount(
            hospital_id=hospital.id,
            administrator_id=administrator_id,
            password_hash=hash_terminal_access_key(access_key),
        )
        session.add(account)
        session.commit()
        print(f"Hospital administrator provisioned: {administrator_id}")
        return 0
    finally:
        session.close()


if __name__ == "__main__":
    raise SystemExit(main())