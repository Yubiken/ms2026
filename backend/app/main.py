from fastapi import FastAPI
from .database import Base, engine
from .routes import users, predictions
from app.routes import matches
from app.routes import admin

Base.metadata.create_all(bind=engine)
print("Tabele utworzone w bazie app.db")

app = FastAPI(
    title="MS 2026 Predictor API",
    description="API do typowania wyników MŚ 2026",
    version="1.0.0",
    openapi_tags=[
        {"name": "Users", "description": "Operacje związane z użytkownikami"},
        {"name": "Predictions", "description": "Typy użytkowników"}
    ]
)

app.include_router(users.router)
app.include_router(predictions.router)
app.include_router(matches.router)
app.include_router(admin.router)