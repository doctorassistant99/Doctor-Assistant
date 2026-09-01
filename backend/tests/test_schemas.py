import pytest
from pydantic import ValidationError
from uuid import uuid4

from app.schemas.user import UserCreate, LoginRequest
from app.schemas.patient import PatientCreate
from app.schemas.transaction import TransactionCreate
from app.schemas.appointment import AppointmentCreate


def test_user_create_valid():
    user = UserCreate(email="test@example.com", full_name="Test User", password="password123", role="cashier")
    assert user.email == "test@example.com"
    assert user.role == "cashier"


def test_user_create_rejects_weak_password():
    with pytest.raises(ValidationError):
        UserCreate(email="test@example.com", full_name="Test", password="123", role="cashier")


def test_user_create_rejects_invalid_role():
    with pytest.raises(ValidationError):
        UserCreate(email="test@example.com", full_name="Test", password="password123", role="superuser")


def test_patient_create_valid():
    patient = PatientCreate(full_name="Ahmed Mohamed", phone="01012345678")
    assert patient.full_name == "Ahmed Mohamed"
    assert patient.phone == "01012345678"


def test_patient_create_rejects_empty_name():
    with pytest.raises(ValidationError):
        PatientCreate(full_name="")


def test_transaction_rejects_negative_amount():
    with pytest.raises(ValidationError):
        TransactionCreate(
            patient_id=uuid4(),
            transaction_type="consultation",
            payment_method="cash",
            amount=-50,
        )


def test_transaction_rejects_zero_amount():
    with pytest.raises(ValidationError):
        TransactionCreate(
            patient_id=uuid4(),
            transaction_type="consultation",
            payment_method="cash",
            amount=0,
        )


def test_transaction_valid():
    txn = TransactionCreate(
        patient_id=uuid4(),
        transaction_type="payment",
        payment_method="card",
        amount=150.50,
    )
    assert txn.amount == 150.50


def test_appointment_valid():
    appt = AppointmentCreate(
        patient_id=uuid4(),
        appointment_date="2026-09-01",
        start_time="09:00",
        end_time="09:30",
    )
    assert appt.appointment_date.isoformat() == "2026-09-01"


def test_login_request_valid():
    login = LoginRequest(email="test@example.com", password="password123")
    assert login.email == "test@example.com"
