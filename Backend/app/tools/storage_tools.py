"""Cloud Storage tools for uploading / downloading images and files.

Used for persisting canvas snapshots, generated images, and student uploads.
"""

from __future__ import annotations

import io
import logging
import uuid
from typing import Any, Dict, Optional

from google.cloud import storage

from app.config import settings

logger = logging.getLogger(__name__)

_client: storage.Client | None = None


def _get_client() -> storage.Client:
    global _client
    if _client is None:
        _client = storage.Client(project=settings.google_cloud_project or None)
    return _client


def _get_bucket() -> storage.Bucket:
    return _get_client().bucket(settings.gcs_bucket)


# ── Upload ────────────────────────────────────────────────────────────────────


def upload_canvas_snapshot(
    user_id: str,
    session_id: str,
    image_bytes_base64: str,
    label: str = "snapshot",
) -> Dict[str, Any]:
    """Upload a base64-encoded canvas snapshot to Cloud Storage.

    Parameters
    ----------
    user_id:  Student identifier.
    session_id:  Current session ID.
    image_bytes_base64:  The image data, base64-encoded.
    label:  A descriptive label (e.g. "final_answer", "step_3").

    Returns
    -------
    dict  with ``gcs_uri`` and ``public_url`` keys.
    """
    import base64

    # Strip optional data-URL prefix (e.g. "data:image/jpeg;base64,")
    if "," in image_bytes_base64:
        image_bytes_base64 = image_bytes_base64.split(",", 1)[1]

    # Strip whitespace that may have been inserted
    image_bytes_base64 = image_bytes_base64.strip()

    # Reject obviously invalid / hallucinated data (real snapshots are large)
    if len(image_bytes_base64) < 100:
        logger.warning(
            "upload_canvas_snapshot: base64 payload too small (%d chars) — "
            "likely not a real image. Skipping upload.",
            len(image_bytes_base64),
        )
        return {
            "status": "error",
            "message": (
                "The image data provided is too small to be a valid canvas "
                "snapshot. This tool should only be called with actual canvas "
                "image data captured from the student's whiteboard."
            ),
        }

    # Pad to a multiple of 4 if needed (some encoders omit trailing '=')
    padding_needed = len(image_bytes_base64) % 4
    if padding_needed:
        image_bytes_base64 += "=" * (4 - padding_needed)

    try:
        image_data = base64.b64decode(image_bytes_base64)
    except Exception as exc:
        logger.warning("upload_canvas_snapshot: invalid base64 — %s", exc)
        return {
            "status": "error",
            "message": (
                "The image data is not valid base64. Please capture a real "
                "canvas snapshot before uploading."
            ),
        }

    blob_name = f"snapshots/{user_id}/{session_id}/{label}_{uuid.uuid4().hex[:8]}.jpeg"

    bucket = _get_bucket()
    blob = bucket.blob(blob_name)
    blob.upload_from_string(image_data, content_type="image/jpeg")

    gcs_uri = f"gs://{settings.gcs_bucket}/{blob_name}"
    logger.info("Uploaded snapshot: %s (%d bytes)", gcs_uri, len(image_data))
    return {
        "status": "ok",
        "gcs_uri": gcs_uri,
        "blob_name": blob_name,
        "size_bytes": len(image_data),
    }


def upload_generated_image(
    user_id: str,
    image_bytes_base64: str,
    filename: str = "generated",
    content_type: str = "image/png",
) -> Dict[str, Any]:
    """Upload an AI-generated image to Cloud Storage.

    Parameters
    ----------
    user_id:  Student identifier.
    image_bytes_base64:  The image data, base64-encoded.
    filename:  Base filename (without extension).
    content_type:  MIME type.
    """
    import base64

    # Strip optional data-URL prefix
    if "," in image_bytes_base64:
        image_bytes_base64 = image_bytes_base64.split(",", 1)[1]

    image_bytes_base64 = image_bytes_base64.strip()

    if len(image_bytes_base64) < 100:
        return {
            "status": "error",
            "message": "The image data is too small to be valid.",
        }

    # Pad to multiple of 4 if needed
    padding_needed = len(image_bytes_base64) % 4
    if padding_needed:
        image_bytes_base64 += "=" * (4 - padding_needed)

    try:
        image_data = base64.b64decode(image_bytes_base64)
    except Exception as exc:
        logger.warning("upload_generated_image: invalid base64 — %s", exc)
        return {
            "status": "error",
            "message": "The image data is not valid base64.",
        }

    ext = content_type.split("/")[-1]
    blob_name = f"generated/{user_id}/{filename}_{uuid.uuid4().hex[:8]}.{ext}"

    bucket = _get_bucket()
    blob = bucket.blob(blob_name)
    blob.upload_from_string(image_data, content_type=content_type)

    gcs_uri = f"gs://{settings.gcs_bucket}/{blob_name}"
    logger.info("Uploaded generated image: %s (%d bytes)", gcs_uri, len(image_data))
    return {
        "status": "ok",
        "gcs_uri": gcs_uri,
        "blob_name": blob_name,
        "size_bytes": len(image_data),
    }


# ── Download / Signed URL ────────────────────────────────────────────────────


def get_signed_url(
    blob_name: str,
    expiration_minutes: int = 60,
) -> Dict[str, Any]:
    """Generate a signed URL for a Cloud Storage object.

    Parameters
    ----------
    blob_name:  Object path inside the bucket.
    expiration_minutes:  How long the URL stays valid.
    """
    import datetime

    bucket = _get_bucket()
    blob = bucket.blob(blob_name)
    url = blob.generate_signed_url(
        expiration=datetime.timedelta(minutes=expiration_minutes),
        method="GET",
    )
    return {"status": "ok", "url": url, "expires_in_minutes": expiration_minutes}


# ── List objects ──────────────────────────────────────────────────────────────


def list_session_snapshots(
    user_id: str,
    session_id: str,
) -> Dict[str, Any]:
    """List all canvas snapshots for a session.

    Parameters
    ----------
    user_id:  Student identifier.
    session_id:  Session ID.
    """
    prefix = f"snapshots/{user_id}/{session_id}/"
    bucket = _get_bucket()
    blobs = list(bucket.list_blobs(prefix=prefix))
    items = [
        {"name": b.name, "size": b.size, "updated": b.updated.isoformat() if b.updated else None}
        for b in blobs
    ]
    return {"status": "ok", "snapshots": items, "count": len(items)}


# ── Export ────────────────────────────────────────────────────────────────────

storage_tools = [
    upload_canvas_snapshot,
    upload_generated_image,
    get_signed_url,
    list_session_snapshots,
]
