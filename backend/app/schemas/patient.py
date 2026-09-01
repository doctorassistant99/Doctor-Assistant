from uuid import UUID
from datetime import datetime, date
from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    email: str | None = None
    date_of_birth: date | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    notes: str | None = None


class PatientUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    email: str | None = None
    date_of_birth: date | None = None
    gender: str | None = Field(None, pattern="^(male|female|other)$")
    notes: str | None = None


class PatientResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str | None
    email: str | None
    date_of_birth: date | None
    gender: str | None
    notes: str | None
    total_visits: int
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None

    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    id: UUID
    full_name: str
    phone: str | None
    email: str | None
    date_of_birth: date | None
    gender: str | None
    total_visits: int
    created_at: datetime

    class Config:
        from_attributes = True
