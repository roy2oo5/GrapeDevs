from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

DEFAULT_MOU_TERMS = (
    "1. Purpose: The hospitals will cooperate on non-commercial sharing of eligible surplus medical supplies "
    "subject to availability and applicable law.\n"
    "2. Requests and approval: Each transfer requires a separate request and approval by the releasing hospital. "
    "This MOU does not guarantee supply, purchase, or delivery.\n"
    "3. Safety and traceability: Supplies must be unopened, authentic, within expiry, and stored and transported "
    "according to the manufacturer's instructions. Batch, quantity, expiry, and transfer records must be retained.\n"
    "4. Costs and logistics: Unless agreed in writing for a specific transfer, the receiving hospital arranges "
    "collection and bears reasonable transport costs. No hospital may charge for donated surplus.\n"
    "5. Compliance and confidentiality: Each hospital remains responsible for its licensing, patient-safety, "
    "privacy, sanctions, and regulatory obligations. Patient-identifying information must not be shared through this MOU.\n"
    "6. Termination: Either hospital may revoke this MOU at any time. Revocation does not cancel an already "
    "approved transfer; the parties must complete or separately cancel that transfer.\n"
    "7. Disputes: The hospital administrators will first try to resolve disputes in good faith and document any "
    "agreed corrective action."
)


class HospitalAgreementCreate(BaseModel):
    partner_hospital_id: UUID
    title: str = Field(min_length=2, max_length=180)
    signatory: str = Field(min_length=2, max_length=160)
    agreement_type: str = Field(min_length=2, max_length=120)
    valid_until: date | None = None
    terms_and_conditions: str = Field(default=DEFAULT_MOU_TERMS, min_length=20, max_length=5000)


class HospitalAgreementStatusUpdate(BaseModel):
    status: str = Field(pattern="^(active|rejected|archived)$")


class HospitalAgreementRead(BaseModel):
    id: UUID
    hospital_id: UUID
    hospital_name: str
    partner_hospital_id: UUID
    partner_hospital_name: str
    title: str
    signatory: str
    agreement_type: str
    valid_until: date | None
    terms_and_conditions: str
    status: str
    created_at: datetime
    updated_at: datetime