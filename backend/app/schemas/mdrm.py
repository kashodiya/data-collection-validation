

from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

# MDRMElement Schemas
class MDRMElementBase(BaseModel):
    mdrm_id: str
    name: str
    description: str
    data_type: str
    item_code: Optional[str] = None
    form_type: Optional[str] = None

class MDRMElementCreate(MDRMElementBase):
    pass

class MDRMElement(MDRMElementBase):
    id: int

    class Config:
        orm_mode = True

# Series Schemas
class SeriesBase(BaseModel):
    series_id: str
    name: str
    description: str
    frequency: str

class SeriesCreate(SeriesBase):
    mdrm_element_ids: Optional[List[int]] = None

class Series(SeriesBase):
    id: int
    mdrm_elements: List[MDRMElement] = []

    class Config:
        orm_mode = True

# Institution Schemas
class InstitutionBase(BaseModel):
    name: str
    identifier: str
    type: str

class InstitutionCreate(InstitutionBase):
    pass

class Institution(InstitutionBase):
    id: int

    class Config:
        orm_mode = True

# Report Schemas
class ReportBase(BaseModel):
    series_id: int
    institution_id: int
    reporting_period: str
    status: str = "submitted"

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    id: int
    submission_date: datetime

    class Config:
        orm_mode = True

# DataValue Schemas
class DataValueBase(BaseModel):
    report_id: int
    mdrm_element_id: int
    value: str

class DataValueCreate(DataValueBase):
    pass

class DataValue(DataValueBase):
    id: int

    class Config:
        orm_mode = True

# ValidationRule Schemas
class ValidationRuleBase(BaseModel):
    mdrm_element_id: int
    name: str
    description: str
    rule_type: str
    rule_expression: str
    error_message: str
    severity: str

class ValidationRuleCreate(ValidationRuleBase):
    pass

class ValidationRule(ValidationRuleBase):
    id: int

    class Config:
        orm_mode = True

# ValidationResult Schemas
class ValidationResultBase(BaseModel):
    data_value_id: int
    validation_rule_id: int
    is_valid: bool
    message: Optional[str] = None

class ValidationResultCreate(ValidationResultBase):
    pass

class ValidationResult(ValidationResultBase):
    id: int

    class Config:
        orm_mode = True

# Bulk Data Upload Schema
class DataUpload(BaseModel):
    report_id: int
    data_values: List[dict]

# Report with Data Values
class ReportWithData(Report):
    data_values: List[DataValue] = []

    class Config:
        orm_mode = True

# Validation Response
class ValidationResponse(BaseModel):
    report_id: int
    is_valid: bool
    validation_results: List[ValidationResult] = []

