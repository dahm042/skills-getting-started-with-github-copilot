"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""


from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path
from pymongo import MongoClient

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")


# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")


# MongoDB setup
MONGO_URL = "mongodb://localhost:27017"
client = MongoClient(MONGO_URL)
db = client["mergington_high"]
activities_collection = db["activities"]

# Initial activities data
initial_activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 18,
        "participants": ["alex@mergington.edu", "lucas@mergington.edu"]
    },
    "Basketball Club": {
        "description": "Practice basketball skills and play friendly games",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["mia@mergington.edu", "noah@mergington.edu"]
    },
    "Art Workshop": {
        "description": "Explore painting, drawing, and sculpture techniques",
        "schedule": "Mondays, 4:00 PM - 5:30 PM",
        "max_participants": 16,
        "participants": ["ava@mergington.edu", "liam@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce school plays and performances",
        "schedule": "Tuesdays, 3:30 PM - 5:00 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "jack@mergington.edu"]
    },
    "Math Olympiad": {
        "description": "Prepare for math competitions and solve challenging problems",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 10,
        "participants": ["ethan@mergington.edu", "grace@mergington.edu"]
    },
    "Science Club": {
        "description": "Conduct experiments and explore scientific concepts",
        "schedule": "Wednesdays, 3:30 PM - 5:00 PM",
        "max_participants": 14,
        "participants": ["chloe@mergington.edu", "ben@mergington.edu"]
    }
}

# Pre-populate database if empty
if activities_collection.count_documents({}) == 0:
    for name, details in initial_activities.items():
        activities_collection.insert_one({"_id": name, **details})


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    activities = {}
    for doc in activities_collection.find():
        name = doc["_id"]
        details = doc.copy()
        details.pop("_id")
        activities[name] = details
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    activity = activities_collection.find_one({"_id": activity_name})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student already signed up for this activity")
    activities_collection.update_one({"_id": activity_name}, {"$push": {"participants": email}})
    return {"message": f"Signed up {email} for {activity_name}"}


# Unregister endpoint
@app.post("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Remove a student from an activity"""
    activity = activities_collection.find_one({"_id": activity_name})
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student not registered for this activity")
    activities_collection.update_one({"_id": activity_name}, {"$pull": {"participants": email}})
    return {"message": f"Unregistered {email} from {activity_name}"}
