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
from app.models import Hospital, HospitalAdminAccount, InventoryBatch
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


def test_delete_inventory_batch_and_enforce_hospital_scope(authorized_client, db_session_factory):
    client = authorized_client
    created = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DELETE-TEST", "sku_name": "Delete Test Item", "quantity": 5},
    )
    assert created.status_code == 201
    batch_id = created.json()["id"]

    deleted = client.delete(f"/api/inventory/batches/{batch_id}")
    assert deleted.status_code == 204
    assert deleted.content == b""
    assert client.get("/api/inventory/batches").json() == []
    assert client.delete(f"/api/inventory/batches/{batch_id}").status_code == 404

    other_hospital_id = UUID("00000000-0000-4000-8000-000000000002")
    with db_session_factory() as db:
        db.add(Hospital(
            id=other_hospital_id,
            name="Other Test Hospital",
            administrator_name="Other Admin",
            administrator_email="other-test@example.org",
            classification="tertiary",
            node_role="coordinator",
            status="active",
        ))
        db.add(InventoryBatch(
            hospital_id=other_hospital_id,
            sku_code="PRIVATE-ITEM",
            sku_name="Other Hospital Item",
            quantity=10,
        ))
        db.commit()
        foreign_batch = db.query(InventoryBatch).filter_by(hospital_id=other_hospital_id).one()
        foreign_batch_id = foreign_batch.id

    assert client.delete(f"/api/inventory/batches/{foreign_batch_id}").status_code == 404


def test_delete_inventory_batch_all_route_variations(authorized_client):
    client = authorized_client

    # 1. Test deletion via DELETE /api/inventory/batches/{id}/ (trailing slash)
    batch1 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-1", "sku_name": "Delete Item 1", "quantity": 10},
    ).json()
    res1 = client.delete(f"/api/inventory/batches/{batch1['id']}/")
    assert res1.status_code == 204

    # 2. Test deletion via DELETE /api/inventory/{id}
    batch2 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-2", "sku_name": "Delete Item 2", "quantity": 20},
    ).json()
    res2 = client.delete(f"/api/inventory/{batch2['id']}")
    assert res2.status_code == 204

    # 3. Test deletion via DELETE /api/inventory/batch/{id}
    batch3 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-3", "sku_name": "Delete Item 3", "quantity": 30},
    ).json()
    res3 = client.delete(f"/api/inventory/batch/{batch3['id']}")
    assert res3.status_code == 204

    # 4. Test deletion via DELETE /api/inventory/batches?batch_id={id}
    batch4 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-4", "sku_name": "Delete Item 4", "quantity": 40},
    ).json()
    res4 = client.delete(f"/api/inventory/batches?batch_id={batch4['id']}")
    assert res4.status_code == 204

    # 5. Test deletion via DELETE /api/inventory/batches?id={id}
    batch5 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-5", "sku_name": "Delete Item 5", "quantity": 50},
    ).json()
    res5 = client.delete(f"/api/inventory/batches?id={batch5['id']}")
    assert res5.status_code == 204

    # 6. Test deletion via DELETE /api/inventory/batches with JSON body
    batch6 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-6", "sku_name": "Delete Item 6", "quantity": 60},
    ).json()
    res6 = client.request("DELETE", "/api/inventory/batches", json={"batch_id": batch6["id"]})
    assert res6.status_code == 204

    # 7. Test deletion via DELETE /api/inventory with query param
    batch7 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-7", "sku_name": "Delete Item 7", "quantity": 70},
    ).json()
    res7 = client.delete(f"/api/inventory?batch_id={batch7['id']}")
    assert res7.status_code == 204

    # 8. Test deletion via POST /api/inventory/batches/{id}/delete
    batch8 = client.post(
        "/api/inventory/batches",
        json={"sku_code": "DEL-8", "sku_name": "Delete Item 8", "quantity": 80},
    ).json()
    res8 = client.post(f"/api/inventory/batches/{batch8['id']}/delete")
    assert res8.status_code == 204

    # 9. Test DELETE /api/inventory/batches without batch_id gives 400 Bad Request, NOT 405 Method Not Allowed
    res_bad = client.delete("/api/inventory/batches")
    assert res_bad.status_code == 400



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


def test_publish_surplus_listing_and_request_creates_transfer(authorized_client):
    client = authorized_client
    batch = client.post(
        "/api/inventory/batches",
        json={
            "sku_code": "MED-PARA-500",
            "sku_name": "Paracetamol 500mg IV",
            "quantity": 100,
            "average_daily_use": 15,
            "unit": "vials",
            "lot_number": "LOT-MKT-1",
        },
    )
    assert batch.status_code == 201

    listing_response = client.post(
        "/api/marketplace/listings",
        json={"inventory_batch_id": batch.json()["id"], "quantity": 50, "notes": "Surplus stock"},
    )
    assert listing_response.status_code == 201
    listing = listing_response.json()
    assert listing["quantity_available"] == 50

    other_hospital = client.post(
        "/api/auth/register",
        json={
            "hospital_name": "Other City Hospital",
            "administrator_name": "Casey Ray",
            "administrator_email": "casey@other.example",
            "classification": "secondary",
            "node_role": "pharmacy",
            "hospital_administrator_id": "OTHER-ADMIN-001",
            "terminal_access_key": "AnotherCorrectKey9!",
        },
    )
    assert other_hospital.status_code == 201
    other_hospital_id = UUID(other_hospital.json()["hospital_id"])
    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="OTHER-ADMIN-001",
        hospital_id=other_hospital_id,
        hospital_name="Other City Hospital",
    )

    requested = client.post(
        f"/api/marketplace/listings/{listing['id']}/request",
        json={"quantity": 20, "urgency": "high", "department": "Emergency"},
    )
    assert requested.status_code == 201
    assert requested.json()["transfer"]["quantity"] == 20
    assert requested.json()["transfer"]["source_hospital_id"] == listing["hospital_id"]
    assert requested.json()["listing"]["quantity_available"] == 30


def test_agreement_create_and_partner_can_accept(authorized_client, client, db_session_factory):
    client = authorized_client
    other_hospital = client.post(
        "/api/auth/register",
        json={
            "hospital_name": "Partner Hospital",
            "administrator_name": "Jordan Lee",
            "administrator_email": "jordan@partner.example",
            "classification": "secondary",
            "node_role": "coordinator",
            "hospital_administrator_id": "PARTNER-ADMIN-001",
            "terminal_access_key": "PartnerAccessKey9!",
        },
    )
    partner_id = other_hospital.json()["hospital_id"]
    created = client.post(
        "/api/agreements",
        json={
            "partner_hospital_id": partner_id,
            "title": "Emergency Medication Mutual Aid",
            "signatory": "Alex Morgan",
            "agreement_type": "surplus_redistribution",
        },
    )
    assert created.status_code == 201
    assert created.json()["status"] == "pending"

    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="PARTNER-ADMIN-001",
        hospital_id=UUID(partner_id),
        hospital_name="Partner Hospital",
    )
    accepted = client.patch(f"/api/agreements/{created.json()['id']}", json={"status": "active"})
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "active"


def test_hospital_settings_and_scenario_are_persisted(authorized_client):
    client = authorized_client
    settings = client.put(
        "/api/operations/settings",
        json={"settings": {"auto_approve_small_requests": True, "surplus_visibility": False}},
    )
    assert settings.status_code == 200
    assert settings.json()["settings"]["surplus_visibility"] is False

    client.post(
        "/api/inventory/batches",
        json={
            "sku_code": "MED-PARA-500",
            "sku_name": "Paracetamol 500mg IV",
            "quantity": 100,
            "average_daily_use": 15,
        },
    )
    scenario = client.post(
        "/api/operations/scenarios",
        json={
            "scenario_type": "epidemic_surge",
            "demand_multiplier": 2,
            "supplier_delay_days": 3,
            "reproduction_index": 1.4,
        },
    )
    assert scenario.status_code == 201
    assert scenario.json()["results"]["inventory_batches_analyzed"] == 1
    assert scenario.json()["results"]["projections"][0]["days_until_stockout"] == 0.3
