from beanie import Document
from pydantic import BaseModel, EmailStr

class User(Document):
    name: str
    age: int
    email: str

    class Settings:
        name = "users"  # MongoDB collection name
