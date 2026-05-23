from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from datetime import date
from database import get_db
import models, schemas

router = APIRouter(prefix="/sales", tags=["Sales"])

def generate_sale_number(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    count = db.query(models.Sale).filter(
        func.date(models.Sale.created_at) == date.today()
    ).count()
    return f"SALE-{today}-{str(count+1).zfill(3)}"

@router.post("/", response_model=schemas.SaleOut, status_code=201)
def create_sale(data: schemas.SaleIn, db: Session = Depends(get_db)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Sale must have at least one item")

    # Validate stock & calculate subtotal
    subtotal = 0.0
    enriched_items = []
    for item in data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
        if not inventory or inventory.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for: {product.name}")
        line_total = float(product.price) * item.quantity
        subtotal += line_total
        enriched_items.append({ "product": product, "inventory": inventory, "quantity": item.quantity, "line_total": line_total })

    # Calculate discount
    discount_amount = 0.0
    if data.discount_type and data.discount_value:
        if data.discount_type == "PERCENT":
            discount_amount = subtotal * (float(data.discount_value) / 100)
        elif data.discount_type == "FIXED":
            discount_amount = float(data.discount_value)
    discount_amount = min(discount_amount, subtotal)
    total = subtotal - discount_amount
    change_given = max(0.0, float(data.amount_paid or 0) - total)

    # Create sale record
    sale = models.Sale(
        sale_number=generate_sale_number(db),
        payment_method=data.payment_method,
        subtotal=round(subtotal, 2),
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        discount_amount=round(discount_amount, 2),
        total=round(total, 2),
        amount_paid=data.amount_paid,
        change_given=round(change_given, 2),
        note=data.note,
        served_by=data.served_by,
    )
    db.add(sale)
    db.flush()

    # Create sale items + deduct stock
    for ei in enriched_items:
        si = models.SaleItem(
            sale_id=sale.id,
            product_id=ei["product"].id,
            product_name=ei["product"].name,
            sku=ei["product"].sku,
            unit_price=ei["product"].price,
            quantity=ei["quantity"],
            line_total=round(ei["line_total"], 2),
        )
        db.add(si)
        ei["inventory"].quantity -= ei["quantity"]
        db.add(models.StockMovement(
            product_id=ei["product"].id,
            movement_type="OUT",
            quantity=ei["quantity"],
            note=f"Sold — {sale.sale_number}",
            created_by=data.served_by,
        ))

    db.commit()
    db.refresh(sale)
    return sale

@router.get("/", response_model=List[schemas.SaleOut])
def get_sales(
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    sale_date: Optional[date] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Sale).order_by(models.Sale.created_at.desc())
    if sale_date:
        q = q.filter(func.date(models.Sale.created_at) == sale_date)
    if payment_method:
        q = q.filter(models.Sale.payment_method == payment_method)
    return q.offset(offset).limit(limit).all()

@router.get("/report/daily")
def daily_report(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM v_daily_sales LIMIT 30")).fetchall()
    return [dict(r._mapping) for r in result]

@router.get("/report/top-products")
def top_products(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT * FROM v_top_products LIMIT 10")).fetchall()
    return [dict(r._mapping) for r in result]

@router.get("/{sale_id}", response_model=schemas.SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(models.Sale).filter(models.Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale
