from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from jose import JWTError, jwt
from database import get_db
import models, bcrypt, os
from datetime import datetime, timedelta
import random

router   = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()

SECRET_KEY = os.getenv("SECRET_KEY", "martmanager-secret-key-change-in-production")
ALGORITHM  = "HS256"

# ---------- Schemas ----------
class LoginIn(BaseModel):
    phone: str
    password: str

class UserIn(BaseModel):
    name: str
    phone: str
    password: str = ""
    role: str = "CASHIER"

class PasswordChange(BaseModel):
    old_password: str
    new_password: str
class ForgotPasswordIn(BaseModel):
    phone: str

class ResetPasswordIn(BaseModel):
    phone: str
    new_password: str

class OTPVerifyIn(BaseModel):
    phone: str
    otp: str
    new_password: str

# ---------- Password helpers using bcrypt directly ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

# ---------- JWT helpers ----------
def create_token(user_id: int, role: str) -> str:
    return jwt.encode({"sub": str(user_id), "role": role}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_admin_or_manager(current_user: models.User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Admin or Manager access required")
    return current_user

# ---------- Routes ----------
@router.post("/login")
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.phone == data.phone,
        models.User.is_active == True
    ).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    token = create_token(user.id, user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "phone": user.phone, "role": user.role}
    }

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "phone": current_user.phone, "role": current_user.role}

@router.get("/users")
def get_users(current_user: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.is_active == True).order_by(models.User.name).all()
    return [{"id":u.id,"name":u.name,"phone":u.phone,"role":u.role} for u in users]

@router.post("/users", status_code=201)
def create_user(data: UserIn, current_user: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = db.query(models.User).filter(models.User.phone == data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    user = models.User(name=data.name, phone=data.phone, password=hash_password(data.password), role=data.role)
    db.add(user); db.commit(); db.refresh(user)
    return {"id": user.id, "name": user.name, "phone": user.phone, "role": user.role}

@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserIn, current_user: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.name = data.name; user.phone = data.phone; user.role = data.role
    if data.password and len(data.password) >= 6:
        user.password = hash_password(data.password)
    db.commit(); db.refresh(user)
    return {"id": user.id, "name": user.name, "phone": user.phone, "role": user.role}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, current_user: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    admin_count = db.query(models.User).filter(models.User.role == "ADMIN", models.User.is_active == True).count()
    if user.role == "ADMIN" and admin_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last Admin")
    user.is_active = False; db.commit()
    return {"message": "User deleted"}

@router.post("/change-password")
def change_password(data: PasswordChange, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(
    data: ForgotPasswordIn,
    db: Session = Depends(get_db)
):
    print("Incoming phone:", data.phone)
    user = db.query(models.User).filter(
        models.User.phone == data.phone
    ).first()
    print("Found user:", user)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    otp = str(random.randint(100000, 999999))

    reset = models.PasswordResetOTP(
        phone=data.phone,
        otp=otp
    )

    db.add(reset)
    db.commit()

    print(f"OTP for {data.phone}: {otp}")

    return {
        "message": "OTP generated"
    }

@router.post("/resend-reset-otp")
def resend_reset_otp(
    data: ForgotPasswordIn,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.phone == data.phone
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # invalidate old OTPs
    db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.phone == data.phone,
        models.PasswordResetOTP.is_used == False
    ).update({
        "is_used": True
    })

    otp = str(random.randint(100000, 999999))

    otp_entry = models.PasswordResetOTP(
        phone=data.phone,
        otp=otp
    )

    db.add(otp_entry)
    db.commit()

    print(f"Resend OTP for {data.phone}: {otp}")

    return {
        "message": "OTP resent successfully"
    }

@router.post("/verify-reset-otp")
def verify_reset_otp(
    data: OTPVerifyIn,
    db: Session = Depends(get_db)
):

    otp_record = db.query(models.PasswordResetOTP).filter(
        models.PasswordResetOTP.phone == data.phone,
        models.PasswordResetOTP.otp == data.otp,
        models.PasswordResetOTP.is_used == False
    ).order_by(
        models.PasswordResetOTP.id.desc()
    ).first()

    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid OTP"
        )

    created = otp_record.created_at

    if datetime.now() - created > timedelta(minutes=5):
        raise HTTPException(
            status_code=400,
            detail="OTP expired"
        )

    user = db.query(models.User).filter(
        models.User.phone == data.phone
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    user.password = hash_password(data.new_password)

    otp_record.is_used = True

    db.commit()

    return {
        "message": "Password reset successful"
    }