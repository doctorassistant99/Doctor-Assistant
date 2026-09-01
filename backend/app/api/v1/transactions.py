from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.base import get_db
from app.models.transaction import Transaction, TransactionType, PaymentMethod
from app.models.patient import Patient
from app.models.user import User
from app.api.v1.deps import require_admin_or_cashier
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("/", response_model=dict)
async def list_transactions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    date_from: date | None = None,
    date_to: date | None = None,
    transaction_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    query = select(Transaction)
    count_query = select(func.count(Transaction.id))

    filters = []
    if date_from:
        filters.append(Transaction.created_at >= date_from)
    if date_to:
        filters.append(Transaction.created_at <= date_to)
    if transaction_type:
        filters.append(Transaction.transaction_type == TransactionType(transaction_type))

    for f in filters:
        query = query.where(f)
        count_query = count_query.where(f)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    offset = (page - 1) * per_page
    result = await db.execute(
        query.order_by(Transaction.created_at.desc()).offset(offset).limit(per_page)
    )
    transactions = result.scalars().all()

    enriched = []
    for txn in transactions:
        patient_result = await db.execute(select(Patient).where(Patient.id == txn.patient_id))
        patient = patient_result.scalar_one_or_none()
        resp = TransactionResponse.model_validate(txn)
        resp.patient_name = patient.full_name if patient else None
        enriched.append(resp)

    return {
        "data": enriched,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page,
    }


@router.get("/today-summary")
async def get_today_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    today = date.today()

    result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            func.date(Transaction.created_at) == today,
            Transaction.transaction_type != TransactionType.REFUND,
        )
    )
    total_revenue = result.scalar() or 0

    count_result = await db.execute(
        select(func.count(Transaction.id)).where(
            func.date(Transaction.created_at) == today,
        )
    )
    transaction_count = count_result.scalar() or 0

    return {
        "total_revenue": float(total_revenue),
        "transaction_count": transaction_count,
        "date": today.isoformat(),
    }


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    patient_result = await db.execute(select(Patient).where(Patient.id == transaction_data.patient_id))
    if not patient_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Patient not found")

    transaction = Transaction(
        patient_id=transaction_data.patient_id,
        visit_id=transaction_data.visit_id,
        transaction_type=TransactionType(transaction_data.transaction_type),
        payment_method=PaymentMethod(transaction_data.payment_method),
        amount=transaction_data.amount,
        description=transaction_data.description,
        notes=transaction_data.notes,
        invoice_number="",
        created_by=current_user.id,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return TransactionResponse.model_validate(transaction)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    txn = result.scalar_one_or_none()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse.model_validate(txn)
