from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from jose import JWTError, jwt
from database import get_db
import models, bcrypt, os

router   = APIRouter(prefix="/shop/auth", tags=["Shop Auth"])
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY", "martmanager-secret-key-change-in-production")
ALGORITHM  = "HS256"

class ShopRegisterIn(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str

class ShopLoginIn(BaseModel):
    phone: str
    password: str

class ShopCustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    class Config: from_attributes = True

def hash_password(p): return bcrypt.hashpw(p.encode(), bcrypt.gensalt(12)).decode()
def verify_password(p, h):
    try: return bcrypt.checkpw(p.encode(), h.encode())
    except: return False

def create_shop_token(customer_id: int) -> str:
    return jwt.encode({"sub": str(customer_id), "type": "shop"}, SECRET_KEY, algorithm=ALGORITHM)

def get_shop_customer(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials: return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "shop": return None
        cid = int(payload.get("sub"))
        return db.query(models.ShopCustomer).filter(models.ShopCustomer.id == cid, models.ShopCustomer.is_active == True).first()
    except: return None

@router.post("/register")
def register(data: ShopRegisterIn, db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = db.query(models.ShopCustomer).filter(models.ShopCustomer.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    customer = models.ShopCustomer(
        name=data.name, phone=data.phone,
        email=data.email, password=hash_password(data.password)
    )
    db.add(customer); db.commit(); db.refresh(customer)
    token = create_shop_token(customer.id)
    return {"access_token": token, "customer": ShopCustomerOut.model_validate(customer)}

@router.post("/login")
def login(data: ShopLoginIn, db: Session = Depends(get_db)):
    customer = db.query(models.ShopCustomer).filter(
        models.ShopCustomer.phone == data.phone,
        models.ShopCustomer.is_active == True
    ).first()
    if not customer or not customer.password or not verify_password(data.password, customer.password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    token = create_shop_token(customer.id)
    return {"access_token": token, "customer": ShopCustomerOut.model_validate(customer)}

@router.get("/me")
def get_me(customer = Depends(get_shop_customer)):
    if not customer:
        raise HTTPException(status_code=401, detail="Not logged in")
    return ShopCustomerOut.model_validate(customer)
