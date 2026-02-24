from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.auth.dependencies import get_current_user
from app.db import get_sessions_ref, get_whiteboards_ref
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)

@router.get("/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    """
    Get high-level statistics for the dashboard.
    """
    sessions_ref = get_sessions_ref()
    if not sessions_ref:
        return {"total_sessions": 0, "total_hours": 0}

    uid = user["uid"]
    
    try:
        # Example query: count all sessions for this user
        # Requires composite index if sorting or strict filtering is added later
        sessions = sessions_ref.where("user_id", "==", uid).get()
        
        total_sessions = len(sessions)
        total_duration_minutes = 0
        
        for doc in sessions:
            data = doc.to_dict()
            total_duration_minutes += data.get("duration_minutes", 0)
            
        return {
            "total_sessions": total_sessions,
            "total_hours": round(total_duration_minutes / 60, 1)
        }
    except Exception as e:
        logger.error("Error fetching stats: %s", e)
        # Return fallback zeros instead of hard failing so dashboard doesn't crash completely
        return {"total_sessions": 0, "total_hours": 0}

@router.get("/sessions", response_model=List[Dict[str, Any]])
async def get_user_sessions(limit: int = 10, user: dict = Depends(get_current_user)):
    """
    List past tutoring sessions.
    """
    sessions_ref = get_sessions_ref()
    if not sessions_ref:
        return []

    uid = user["uid"]
    
    try:
        # Sort by creation date descending
        query = sessions_ref.where("user_id", "==", uid)\
                            .order_by("created_at", direction="DESCENDING")\
                            .limit(limit)
        
        results = []
        for doc in query.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
            
        return results
    except Exception as e:
        logger.error("Error fetching sessions: %s", e)
        return []

@router.get("/whiteboards", response_model=List[Dict[str, Any]])
async def get_saved_whiteboards(limit: int = 20, user: dict = Depends(get_current_user)):
    """
    List saved whiteboard snapshots from previous sessions.
    """
    whiteboards_ref = get_whiteboards_ref()
    if not whiteboards_ref:
        return []

    uid = user["uid"]
    
    try:
        query = whiteboards_ref.where("user_id", "==", uid)\
                               .order_by("created_at", direction="DESCENDING")\
                               .limit(limit)
        
        results = []
        for doc in query.stream():
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)
            
        return results
    except Exception as e:
        logger.error("Error fetching whiteboards: %s", e)
        return []
