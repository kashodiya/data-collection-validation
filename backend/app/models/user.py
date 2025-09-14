
from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from .base import Base

class UserRole(enum.Enum):
    EXTERNAL = "external"
    ANALYST = "analyst"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    institution = Column(String, nullable=True)
    role = Column(String, default=UserRole.EXTERNAL.value)
    is_active = Column(Boolean, default=True)
