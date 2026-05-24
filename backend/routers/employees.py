from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import models

router = APIRouter(prefix="/employees", tags=["Employees"])

class EmployeeIn(BaseModel):
    name: str
    phone: Optional[str] = None
    role: str = "CASHIER"
    pin: str

class EmployeeOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    class Config: from_attributes = True

class PinVerify(BaseModel):
    pin: str

@router.get("/", response_model=List[EmployeeOut])
def get_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(
        models.Employee.is_active == True
    ).order_by(models.Employee.name).all()

@router.post("/verify-pin")
def verify_pin(data: PinVerify, db: Session = Depends(get_db)):
    employee = db.query(models.Employee).filter(
        models.Employee.pin == data.pin,
        models.Employee.is_active == True
    ).first()
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid PIN")
    return {"id": employee.id, "name": employee.name, "role": employee.role}

@router.post("/", response_model=EmployeeOut, status_code=201)
def create_employee(data: EmployeeIn, db: Session = Depends(get_db)):
    if len(data.pin) < 4:
        raise HTTPException(status_code=400, detail="PIN must be at least 4 digits")
    existing = db.query(models.Employee).filter(models.Employee.pin == data.pin, models.Employee.is_active == True).first()
    if existing:
        raise HTTPException(status_code=400, detail="PIN already in use by another employee")
    emp = models.Employee(name=data.name, phone=data.phone, role=data.role, pin=data.pin)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, data: EmployeeIn, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if len(data.pin) < 4:
        raise HTTPException(status_code=400, detail="PIN must be at least 4 digits")
    conflict = db.query(models.Employee).filter(
        models.Employee.pin == data.pin,
        models.Employee.id != emp_id,
        models.Employee.is_active == True
    ).first()
    if conflict:
        raise HTTPException(status_code=400, detail="PIN already in use")
    emp.name = data.name; emp.phone = data.phone; emp.role = data.role; emp.pin = data.pin
    db.commit(); db.refresh(emp)
    return emp

@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    if emp.role == "ADMIN":
        count = db.query(models.Employee).filter(models.Employee.role == "ADMIN", models.Employee.is_active == True).count()
        if count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last Admin")
    emp.is_active = False
    db.commit()
    return {"message": "Employee deactivated"}
