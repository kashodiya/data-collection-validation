



from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.orm import Session

from .models.base import engine, Base, get_db
from .models.user import User, UserRole
from .auth.jwt import get_password_hash
from .api import auth, mdrm, reports

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MDRM Data Collection System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(mdrm.router, prefix="/api", tags=["MDRM"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])

# Create admin user if it doesn't exist
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN.value,
            is_active=True
        )
        db.add(admin_user)
        
        # Also create an analyst user
        analyst_user = User(
            username="analyst",
            email="analyst@example.com",
            hashed_password=get_password_hash("analyst"),
            role=UserRole.ANALYST.value,
            is_active=True
        )
        db.add(analyst_user)
        
        # Create an external user
        external_user = User(
            username="external",
            email="external@example.com",
            hashed_password=get_password_hash("external"),
            role=UserRole.EXTERNAL.value,
            institution="1",  # This will be linked to an institution later
            is_active=True
        )
        db.add(external_user)
        
        db.commit()

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Mount the React frontend in production
@app.on_event("startup")
async def mount_frontend():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
    if os.path.exists(frontend_path):
        app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=52308, reload=True)


