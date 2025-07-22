from motor.motor_asyncio import AsyncIOMotorClient
import os

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ.get('DB_NAME', 'school_schedule')]

async def get_database():
    return db