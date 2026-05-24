from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# ---------- Category ----------
class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    class Config: from_attributes = True

# ---------- Supplier ----------
class SupplierOut(BaseModel):
    id: int
    name: str
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    class Config: from_attributes = True

# ---------- Variant ----------
class VariantOut(BaseModel):
    id: int
    size: Optional[str] = None
    color: Optional[str] = None
    age_group: Optional[str] = None
    class Config: from_attributes = True

class VariantIn(BaseModel):
    size: Optional[str] = None
    color: Optional[str] = None
    age_group: Optional[str] = None

# ---------- Inventory ----------
class InventoryOut(BaseModel):
    quantity: int
    low_stock_alert: int
    max_stock: Optional[int] = None
    class Config: from_attributes = True

class InventoryIn(BaseModel):
    quantity: int
    low_stock_alert: int = 10
    max_stock: int = 100

# ---------- Product ----------
class ProductIn(BaseModel):
    name: str
    sku: str
    category_id: int
    supplier_id: Optional[int] = None
    price: Decimal
    cost_price: Optional[Decimal] = None
    description: Optional[str] = None
    inventory: Optional[InventoryIn] = None
    variants: Optional[List[VariantIn]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    price: Decimal
    cost_price: Optional[Decimal] = None
    description: Optional[str] = None
    is_active: bool
    category: Optional[CategoryOut] = None
    supplier: Optional[SupplierOut] = None
    inventory: Optional[InventoryOut] = None
    variants: List[VariantOut] = []
    created_at: Optional[datetime] = None
    class Config: from_attributes = True

# ---------- Stock Movement ----------
class StockMovementIn(BaseModel):
    product_id: int
    movement_type: str
    quantity: int
    note: Optional[str] = None
    created_by: Optional[str] = None

class StockMovementOut(StockMovementIn):
    id: int
    created_at: Optional[datetime] = None
    class Config: from_attributes = True

# ---------- Sale ----------
class SaleItemIn(BaseModel):
    product_id: int
    quantity: int

class SaleItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    sku: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal
    class Config: from_attributes = True

class SaleIn(BaseModel):
    payment_method: str             # CASH | CARD | QR
    items: List[SaleItemIn]
    discount_type: Optional[str]  = None   # PERCENT | FIXED
    discount_value: Optional[Decimal] = None
    amount_paid: Optional[Decimal] = None
    note: Optional[str] = None
    served_by: Optional[str] = None
    customer_id: Optional[int] = None
    redeem_points: Optional[int] = None

class SaleOut(BaseModel):
    id: int
    sale_number: str
    payment_method: str
    subtotal: Decimal
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    discount_amount: Decimal
    total: Decimal
    amount_paid: Optional[Decimal] = None
    change_given: Optional[Decimal] = None
    note: Optional[str] = None
    served_by: Optional[str] = None
    customer_id: Optional[int] = None
    loyalty_earned: Optional[int] = 0
    loyalty_redeemed: Optional[int] = 0
    created_at: Optional[datetime] = None
    items: List[SaleItemOut] = []
    class Config: from_attributes = True
