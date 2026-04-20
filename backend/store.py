"""
Shared store for uploaded data — with file-based persistence.

Now handles multi-tenant draft state by user_id and persistent
campaign state by campaign_id.
"""

import os
import json
import logging
import shutil
import re
from typing import List, Optional, Tuple
from models import Recipient

logger = logging.getLogger(__name__)

# Persistent storage directory
DATA_DIR = os.environ.get("CERTFLOW_DATA_DIR", "/tmp/certflow_data")


class Store:
    """Manager for user drafts and active campaigns backed by disk."""

    def __init__(self):
        self._ensure_dir(DATA_DIR)

    def _ensure_dir(self, path: str):
        os.makedirs(path, exist_ok=True)

    def _safe_id(self, id_str: str) -> str:
        """Validate ID to prevent path traversal."""
        if not re.match(r"^[a-zA-Z0-9\-_]+$", id_str):
            raise ValueError("Invalid ID format")
        return id_str

    def get_draft_dir(self, user_id: str) -> str:
        user_id = self._safe_id(user_id)
        d = os.path.join(DATA_DIR, "drafts", user_id)

        self._ensure_dir(d)
        return d

    def get_campaign_dir(self, campaign_id: str) -> str:
        campaign_id = self._safe_id(campaign_id)
        d = os.path.join(DATA_DIR, "campaigns", campaign_id)

        self._ensure_dir(d)
        return d

    # ---- Draft Methods ----

    def save_draft_csv(self, user_id: str, csv_bytes: bytes, recipients: List[Recipient]):
        d = self.get_draft_dir(user_id)
        with open(os.path.join(d, "uploaded.csv"), "wb") as f:
            f.write(csv_bytes)
        data = [{"name": r.name, "email": r.email} for r in recipients]
        with open(os.path.join(d, "recipients.json"), "w", encoding="utf-8") as f:
            json.dump(data, f)
        logger.info(f"Saved draft CSV for user {user_id} ({len(recipients)} recipients)")

    def save_draft_template(self, user_id: str, template_bytes_list: List[bytes]):
        d = self.get_draft_dir(user_id)
        # Clear existing templates
        for fname in os.listdir(d):
            if fname.startswith("template") and fname.endswith(".img"):
                os.remove(os.path.join(d, fname))
                
        for i, t_bytes in enumerate(template_bytes_list):
            with open(os.path.join(d, f"template_{i}.img"), "wb") as f:
                f.write(t_bytes)
        logger.info(f"Saved {len(template_bytes_list)} draft templates for user {user_id}")

    def get_draft_state(self, user_id: str) -> dict:
        d = self.get_draft_dir(user_id)
        
        t_count = 0
        while os.path.exists(os.path.join(d, f"template_{t_count}.img")):
            t_count += 1
            
        has_old = os.path.exists(os.path.join(d, "template.img"))
        if t_count == 0 and has_old:
            t_count = 1

        state = {
            "template_loaded": t_count > 0,
            "template_count": t_count,
            "template_size_bytes": 0,
            "csv_loaded": os.path.exists(os.path.join(d, "uploaded.csv")),
            "recipient_count": 0,
            "last_sent_count": 0, # Drafts haven't been sent
            "recipients_sample": []
        }
        
        if state["template_loaded"]:
            try:
                from PIL import Image
                import io
                first_path = os.path.join(d, "template_0.img")
                if not os.path.exists(first_path):
                    first_path = os.path.join(d, "template.img")
                state["template_size_bytes"] = os.path.getsize(first_path)
                with open(first_path, "rb") as f:
                    img = Image.open(io.BytesIO(f.read()))
                    state["template_width"] = img.size[0]
                    state["template_height"] = img.size[1]
            except Exception:
                pass

        r_path = os.path.join(d, "recipients.json")
        if os.path.exists(r_path):
            with open(r_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                state["recipient_count"] = len(data)
                state["recipients_sample"] = data[:5]
        return state

    def get_draft_data(self, user_id: str) -> Tuple[List[bytes], List[Recipient]]:
        d = self.get_draft_dir(user_id)
        template_bytes_list = []
        
        i = 0
        while os.path.exists(os.path.join(d, f"template_{i}.img")):
            with open(os.path.join(d, f"template_{i}.img"), "rb") as f:
                template_bytes_list.append(f.read())
            i += 1
            
        if not template_bytes_list and os.path.exists(os.path.join(d, "template.img")):
            with open(os.path.join(d, "template.img"), "rb") as f:
                template_bytes_list.append(f.read())

        recipients = []
        r_path = os.path.join(d, "recipients.json")
        if os.path.exists(r_path):
            with open(r_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                recipients = [Recipient(name=r["name"], email=r["email"]) for r in data]

        return template_bytes_list, recipients

    def load_from_disk(self):
        """Legacy compatibility method for startup."""
        pass

    # ---- Campaign Methods ----

    def promote_draft_to_campaign(self, user_id: str, campaign_id: str):
        """Copy draft sandbox to the persistent campaign sandbox."""
        draft_dir = self.get_draft_dir(user_id)
        camp_dir = self.get_campaign_dir(campaign_id)
        if os.path.exists(draft_dir):
            shutil.copytree(draft_dir, camp_dir, dirs_exist_ok=True)
            logger.info(f"Promoted draft {user_id} -> campaign {campaign_id}")

    def get_campaign_data(self, campaign_id: str) -> Tuple[List[bytes], List[Recipient]]:
        d = self.get_campaign_dir(campaign_id)
        template_bytes_list = []
        
        i = 0
        while os.path.exists(os.path.join(d, f"template_{i}.img")):
            with open(os.path.join(d, f"template_{i}.img"), "rb") as f:
                template_bytes_list.append(f.read())
            i += 1
            
        if not template_bytes_list and os.path.exists(os.path.join(d, "template.img")):
            with open(os.path.join(d, "template.img"), "rb") as f:
                template_bytes_list.append(f.read())

        recipients = []
        r_path = os.path.join(d, "recipients.json")
        if os.path.exists(r_path):
            with open(r_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                recipients = [Recipient(name=r["name"], email=r["email"]) for r in data]

        return template_bytes_list, recipients

    def save_campaign_failed_recipients(self, campaign_id: str, failed_list: List[dict]):
        """Save failed recipients to a JSON file in the campaign directory."""
        camp_dir = self.get_campaign_dir(campaign_id)
        path = os.path.join(camp_dir, "failed_recipients.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(failed_list, f)
        logger.info(f"Saved {len(failed_list)} failed recipients for campaign {campaign_id}")

    def get_campaign_failed_recipients(self, campaign_id: str) -> List[Recipient]:
        """Load failed recipients from the campaign directory."""
        camp_dir = self.get_campaign_dir(campaign_id)
        path = os.path.join(camp_dir, "failed_recipients.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [Recipient(name=r["name"], email=r["email"]) for r in data]
        return []

store = Store()
