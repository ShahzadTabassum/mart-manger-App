from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    DECIMAL, Enum, ForeignKey, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "categories"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    created_at  = Column(TIMESTAMP, server_default=func.now())
    products    = relationship("Product", back_populates="category")

class Supplier(Base):
    __tablename__ = "suppliers"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(150), nullable=False)
    contact_name = Column(String(100))
    phone        = Column(String(30))
    email        = Column(String(150))
    address      = Column(Text)
    created_at   = Column(TIMESTAMP, server_default=func.now())
    products     = relationship("Product", back_populates="supplier")

class Product(Base):
    __tablename__ = "products"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), nullable=False)
    sku         = Column(String(50), nullable=False, unique=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    price       = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    cost_price  = Column(DECIMAL(10, 2), default=0.00)
    description = Column(Text)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(TIMESTAMP, server_default=func.now())
    updated_at  = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    category  = relationship("Category", back_populates="products")
    supplier  = relationship("Supplier", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", uselist=False)
    variants  = relationship("ProductVariant", back_populates="product", cascade="all, delete")

class ProductVariant(Base):
    __tablename__ = "product_variants"
    id         = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    size       = Column(String(50))
    color      = Column(String(50))
    age_group  = Column(String(50))
    sku_suffix = Column(String(30))
    created_at = Column(TIMESTAMP, server_default=func.now())
    product    = relationship("Product", back_populates="variants")

class Inventory(Base):
    __tablename__ = "inventory"
    id                = Column(Integer, primary_key=True, index=True)
    product_id        = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, unique=True)
    quantity          = Column(Integer, nullable=False, default=0)
    low_stock_alert   = Column(Integer, nullable=False, default=10)
    max_stock         = Column(Integer, default=100)
    last_restocked_at = Column(TIMESTAMP)
    updated_at        = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    product           = relationship("Product", back_populates="inventory")

class StockMovement(Base):
    __tablename__ = "stock_movements"
    id            = Column(Integer, primary_key=True, index=True)
    product_id    = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(Enum("IN", "OUT", "ADJUSTMENT"), nullable=False)
    quantity      = Column(Integer, nullable=False)
    note          = Column(String(255))
    created_by    = Column(String(100))
    created_at    = Column(TIMESTAMP, server_default=func.now())

class Sale(Base):
    __tablename__ = "sales"
    id              = Column(Integer, primary_key=True, index=True)
    sale_number     = Column(String(30), nullable=False, unique=True)
    payment_method  = Column(Enum("CASH","CARD","QR"), nullable=False)
    subtotal        = Column(DECIMAL(10,2), nullable=False, default=0.00)
    discount_type   = Column(Enum("PERCENT","FIXED"), nullable=True)
    discount_value  = Column(DECIMAL(10,2), default=0.00)
    discount_amount = Column(DECIMAL(10,2), default=0.00)
    total           = Column(DECIMAL(10,2), nullable=False, default=0.00)
    amount_paid     = Column(DECIMAL(10,2), default=0.00)
    change_given    = Column(DECIMAL(10,2), default=0.00)
    note            = Column(String(255))
    served_by       = Column(String(100))
    created_at      = Column(TIMESTAMP, server_default=func.now())
    items           = relationship("SaleItem", back_populates="sale", cascade="all, delete")

class SaleItem(Base):
    __tablename__ = "sale_items"
    id           = Column(Integer, primary_key=True, index=True)
    sale_id      = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id   = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    sku          = Column(String(50), nullable=False)
    unit_price   = Column(DECIMAL(10,2), nullable=False)
    quantity     = Column(Integer, nullable=False)
    line_total   = Column(DECIMAL(10,2), nullable=False)
    created_at   = Column(TIMESTAMP, server_default=func.now())
    sale         = relationship("Sale", back_populates="items")
