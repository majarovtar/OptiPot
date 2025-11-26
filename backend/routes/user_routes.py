from fastapi import APIRouter, HTTPException
from controllers.user_controller import create_user, get_user, get_all_users, delete_user
from models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/")
async def create_user_route(user: User):
    new_user = await create_user(user.dict())
    return new_user

@router.get("/")
async def get_all_users_route():
    return await get_all_users()

@router.get("/{user_id}")
async def get_user_route(user_id: str):
    user = await get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}")
async def delete_user_route(user_id: str):
    deleted = await delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}
