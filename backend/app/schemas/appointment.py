from uuid import UUID
from datetime import datetime, date, time
from pydantic import BaseModel, Field


class AppointmentCreate(BaseModel):
    patient_id: UUID
    appointment_date: date
    start_time: time
    end_time: time
    service: str | None = None
    notes: str | None = None
    booking_source: str = Field(default="manual", pattern="^(online|reception|phone|manual)$")


class AppointmentUpdate(BaseModel):
    status: str | None = Field(None, pattern="^(scheduled|confirmed|checked_in|completed|cancelled|no_show)$")
    service: str | None = None
    notes: str | None = None
    start_time: time | None = None
    end_time: time | None = None


class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    service: str | None
    booking_source: str
    notes: str | None
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    patient_name: str | None = None
    patient_phone: str | None = None

    class Config:
        from_attributes = True


class AppointmentListResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    appointment_date: date
    start_time: time
    end_time: time
    status: str
    service: str | None
    booking_source: str
    patient_name: str | None = None
    patient_phone: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
