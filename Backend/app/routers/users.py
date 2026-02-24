from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.auth.dependencies import get_current_user
from app.db import get_users_ref
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_profile(user: dict = Depends(get_current_user)):
    """
    Get the current user's profile from Firestore based on the Firebase token.
    """
    users_ref = get_users_ref()
    if not users_ref:
        raise HTTPException(status_code=500, detail="Database connection not available")

    uid = user["uid"]
    doc_ref = users_ref.document(uid)
    doc = doc_ref.get()

    if doc.exists:
        profile_data = doc.to_dict()
        return {
            "uid": uid,
            "metadata": profile_data
        }
    
    # If the user is in Firebase Auth but not in our Firestore yet, return the basic token info
    return {"uid": uid, "metadata": {"name": user.get("name"), "email": user.get("email")}}

@router.post("/sync", response_model=Dict[str, Any])
async def sync_user(user: dict = Depends(get_current_user)):
    """
    Ensure the user document exists in Firestore.
    The frontend should hit this endpoint exactly once after successful login/signup.
    """
    users_ref = get_users_ref()
    if not users_ref:
        raise HTTPException(status_code=500, detail="Database connection not available")

    uid = user["uid"]
    doc_ref = users_ref.document(uid)
    doc = doc_ref.get()

    now = datetime.utcnow().isoformat()
    
    if not doc.exists:
        logger.info(f"Creating new user profile for {uid}")
        new_data = {
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
            "created_at": now,
            "last_login": now,
            "preferences": {}
        }
        doc_ref.set(new_data)
        return {"status": "created", "data": new_data}
    else:
        logger.info(f"Updating last_login for {uid}")
        update_data = {
            "last_login": now,
            "name": user.get("name", doc.to_dict().get("name")), 
            "picture": user.get("picture", doc.to_dict().get("picture"))
        }
        # Update without overwriting things like preferences
        doc_ref.set(update_data, merge=True)
        return {"status": "updated", "data": update_data}
