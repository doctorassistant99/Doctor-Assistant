import sys
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND_DIR)

import app.core.config as config_module


class MockSettings:
    SECRET_KEY = "test-secret-key"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test"
    SUPABASE_URL = "https://test.supabase.co"
    SUPABASE_PUBLISHABLE_KEY = "test-key"


config_module.settings = MockSettings()
