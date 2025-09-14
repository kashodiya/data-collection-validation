




import sys
import os
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from sqlalchemy.orm import Session
from app.models.base import engine, Base, SessionLocal
from app.models.user import User, UserRole
from app.models.mdrm import (
    MDRMElement, Series, Institution, Report, 
    ValidationRule, series_mdrm_association
)
from app.auth.jwt import get_password_hash

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if we already have data
        if db.query(User).count() > 0:
            print("Database already initialized")
            return
        
        # Create users
        print("Creating users...")
        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN.value,
            is_active=True
        )
        db.add(admin_user)
        
        analyst_user = User(
            username="analyst",
            email="analyst@example.com",
            hashed_password=get_password_hash("analyst"),
            role=UserRole.ANALYST.value,
            is_active=True
        )
        db.add(analyst_user)
        
        # Create institutions
        print("Creating institutions...")
        institution1 = Institution(
            name="First National Bank",
            identifier="FNB12345",
            type="bank"
        )
        db.add(institution1)
        
        institution2 = Institution(
            name="Community Credit Union",
            identifier="CCU67890",
            type="credit_union"
        )
        db.add(institution2)
        
        # Flush to get IDs
        db.flush()
        
        # Create external users for each institution
        external_user1 = User(
            username="fnb_user",
            email="fnb@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.EXTERNAL.value,
            institution=str(institution1.id),
            is_active=True
        )
        db.add(external_user1)
        
        external_user2 = User(
            username="ccu_user",
            email="ccu@example.com",
            hashed_password=get_password_hash("password"),
            role=UserRole.EXTERNAL.value,
            institution=str(institution2.id),
            is_active=True
        )
        db.add(external_user2)
        
        # Create MDRM elements
        print("Creating MDRM elements...")
        mdrm1 = MDRMElement(
            mdrm_id="RCFD1480",
            name="Total Assets",
            description="The sum of all assets owned by the institution",
            data_type="numeric",
            item_code="1480",
            form_type="FFIEC 031"
        )
        db.add(mdrm1)
        
        mdrm2 = MDRMElement(
            mdrm_id="RCFD2170",
            name="Total Liabilities",
            description="The sum of all liabilities owed by the institution",
            data_type="numeric",
            item_code="2170",
            form_type="FFIEC 031"
        )
        db.add(mdrm2)
        
        mdrm3 = MDRMElement(
            mdrm_id="RCFD3210",
            name="Total Equity Capital",
            description="The total equity capital of the institution",
            data_type="numeric",
            item_code="3210",
            form_type="FFIEC 031"
        )
        db.add(mdrm3)
        
        # Create series
        print("Creating series...")
        series1 = Series(
            series_id="FFIEC 031",
            name="Consolidated Reports of Condition and Income for a Bank with Domestic and Foreign Offices",
            description="Call Report for banks with domestic and foreign offices",
            frequency="quarterly"
        )
        db.add(series1)
        
        # Flush to get IDs
        db.flush()
        
        # Associate MDRM elements with series
        series1.mdrm_elements.extend([mdrm1, mdrm2, mdrm3])
        
        # Create validation rules
        print("Creating validation rules...")
        rule1 = ValidationRule(
            mdrm_element_id=mdrm1.id,
            name="Assets must be positive",
            description="Total assets must be greater than zero",
            rule_type="range",
            rule_expression="> 0",
            error_message="Total assets must be greater than zero",
            severity="error"
        )
        db.add(rule1)
        
        rule2 = ValidationRule(
            mdrm_element_id=mdrm3.id,
            name="Equity must be positive",
            description="Total equity capital must be greater than zero",
            rule_type="range",
            rule_expression="> 0",
            error_message="Total equity capital must be greater than zero",
            severity="error"
        )
        db.add(rule2)
        
        rule3 = ValidationRule(
            mdrm_element_id=mdrm1.id,
            name="Assets equals Liabilities plus Equity",
            description="Total assets must equal total liabilities plus total equity capital",
            rule_type="formula",
            rule_expression="= RCFD2170 + RCFD3210",
            error_message="Total assets must equal total liabilities plus total equity capital",
            severity="error"
        )
        db.add(rule3)
        
        # Create reports
        print("Creating reports...")
        report1 = Report(
            series_id=series1.id,
            institution_id=institution1.id,
            reporting_period="2023Q1",
            status="submitted"
        )
        db.add(report1)
        
        # Commit all changes
        db.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()



