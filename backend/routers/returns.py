from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import date
from database import get_db
import models

router = APIRouter(prefix="/returns", tags=["Returns"])

class ReturnItemIn(BaseModel):
    product_id: int
    quantity: int

class ExchangeItemIn(BaseModel):
    product_id: int
    quantity: int

class ReturnIn(BaseModel):
    original_sale_id: Optional[int] = None
    type: str  # REFUND | EXCHANGE
    reason: Optional[str] = None
    refund_method: Optional[str] = None
    return_items: List[ReturnItemIn]
    exchange_items: Optional[List[ExchangeItemIn]] = []
    served_by: Optional[str] = None

def gen_return_number(db):
    today = date.today().strftime("%Y%m%d")
    count = db.query(models.Return).filter(
        func.date(models.Return.created_at) == date.today()
    ).count()
    return f"RET-{today}-{str(count+1).zfill(3)}"

@router.post("/", status_code=201)
def create_return(data: ReturnIn, db: Session = Depends(get_db)):
    if not data.return_items:
        raise HTTPException(status_code=400, detail="At least one return item required")

    # Process returned items — add stock back
    return_total = 0.0
    ret_items = []
    for ri in data.return_items:
        product = db.query(models.Product).filter(models.Product.id == ri.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {ri.product_id} not found")
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == ri.product_id).first()
        line_total = float(product.price) * ri.quantity
        return_total += line_total
        # Add stock back
        if inventory:
            inventory.quantity += ri.quantity
        db.add(models.StockMovement(
            product_id=product.id, movement_type="IN",
            quantity=ri.quantity, note=f"Return — {data.reason or 'Customer return'}",
            created_by=data.served_by,
        ))
        ret_items.append({"product": product, "quantity": ri.quantity, "line_total": line_total})

    # Process exchange items — deduct stock
    exchange_total = 0.0
    exc_items = []
    for ei in (data.exchange_items or []):
        product = db.query(models.Product).filter(models.Product.id == ei.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {ei.product_id} not found")
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == ei.product_id).first()
        if not inventory or inventory.quantity < ei.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for: {product.name}")
        line_total = float(product.price) * ei.quantity
        exchange_total += line_total
        inventory.quantity -= ei.quantity
        db.add(models.StockMovement(
            product_id=product.id, movement_type="OUT",
            quantity=ei.quantity, note=f"Exchange — given to customer",
            created_by=data.served_by,
        ))
        exc_items.append({"product": product, "quantity": ei.quantity, "line_total": line_total})

    # Refund amount = returned value - exchange value
    refund_amount = max(0.0, return_total - exchange_total)
    # Extra to pay = exchange value - returned value
    extra_to_pay  = max(0.0, exchange_total - return_total)

    # Create return record
    ret = models.Return(
        return_number=gen_return_number(db),
        original_sale_id=data.original_sale_id,
        type=data.type,
        reason=data.reason,
        refund_method=data.refund_method,
        refund_amount=round(refund_amount, 2),
        served_by=data.served_by,
    )
    db.add(ret)
    db.flush()

    for ri in ret_items:
        db.add(models.ReturnItem(
            return_id=ret.id, product_id=ri["product"].id,
            product_name=ri["product"].name, sku=ri["product"].sku,
            unit_price=ri["product"].price, quantity=ri["quantity"],
            line_total=round(ri["line_total"], 2),
        ))
    for ei in exc_items:
        db.add(models.ExchangeItem(
            return_id=ret.id, product_id=ei["product"].id,
            product_name=ei["product"].name, sku=ei["product"].sku,
            unit_price=ei["product"].price, quantity=ei["quantity"],
            line_total=round(ei["line_total"], 2),
        ))

    db.commit()
    db.refresh(ret)
    return {
        "id": ret.id,
        "return_number": ret.return_number,
        "type": ret.type,
        "return_total": round(return_total, 2),
        "exchange_total": round(exchange_total, 2),
        "refund_amount": round(refund_amount, 2),
        "extra_to_pay": round(extra_to_pay, 2),
        "refund_method": ret.refund_method,
        "reason": ret.reason,
        "served_by": ret.served_by,
        "created_at": str(ret.created_at),
        "return_items":   [{"product_name":r["product"].name,"sku":r["product"].sku,"quantity":r["quantity"],"line_total":r["line_total"]} for r in ret_items],
        "exchange_items":  [{"product_name":e["product"].name,"sku":e["product"].sku,"quantity":e["quantity"],"line_total":e["line_total"]} for e in exc_items],
    }

@router.get("/")
def get_returns(db: Session = Depends(get_db)):
    rets = db.query(models.Return).order_by(models.Return.created_at.desc()).limit(100).all()
    result = []
    for r in rets:
        result.append({
            "id": r.id, "return_number": r.return_number,
            "type": r.type, "refund_amount": float(r.refund_amount),
            "refund_method": r.refund_method, "reason": r.reason,
            "served_by": r.served_by, "created_at": str(r.created_at),
            "original_sale_id": r.original_sale_id,
            "return_items":  [{"product_name":i.product_name,"sku":i.sku,"quantity":i.quantity,"line_total":float(i.line_total)} for i in r.return_items],
            "exchange_items": [{"product_name":i.product_name,"sku":i.sku,"quantity":i.quantity,"line_total":float(i.line_total)} for i in r.exchange_items],
        })
    return result
