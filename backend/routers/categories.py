from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import models

router = APIRouter(prefix="/categories", tags=["Categories"])

class CategoryIn(BaseModel):
    name: str
    parent_id: Optional[int] = None
    icon: Optional[str] = "🏷️"
    description: Optional[str] = None

class SubCategoryOut(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    description: Optional[str] = None
    product_count: int = 0
    class Config: from_attributes = True

class CategoryTreeOut(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None
    description: Optional[str] = None
    product_count: int = 0
    children: List[SubCategoryOut] = []

# Flat list — used by product dropdowns
@router.get("/flat")
def get_categories_flat(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM v_category_tree")).fetchall()
    return [dict(r._mapping) for r in rows]

# Tree structure — used by category management UI
@router.get("/tree")
def get_categories_tree(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM v_category_tree")).fetchall()
    all_cats = [dict(r._mapping) for r in rows]
    mains = [c for c in all_cats if c["parent_id"] is None]
    for main in mains:
        main["children"] = [c for c in all_cats if c["parent_id"] == main["id"]]
    return mains

# Keep backward compat — returns flat list
@router.get("/")
def get_categories(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM v_category_tree")).fetchall()
    return [dict(r._mapping) for r in rows]

@router.post("/")
def create_category(data: CategoryIn, db: Session = Depends(get_db)):
    cat = models.Category(
        name=data.name,
        parent_id=data.parent_id,
        icon=data.icon,
        description=data.description,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(models.Category).filter(models.Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    product_count = db.query(models.Product).filter(models.Product.category_id == cat_id, models.Product.is_active == True).count()
    if product_count > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete: {product_count} products use this category")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}
