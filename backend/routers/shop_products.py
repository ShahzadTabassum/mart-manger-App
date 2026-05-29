from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/shop/products", tags=["Shop Products"])

@router.get("/")
def get_shop_products(
    category_id: Optional[int] = Query(None),
    search:       Optional[str] = Query(None),
    featured:     Optional[bool]= Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.inventory),
    ).filter(
        models.Product.is_active == True,
        models.Product.shop_visible == True,
    )
    if category_id: q = q.filter(models.Product.category_id == category_id)
    if featured:    q = q.filter(models.Product.shop_featured == True)
    if search:      q = q.filter(models.Product.name.ilike(f"%{search}%"))
    products = q.all()
    return [_format_product(p) for p in products]

@router.get("/categories")
def get_shop_categories(db: Session = Depends(get_db)):
    # Return only categories that have visible products
    from sqlalchemy import text
    result = db.execute(text("""
        SELECT DISTINCT c.id, c.name, c.icon, c.parent_id,
               pc.name as parent_name, pc.icon as parent_icon,
               COUNT(p.id) as product_count
        FROM categories c
        JOIN products p ON p.category_id = c.id
        LEFT JOIN categories pc ON pc.id = c.parent_id
        WHERE p.is_active = TRUE AND p.shop_visible = TRUE
        GROUP BY c.id
        ORDER BY pc.name, c.name
    """)).fetchall()
    return [dict(r._mapping) for r in result]

@router.get("/featured")
def get_featured(db: Session = Depends(get_db)):
    products = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.inventory),
    ).filter(
        models.Product.is_active == True,
        models.Product.shop_visible == True,
        models.Product.shop_featured == True,
    ).limit(8).all()
    return [_format_product(p) for p in products]

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(models.Product).options(
        joinedload(models.Product.category),
        joinedload(models.Product.inventory),
        joinedload(models.Product.variants),
    ).filter(
        models.Product.id == product_id,
        models.Product.is_active == True,
        models.Product.shop_visible == True,
    ).first()
    if not p:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Product not found")
    return _format_product(p, include_variants=True)

def _format_product(p, include_variants=False):
    inv = p.inventory
    result = {
        "id":          p.id,
        "name":        p.name,
        "sku":         p.sku,
        "price":       float(p.price),
        "description": p.description,
        "featured":    p.shop_featured,
        "category":    {"id": p.category.id, "name": p.category.name, "icon": p.category.icon} if p.category else None,
        "in_stock":    (inv.quantity > 0) if inv else False,
        "stock_qty":   inv.quantity if inv else 0,
    }
    if include_variants:
        result["variants"] = [
            {"id": v.id, "size": v.size, "color": v.color, "age_group": v.age_group}
            for v in (p.variants or [])
        ]
    return result
