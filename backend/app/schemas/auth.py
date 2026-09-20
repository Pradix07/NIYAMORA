from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    company_name: str = Field(..., min_length=2, max_length=255)
    role: Optional[str] = Field("COMPANY_USER", max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    company_id: str
    company_name: Optional[str] = None
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
