from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.base import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.patient import Patient
from app.models.user import User
from app.api.v1.deps import require_admin_or_cashier
from app.schemas.appointment import (
    AppointmentCreate, AppointmentUpdate,
    AppointmentResponse, AppointmentListResponse,
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("/", response_model=dict)
async def list_appointments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    date_from: date | None = None,
    date_to: date | None = None,
    doctor_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    query = select(Appointment)
    count_query = select(func.count(Appointment.id))

    filters = []
    if status_filter:
        filters.append(Appointment.status == AppointmentStatus(status_filter))
    if date_from:
        filters.append(Appointment.appointment_date >= date_from)
    if date_to:
        filters.append(Appointment.appointment_date <= date_to)
    if doctor_id:
        filters.append(Appointment.doctor_id == doctor_id)

    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * per_page
    result = await db.execute(
        query.order_by(Appointment.appointment_date.desc(), Appointment.start_time.desc())
        .offset(offset).limit(per_page)
    )
    appointments = result.scalars().all()

    enriched = []
    for appt in appointments:
        patient_result = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
        patient = patient_result.scalar_one_or_none()
        resp = AppointmentListResponse.model_validate(appt)
        resp.patient_name = patient.full_name if patient else None
        resp.patient_phone = patient.phone if patient else None
        enriched.append(resp)

    return {
        "data": enriched,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/today", response_model=list[AppointmentListResponse])
async def get_today_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    today = date.today()
    result = await db.execute(
        select(Appointment)
        .where(Appointment.appointment_date == today)
        .order_by(Appointment.start_time)
    )
    appointments = result.scalars().all()

    enriched = []
    for appt in appointments:
        patient_result = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
        patient = patient_result.scalar_one_or_none()
        resp = AppointmentListResponse.model_validate(appt)
        resp.patient_name = patient.full_name if patient else None
        resp.patient_phone = patient.phone if patient else None
        enriched.append(resp)

    return enriched


@router.get("/upcoming", response_model=list[AppointmentListResponse])
async def get_upcoming_appointments(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    today = date.today()
    result = await db.execute(
        select(Appointment)
        .where(Appointment.appointment_date >= today)
        .where(Appointment.status.in_(["scheduled", "confirmed"]))
        .order_by(Appointment.appointment_date, Appointment.start_time)
        .limit(limit)
    )
    appointments = result.scalars().all()

    enriched = []
    for appt in appointments:
        patient_result = await db.execute(select(Patient).where(Patient.id == appt.patient_id))
        patient = patient_result.scalar_one_or_none()
        resp = AppointmentListResponse.model_validate(appt)
        resp.patient_name = patient.full_name if patient else None
        resp.patient_phone = patient.phone if patient else None
        enriched.append(resp)

    return enriched


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment(
    appointment_data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    conflict = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == current_user.id,
            Appointment.appointment_date == appointment_data.appointment_date,
            Appointment.start_time == appointment_data.start_time,
            Appointment.status.notin_(["cancelled", "no_show"]),
        )
    )
    if conflict.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Time slot is already booked")

    appointment = Appointment(
        patient_id=appointment_data.patient_id,
        doctor_id=current_user.id,
        appointment_date=appointment_data.appointment_date,
        start_time=appointment_data.start_time,
        end_time=appointment_data.end_time,
        service=appointment_data.service,
        notes=appointment_data.notes,
        booking_source=appointment_data.booking_source,
        created_by=current_user.id,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return AppointmentResponse.model_validate(appointment)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return AppointmentResponse.model_validate(appt)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: UUID,
    appointment_data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(appt, key, value)

    await db.commit()
    await db.refresh(appt)
    return AppointmentResponse.model_validate(appt)
