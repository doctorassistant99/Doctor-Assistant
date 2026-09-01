from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    patient_id: UUID
    visit_id: UUID | None = None
    transaction_type: str = Field(..., pattern="^(consultation|payment|refund|other)$")
    payment_method: str = Field(..., pattern="^(cash|card|transfer|other)$")
    amount: float = Field(..., gt=0)
    description: str | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: UUID
    invoice_number: str
    patient_id: UUID
    visit_id: UUID | None
    transaction_type: str
    payment_method: str
    amount: float
    description: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    patient_name: str | None = None

    class Config:
        from_attributes = True
