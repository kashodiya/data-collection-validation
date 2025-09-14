
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

# Association table for many-to-many relationship between Series and MDRMElement
series_mdrm_association = Table(
    'series_mdrm_association',
    Base.metadata,
    Column('series_id', Integer, ForeignKey('series.id')),
    Column('mdrm_element_id', Integer, ForeignKey('mdrm_elements.id'))
)

class MDRMElement(Base):
    __tablename__ = "mdrm_elements"

    id = Column(Integer, primary_key=True, index=True)
    mdrm_id = Column(String, unique=True, index=True)  # The MDRM ID (e.g., RCFD1480)
    name = Column(String)
    description = Column(Text)
    data_type = Column(String)  # e.g., numeric, text, date
    item_code = Column(String, nullable=True)
    form_type = Column(String, nullable=True)
    
    # Relationships
    series = relationship("Series", secondary=series_mdrm_association, back_populates="mdrm_elements")
    validation_rules = relationship("ValidationRule", back_populates="mdrm_element")
    data_values = relationship("DataValue", back_populates="mdrm_element")

class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(String, unique=True, index=True)  # e.g., FFIEC 031
    name = Column(String)
    description = Column(Text)
    frequency = Column(String)  # e.g., quarterly, annual
    
    # Relationships
    mdrm_elements = relationship("MDRMElement", secondary=series_mdrm_association, back_populates="series")
    reports = relationship("Report", back_populates="series")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(Integer, ForeignKey("series.id"))
    institution_id = Column(Integer, ForeignKey("institutions.id"))
    reporting_period = Column(String)  # e.g., 2023Q1
    submission_date = Column(DateTime, default=func.now())
    status = Column(String)  # e.g., submitted, validated, rejected
    
    # Relationships
    series = relationship("Series", back_populates="reports")
    institution = relationship("Institution", back_populates="reports")
    data_values = relationship("DataValue", back_populates="report")

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    identifier = Column(String, unique=True, index=True)  # e.g., RSSD ID
    type = Column(String)  # e.g., bank, credit union
    
    # Relationships
    reports = relationship("Report", back_populates="institution")
    users = relationship("User", primaryjoin="Institution.id == foreign(User.institution)")

class DataValue(Base):
    __tablename__ = "data_values"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    mdrm_element_id = Column(Integer, ForeignKey("mdrm_elements.id"))
    value = Column(String)  # Store as string and convert as needed
    
    # Relationships
    report = relationship("Report", back_populates="data_values")
    mdrm_element = relationship("MDRMElement", back_populates="data_values")
    validation_results = relationship("ValidationResult", back_populates="data_value")

class ValidationRule(Base):
    __tablename__ = "validation_rules"

    id = Column(Integer, primary_key=True, index=True)
    mdrm_element_id = Column(Integer, ForeignKey("mdrm_elements.id"))
    name = Column(String)
    description = Column(Text)
    rule_type = Column(String)  # e.g., range, comparison, formula
    rule_expression = Column(Text)  # e.g., ">= 0", "= RCFD1480 + RCFD1481"
    error_message = Column(Text)
    severity = Column(String)  # e.g., error, warning
    
    # Relationships
    mdrm_element = relationship("MDRMElement", back_populates="validation_rules")
    validation_results = relationship("ValidationResult", back_populates="validation_rule")

class ValidationResult(Base):
    __tablename__ = "validation_results"

    id = Column(Integer, primary_key=True, index=True)
    data_value_id = Column(Integer, ForeignKey("data_values.id"))
    validation_rule_id = Column(Integer, ForeignKey("validation_rules.id"))
    is_valid = Column(Boolean)
    message = Column(Text, nullable=True)
    
    # Relationships
    data_value = relationship("DataValue", back_populates="validation_results")
    validation_rule = relationship("ValidationRule", back_populates="validation_results")
