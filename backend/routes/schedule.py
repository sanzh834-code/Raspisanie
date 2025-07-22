from fastapi import APIRouter, HTTPException, Depends
from typing import List
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.schedule import Schedule, ScheduleCreate, ScheduleUpdate, Subject, SubjectCreate, SchoolClass, SchoolClassCreate
from models.auth import User
from routes.auth import get_admin_user
from database import get_database
import uuid
from datetime import datetime

router = APIRouter()

# Subject routes - Protected
@router.post("/subjects", response_model=Subject)
async def create_subject(
    subject: SubjectCreate, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: User = Depends(get_admin_user)
):
    subject_dict = subject.dict()
    subject_obj = Subject(**subject_dict)
    result = await db.subjects.insert_one(subject_obj.dict())
    return subject_obj

@router.get("/subjects", response_model=List[Subject])
async def get_subjects(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get subjects - public endpoint"""
    subjects = await db.subjects.find().to_list(1000)
    return [Subject(**subject) for subject in subjects]

@router.delete("/subjects/{subject_id}")
async def delete_subject(
    subject_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: User = Depends(get_admin_user)
):
    result = await db.subjects.delete_one({"id": subject_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}

# Schedule routes
@router.post("/schedules", response_model=Schedule)
async def create_schedule(
    schedule_data: ScheduleCreate, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: User = Depends(get_admin_user)
):
    """Create schedule - admin only"""
    # Check if schedule already exists for this class
    existing = await db.schedules.find_one({"grade": schedule_data.grade, "letter": schedule_data.letter})
    if existing:
        raise HTTPException(status_code=400, detail="Schedule already exists for this class")
    
    class_id = f"{schedule_data.grade}{schedule_data.letter}"
    schedule_dict = schedule_data.dict()
    schedule_obj = Schedule(class_id=class_id, **schedule_dict)
    
    result = await db.schedules.insert_one(schedule_obj.dict())
    return schedule_obj

@router.get("/schedules", response_model=List[Schedule])
async def get_all_schedules(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get all schedules - public endpoint"""
    schedules = await db.schedules.find().to_list(1000)
    return [Schedule(**schedule) for schedule in schedules]

@router.get("/schedules/{grade}/{letter}", response_model=Schedule)
async def get_schedule(grade: int, letter: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get specific schedule - public endpoint"""
    schedule = await db.schedules.find_one({"grade": grade, "letter": letter})
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return Schedule(**schedule)

@router.put("/schedules/{grade}/{letter}", response_model=Schedule)
async def update_schedule(
    grade: int, 
    letter: str, 
    schedule_update: ScheduleUpdate, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: User = Depends(get_admin_user)
):
    """Update schedule - admin only"""
    update_data = schedule_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.schedules.update_one(
        {"grade": grade, "letter": letter},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    updated_schedule = await db.schedules.find_one({"grade": grade, "letter": letter})
    return Schedule(**updated_schedule)

@router.delete("/schedules/{grade}/{letter}")
async def delete_schedule(
    grade: int, 
    letter: str, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: User = Depends(get_admin_user)
):
    """Delete schedule - admin only"""
    result = await db.schedules.delete_one({"grade": grade, "letter": letter})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}

# Utility routes
@router.get("/classes")
async def get_all_classes(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Get all classes that have schedules - public endpoint"""
    schedules = await db.schedules.find().to_list(1000)
    classes = []
    for schedule in schedules:
        classes.append({
            "grade": schedule["grade"],
            "letter": schedule["letter"],
            "class_id": schedule["class_id"],
            "last_updated": schedule.get("updated_at", schedule.get("created_at"))
        })
    return classes

@router.post("/schedules/bulk")
async def create_bulk_schedules(
    schedules: List[ScheduleCreate], 
    db: AsyncIOMotorDatabase = Depends(get_database),
    admin_user: User = Depends(get_admin_user)
):
    """Create multiple schedules at once - admin only"""
    created_schedules = []
    
    for schedule_data in schedules:
        # Check if schedule already exists
        existing = await db.schedules.find_one({"grade": schedule_data.grade, "letter": schedule_data.letter})
        if existing:
            continue  # Skip existing schedules
        
        class_id = f"{schedule_data.grade}{schedule_data.letter}"
        schedule_dict = schedule_data.dict()
        schedule_obj = Schedule(class_id=class_id, **schedule_dict)
        
        await db.schedules.insert_one(schedule_obj.dict())
        created_schedules.append(schedule_obj)
    
    return {"created": len(created_schedules), "schedules": created_schedules}