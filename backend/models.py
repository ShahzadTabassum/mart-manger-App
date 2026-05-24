from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    DECIMAL, Enum, ForeignKey, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "categories"
    id          = Column(Integer, primary_key=True, index=True)
    parent_id   = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name        = Column(String(100), nullable=False, unique=True)
    icon        = Column(String(10), default="🏷️")
    description = Column(Text)
    created_at  = Column(TIMESTAMP, server_default=func.now())
    products    = relationship("Product", back_populates="category")
    children    = relationship("Category", backref="parent", remote_side="Category.id", foreign_keys=[parent_id])

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
    sku         = Column(String(50),  nullable=False, unique=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    price       = Column(DECIMAL(10,2), nullable=False, default=0.00)
    cost_price  = Column(DECIMAL(10,2), default=0.00)
    description = Column(Text)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(TIMESTAMP, server_default=func.now())
    updated_at  = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    category    = relationship("Category", back_populates="products")
    supplier    = relationship("Supplier", back_populates="products")
    inventory   = relationship("Inventory", back_populates="product", uselist=False)
    variants    = relationship("ProductVariant", back_populates="product", cascade="all, delete")

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
    movement_type = Column(Enum("IN","OUT","ADJUSTMENT"), nullable=False)
    quantity      = Column(Integer, nullable=False)
    note          = Column(String(255))
    created_by    = Column(String(100))
    created_at    = Column(TIMESTAMP, server_default=func.now())

class Sale(Base):
    __tablename__ = "sales"
    id               = Column(Integer, primary_key=True, index=True)
    sale_number      = Column(String(30),  nullable=False, unique=True)
    payment_method   = Column(Enum("CASH","CARD","QR"), nullable=False)
    subtotal         = Column(DECIMAL(10,2), nullable=False, default=0.00)
    discount_type    = Column(Enum("PERCENT","FIXED"), nullable=True)
    discount_value   = Column(DECIMAL(10,2), default=0.00)
    discount_amount  = Column(DECIMAL(10,2), default=0.00)
    total            = Column(DECIMAL(10,2), nullable=False, default=0.00)
    amount_paid      = Column(DECIMAL(10,2), default=0.00)
    change_given     = Column(DECIMAL(10,2), default=0.00)
    note             = Column(String(255))
    served_by        = Column(String(100))
    customer_id      = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    loyalty_earned   = Column(Integer, default=0)
    loyalty_redeemed = Column(Integer, default=0)
    created_at       = Column(TIMESTAMP, server_default=func.now())
    items            = relationship("SaleItem", back_populates="sale", cascade="all, delete")

class SaleItem(Base):
    __tablename__ = "sale_items"
    id           = Column(Integer, primary_key=True, index=True)
    sale_id      = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id   = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    sku          = Column(String(50),  nullable=False)
    unit_price   = Column(DECIMAL(10,2), nullable=False)
    quantity     = Column(Integer, nullable=False)
    line_total   = Column(DECIMAL(10,2), nullable=False)
    created_at   = Column(TIMESTAMP, server_default=func.now())
    sale         = relationship("Sale", back_populates="items")

class Customer(Base):
    __tablename__ = "customers"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String(150), nullable=False)
    phone          = Column(String(30),  nullable=False, unique=True)
    loyalty_points = Column(Integer,     nullable=False, default=0)
    total_spent    = Column(DECIMAL(10,2), nullable=False, default=0.00)
    visit_count    = Column(Integer,     nullable=False, default=0)
    is_active      = Column(Boolean,     nullable=False, default=True)
    created_at     = Column(TIMESTAMP,   server_default=func.now())
    updated_at     = Column(TIMESTAMP,   server_default=func.now(), onupdate=func.now())
    loyalty_txns   = relationship("LoyaltyTransaction", back_populates="customer", cascade="all, delete")

class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"
    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    sale_id     = Column(Integer, ForeignKey("sales.id",     ondelete="SET NULL"), nullable=True)
    type        = Column(Enum("EARN","REDEEM","ADJUSTMENT"), nullable=False)
    points      = Column(Integer, nullable=False)
    note        = Column(String(255))
    created_at  = Column(TIMESTAMP, server_default=func.now())
    customer    = relationship("Customer", back_populates="loyalty_txns")

class Employee(Base):
    __tablename__ = "employees"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(150), nullable=False)
    phone      = Column(String(30))
    role       = Column(Enum("SALESMAN"), nullable=False, default="SALESMAN")
    pin        = Column(String(6), nullable=False, default="0000")
    is_active  = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class Return(Base):
    __tablename__    = "returns"
    id               = Column(Integer, primary_key=True, index=True)
    return_number    = Column(String(30), nullable=False, unique=True)
    original_sale_id = Column(Integer, ForeignKey("sales.id", ondelete="SET NULL"), nullable=True)
    type             = Column(Enum("REFUND","EXCHANGE"), nullable=False)
    reason           = Column(String(255))
    refund_method    = Column(Enum("CASH","CARD","QR"), nullable=True)
    refund_amount    = Column(DECIMAL(10,2), default=0.00)
    served_by        = Column(String(100))
    created_at       = Column(TIMESTAMP, server_default=func.now())
    return_items     = relationship("ReturnItem",   back_populates="ret", cascade="all, delete")
    exchange_items   = relationship("ExchangeItem", back_populates="ret", cascade="all, delete")

class ReturnItem(Base):
    __tablename__ = "return_items"
    id           = Column(Integer, primary_key=True, index=True)
    return_id    = Column(Integer, ForeignKey("returns.id", ondelete="CASCADE"), nullable=False)
    product_id   = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    sku          = Column(String(50),  nullable=False)
    unit_price   = Column(DECIMAL(10,2), nullable=False)
    quantity     = Column(Integer, nullable=False)
    line_total   = Column(DECIMAL(10,2), nullable=False)
    ret          = relationship("Return", back_populates="return_items")

class ExchangeItem(Base):
    __tablename__ = "exchange_items"
    id           = Column(Integer, primary_key=True, index=True)
    return_id    = Column(Integer, ForeignKey("returns.id", ondelete="CASCADE"), nullable=False)
    product_id   = Column(Integer, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(200), nullable=False)
    sku          = Column(String(50),  nullable=False)
    unit_price   = Column(DECIMAL(10,2), nullable=False)
    quantity     = Column(Integer, nullable=False)
    line_total   = Column(DECIMAL(10,2), nullable=False)
    ret          = relationship("Return", back_populates="exchange_items")

class User(Base):
    __tablename__ = "users"
    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(150), nullable=False)
    phone      = Column(String(30),  nullable=False, unique=True)
    password   = Column(String(255), nullable=False)
    role       = Column(Enum("ADMIN","MANAGER","CASHIER"), nullable=False, default="CASHIER")
    is_active  = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)

    phone = Column(String(30), nullable=False)

    otp = Column(String(6), nullable=False)

    is_used = Column(Boolean, default=False)

    created_at = Column(
        TIMESTAMP,
        server_default=func.now()
    )
