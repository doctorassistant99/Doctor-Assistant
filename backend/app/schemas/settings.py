from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ClinicSettingsUpdate(BaseModel):
    doctor_name: str | None = None
    clinic_name: str | None = None
    logo_url: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    booking_enabled: bool | None = None
    working_hours: dict | None = None
    appointment_duration_minutes: int | None = None
    invoice_prefix: str | None = None
    invoice_format: str | None = None
    extra_config: dict | None = None


class ClinicSettingsResponse(BaseModel):
    id: UUID
    doctor_name: str | None
    clinic_name: str | None
    logo_url: str | None
    phone: str | None
    email: str | None
    address: str | None
    booking_enabled: bool
    working_hours: dict | None
    appointment_duration_minutes: int
    invoice_prefix: str | None
    invoice_format: str | None
    extra_config: dict | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
