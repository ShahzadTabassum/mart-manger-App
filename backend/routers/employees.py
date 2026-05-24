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

class EmployeeOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    is_active: bool
    class Config: from_attributes = True

@router.get("/", response_model=List[EmployeeOut])
def get_employees(db: Session = Depends(get_db)):
    return db.query(models.Employee).filter(
        models.Employee.is_active == True
    ).order_by(models.Employee.name).all()

@router.post("/", response_model=EmployeeOut, status_code=201)
def create_employee(data: EmployeeIn, db: Session = Depends(get_db)):
    emp = models.Employee(name=data.name, phone=data.phone, role="SALESMAN", pin="0000")
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.put("/{emp_id}", response_model=EmployeeOut)
def update_employee(emp_id: int, data: EmployeeIn, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.name = data.name
    emp.phone = data.phone
    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(models.Employee).filter(models.Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    emp.is_active = False
    db.commit()
    return {"message": "Salesman removed"}
