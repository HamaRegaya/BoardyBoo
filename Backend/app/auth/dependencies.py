from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging
import time

logger = logging.getLogger(__name__)

# use HTTPBearer to extract the Bearer token from the Authorization header
security = HTTPBearer()

def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify the Firebase ID Token from the Authorization header.
    Returns the decoded token (which contains user info like uid, email, etc.).
    """
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        # Handle clock skew: retry once after a brief pause
        if "too early" in str(e).lower():
            time.sleep(2)
            try:
                decoded_token = auth.verify_id_token(token)
                return decoded_token
            except Exception as e2:
                logger.error("Error verifying Firebase ID token (retry): %s", e2)
        else:
            logger.error("Error verifying Firebase ID token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(decoded_token: dict = Depends(verify_firebase_token)):
    """
    Dependency to get the current authenticated user's uid.
    Can be expanded to fetch full user profile from Firestore if needed.
    """
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain user ID",
        )
    
    # Return a basic user object. You could fetch more from Firestore if needed here, 
    # but returning the decoded token info is often enough for identity verification.
    return {
        "uid": uid,
        "email": decoded_token.get("email"),
        "name": decoded_token.get("name"),
        "picture": decoded_token.get("picture"),
    }
