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
from app.models import (
    Hospital, HospitalAdminAccount, HospitalAgreement, InventoryBatch, MedicineDailyUsage, TransferItem,
    TransferRequest,
)
from app.schemas import HospitalAdminIdentity
from app.services.auth import hash_terminal_access_key


def test_hospital_data_search_and_export_are_hospital_scoped(authorized_client, db_session_factory):
    current_hospital_id = authorized_client.test_hospital_id
    with db_session_factory() as db:
        other_hospital = Hospital(
            name="Other General Hospital",
            administrator_name="Other Admin",
            administrator_email="other-admin@example.org",
            classification="tertiary",
            node_role="coordinator",
            status="active",
        )
        db.add(other_hospital)
        db.flush()
        db.add_all([
            InventoryBatch(
                hospital_id=current_hospital_id,
                sku_code="MED-ALPHA-001",
                sku_name="Medicine Alpha",
                quantity=12,
                unit="packs",
            ),
            InventoryBatch(
                hospital_id=other_hospital.id,
                sku_code="MED-ALPHA-002",
                sku_name="Medicine Alpha Other",
                quantity=99,
                unit="packs",
            ),
        ])
        db.commit()

    search = authorized_client.get("/api/hospital-data/search?q=Medicine%20Alpha")
    assert search.status_code == 200
    assert [row["title"] for row in search.json()["results"] if row["type"] == "Inventory"] == ["Medicine Alpha"]

    export = authorized_client.get("/api/hospital-data/export")
    assert export.status_code == 200
    payload = export.json()
    assert payload["hospital"]["id"] == str(current_hospital_id)
    assert [row["sku_name"] for row in payload["inventory"]] == ["Medicine Alpha"]


def test_hospital_data_search_validates_query_length(authorized_client):
    assert authorized_client.get("/api/hospital-data/search?q=x").status_code == 422


def test_hospital_profile_can_be_updated(authorized_client):
    response = authorized_client.put(
        "/api/operations/profile",
        json={"hospital_name": " Updated Hospital ", "administrator_name": " New Admin "},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Hospital"
    assert response.json()["administrator_name"] == "New Admin"


def test_hospital_admin_can_change_access_key(authorized_client, db_session_factory, monkeypatch):
    with db_session_factory() as db:
        db.add(
            HospitalAdminAccount(
                hospital_id=authorized_client.test_hospital_id,
                administrator_id="TEST-ADMIN-001",
                password_hash=hash_terminal_access_key("CorrectHorseBattery9!"),
            )
        )
        db.commit()

    incorrect = authorized_client.post(
        "/api/auth/change-access-key",
        json={
            "current_access_key": "IncorrectPassword9!",
            "new_access_key": "AnotherCorrectKey9!",
        },
    )
    assert incorrect.status_code == 400

    changed = authorized_client.post(
        "/api/auth/change-access-key",
        json={
            "current_access_key": "CorrectHorseBattery9!",
            "new_access_key": "AnotherCorrectKey9!",
        },
    )
    assert changed.status_code == 204

    configure_test_signing(monkeypatch)
    old_key_login = authorized_client.post(
        "/api/auth/login",
        json={
            "hospital_administrator_id": "TEST-ADMIN-001",
            "terminal_access_key": "CorrectHorseBattery9!",
        },
    )
    new_key_login = authorized_client.post(
        "/api/auth/login",
        json={
            "hospital_administrator_id": "TEST-ADMIN-001",
            "terminal_access_key": "AnotherCorrectKey9!",
        },
    )
    assert old_key_login.status_code == 401
    assert new_key_login.status_code == 200


def test_cors_allows_hosted_vercel_frontend(client):
    response = client.options(
        "/api/health",
        headers={
            "Origin": "https://grape-devs.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://grape-devs.vercel.app"


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



def test_transfer_status_requires_valid_transition_and_hospital_scope(
    authorized_client, db_session_factory
):
    client = authorized_client
    assert client.post(
        "/api/transfers",
        json={"sku_name": "Normal Saline 1000ml", "quantity": 20},
    ).status_code == 422
    with db_session_factory() as db:
        source = Hospital(
            name="Source General Hospital",
            administrator_name="Source Admin",
            administrator_email="source-admin@example.org",
            classification="tertiary",
            node_role="coordinator",
            status="active",
        )
        db.add(source)
        db.commit()
        source_id = source.id
    create_response = client.post(
        "/api/transfers",
        json={
            "source_hospital_id": str(source_id),
            "sku_code": "MED-SALINE-1000",
            "sku_name": "Normal Saline 1000ml",
            "quantity": 20,
            "urgency": "critical",
        },
    )
    assert create_response.status_code == 201
    transfer_id = create_response.json()["id"]
    assert create_response.json()["requesting_hospital_id"] == str(client.test_hospital_id)

    approve_response = client.patch(f"/api/transfers/{transfer_id}", json={"status": "approved"})
    assert approve_response.status_code == 403

    invalid_response = client.patch(f"/api/transfers/{transfer_id}", json={"status": "completed"})
    assert invalid_response.status_code == 403


def test_transfer_approval_reserves_stock_after_policy_checks(authorized_client, db_session_factory):
    client = authorized_client
    source_id = client.test_hospital_id
    with db_session_factory() as db:
        source = db.get(Hospital, source_id)
        source.settings = {"latitude": 12.9716, "longitude": 77.5946}
        receiver = Hospital(
            name="Shortage Receiving Hospital",
            administrator_name="Receiver",
            administrator_email="shortage-receiver@example.org",
            classification="secondary",
            node_role="coordinator",
            status="active",
            settings={"latitude": 12.975, "longitude": 77.6},
        )
        db.add(receiver)
        db.flush()
        source_batch = InventoryBatch(
            hospital_id=source_id,
            sku_code="MED-APPROVAL-01",
            sku_name="Approval Test Medicine",
            quantity=100,
            unit="vials",
            average_daily_use=1,
        )
        agreement = HospitalAgreement(
            hospital_id=source_id,
            partner_hospital_id=receiver.id,
            title="Active supply MOU",
            signatory="Source Admin",
            agreement_type="emergency stock sharing",
            terms_and_conditions="Test agreement",
            status="active",
        )
        transfer = TransferRequest(
            requesting_hospital_id=receiver.id,
            source_hospital_id=source_id,
            sku_code=source_batch.sku_code,
            sku_name=source_batch.sku_name,
            quantity=10,
            unit="vials",
            status="requested",
        )
        db.add_all([source_batch, agreement, transfer])
        db.commit()
        transfer_id = transfer.id
        source_batch_id = source_batch.id

    response = client.patch(f"/api/transfers/{transfer_id}", json={"status": "approved"})
    assert response.status_code == 200
    with db_session_factory() as db:
        assert db.get(InventoryBatch, source_batch_id).reserved_quantity == 10
        item = db.query(TransferItem).filter_by(transfer_id=transfer_id).one()
        assert item.reserved_quantity == 10


def test_sender_prepares_dispatches_and_receiver_accepts_delivery(authorized_client, db_session_factory):
    client = authorized_client
    source_id = client.test_hospital_id
    with db_session_factory() as db:
        source = db.get(Hospital, source_id)
        source.settings = {"latitude": 12.9716, "longitude": 77.5946}
        receiver = Hospital(
            name="Direct Delivery Hospital",
            administrator_name="Receiver",
            administrator_email="direct-receiver@example.org",
            classification="secondary",
            node_role="coordinator",
            status="active",
            settings={"latitude": 12.975, "longitude": 77.6},
        )
        db.add(receiver)
        db.flush()
        source_batch = InventoryBatch(
            hospital_id=source_id,
            sku_code="MED-DIRECT-01",
            sku_name="Direct Delivery Medicine",
            quantity=100,
            unit="vials",
            lot_number="DIRECT-LOT",
            expires_on=date(2027, 1, 1),
            average_daily_use=2,
        )
        agreement = HospitalAgreement(
            hospital_id=source_id,
            partner_hospital_id=receiver.id,
            title="Active supply MOU",
            signatory="Source Admin",
            agreement_type="emergency stock sharing",
            terms_and_conditions="Test agreement",
            status="active",
        )
        db.add_all([receiver, source_batch, agreement])
        db.commit()
        receiver_id = receiver.id
        source_batch_id = source_batch.id

    sent_response = client.post(
        "/api/transfers",
        json={
            "destination_hospital_id": str(receiver_id),
            "sku_code": "MED-DIRECT-01",
            "sku_name": "Direct Delivery Medicine",
            "quantity": 10,
            "unit": "vials",
        },
    )
    assert sent_response.status_code == 201
    transfer_id = sent_response.json()["id"]
    assert sent_response.json()["status"] == "approved"
    assert sent_response.json()["source_hospital_id"] == str(source_id)
    assert sent_response.json()["requesting_hospital_id"] == str(receiver_id)
    assert sent_response.json()["destination_hospital_id"] == str(receiver_id)
    with db_session_factory() as db:
        source_batch = db.get(InventoryBatch, source_batch_id)
        assert source_batch.quantity == 100
        assert source_batch.reserved_quantity == 10
        assert db.query(TransferItem).filter_by(transfer_id=UUID(transfer_id)).one().reserved_quantity == 10

    prepared_response = client.patch(
        f"/api/transfers/{transfer_id}",
        json={"status": "pending_pickup"},
    )
    assert prepared_response.status_code == 200
    assert prepared_response.json()["status"] == "pending_pickup"
    dispatched_response = client.patch(
        f"/api/transfers/{transfer_id}",
        json={"status": "in_transit"},
    )
    assert dispatched_response.status_code == 200
    assert dispatched_response.json()["status"] == "in_transit"

    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="DIRECT-RECEIVER-ADMIN",
        hospital_id=receiver_id,
        hospital_name="Direct Delivery Hospital",
    )
    accepted_response = client.post(
        f"/api/transfers/{transfer_id}/receipt",
        json={
            "received_by_name": "Direct Delivery Hospital",
            "inspected_at": "2026-10-09T00:00:00Z",
            "accepted_quantity": 10,
            "rejected_quantity": 0,
        },
    )
    assert accepted_response.status_code == 200
    assert accepted_response.json()["status"] == "completed"
    with db_session_factory() as db:
        source_batch = db.get(InventoryBatch, source_batch_id)
        destination_batches = db.query(InventoryBatch).filter_by(
            hospital_id=receiver_id,
            sku_code="MED-DIRECT-01",
        ).all()
        assert source_batch.quantity == 90
        assert source_batch.reserved_quantity == 0
        assert sum(batch.quantity for batch in destination_batches) == 10


def test_transfer_receipt_deducts_dispatched_quantity_and_adds_only_accepted_stock(
    authorized_client, db_session_factory
):
    client = authorized_client
    source_id = client.test_hospital_id
    with db_session_factory() as db:
        receiver = Hospital(
            name="Receiving Hospital",
            administrator_name="Receiver",
            administrator_email="receiver@example.org",
            classification="secondary",
            node_role="coordinator",
            status="active",
        )
        db.add(receiver)
        db.flush()
        batch = InventoryBatch(
            hospital_id=source_id,
            sku_code="MED-TEST-01",
            sku_name="Test Medicine",
            quantity=60,
            reserved_quantity=6,
            unit="vials",
            lot_number="LOT-01",
            expires_on=date(2027, 1, 1),
            storage_regime="cold_chain",
            average_daily_use=2,
        )
        second_batch = InventoryBatch(
            hospital_id=source_id,
            sku_code="MED-TEST-01",
            sku_name="Test Medicine",
            quantity=40,
            reserved_quantity=4,
            unit="vials",
            lot_number="LOT-02",
            expires_on=date(2028, 1, 1),
            storage_regime="cold_chain",
            average_daily_use=2,
        )
        transfer = TransferRequest(
            requesting_hospital_id=receiver.id,
            source_hospital_id=source_id,
            sku_code=batch.sku_code,
            sku_name=batch.sku_name,
            quantity=10,
            unit=batch.unit,
            status="approved",
        )
        db.add_all([batch, second_batch, transfer])
        db.flush()
        db.add_all([
            TransferItem(
                transfer_id=transfer.id,
                source_inventory_batch_id=batch.id,
                requested_quantity=6,
                reserved_quantity=6,
            ),
            TransferItem(
                transfer_id=transfer.id,
                source_inventory_batch_id=second_batch.id,
                requested_quantity=4,
                reserved_quantity=4,
            ),
        ])
        db.commit()
        transfer_id = transfer.id
        receiver_id = receiver.id
        batch_id = batch.id
        second_batch_id = second_batch.id

    assert client.patch(
        f"/api/transfers/{transfer_id}", json={"status": "in_transit"}
    ).status_code == 403
    assert client.patch(
        f"/api/transfers/{transfer_id}", json={"status": "pending_pickup"}
    ).status_code == 200
    assert client.patch(
        f"/api/transfers/{transfer_id}", json={"status": "in_transit"}
    ).status_code == 200
    with db_session_factory() as db:
        assert db.get(InventoryBatch, batch_id).quantity == 60
        assert db.get(InventoryBatch, batch_id).reserved_quantity == 6
        assert db.get(InventoryBatch, second_batch_id).quantity == 40
        assert db.get(InventoryBatch, second_batch_id).reserved_quantity == 4

    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="RECEIVER-ADMIN",
        hospital_id=receiver_id,
        hospital_name="Receiving Hospital",
    )
    assert client.patch(
        f"/api/transfers/{transfer_id}",
        json={"status": "arrived_awaiting_inspection"},
    ).status_code == 200
    incomplete_receipt = client.post(
        f"/api/transfers/{transfer_id}/receipt",
        json={
            "received_by_name": "Receiver",
            "inspected_at": "2026-10-09T00:00:00Z",
            "accepted_quantity": 8,
            "rejected_quantity": 1,
        },
    )
    assert incomplete_receipt.status_code == 422
    receipt_response = client.post(
        f"/api/transfers/{transfer_id}/receipt",
        json={
            "received_by_name": "Receiver",
            "inspected_at": "2026-10-09T00:00:00Z",
            "accepted_quantity": 8,
            "rejected_quantity": 2,
        },
    )
    assert receipt_response.status_code == 200
    assert receipt_response.json()["status"] == "completed"

    with db_session_factory() as db:
        source_batch = db.get(InventoryBatch, batch_id)
        second_source_batch = db.get(InventoryBatch, second_batch_id)
        destination_batches = db.query(InventoryBatch).filter_by(
            hospital_id=receiver_id, sku_code="MED-TEST-01"
        ).all()
        settled_items = db.query(TransferItem).filter_by(transfer_id=transfer_id).all()
        assert source_batch.quantity + second_source_batch.quantity == 90
        assert source_batch.reserved_quantity == 0
        assert second_source_batch.reserved_quantity == 0
        assert sum(batch.quantity for batch in destination_batches) == 8
        assert {batch.lot_number for batch in destination_batches} == {"LOT-01", "LOT-02"}
        assert all(batch.storage_regime == "cold_chain" for batch in destination_batches)
        assert sum(item.accepted_quantity for item in settled_items) == 8
        assert sum(item.damaged_quantity for item in settled_items) == 2
        assert all(item.reserved_quantity == 0 for item in settled_items)


def test_usage_cannot_consume_stock_reserved_for_a_transfer(authorized_client, db_session_factory):
    client = authorized_client
    batch_response = client.post(
        "/api/inventory/batches",
        json={
            "sku_code": "MED-RESERVED-01",
            "sku_name": "Reserved Test Medicine",
            "quantity": 10,
        },
    )
    assert batch_response.status_code == 201
    batch_id = batch_response.json()["id"]

    with db_session_factory() as db:
        batch = db.get(InventoryBatch, UUID(batch_id))
        batch.reserved_quantity = 8
        db.commit()

    first_usage = client.post(
        "/api/data/usage",
        json={
            "sku_code": "MED-RESERVED-01",
            "sku_name": "Reserved Test Medicine",
            "usage_date": "2026-10-09",
            "quantity_dispensed": 2,
        },
    )
    assert first_usage.status_code == 201

    over_reserved_usage = client.post(
        "/api/data/usage",
        json={
            "sku_code": "MED-RESERVED-01",
            "sku_name": "Reserved Test Medicine",
            "usage_date": "2026-10-09",
            "quantity_dispensed": 3,
        },
    )
    assert over_reserved_usage.status_code == 409
    with db_session_factory() as db:
        remaining_batch = db.get(InventoryBatch, UUID(batch_id))
        assert remaining_batch.quantity == 8
        assert remaining_batch.reserved_quantity == 8


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
            "quantity": 155,
            "average_daily_use": 15,
            "unit": "vials",
            "lot_number": "LOT-MKT-1",
        },
    )
    assert batch.status_code == 201

    listing_response = client.post(
        "/api/marketplace/listings",
        json={
            "inventory_batch_id": batch.json()["id"],
            "quantity": 50,
            "expires_on": (date.today() + timedelta(days=20)).isoformat(),
            "notes": "Surplus stock",
        },
    )
    assert listing_response.status_code == 201
    listing = listing_response.json()
    assert listing["quantity_available"] == 50
    assert listing["expires_on"] == (date.today() + timedelta(days=20)).isoformat()
    source_location = client.put(
        "/api/operations/settings",
        json={"settings": {"latitude": 12.9716, "longitude": 77.5946}},
    )
    assert source_location.status_code == 200

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
    partner_location = client.put(
        "/api/operations/settings",
        json={"settings": {"latitude": 12.9717, "longitude": 77.5947}},
    )
    assert partner_location.status_code == 200

    requested = client.post(
        f"/api/marketplace/listings/{listing['id']}/request",
        json={"quantity": 20, "urgency": "high", "department": "Emergency"},
    )
    assert requested.status_code == 201
    assert requested.json()["transfer"]["quantity"] == 20
    assert requested.json()["transfer"]["source_hospital_id"] == listing["hospital_id"]
    assert requested.json()["listing"]["quantity_available"] == 30
    transfer_id = requested.json()["transfer"]["id"]
    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="TEST-ADMIN-001",
        hospital_id=client.test_hospital_id,
        hospital_name="Test General Hospital",
    )
    assert client.get("/api/marketplace/inventory").json() == []
    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="OTHER-ADMIN-001",
        hospital_id=other_hospital_id,
        hospital_name="Other City Hospital",
    )
    duplicate = client.post(
        f"/api/marketplace/listings/{listing['id']}/request",
        json={"quantity": 5},
    )
    assert duplicate.status_code == 409

    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="TEST-ADMIN-001",
        hospital_id=client.test_hospital_id,
        hospital_name="Test General Hospital",
    )
    rejected = client.patch(f"/api/transfers/{transfer_id}", json={"status": "rejected"})
    assert rejected.status_code == 200
    audit = client.get(f"/api/transfers/{transfer_id}/audit")
    assert audit.status_code == 200
    assert [event["to_status"] for event in audit.json()] == ["requested", "rejected"]
    restored_listing = client.get("/api/marketplace/mine").json()[0]
    assert restored_listing["quantity_available"] == 50

    own_listings = client.get("/api/marketplace/mine")
    assert own_listings.status_code == 200
    assert own_listings.json()[0]["buyers"][0]["hospital_name"] == "Other City Hospital"
    assert own_listings.json()[0]["buyers"][0]["quantity"] == 20
    assert own_listings.json()[0]["buyers"][0]["status"] == "rejected"


def test_agreement_create_and_partner_can_accept(authorized_client, client, db_session_factory):
    client = authorized_client
    source_location = client.put(
        "/api/operations/settings",
        json={"settings": {"latitude": 12.9716, "longitude": 77.5946}},
    )
    assert source_location.status_code == 200
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
    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="PARTNER-ADMIN-001",
        hospital_id=UUID(partner_id),
        hospital_name="Partner Hospital",
    )
    partner_location = client.put(
        "/api/operations/settings",
        json={"settings": {"latitude": 12.9717, "longitude": 77.5947}},
    )
    assert partner_location.status_code == 200
    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="TEST-ADMIN-001",
        hospital_id=client.test_hospital_id,
        hospital_name="Test General Hospital",
    )
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


def test_surplus_marketplace_keeps_seven_days_of_recent_use_in_reserve(
    authorized_client, client, db_session_factory
):
    source_id = authorized_client.test_hospital_id
    with db_session_factory() as db:
        source = db.get(Hospital, source_id)
        source.settings = {"latitude": 12.9716, "longitude": 77.5946}
        receiver = Hospital(
            name="Nearby Receiving Hospital",
            administrator_name="Receiver",
            administrator_email="nearby-receiver@example.org",
            classification="secondary",
            node_role="coordinator",
            status="active",
            settings={"latitude": 12.9717, "longitude": 77.5947},
        )
        batch = InventoryBatch(
            hospital_id=source_id,
            sku_code="MED-RESERVE-01",
            sku_name="Reserve Test Medicine",
            quantity=100,
            unit="packs",
            average_daily_use=1,
        )
        db.add_all([receiver, batch])
        db.flush()
        db.add_all([
            MedicineDailyUsage(
                hospital_id=source_id,
                sku_code="MED-RESERVE-01",
                sku_name="Reserve Test Medicine",
                usage_date=date.today() - timedelta(days=day),
                quantity_dispensed=10,
            )
            for day in range(7)
        ])
        db.commit()
        receiver_id = receiver.id
        batch_id = batch.id

    eligible_inventory = authorized_client.get("/api/marketplace/inventory").json()
    assert eligible_inventory[0]["quantity_available"] == 30
    posted = authorized_client.post(
        "/api/marketplace/listings",
        json={"inventory_batch_id": str(batch_id), "quantity": 10},
    )
    assert posted.status_code == 201
    eligible_inventory = authorized_client.get("/api/marketplace/inventory").json()
    assert eligible_inventory[0]["quantity_available"] == 20

    with db_session_factory() as db:
        db.get(InventoryBatch, batch_id).quantity = 65
        db.commit()

    assert authorized_client.get("/api/marketplace/inventory").json() == []
    blocked_post = authorized_client.post(
        "/api/marketplace/listings",
        json={"inventory_batch_id": str(batch_id), "quantity": 1},
    )
    assert blocked_post.status_code == 409
    assert "7 days" in blocked_post.json()["detail"]

    fastapi_app.dependency_overrides[get_current_hospital_admin] = lambda: HospitalAdminIdentity(
        administrator_id="NEARBY-ADMIN",
        hospital_id=receiver_id,
        hospital_name="Nearby Receiving Hospital",
    )
    assert client.get("/api/marketplace/listings").json() == []
    blocked_request = client.post(
        f"/api/marketplace/listings/{posted.json()['id']}/request",
        json={"quantity": 1},
    )
    assert blocked_request.status_code == 409
    assert "7-day" in blocked_request.json()["detail"]


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
