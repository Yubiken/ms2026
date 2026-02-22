# list_users.py
from app.database import SessionLocal
from app.models import User

# utworzenie sesji do bazy
db = SessionLocal()

# pobranie wszystkich użytkowników
users = db.query(User).all()
    
if not users:
    print("Brak użytkowników w bazie.")
else:
    for u in users:
        print(f"ID: {u.id}, Email: {u.email}, Password Hash: {u.password_hash}")