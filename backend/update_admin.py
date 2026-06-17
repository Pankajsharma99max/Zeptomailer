import sys
import os
from config import get_settings
from database import get_connection
from auth import hash_password

settings = get_settings()
conn = get_connection()
cursor = conn.cursor()

admin_username = settings.ADMIN_EMAIL
admin_pw = settings.APP_PASSWORD
hashed = hash_password(admin_pw)

cursor.execute("UPDATE users SET username = ?, password_hash = ? WHERE role = 'admin'",
                (admin_username, hashed))
conn.commit()
conn.close()
print(f"Updated admin credentials in DB: {admin_username} / {admin_pw}")
