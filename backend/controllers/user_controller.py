from models.user import User

async def create_user(user_data: dict):
    user = User(**user_data)
    await user.insert()
    return user

async def get_all_users():
    return await User.find_all().to_list()

async def get_user(user_id: str):
    return await User.get(user_id)

async def delete_user(user_id: str):
    user = await User.get(user_id)
    if user:
        await user.delete()
        return True
    return False
