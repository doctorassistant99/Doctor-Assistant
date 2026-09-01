import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ClinicSettings(Base):
    __tablename__ = "clinic_settings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_name: Mapped[str | None] = mapped_column(String(255))
    clinic_name: Mapped[str | None] = mapped_column(String(255))
    logo_url: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text)
    booking_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    working_hours: Mapped[dict | None] = mapped_column(JSONB, default={})
    appointment_duration_minutes: Mapped[int] = mapped_column(default=30)
    invoice_prefix: Mapped[str | None] = mapped_column(String(20))
    invoice_format: Mapped[str | None] = mapped_column(String(100), default="YYMMDD0001")
    extra_config: Mapped[dict | None] = mapped_column(JSONB, default={})
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
