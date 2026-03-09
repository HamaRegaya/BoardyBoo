import os
import firebase_admin
from firebase_admin import credentials, firestore
import logging

from app.config import settings

logger = logging.getLogger(__name__)

# Try to get the path to the service account JSON file from the environment
CREDENTIALS_PATH = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")

def initialize_firebase():
    """Initialize the Firebase Admin SDK."""
    if not firebase_admin._apps:
        try:
            if CREDENTIALS_PATH and os.path.exists(CREDENTIALS_PATH):
                logger.info(f"Initializing Firebase with credentials from {CREDENTIALS_PATH}")
                cred = credentials.Certificate(CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
            else:
                logger.warning("Initializing Firebase with default (Application Default Credentials).")
                options = {}
                if settings.firebase_project_id:
                    options["projectId"] = settings.firebase_project_id
                try:
                    firebase_admin.initialize_app(options=options if options else None)
                except ValueError as e:
                    logger.error("Failed to initialize Firebase Admin SDK. Did you set FIREBASE_SERVICE_ACCOUNT_PATH? Error: %s", e)
        except Exception as e:
            logger.error("Error initializing Firebase: %s", e)
            raise e

# Initialize immediately when this module is imported
try:
    initialize_firebase()
except Exception as e:
    logger.error("Error calling initialize_firebase: %s", e)

def get_db():
    """Get the Firestore client."""
    try:
        return firestore.client()
    except Exception as e:
        logger.error("Firestore client not available: %s", e)
        return None

# Collection references helpers
def get_users_ref():
    db = get_db()
    return db.collection("users") if db else None

def get_sessions_ref():
    db = get_db()
    return db.collection("sessions") if db else None

def get_whiteboards_ref():
    db = get_db()
    return db.collection("whiteboards") if db else None
