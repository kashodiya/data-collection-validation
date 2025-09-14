

from typing import Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    username: str
    email: EmailStr
    institution: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "external"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    institution: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool

    class Config:
        orm_mode = True

