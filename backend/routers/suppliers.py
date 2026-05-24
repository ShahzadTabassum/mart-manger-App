from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import models

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

class SupplierIn(BaseModel):
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierOut(BaseModel):
    id: int
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    class Config: from_attributes = True

@router.get("/", response_model=List[SupplierOut])
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(models.Supplier).order_by(models.Supplier.name).all()

@router.post("/", response_model=SupplierOut, status_code=201)
def create_supplier(data: SupplierIn, db: Session = Depends(get_db)):
    existing = db.query(models.Supplier).filter(models.Supplier.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier with this name already exists")
    supplier = models.Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, data: SupplierIn, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    # Check if any products reference this supplier
    product_count = db.query(models.Product).filter(
        models.Product.supplier_id == supplier_id,
        models.Product.is_active == True
    ).count()
    if product_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete — {product_count} active products use this supplier")
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}
