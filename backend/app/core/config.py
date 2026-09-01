import json
from functools import lru_cache
from typing import Any

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase Shared Pooler (Supavisor). The real password must be supplied
    # through the DATABASE_URL environment variable in the deployment target;
    # never commit it to the repository.
    DATABASE_URL: str = "postgresql+asyncpg://postgres.mcbhpjejmilyrqfienja:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
    SUPABASE_URL: str = "https://mcbhpjejmilyrqfienja.supabase.co"
    SUPABASE_PUBLISHABLE_KEY: str = "sb_publishable_q38z2EmOefibTR_Tgp6Pew_PmBb8LgS"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    # Stored as a string to avoid pydantic's complex-encoding JSON parse,
    # which breaks on comma-separated values set in env files / Vercel.
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    API_V1_PREFIX: str = "/api/v1"

    @property
    def cors_origins_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return []
        parsed_origins: list[str] = []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                parsed_origins = [str(item) for item in parsed]
            elif isinstance(parsed, str) and parsed:
                parsed_origins = [parsed]
        except (json.JSONDecodeError, ValueError):
            pass
        if not parsed_origins:
            parsed_origins = [item for item in raw.split(",") if item.strip()]
        seen: set[str] = set()
        unique: list[str] = []
        for item in parsed_origins:
            normalized = item.strip().strip('"').rstrip("/")
            if normalized and normalized not in seen:
                seen.add(normalized)
                unique.append(normalized)
        return unique

    class Config:
        env_file = ".env"

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: Any,
        env_settings: Any,
        dotenv_settings: Any,
        file_secret_settings: Any,
    ) -> tuple[Any, ...]:
        return (init_settings, env_settings, dotenv_settings, file_secret_settings)


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
