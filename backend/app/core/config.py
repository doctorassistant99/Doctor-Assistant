from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:mcbhpjejmilyrqfienja@db.mcbhpjejmilyrqfienja.supabase.co:5432/postgres"
    SUPABASE_URL: str = "https://mcbhpjejmilyrqfienja.supabase.co"
    SUPABASE_PUBLISHABLE_KEY: str = "sb_publishable_q38z2EmOefibTR_Tgp6Pew_PmBb8LgS"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    API_V1_PREFIX: str = "/api/v1"

    class Config:
        env_file = ".env"

settings = Settings()
