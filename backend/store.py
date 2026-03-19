"""
Shared in-memory store for uploaded data.

Using a class ensures all modules reference the same mutable object,
avoiding the Python "import copies the value" bug with module-level variables.
"""

from typing import List, Optional
from models import Recipient


class Store:
    """Global in-memory store for CSV and template data."""

    def __init__(self):
        self.csv_bytes: bytes = b""
        self.template_bytes: bytes = b""
        self.recipients: List[Recipient] = []


store = Store()
