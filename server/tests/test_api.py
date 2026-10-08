from datetime import date, timedelta
from uuid import UUID
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models
import app.services.auth as auth_service
from app.api.routers.auth import get_current_hospital_admin
from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app
from app.models import Hospital, HospitalAdminAccount
from app.schemas import HospitalAdminIdentity
from app.services.auth import hash_terminal_access_key


@pytest.fixture
def db_session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, expire_on_commit=False)
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(db_session_factory):
    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(fastapi_app)
    yield test_client
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def authorized_client(client, db_session_factory):
    hospital_id = UUID("00000000-0000-4000-8000-000000000001")
    with db_session_factory() as db:
        db.add(
            Hospital(
                id=hospital_id,
                name="Test General Hospital",
                administrator_name="Test Admin",
                administrator_email="test-admin@example.org",
                classification="tertiary",
                node_role="coordinator",
                status="active",
            )
        )
        db.commit()
    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="TEST-ADMIN-001",
        hospital_id=hospital_id,
        hospital_name="Test General Hospital",
    )
    client.test_hospital_id = hospital_id
    yield client
    fastapi_app.dependency_overrides.pop(get_current_hospital_admin, None)


@pytest.fixture
def active_hospital_admin(db_session_factory):
    with db_session_factory() as db:
        hospital = Hospital(
            name="Regional General Hospital",
            administrator_name="Hospital Admin",
            administrator_email="hospital-admin@example.org",
            classification="tertiary",
            node_role="coordinator",
            status="active",
        )
        db.add(hospital)
        db.flush()
        account = HospitalAdminAccount(
            hospital_id=hospital.id,
            administrator_id="RGH-ADMIN-001",
            password_hash=hash_terminal_access_key("CorrectHorseBattery9!"),
        )
        db.add(account)
        db.commit()
    return {
        "hospital_id": str(hospital.id),
        "administrator_id": "RGH-ADMIN-001",
        "terminal_access_key": "CorrectHorseBattery9!",
    }


def configure_test_signing(monkeypatch):
    monkeypatch.setattr(
        auth_service,
        "get_settings",
        lambda: SimpleNamespace(AUTH_TOKEN_SECRET="unit-test-signing-secret-32-characters", AUTH_TOKEN_TTL_MINUTES=30),
    )


def test_health_has_frontend_telemetry_fields(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert response.json()["framework"] == "FastAPI"
    assert response.json()["uptime_seconds"] >= 0


def test_register_hospital_then_login_and_read_identity(client, monkeypatch):
    configure_test_signing(monkeypatch)
    registration = client.post(
        "/api/auth/register",
        json={
            "hospital_name": "North District General Hospital",
            "administrator_name": "Avery Stone",
            "administrator_email": "avery@example.org",
            "classification": "tertiary",
            "node_role": "coordinator",
            "hospital_administrator_id": "NDGH-ADMIN-001",
            "terminal_access_key": "CorrectHorseBattery9!",
        },
    )
    assert registration.status_code == 201
    registration_data = registration.json()
    assert UUID(registration_data["hospital_id"])
    assert registration_data["hospital_name"] == "North District General Hospital"

    login = client.post(
        "/api/auth/login",
        json={
            "hospital_administrator_id": "ndgh-admin-001",
            "terminal_access_key": "CorrectHorseBattery9!",
        },
    )
    assert login.status_code == 200
    session = login.json()
    assert session["hospital_id"] == registration_data["hospital_id"]
    assert session["role"] == "Hospital Administrator"

    identity = client.get("/api/hospitals/me", headers={"Authorization": f"Bearer {session['access_token']}"})
    assert identity.status_code == 200
    assert identity.json()["name"] == "North District General Hospital"


def test_hospital_registration_rejects_duplicate_admin_email(client):
    payload = {
        "hospital_name": "North District General Hospital",
        "administrator_name": "Avery Stone",
        "administrator_email": "avery@example.org",
        "classification": "tertiary",
        "node_role": "coordinator",
        "hospital_administrator_id": "NDGH-ADMIN-001",
        "terminal_access_key": "CorrectHorseBattery9!",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201
    payload["hospital_administrator_id"] = "NDGH-ADMIN-002"
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_hospital_admin_login_rejects_invalid_access_key(client, active_hospital_admin, monkeypatch):
    configure_test_signing(monkeypatch)
    response = client.post(
        "/api/auth/login",
        json={
            "hospital_administrator_id": active_hospital_admin["administrator_id"],
            "terminal_access_key": "WrongAccessKey123!",
        },
    )
    assert response.status_code == 401


def test_inventory_and_dashboard_are_scoped_to_hospital(authorized_client):
    client = authorized_client
    batch_response = client.post(
        "/api/inventory/batches",
        json={
            "sku_code": "IV-PARA-500",
            "sku_name": "Paracetamol 500mg IV",
            "quantity": 140,
            "lot_number": "LOT-99214-A",
            "expires_on": (date.today() + timedelta(days=14)).isoformat(),
        },
    )
    assert batch_response.status_code == 201
    batch = batch_response.json()
    assert batch["hospital_id"] == str(client.test_hospital_id)
    assert batch["unit"] == "units"
    assert batch["storage_regime"] == "ambient"

    cross_hospital_attempt = client.post(
        "/api/inventory/batches",
        json={
            "hospital_id": "00000000-0000-4000-8000-000000000002",
            "sku_code": "IV-PARA-500",
            "sku_name": "Paracetamol 500mg IV",
            "quantity": 10,
        },
    )
    assert cross_hospital_attempt.status_code == 403

    dashboard = client.get("/api/dashboard").json()
    assert dashboard["inventory_batch_count"] == 1
    assert dashboard["inventory_units"] == 140
    assert dashboard["units_expiring_within_30_days"] == 140
    assert dashboard["hospital_id"] == str(client.test_hospital_id)


def test_transfer_status_requires_valid_transition_and_hospital_scope(authorized_client):
    client = authorized_client
    create_response = client.post(
        "/api/transfers",
        json={"sku_name": "Normal Saline 1000ml", "quantity": 20, "urgency": "critical"},
    )
    assert create_response.status_code == 201
    transfer_id = create_response.json()["id"]
    assert create_response.json()["requesting_hospital_id"] == str(client.test_hospital_id)

    approve_response = client.patch(f"/api/transfers/{transfer_id}", json={"status": "approved"})
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"

    invalid_response = client.patch(f"/api/transfers/{transfer_id}", json={"status": "completed"})
    assert invalid_response.status_code == 409


def test_hospital_data_routes_require_bearer_token(client):
    assert client.get("/api/dashboard").status_code == 401
    assert client.get("/api/inventory/batches").status_code == 401
    assert client.get("/api/transfers").status_code == 401
    assert client.get("/api/hospitals/me").status_code == 401


def test_old_facility_registration_route_is_removed(client):
    response = client.post("/api/facilities", json={})
    assert response.status_code == 404
