from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from database import get_db
import models

router = APIRouter(prefix="/customers", tags=["Customers"])

class CustomerIn(BaseModel):
    name: str
    phone: str

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    loyalty_points: int
    total_spent: Decimal
    visit_count: int
    class Config: from_attributes = True

class LoyaltyAdjust(BaseModel):
    points: int
    note: Optional[str] = None

@router.get("/", response_model=List[CustomerOut])
def get_customers(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(models.Customer).filter(models.Customer.is_active == True)
    if search:
        q = q.filter(
            models.Customer.name.ilike(f"%{search}%") |
            models.Customer.phone.ilike(f"%{search}%")
        )
    return q.order_by(models.Customer.name).all()

@router.get("/top", response_model=List[CustomerOut])
def get_top_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).filter(
        models.Customer.is_active == True
    ).order_by(models.Customer.total_spent.desc()).limit(10).all()

@router.get("/search-by-phone")
def search_by_phone(phone: str, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(
        models.Customer.phone == phone,
        models.Customer.is_active == True
    ).first()
    if not customer:
        return None
    return CustomerOut.model_validate(customer)

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c

@router.get("/{customer_id}/history")
def get_customer_history(customer_id: int, db: Session = Depends(get_db)):
    sales = db.query(models.Sale).filter(
        models.Sale.customer_id == customer_id
    ).order_by(models.Sale.created_at.desc()).limit(20).all()
    loyalty = db.query(models.LoyaltyTransaction).filter(
        models.LoyaltyTransaction.customer_id == customer_id
    ).order_by(models.LoyaltyTransaction.created_at.desc()).limit(20).all()
    return {
        "sales": [{"id":s.id,"sale_number":s.sale_number,"total":float(s.total),"created_at":str(s.created_at),"loyalty_earned":s.loyalty_earned,"loyalty_redeemed":s.loyalty_redeemed} for s in sales],
        "loyalty": [{"type":lt.type,"points":lt.points,"note":lt.note,"created_at":str(lt.created_at)} for lt in loyalty],
    }

@router.post("/", response_model=CustomerOut, status_code=201)
def create_customer(data: CustomerIn, db: Session = Depends(get_db)):
    existing = db.query(models.Customer).filter(models.Customer.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    customer = models.Customer(name=data.name, phone=data.phone)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, data: CustomerIn, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.name  = data.name
    customer.phone = data.phone
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/{customer_id}/loyalty")
def adjust_loyalty(customer_id: int, data: LoyaltyAdjust, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.loyalty_points += data.points
    if customer.loyalty_points < 0:
        raise HTTPException(status_code=400, detail="Insufficient loyalty points")
    txn = models.LoyaltyTransaction(
        customer_id=customer_id, type="ADJUSTMENT",
        points=data.points, note=data.note
    )
    db.add(txn)
    db.commit()
    return {"loyalty_points": customer.loyalty_points}

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.is_active = False
    db.commit()
    return {"message": "Customer deactivated"}
