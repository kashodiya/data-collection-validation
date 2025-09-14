



from typing import List
import re
from sqlalchemy.orm import Session
import operator
from datetime import datetime

from ..models.mdrm import (
    Report, DataValue, ValidationRule, ValidationResult, MDRMElement
)

def validate_report_data(db: Session, report: Report, data_values: List[DataValue]) -> List[ValidationResult]:
    """
    Validate report data against defined validation rules.
    Returns a list of ValidationResult objects.
    """
    validation_results = []
    
    # Get all validation rules for the MDRM elements in this report
    mdrm_element_ids = [dv.mdrm_element_id for dv in data_values]
    validation_rules = db.query(ValidationRule).filter(
        ValidationRule.mdrm_element_id.in_(mdrm_element_ids)
    ).all()
    
    # Create a dictionary for quick lookup of data values by MDRM element ID
    data_value_dict = {dv.mdrm_element_id: dv for dv in data_values}
    
    # Create a dictionary for quick lookup of MDRM elements by ID
    mdrm_elements = db.query(MDRMElement).filter(
        MDRMElement.id.in_(mdrm_element_ids)
    ).all()
    mdrm_element_dict = {elem.id: elem for elem in mdrm_elements}
    
    # Process each validation rule
    for rule in validation_rules:
        if rule.mdrm_element_id not in data_value_dict:
            continue
        
        data_value = data_value_dict[rule.mdrm_element_id]
        is_valid, message = evaluate_rule(
            rule, data_value, data_value_dict, mdrm_element_dict, db, report
        )
        
        # Create validation result
        validation_result = ValidationResult(
            data_value_id=data_value.id,
            validation_rule_id=rule.id,
            is_valid=is_valid,
            message=message if not is_valid else None
        )
        
        db.add(validation_result)
        validation_results.append(validation_result)
    
    db.flush()  # Flush to get IDs for validation results
    return validation_results

def evaluate_rule(
    rule: ValidationRule, 
    data_value: DataValue, 
    data_value_dict: dict, 
    mdrm_element_dict: dict,
    db: Session,
    report: Report
) -> tuple:
    """
    Evaluate a validation rule against a data value.
    Returns a tuple of (is_valid, message).
    """
    rule_type = rule.rule_type
    rule_expression = rule.rule_expression
    
    # Get the data type of the MDRM element
    mdrm_element = mdrm_element_dict.get(rule.mdrm_element_id)
    if not mdrm_element:
        return False, "MDRM element not found"
    
    # Convert value based on data type
    try:
        value = convert_value(data_value.value, mdrm_element.data_type)
    except ValueError:
        return False, f"Invalid value format for {mdrm_element.data_type}: {data_value.value}"
    
    # Evaluate based on rule type
    if rule_type == "range":
        return evaluate_range_rule(rule_expression, value)
    elif rule_type == "comparison":
        return evaluate_comparison_rule(rule_expression, value, data_value_dict, mdrm_element_dict)
    elif rule_type == "formula":
        return evaluate_formula_rule(rule_expression, value, data_value_dict, mdrm_element_dict)
    elif rule_type == "historical":
        return evaluate_historical_rule(rule_expression, value, db, report, mdrm_element)
    else:
        return False, f"Unknown rule type: {rule_type}"

def convert_value(value_str: str, data_type: str):
    """Convert string value to appropriate type based on MDRM data type."""
    if data_type == "numeric":
        return float(value_str)
    elif data_type == "integer":
        return int(value_str)
    elif data_type == "date":
        return datetime.strptime(value_str, "%Y-%m-%d")
    else:
        return value_str  # Keep as string for text types

def evaluate_range_rule(expression: str, value) -> tuple:
    """
    Evaluate a range rule like ">= 0" or "between 1 and 100".
    Returns (is_valid, message).
    """
    try:
        if "between" in expression.lower():
            match = re.match(r"between\s+(\S+)\s+and\s+(\S+)", expression, re.IGNORECASE)
            if match:
                min_val = float(match.group(1))
                max_val = float(match.group(2))
                if min_val <= value <= max_val:
                    return True, None
                else:
                    return False, f"Value {value} is not between {min_val} and {max_val}"
        else:
            # Handle operators like >, <, >=, <=, ==, !=
            ops = {
                '>': operator.gt,
                '<': operator.lt,
                '>=': operator.ge,
                '<=': operator.le,
                '==': operator.eq,
                '!=': operator.ne
            }
            
            for op_str, op_func in ops.items():
                if op_str in expression:
                    parts = expression.split(op_str)
                    if len(parts) == 2:
                        threshold = float(parts[1].strip())
                        if op_func(value, threshold):
                            return True, None
                        else:
                            return False, f"Value {value} does not satisfy {expression}"
        
        return False, f"Invalid range expression: {expression}"
    except Exception as e:
        return False, f"Error evaluating range rule: {str(e)}"

def evaluate_comparison_rule(
    expression: str, 
    value, 
    data_value_dict: dict, 
    mdrm_element_dict: dict
) -> tuple:
    """
    Evaluate a comparison rule like "= RCFD1480" or "> RCFD1480 + RCFD1481".
    Returns (is_valid, message).
    """
    try:
        # Extract MDRM IDs from the expression
        mdrm_ids = re.findall(r'[A-Z]{4}\d{4}', expression)
        
        # Replace MDRM IDs with their values
        expr = expression
        for mdrm_id in mdrm_ids:
            # Find the MDRM element by ID
            mdrm_element = next(
                (elem for elem in mdrm_element_dict.values() if elem.mdrm_id == mdrm_id), 
                None
            )
            
            if not mdrm_element:
                return False, f"MDRM element {mdrm_id} not found"
            
            # Find the data value for this MDRM element
            data_value = next(
                (dv for dv in data_value_dict.values() if dv.mdrm_element_id == mdrm_element.id),
                None
            )
            
            if not data_value:
                return False, f"Data value for {mdrm_id} not found"
            
            # Convert value based on data type
            try:
                other_value = convert_value(data_value.value, mdrm_element.data_type)
                expr = expr.replace(mdrm_id, str(other_value))
            except ValueError:
                return False, f"Invalid value format for {mdrm_id}: {data_value.value}"
        
        # Extract operator
        ops = {
            '>': operator.gt,
            '<': operator.lt,
            '>=': operator.ge,
            '<=': operator.le,
            '==': operator.eq,
            '=': operator.eq,
            '!=': operator.ne
        }
        
        op_str = None
        for op in ops.keys():
            if op in expr:
                op_str = op
                break
        
        if not op_str:
            return False, f"No operator found in expression: {expression}"
        
        # Split expression by operator
        parts = expr.split(op_str, 1)
        if len(parts) != 2:
            return False, f"Invalid comparison expression: {expression}"
        
        # Evaluate both sides
        left_side = eval(parts[0].strip())
        right_side = eval(parts[1].strip())
        
        # Compare using the operator
        if ops[op_str](value, right_side):
            return True, None
        else:
            return False, f"Value {value} does not satisfy {expression} (evaluated as {value} {op_str} {right_side})"
    
    except Exception as e:
        return False, f"Error evaluating comparison rule: {str(e)}"

def evaluate_formula_rule(
    expression: str, 
    value, 
    data_value_dict: dict, 
    mdrm_element_dict: dict
) -> tuple:
    """
    Evaluate a formula rule like "= RCFD1480 + RCFD1481".
    Returns (is_valid, message).
    """
    try:
        # Extract MDRM IDs from the expression
        mdrm_ids = re.findall(r'[A-Z]{4}\d{4}', expression)
        
        # Replace MDRM IDs with their values
        expr = expression
        for mdrm_id in mdrm_ids:
            # Find the MDRM element by ID
            mdrm_element = next(
                (elem for elem in mdrm_element_dict.values() if elem.mdrm_id == mdrm_id), 
                None
            )
            
            if not mdrm_element:
                return False, f"MDRM element {mdrm_id} not found"
            
            # Find the data value for this MDRM element
            data_value = next(
                (dv for dv in data_value_dict.values() if dv.mdrm_element_id == mdrm_element.id),
                None
            )
            
            if not data_value:
                return False, f"Data value for {mdrm_id} not found"
            
            # Convert value based on data type
            try:
                other_value = convert_value(data_value.value, mdrm_element.data_type)
                expr = expr.replace(mdrm_id, str(other_value))
            except ValueError:
                return False, f"Invalid value format for {mdrm_id}: {data_value.value}"
        
        # Extract operator and expected result
        match = re.match(r"([=<>!]+)\s*(.*)", expr)
        if not match:
            return False, f"Invalid formula expression: {expression}"
        
        op_str = match.group(1)
        formula = match.group(2)
        
        # Map operators
        ops = {
            '>': operator.gt,
            '<': operator.lt,
            '>=': operator.ge,
            '<=': operator.le,
            '==': operator.eq,
            '=': operator.eq,
            '!=': operator.ne
        }
        
        if op_str not in ops:
            return False, f"Unsupported operator in formula: {op_str}"
        
        # Evaluate the formula
        expected_value = eval(formula)
        
        # Compare the actual value with the expected value
        if ops[op_str](value, expected_value):
            return True, None
        else:
            return False, f"Value {value} does not satisfy {expression} (expected {op_str} {expected_value})"
    
    except Exception as e:
        return False, f"Error evaluating formula rule: {str(e)}"

def evaluate_historical_rule(
    expression: str, 
    value, 
    db: Session,
    current_report: Report,
    mdrm_element: MDRMElement
) -> tuple:
    """
    Evaluate a rule that compares with historical data.
    Example: ">= previous_period" or "< previous_period * 1.1"
    Returns (is_valid, message).
    """
    try:
        # Parse the expression to determine which historical data to fetch
        match = re.match(r"([=<>!]+)\s*(previous_period)(?:\s*([*/+-])\s*([0-9.]+))?", expression)
        if not match:
            return False, f"Invalid historical expression: {expression}"
        
        op_str = match.group(1)
        period_ref = match.group(2)
        modifier_op = match.group(3)
        modifier_val = match.group(4)
        
        # Map operators
        ops = {
            '>': operator.gt,
            '<': operator.lt,
            '>=': operator.ge,
            '<=': operator.le,
            '==': operator.eq,
            '=': operator.eq,
            '!=': operator.ne
        }
        
        if op_str not in ops:
            return False, f"Unsupported operator in historical rule: {op_str}"
        
        # Get the previous period report
        # This is a simplified approach - in a real system, you'd need more sophisticated period handling
        previous_report = db.query(Report).filter(
            Report.series_id == current_report.series_id,
            Report.institution_id == current_report.institution_id,
            Report.id < current_report.id
        ).order_by(Report.id.desc()).first()
        
        if not previous_report:
            return True, None  # No previous report to compare with, assume valid
        
        # Get the previous value for this MDRM element
        previous_value = db.query(DataValue).filter(
            DataValue.report_id == previous_report.id,
            DataValue.mdrm_element_id == mdrm_element.id
        ).first()
        
        if not previous_value:
            return True, None  # No previous value to compare with, assume valid
        
        # Convert previous value based on data type
        try:
            prev_val = convert_value(previous_value.value, mdrm_element.data_type)
        except ValueError:
            return False, f"Invalid previous value format: {previous_value.value}"
        
        # Apply modifier if present
        if modifier_op and modifier_val:
            modifier = float(modifier_val)
            if modifier_op == '*':
                prev_val *= modifier
            elif modifier_op == '/':
                prev_val /= modifier
            elif modifier_op == '+':
                prev_val += modifier
            elif modifier_op == '-':
                prev_val -= modifier
        
        # Compare the current value with the (possibly modified) previous value
        if ops[op_str](value, prev_val):
            return True, None
        else:
            return False, f"Value {value} does not satisfy historical comparison: {expression} (compared to {prev_val})"
    
    except Exception as e:
        return False, f"Error evaluating historical rule: {str(e)}"


