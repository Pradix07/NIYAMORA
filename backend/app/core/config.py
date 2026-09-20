import os
from typing import Optional, List
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
    JWT_SECRET_KEY: Optional[str] = os.getenv("JWT_SECRET_KEY", None)
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/niyamora_dev.db")
    
    # Storage
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", str(BASE_DIR / "storage" / "uploads"))
    MAX_UPLOAD_SIZE_BYTES: int = 100 * 1024 * 1024  # 100 MB
    
    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ]
    
    # Supported File Formats
    ALLOWED_IMAGE_TYPES: List[str] = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
    ALLOWED_DOC_TYPES: List[str] = ["application/pdf"]
    ALLOWED_EXTENSIONS: List[str] = [".png", ".jpg", ".jpeg", ".webp", ".pdf"]

    def get_jwt_secret_key(self) -> str:
        env = (os.getenv("ENVIRONMENT") or self.ENVIRONMENT).lower().strip()
        secret = (os.getenv("JWT_SECRET_KEY") or self.JWT_SECRET_KEY or "").strip()
        if env == "production":
            if not secret or "dev_" in secret or "secret_key_2026" in secret:
                raise RuntimeError(
                    "Critical Configuration Error: JWT_SECRET_KEY must be explicitly configured with a strong secret in production environment. Development fallbacks are strictly prohibited."
                )
            return secret
        return secret or "niyamora_dev_jwt_secret_key_secure_local_testing_only_2026"

settings = Settings()
