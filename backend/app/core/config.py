import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "NIYAMORA"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Environment & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_niyamora_packaging_compliance_2026")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/niyamora_dev.db")
    
    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", str(BASE_DIR / "storage" / "uploads"))
    MAX_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Supported File Formats
    ALLOWED_IMAGE_TYPES: list[str] = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    ALLOWED_DOC_TYPES: list[str] = ["application/pdf"]
    ALLOWED_EXTENSIONS: list[str] = [".png", ".jpg", ".jpeg", ".webp", ".pdf"]

settings = Settings()
