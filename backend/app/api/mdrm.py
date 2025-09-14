


from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.base import get_db
from ..models.mdrm import MDRMElement, Series, series_mdrm_association
from ..schemas.mdrm import (
    MDRMElement as MDRMElementSchema,
    MDRMElementCreate,
    Series as SeriesSchema,
    SeriesCreate
)
from ..auth.jwt import get_current_active_user, check_analyst_role, check_admin_role
from ..models.user import User

router = APIRouter()

# MDRM Element endpoints
@router.post("/mdrm-elements/", response_model=MDRMElementSchema, dependencies=[Depends(check_analyst_role)])
def create_mdrm_element(mdrm_element: MDRMElementCreate, db: Session = Depends(get_db)):
    db_mdrm = db.query(MDRMElement).filter(MDRMElement.mdrm_id == mdrm_element.mdrm_id).first()
    if db_mdrm:
        raise HTTPException(status_code=400, detail="MDRM ID already registered")
    
    db_mdrm = MDRMElement(**mdrm_element.dict())
    db.add(db_mdrm)
    db.commit()
    db.refresh(db_mdrm)
    return db_mdrm

@router.get("/mdrm-elements/", response_model=List[MDRMElementSchema])
def read_mdrm_elements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    mdrm_elements = db.query(MDRMElement).offset(skip).limit(limit).all()
    return mdrm_elements

@router.get("/mdrm-elements/{mdrm_id}", response_model=MDRMElementSchema)
def read_mdrm_element(mdrm_id: str, db: Session = Depends(get_db)):
    db_mdrm = db.query(MDRMElement).filter(MDRMElement.mdrm_id == mdrm_id).first()
    if db_mdrm is None:
        raise HTTPException(status_code=404, detail="MDRM element not found")
    return db_mdrm

@router.put("/mdrm-elements/{mdrm_id}", response_model=MDRMElementSchema, dependencies=[Depends(check_analyst_role)])
def update_mdrm_element(mdrm_id: str, mdrm_element: MDRMElementCreate, db: Session = Depends(get_db)):
    db_mdrm = db.query(MDRMElement).filter(MDRMElement.mdrm_id == mdrm_id).first()
    if db_mdrm is None:
        raise HTTPException(status_code=404, detail="MDRM element not found")
    
    for key, value in mdrm_element.dict().items():
        setattr(db_mdrm, key, value)
    
    db.commit()
    db.refresh(db_mdrm)
    return db_mdrm

@router.delete("/mdrm-elements/{mdrm_id}", dependencies=[Depends(check_admin_role)])
def delete_mdrm_element(mdrm_id: str, db: Session = Depends(get_db)):
    db_mdrm = db.query(MDRMElement).filter(MDRMElement.mdrm_id == mdrm_id).first()
    if db_mdrm is None:
        raise HTTPException(status_code=404, detail="MDRM element not found")
    
    db.delete(db_mdrm)
    db.commit()
    return {"detail": "MDRM element deleted"}

# Series endpoints
@router.post("/series/", response_model=SeriesSchema, dependencies=[Depends(check_analyst_role)])
def create_series(series: SeriesCreate, db: Session = Depends(get_db)):
    db_series = db.query(Series).filter(Series.series_id == series.series_id).first()
    if db_series:
        raise HTTPException(status_code=400, detail="Series ID already registered")
    
    # Create series without mdrm_element_ids
    series_data = series.dict(exclude={"mdrm_element_ids"})
    db_series = Series(**series_data)
    db.add(db_series)
    db.commit()
    db.refresh(db_series)
    
    # Add MDRM elements if provided
    if series.mdrm_element_ids:
        for mdrm_id in series.mdrm_element_ids:
            mdrm_element = db.query(MDRMElement).filter(MDRMElement.id == mdrm_id).first()
            if mdrm_element:
                db_series.mdrm_elements.append(mdrm_element)
        
        db.commit()
        db.refresh(db_series)
    
    return db_series

@router.get("/series/", response_model=List[SeriesSchema])
def read_series(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    series = db.query(Series).offset(skip).limit(limit).all()
    return series

@router.get("/series/{series_id}", response_model=SeriesSchema)
def read_series_by_id(series_id: str, db: Session = Depends(get_db)):
    db_series = db.query(Series).filter(Series.series_id == series_id).first()
    if db_series is None:
        raise HTTPException(status_code=404, detail="Series not found")
    return db_series

@router.put("/series/{series_id}", response_model=SeriesSchema, dependencies=[Depends(check_analyst_role)])
def update_series(series_id: str, series: SeriesCreate, db: Session = Depends(get_db)):
    db_series = db.query(Series).filter(Series.series_id == series_id).first()
    if db_series is None:
        raise HTTPException(status_code=404, detail="Series not found")
    
    # Update series data
    for key, value in series.dict(exclude={"mdrm_element_ids"}).items():
        setattr(db_series, key, value)
    
    # Update MDRM elements if provided
    if series.mdrm_element_ids is not None:
        # Clear existing associations
        db_series.mdrm_elements = []
        
        # Add new associations
        for mdrm_id in series.mdrm_element_ids:
            mdrm_element = db.query(MDRMElement).filter(MDRMElement.id == mdrm_id).first()
            if mdrm_element:
                db_series.mdrm_elements.append(mdrm_element)
    
    db.commit()
    db.refresh(db_series)
    return db_series

@router.delete("/series/{series_id}", dependencies=[Depends(check_admin_role)])
def delete_series(series_id: str, db: Session = Depends(get_db)):
    db_series = db.query(Series).filter(Series.series_id == series_id).first()
    if db_series is None:
        raise HTTPException(status_code=404, detail="Series not found")
    
    db.delete(db_series)
    db.commit()
    return {"detail": "Series deleted"}

