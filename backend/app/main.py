from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from .routes import users, predictions
from app.routes import matches
from app.routes import admin

Base.metadata.create_all(bind=engine)
print("Database connected and tables ready")

app = FastAPI(
    title="MS 2026 Predictor API",
    description="API do typowania wyników MŚ 2026",
    version="1.0.0",
    openapi_tags=[
        {"name": "Users", "description": "Operacje związane z użytkownikami"},
        {"name": "Predictions", "description": "Typy użytkowników"}
    ]
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ms2026.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "Backend działa 🚀"}
    
app.include_router(users.router)
app.include_router(predictions.router)
app.include_router(matches.router)
app.include_router(admin.router)

@app.get("/health")
def health():
    return {"status": "ok"}