from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from datetime import datetime

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/low-stock")
def get_low_stock(db: Session = Depends(get_db)):
    items = db.query(models.Inventory).join(models.Product).filter(
        models.Inventory.quantity <= models.Inventory.low_stock_alert,
        models.Product.is_active == True
    ).all()
    return [
        {
            "product_id": i.product_id,
            "product_name": i.product.name,
            "sku": i.product.sku,
            "quantity": i.quantity,
            "low_stock_alert": i.low_stock_alert,
            "max_stock": i.max_stock,
        }
        for i in items
    ]

@router.post("/movement", response_model=schemas.StockMovementOut)
def record_movement(data: schemas.StockMovementIn, db: Session = Depends(get_db)):
    inventory = db.query(models.Inventory).filter(
        models.Inventory.product_id == data.product_id
    ).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    if data.movement_type == "IN":
        inventory.quantity += data.quantity
        inventory.last_restocked_at = datetime.utcnow()
    elif data.movement_type == "OUT":
        if inventory.quantity < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        inventory.quantity -= data.quantity
    elif data.movement_type == "ADJUSTMENT":
        inventory.quantity = data.quantity

    movement = models.StockMovement(
        product_id=data.product_id,
        movement_type=data.movement_type,
        quantity=data.quantity,
        note=data.note,
        created_by=data.created_by,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement
