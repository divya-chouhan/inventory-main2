"""Application configuration loaded entirely from environment variables.

No credentials are ever hardcoded. All sensitive values (database URL,
CORS origins, etc.) come from the environment / .env file.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Core
    app_name: str = "Inventory & Order Management API"
    api_v1_prefix: str = "/api"
    environment: str = "development"

    # Database. Example:
    # postgresql+psycopg://user:password@host:5432/dbname
    database_url: str = "postgresql+psycopg://iom:iom@db:5432/iom"

    # Comma-separated list of allowed CORS origins.
    # e.g. "http://localhost:5173,https://my-frontend.vercel.app"
    cors_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"

    # Whether to auto-create tables + seed demo data on startup.
    auto_init_db: bool = True
    seed_demo_data: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
