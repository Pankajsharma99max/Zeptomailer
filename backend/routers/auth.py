import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, status
from models import LoginRequest, TokenResponse, UserCreate, User
from auth import hash_password, verify_password, generate_token, get_current_user, require_admin
from database import db_cursor, get_connection

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, password_hash, role FROM users WHERE username = ?", (req.username,))
    row = cursor.fetchone()
    conn.close()
    
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    token = generate_token()
    with db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, row["id"], time.time())
        )
        
    return TokenResponse(
        access_token=token,
        token_type="Bearer",
        user=User(id=row["id"], username=row["username"], role=row["role"])
    )

@router.get("/me", response_model=User)
async def get_me(user: User = Depends(get_current_user)):
    return user

@router.post("/users", response_model=User)
async def create_user(req: UserCreate, admin: User = Depends(require_admin)):
    """Create a new user (Admin only)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (req.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")
    conn.close()
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(req.password)
    with db_cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)",
            (user_id, req.username, hashed_pw, req.role)
        )
    return User(id=user_id, username=req.username, role=req.role)

@router.get("/users")
async def list_users(admin: User = Depends(require_admin)):
    """List all users (Admin only)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "username": r["username"], "role": r["role"]} for r in rows]

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin)):
    """Delete a user (Admin only)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    with db_cursor() as cursor:
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    return {"message": "User deleted"}
