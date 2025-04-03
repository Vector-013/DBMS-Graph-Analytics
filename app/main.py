from fastapi import FastAPI
from app.db.neo4j_connection import get_db

from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router

app = FastAPI()

# Allow all origins for now; restrict later in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the LastFM Graph Analytics API!"}
