from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User
from dotenv import load_dotenv
import os

load_dotenv()

async def init_db():
    # your MongoDB connection string
    MONGO_URI = os.getenv("MONGO_URI")

    client = AsyncIOMotorClient(MONGO_URI)

    await init_beanie(
        database=client["ada_hek"],
        document_models=[
            User,
        ]
    )
