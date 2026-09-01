from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.base import get_db
from app.models.settings import ClinicSettings
from app.models.user import User
from app.api.v1.deps import require_admin_or_cashier, require_admin
from app.schemas.settings import ClinicSettingsUpdate, ClinicSettingsResponse

router = APIRouter(prefix="/settings", tags=["Settings"])


async def _get_or_create_settings(db: AsyncSession) -> ClinicSettings:
    result = await db.execute(select(ClinicSettings).order_by(ClinicSettings.created_at).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = ClinicSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/", response_model=ClinicSettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin_or_cashier),
):
    settings = await _get_or_create_settings(db)
    return ClinicSettingsResponse.model_validate(settings)


@router.put("/", response_model=ClinicSettingsResponse)
async def update_settings(
    settings_data: ClinicSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    settings = await _get_or_create_settings(db)
    update_data = settings_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    settings.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(settings)
    return ClinicSettingsResponse.model_validate(settings)
