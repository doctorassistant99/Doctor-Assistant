import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Enum, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CASHIER = "cashier"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.CASHIER)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    creator: Mapped["User | None"] = relationship("User", foreign_keys=[created_by], remote_side="User.id")
    patients_created: Mapped[list["Patient"]] = relationship("Patient", back_populates="created_by_user")
    appointments_created: Mapped[list["Appointment"]] = relationship("Appointment", foreign_keys="Appointment.created_by", back_populates="created_by_user")
    transactions_created: Mapped[list["Transaction"]] = relationship("Transaction", back_populates="created_by_user")
