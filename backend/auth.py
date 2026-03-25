import secrets
import string
import time
import bcrypt
from fastapi import Header, HTTPException, status, Depends
from models import User
from database import get_connection

def hash_password(password: str) -> str:
    """Hash a password using bcrypt with a random salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed one."""
    try:
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    except Exception:
        return False

def generate_token() -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(64))

def get_current_user(authorization: str = Header(None)) -> User:
    """Dependency to verify the bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    
    token = authorization.split(" ")[1]
    
    conn = get_connection()
    cursor = conn.cursor()
    
    # Clean up expired tokens (older than 24 hours) as a side effect
    cursor.execute("DELETE FROM sessions WHERE created_at < ?", (time.time() - 86400,))
    conn.commit()
    
    cursor.execute("""
        SELECT u.id, u.username, u.role 
        FROM sessions s JOIN users u ON s.user_id = u.id 
        WHERE s.token = ?
    """, (token,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
        
    return User(id=row["id"], username=row["username"], role=row["role"])

def require_admin(user: User = Depends(get_current_user)):
    """Dependency to check if current user is admin."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
