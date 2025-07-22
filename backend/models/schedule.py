from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid

# Subject Model
class Subject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_kz: str  # Kazakh name
    name_ru: str  # Russian name
    color: str = "gray"  # Color for UI
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubjectCreate(BaseModel):
    name_kz: str
    name_ru: str
    color: str = "gray"

# Class Model
class SchoolClass(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    grade: int  # 1-11
    letter: str  # А, Ә, Б, В
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SchoolClassCreate(BaseModel):
    grade: int
    letter: str

# Schedule Models
class DailySchedule(BaseModel):
    monday: List[str] = []
    tuesday: List[str] = []
    wednesday: List[str] = []
    thursday: List[str] = []
    friday: List[str] = []

class Schedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    class_id: str  # Reference to SchoolClass
    grade: int
    letter: str
    schedule: DailySchedule
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ScheduleCreate(BaseModel):
    grade: int
    letter: str
    schedule: DailySchedule

class ScheduleUpdate(BaseModel):
    schedule: DailySchedule