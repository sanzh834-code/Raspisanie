from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.auth import User, UserCreate, UserLogin, Token, hash_password, verify_password
from database import get_database
import jwt
from datetime import datetime, timedelta
from typing import Optional
import os

# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "school-schedule-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

router = APIRouter()
security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        
        if username is None:
            raise credentials_exception
            
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"username": username, "id": user_id})
    if user is None:
        raise credentials_exception
    
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    """Check if current user is admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Authenticate user and return JWT token"""
    
    user = await db.users.find_one({"username": user_credentials.username})
    
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Update last login
    await db.users.update_one(
        {"username": user_credentials.username},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60  # seconds
    }

@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Successfully logged out"}

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "username": current_user.username,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@router.post("/create-admin")
async def create_admin_user(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Create default admin user if none exists"""
    
    # Check if admin already exists
    existing_admin = await db.users.find_one({"is_admin": True})
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user already exists"
        )
    
    # Create default admin
    admin_data = {
        "username": "admin",
        "password": "admin123",  # Default password - should be changed
        "email": "admin@school.kz",
        "is_admin": True
    }
    
    admin_user = User(
        username=admin_data["username"],
        email=admin_data["email"],
        hashed_password=hash_password(admin_data["password"]),
        is_admin=True
    )
    
    await db.users.insert_one(admin_user.dict())
    
    return {
        "message": "Admin user created successfully",
        "username": "admin",
        "password": "admin123",
        "note": "Please change the default password after first login"
    }

@router.put("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Change user password"""
    
    # Verify old password
    user = await db.users.find_one({"username": current_user.username})
    if not verify_password(old_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Update password
    hashed_new_password = hash_password(new_password)
    await db.users.update_one(
        {"username": current_user.username},
        {"$set": {"hashed_password": hashed_new_password}}
    )
    
    return {"message": "Password changed successfully"}