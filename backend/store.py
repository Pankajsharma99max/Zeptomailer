"""
Shared store for uploaded data — with file-based persistence.

Saves CSV and template bytes to disk so they survive page refreshes
and (on Render) container restarts within the same deploy.
"""

import io
import os
import json
import logging
from typing import List, Optional
from models import Recipient

logger = logging.getLogger(__name__)

# Persistent storage directory — /tmp survives within a single Render deploy
DATA_DIR = os.environ.get("CERTFLOW_DATA_DIR", "/tmp/certflow_data")


class Store:
    """Global store for CSV and template data, backed by disk."""

    def __init__(self):
        self.csv_bytes: bytes = b""
        self.template_bytes: bytes = b""
        self.recipients: List[Recipient] = []
        self.last_sent_count: int = 0
        self.history: List[dict] = []
        self._ensure_dir()

    def _ensure_dir(self):
        os.makedirs(DATA_DIR, exist_ok=True)

    def _csv_path(self) -> str:
        return os.path.join(DATA_DIR, "uploaded.csv")

    def _template_path(self) -> str:
        return os.path.join(DATA_DIR, "template.img")

    def _recipients_path(self) -> str:
        return os.path.join(DATA_DIR, "recipients.json")

    def _progress_path(self) -> str:
        return os.path.join(DATA_DIR, "progress.json")

    def _history_path(self) -> str:
        return os.path.join(DATA_DIR, "history.json")

    # ---- Save to disk ----

    def save_csv(self):
        """Persist CSV bytes and parsed recipients to disk."""
        try:
            self._ensure_dir()
            with open(self._csv_path(), "wb") as f:
                f.write(self.csv_bytes)
            # Also save parsed recipients as JSON
            data = [{"name": r.name, "email": r.email} for r in self.recipients]
            with open(self._recipients_path(), "w", encoding="utf-8") as f:
                json.dump(data, f)
            logger.info("CSV saved to disk (%d bytes, %d recipients)", len(self.csv_bytes), len(self.recipients))
        except Exception as e:
            logger.error("Failed to save CSV to disk: %s", e)

    def save_template(self):
        """Persist template image bytes to disk."""
        try:
            self._ensure_dir()
            with open(self._template_path(), "wb") as f:
                f.write(self.template_bytes)
            logger.info("Template saved to disk (%d bytes)", len(self.template_bytes))
        except Exception as e:
            logger.error("Failed to save template to disk: %s", e)

    def save_progress(self, sent: int):
        """Persist the number of sent emails to resume later."""
        try:
            self._ensure_dir()
            with open(self._progress_path(), "w", encoding="utf-8") as f:
                json.dump({"last_sent_count": sent}, f)
            self.last_sent_count = sent
        except Exception as e:
            logger.error("Failed to save progress to disk: %s", e)

    def save_history(self):
        """Persist the campaign history to disk."""
        try:
            self._ensure_dir()
            with open(self._history_path(), "w", encoding="utf-8") as f:
                json.dump(self.history, f)
        except Exception as e:
            logger.error("Failed to save history to disk: %s", e)

    def add_history_record(self, record: dict):
        """Add a new campaign record and save to disk."""
        self.history.insert(0, record)  # Newest first
        self.save_history()

    def clear_history(self):
        """Clear all campaign history records and save."""
        self.history = []
        self.save_history()

    # ---- Load from disk ----

    def load_from_disk(self):
        """Reload CSV and template from disk if they exist."""
        loaded = []
        try:
            csv_path = self._csv_path()
            if os.path.exists(csv_path):
                with open(csv_path, "rb") as f:
                    self.csv_bytes = f.read()
                loaded.append("csv")

            recipients_path = self._recipients_path()
            if os.path.exists(recipients_path):
                with open(recipients_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.recipients = [Recipient(name=r["name"], email=r["email"]) for r in data]
                loaded.append(f"recipients({len(self.recipients)})")

            template_path = self._template_path()
            if os.path.exists(template_path):
                with open(template_path, "rb") as f:
                    self.template_bytes = f.read()
                loaded.append("template")

            progress_path = self._progress_path()
            if os.path.exists(progress_path):
                with open(progress_path, "r", encoding="utf-8") as f:
                    p_data = json.load(f)
                self.last_sent_count = p_data.get("last_sent_count", 0)
                loaded.append("progress")

            history_path = self._history_path()
            if os.path.exists(history_path):
                with open(history_path, "r", encoding="utf-8") as f:
                    self.history = json.load(f)
                loaded.append(f"history({len(self.history)})")

            if loaded:
                logger.info("Restored from disk: %s", ", ".join(loaded))
            else:
                logger.info("No persisted data found on disk.")
        except Exception as e:
            logger.error("Failed to load from disk: %s", e)

    # ---- Status helpers ----

    def get_status(self) -> dict:
        """Return a status dict for the /api/status endpoint."""
        status = {
            "template_loaded": bool(self.template_bytes),
            "template_size_bytes": len(self.template_bytes),
            "csv_loaded": bool(self.csv_bytes),
            "recipient_count": len(self.recipients),
            "last_sent_count": getattr(self, "last_sent_count", 0),
            "recipients_sample": [
                {"name": r.name, "email": r.email}
                for r in self.recipients[:5]
            ],
        }
        # Get template dimensions if loaded
        if self.template_bytes:
            try:
                from PIL import Image
                img = Image.open(io.BytesIO(self.template_bytes))
                status["template_width"] = img.size[0]
                status["template_height"] = img.size[1]
            except Exception:
                pass
        return status


store = Store()
