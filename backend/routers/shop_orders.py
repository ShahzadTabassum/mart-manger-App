from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from database import get_db
from routers.shop_auth import get_shop_customer
import models

router = APIRouter(prefix="/shop/orders", tags=["Shop Orders"])

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int

class OrderIn(BaseModel):
    customer_name:    str
    customer_phone:   str
    customer_email:   Optional[str] = None
    fulfillment_type: str  # DELIVERY | PICKUP
    delivery_address: Optional[str] = None
    payment_method:   str  # ONLINE | COD
    items:            List[OrderItemIn]
    note:             Optional[str] = None

def gen_order_number(db):
    today = date.today().strftime("%Y%m%d")
    count = db.query(models.Order).filter(
        func.date(models.Order.created_at) == date.today()
    ).count()
    return f"ORD-{today}-{str(count+1).zfill(3)}"

def format_order(o):
    return {
        "id":               o.id,
        "order_number":     o.order_number,
        "customer_name":    o.customer_name,
        "customer_phone":   o.customer_phone,
        "fulfillment_type": o.fulfillment_type,
        "delivery_address": o.delivery_address,
        "payment_method":   o.payment_method,
        "payment_status":   o.payment_status,
        "status":           o.status,
        "subtotal":         float(o.subtotal),
        "delivery_fee":     float(o.delivery_fee),
        "total":            float(o.total),
        "note":             o.note,
        "created_at":       str(o.created_at),
        "items": [
            {
                "product_name": i.product_name,
                "sku":          i.sku,
                "unit_price":   float(i.unit_price),
                "quantity":     i.quantity,
                "line_total":   float(i.line_total),
            }
            for i in o.items
        ],
    }

@router.post("/", status_code=201)
def create_order(data: OrderIn, customer=Depends(get_shop_customer), db: Session = Depends(get_db)):
    if not data.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")
    if data.fulfillment_type == "DELIVERY" and not data.delivery_address:
        raise HTTPException(status_code=400, detail="Delivery address is required")

    DELIVERY_FEE = 5.00  # SGD 5 flat delivery fee

    subtotal = 0.0
    enriched = []
    for item in data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id, models.Product.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
        inventory = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
        if not inventory or inventory.quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for: {product.name}")
        line_total = float(product.price) * item.quantity
        subtotal += line_total
        enriched.append({"product": product, "inventory": inventory, "quantity": item.quantity, "line_total": line_total})

    delivery_fee = DELIVERY_FEE if data.fulfillment_type == "DELIVERY" else 0.0
    total = subtotal + delivery_fee

    order = models.Order(
        order_number=gen_order_number(db),
        customer_id=customer.id if customer else None,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        fulfillment_type=data.fulfillment_type,
        delivery_address=data.delivery_address,
        payment_method=data.payment_method,
        payment_status="PENDING",
        status="PENDING",
        subtotal=round(subtotal, 2),
        delivery_fee=round(delivery_fee, 2),
        total=round(total, 2),
        note=data.note,
    )
    db.add(order)
    db.flush()

    for ei in enriched:
        db.add(models.OrderItem(
            order_id=order.id,
            product_id=ei["product"].id,
            product_name=ei["product"].name,
            sku=ei["product"].sku,
            unit_price=ei["product"].price,
            quantity=ei["quantity"],
            line_total=round(ei["line_total"], 2),
        ))
        # Reserve stock
        ei["inventory"].quantity -= ei["quantity"]
        db.add(models.StockMovement(
            product_id=ei["product"].id,
            movement_type="OUT",
            quantity=ei["quantity"],
            note=f"Online order — {order.order_number}",
        ))

    db.add(models.OrderStatusHistory(order_id=order.id, status="PENDING", note="Order placed by customer"))
    db.commit()
    db.refresh(order)
    return format_order(order)

@router.get("/track/{order_number}")
def track_order(order_number: str, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    history = db.query(models.OrderStatusHistory).filter(
        models.OrderStatusHistory.order_id == order.id
    ).order_by(models.OrderStatusHistory.created_at.asc()).all()
    result = format_order(order)
    result["history"] = [{"status": h.status, "note": h.note, "created_at": str(h.created_at)} for h in history]
    return result

@router.get("/my-orders")
def my_orders(customer=Depends(get_shop_customer), db: Session = Depends(get_db)):
    if not customer:
        raise HTTPException(status_code=401, detail="Login required")
    orders = db.query(models.Order).filter(
        models.Order.customer_id == customer.id
    ).order_by(models.Order.created_at.desc()).all()
    return [format_order(o) for o in orders]

# ── Admin: manage orders ──
@router.get("/admin/all")
def admin_get_orders(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Order).order_by(models.Order.created_at.desc())
    if status: q = q.filter(models.Order.status == status)
    return [format_order(o) for o in q.limit(100).all()]

@router.put("/admin/{order_id}/status")
def admin_update_status(
    order_id: int,
    status: str,
    note: Optional[str] = None,
    changed_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    valid = ["PENDING","CONFIRMED","PROCESSING","READY","DELIVERED","CANCELLED"]
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid}")
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # If cancelling — restore stock
    if status == "CANCELLED" and order.status != "CANCELLED":
        for item in order.items:
            inv = db.query(models.Inventory).filter(models.Inventory.product_id == item.product_id).first()
            if inv:
                inv.quantity += item.quantity
                db.add(models.StockMovement(
                    product_id=item.product_id,
                    movement_type="IN",
                    quantity=item.quantity,
                    note=f"Order cancelled — {order.order_number}",
                    created_by=changed_by,
                ))

    order.status = status
    if status == "DELIVERED": order.payment_status = "PAID"
    db.add(models.OrderStatusHistory(order_id=order_id, status=status, note=note, changed_by=changed_by))
    db.commit()
    db.refresh(order)
    return format_order(order)
