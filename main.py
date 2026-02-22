from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "MS 2026 Predictor działa 🚀"}