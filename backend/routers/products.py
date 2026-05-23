from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[schemas.ProductOut])
def get_products(
    category_id: Optional[int] = Query(None),
    low_stock: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.supplier),
        joinedload(models.Product.inventory),
        joinedload(models.Product.variants),
    ).filter(models.Product.is_active == True)

    if category_id:
        q = q.filter(models.Product.category_id == category_id)
    if search:
        q = q.filter(
            models.Product.name.ilike(f"%{search}%") |
            models.Product.sku.ilike(f"%{search}%")
        )
    if low_stock:
        q = q.join(models.Inventory).filter(
            models.Inventory.quantity <= models.Inventory.low_stock_alert
        )
    return q.all()

@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.supplier),
        joinedload(models.Product.inventory),
        joinedload(models.Product.variants),
    ).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=schemas.ProductOut, status_code=201)
def create_product(data: schemas.ProductIn, db: Session = Depends(get_db)):
    existing = db.query(models.Product).filter(models.Product.sku == data.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")

    product = models.Product(
        name=data.name, sku=data.sku,
        category_id=data.category_id, supplier_id=data.supplier_id,
        price=data.price, cost_price=data.cost_price,
        description=data.description,
    )
    db.add(product)
    db.flush()

    if data.inventory:
        inv = models.Inventory(
            product_id=product.id,
            quantity=data.inventory.quantity,
            low_stock_alert=data.inventory.low_stock_alert,
            max_stock=data.inventory.max_stock,
        )
        db.add(inv)

    for v in (data.variants or []):
        variant = models.ProductVariant(
            product_id=product.id,
            size=v.size, color=v.color, age_group=v.age_group
        )
        db.add(variant)

    db.commit()
    db.refresh(product)
    return product

@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, data: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False  # soft delete
    db.commit()
    return {"message": "Product deactivated successfully"}
