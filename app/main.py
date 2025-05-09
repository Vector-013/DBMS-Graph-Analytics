from fastapi import FastAPI
from app.db.neo4j_connection import get_db

from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.initial_conn import start_up

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the LastFM Graph Analytics API!"}
