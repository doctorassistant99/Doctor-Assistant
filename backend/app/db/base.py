from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Supabase shared pooler requires TLS and, in serverless (Vercel Functions),
# connections must not be pooled across requests: NullPool opens/ closes a
# connection per session. statement_cache_size=0 disables asyncpg prepared
# statements, which Supavisor/pgbouncer (transaction pooler) does not support.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    poolclass=NullPool,
    connect_args={"ssl": "require", "statement_cache_size": 0},
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
