import uuid
from datetime import date, time

from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.appointment import Appointment, AppointmentStatus, BookingSource
from app.models.transaction import Transaction, PaymentMethod, TransactionType


def _column_default(model, column_name):
    return model.__table__.c[column_name].default


def test_user_model_default_role_is_cashier():
    user = User(email="a@b.com", full_name="Test", hashed_password="xxx")
    assert user.role is None
    default = _column_default(User, "role")
    assert isinstance(default.arg, UserRole)
    assert default.arg == UserRole.CASHIER
    assert User.__table__.c.is_active.default.arg is True


def test_user_role_enum_values():
    assert UserRole.ADMIN.value == "admin"
    assert UserRole.CASHIER.value == "cashier"


def test_user_primary_key_uuid_auto_generates():
    default = _column_default(User, "id")
    assert callable(default.arg)
    assert isinstance(default.arg(None), uuid.UUID)


def test_patient_default_visits_zero():
    patient = Patient(full_name="Test Patient")
    assert patient.total_visits is None
    default = _column_default(Patient, "total_visits")
    assert default.arg == 0


def test_appointment_default_status_scheduled():
    default_status = _column_default(Appointment, "status")
    assert isinstance(default_status.arg, AppointmentStatus)
    assert default_status.arg == AppointmentStatus.SCHEDULED

    default_source = _column_default(Appointment, "booking_source")
    assert isinstance(default_source.arg, BookingSource)
    assert default_source.arg == BookingSource.MANUAL


def test_appointment_model_constructable():
    appt = Appointment(
        patient_id=uuid.uuid4(),
        doctor_id=uuid.uuid4(),
        appointment_date=date(2026, 9, 1),
        start_time=time(9, 0),
        end_time=time(9, 30),
    )
    assert appt.appointment_date == date(2026, 9, 1)
    assert appt.start_time == time(9, 0)


def test_transaction_requires_fields():
    txn = Transaction(
        invoice_number="2609010001",
        patient_id=uuid.uuid4(),
        transaction_type=TransactionType.CONSULTATION,
        payment_method=PaymentMethod.CASH,
        amount=100,
        created_by=uuid.uuid4(),
    )
    assert txn.transaction_type == TransactionType.CONSULTATION
    assert txn.invoice_number == "2609010001"
    assert txn.amount == 100
