



from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import json
import csv
from io import StringIO

from ..models.base import get_db
from ..models.mdrm import (
    Report, Institution, DataValue, MDRMElement, 
    ValidationRule, ValidationResult, Series
)
from ..schemas.mdrm import (
    Report as ReportSchema,
    ReportCreate,
    ReportWithData,
    DataUpload,
    ValidationResponse,
    DataValue as DataValueSchema,
    DataValueCreate
)
from ..auth.jwt import get_current_active_user, check_analyst_role
from ..models.user import User
from ..services.validation import validate_report_data

router = APIRouter()

# Institution endpoints
@router.post("/institutions/", dependencies=[Depends(check_analyst_role)])
def create_institution(
    name: str, 
    identifier: str, 
    type: str, 
    db: Session = Depends(get_db)
):
    db_institution = db.query(Institution).filter(Institution.identifier == identifier).first()
    if db_institution:
        raise HTTPException(status_code=400, detail="Institution already exists")
    
    db_institution = Institution(name=name, identifier=identifier, type=type)
    db.add(db_institution)
    db.commit()
    db.refresh(db_institution)
    return db_institution

@router.get("/institutions/")
def read_institutions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    institutions = db.query(Institution).offset(skip).limit(limit).all()
    return institutions

# Report endpoints
@router.post("/reports/", response_model=ReportSchema)
def create_report(
    report: ReportCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if series exists
    db_series = db.query(Series).filter(Series.id == report.series_id).first()
    if not db_series:
        raise HTTPException(status_code=404, detail="Series not found")
    
    # Check if institution exists
    db_institution = db.query(Institution).filter(Institution.id == report.institution_id).first()
    if not db_institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    # Check if user is authorized for this institution
    if current_user.role == "external" and current_user.institution != str(db_institution.id):
        raise HTTPException(status_code=403, detail="Not authorized to submit for this institution")
    
    # Create report
    db_report = Report(**report.dict())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/reports/", response_model=List[ReportSchema])
def read_reports(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Filter reports based on user role
    if current_user.role == "external":
        reports = db.query(Report).join(Institution).filter(
            Institution.id == int(current_user.institution)
        ).offset(skip).limit(limit).all()
    else:
        reports = db.query(Report).offset(skip).limit(limit).all()
    
    return reports

@router.get("/reports/{report_id}", response_model=ReportWithData)
def read_report(
    report_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check authorization
    if current_user.role == "external" and str(db_report.institution_id) != current_user.institution:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
    
    return db_report

# Data submission endpoints
@router.post("/reports/{report_id}/data", response_model=ValidationResponse)
def submit_report_data(
    report_id: int,
    data: DataUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if report exists
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check authorization
    if current_user.role == "external" and str(db_report.institution_id) != current_user.institution:
        raise HTTPException(status_code=403, detail="Not authorized to submit data for this report")
    
    # Delete existing data values for this report
    db.query(DataValue).filter(DataValue.report_id == report_id).delete()
    
    # Insert new data values
    data_values = []
    for data_item in data.data_values:
        db_data_value = DataValue(
            report_id=report_id,
            mdrm_element_id=data_item["mdrm_element_id"],
            value=data_item["value"]
        )
        db.add(db_data_value)
        db.flush()  # Flush to get the ID
        data_values.append(db_data_value)
    
    # Validate data
    validation_results = validate_report_data(db, db_report, data_values)
    
    # Update report status based on validation results
    is_valid = all(result.is_valid for result in validation_results)
    db_report.status = "validated" if is_valid else "rejected"
    
    db.commit()
    
    return {
        "report_id": report_id,
        "is_valid": is_valid,
        "validation_results": validation_results
    }

@router.post("/reports/{report_id}/upload-csv")
async def upload_csv_data(
    report_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if report exists
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check authorization
    if current_user.role == "external" and str(db_report.institution_id) != current_user.institution:
        raise HTTPException(status_code=403, detail="Not authorized to submit data for this report")
    
    # Read CSV file
    content = await file.read()
    csv_content = content.decode('utf-8')
    csv_reader = csv.DictReader(StringIO(csv_content))
    
    # Get series MDRM elements
    series = db_report.series
    mdrm_elements = {elem.mdrm_id: elem.id for elem in series.mdrm_elements}
    
    # Process CSV data
    data_values = []
    errors = []
    
    for row in csv_reader:
        mdrm_id = row.get('mdrm_id')
        value = row.get('value')
        
        if not mdrm_id or not value:
            errors.append(f"Missing mdrm_id or value in row: {row}")
            continue
        
        if mdrm_id not in mdrm_elements:
            errors.append(f"MDRM ID {mdrm_id} not found in series {series.series_id}")
            continue
        
        data_values.append({
            "mdrm_element_id": mdrm_elements[mdrm_id],
            "value": value
        })
    
    if errors:
        return {"status": "error", "errors": errors}
    
    # Submit data using existing endpoint
    data_upload = DataUpload(report_id=report_id, data_values=data_values)
    return submit_report_data(report_id, data_upload, db, current_user)

@router.get("/reports/{report_id}/validation", response_model=ValidationResponse)
def validate_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Check if report exists
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if db_report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Check authorization
    if current_user.role == "external" and str(db_report.institution_id) != current_user.institution:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")
    
    # Get data values
    data_values = db.query(DataValue).filter(DataValue.report_id == report_id).all()
    
    # Validate data
    validation_results = validate_report_data(db, db_report, data_values)
    
    # Check if all validations passed
    is_valid = all(result.is_valid for result in validation_results)
    
    return {
        "report_id": report_id,
        "is_valid": is_valid,
        "validation_results": validation_results
    }


