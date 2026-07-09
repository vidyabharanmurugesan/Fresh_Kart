"""
Google Sheets Service — Logs login/signup events to a Google Sheet.

Supports THREE logging methods (all run in background threads):

1. **Google Sheets API** (direct) — requires a Service Account JSON key.
   Set GOOGLE_SHEETS_CREDENTIALS_PATH and GOOGLE_SHEETS_SPREADSHEET_ID.

2. **Google Sheets API with API Key** — uses API key for appending rows
   via the Sheets API v4 REST endpoint. Requires the sheet to be shared
   with "Anyone with the link" as Editor.
   Set GOOGLE_SHEETS_API_KEY and GOOGLE_SHEETS_SPREADSHEET_ID.

3. **Local CSV** — always active as a fallback backup log.
"""

import os
import csv
import json
import threading
from datetime import datetime

# Lazy-loaded globals for service account method
_gc = None
_sheet = None
_init_lock = threading.Lock()
_initialized = False

HEADER_ROW = [
    "Timestamp",
    "Event Type",
    "User ID",
    "Name",
    "Email",
    "Role",
    "Phone",
    "IP Address",
    "Status",
    "Failure Reason",
]

# ── CSV Backup Path ──
_CSV_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "database"))
_CSV_PATH = os.path.join(_CSV_DIR, "login_events.csv")
_csv_lock = threading.Lock()


def _ensure_csv_header():
    """Create CSV file with header if it doesn't exist."""
    os.makedirs(_CSV_DIR, exist_ok=True)
    if not os.path.exists(_CSV_PATH):
        with open(_CSV_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(HEADER_ROW)
        print(f"[CSV Logger] Created login events log: {_CSV_PATH}")


def _log_to_csv(row_data):
    """Append a row to the local CSV file (thread-safe)."""
    try:
        _ensure_csv_header()
        with _csv_lock:
            with open(_CSV_PATH, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(row_data)
    except Exception as e:
        print(f"[CSV Logger ERROR] Failed to write: {e}")


# ── Method 1: Service Account (gspread) ──

def _get_sheet():
    """Lazy-initialize the Google Sheets connection via service account (thread-safe)."""
    global _gc, _sheet, _initialized

    if _initialized:
        return _sheet

    with _init_lock:
        if _initialized:
            return _sheet

        try:
            import gspread
            from google.oauth2.service_account import Credentials

            creds_path = os.getenv("GOOGLE_SHEETS_CREDENTIALS_PATH")
            spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")

            if not creds_path or not spreadsheet_id:
                _initialized = True
                return None

            # Resolve relative path from project root
            if not os.path.isabs(creds_path):
                project_root = os.path.abspath(
                    os.path.join(os.path.dirname(__file__), "..", "..")
                )
                creds_path = os.path.join(project_root, creds_path)

            if not os.path.exists(creds_path):
                print(
                    f"[Google Sheets] Service account file not found: {creds_path}"
                )
                _initialized = True
                return None

            scopes = [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive",
            ]
            credentials = Credentials.from_service_account_file(creds_path, scopes=scopes)
            _gc = gspread.authorize(credentials)
            _sheet = _gc.open_by_key(spreadsheet_id).sheet1

            # Auto-create header row if the sheet is empty
            existing = _sheet.row_values(1)
            if not existing or existing[0] != HEADER_ROW[0]:
                _sheet.insert_row(HEADER_ROW, index=1)
                print("[Google Sheets] Header row created.")

            _initialized = True
            print(f"[Google Sheets] Connected via Service Account to: {spreadsheet_id}")
            return _sheet

        except Exception as e:
            print(f"[Google Sheets] Service account init failed: {e}")
            _initialized = True
            return None


def _append_via_service_account(row_data):
    """Append a row using gspread service account."""
    try:
        sheet = _get_sheet()
        if sheet is None:
            return False
        sheet.append_row(row_data, value_input_option="USER_ENTERED")
        return True
    except Exception as e:
        print(f"[Google Sheets SA ERROR] {e}")
        return False


# ── Method 2: API Key (REST) ──

def _append_via_api_key(row_data):
    """Append a row using Google Sheets API v4 REST endpoint with API key.
    
    Requires the spreadsheet to be shared as 'Anyone with the link → Editor'.
    """
    import urllib.request
    import urllib.parse

    api_key = os.getenv("GOOGLE_SHEETS_API_KEY")
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")

    if not api_key or not spreadsheet_id:
        return False

    try:
        url = (
            f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}"
            f"/values/Sheet1!A:J:append"
            f"?valueInputOption=USER_ENTERED"
            f"&insertDataOption=INSERT_ROWS"
            f"&key={api_key}"
        )

        body = json.dumps({
            "values": [row_data]
        }).encode("utf-8")

        req = urllib.request.Request(url, data=body, method="POST")
        req.add_header("Content-Type", "application/json")

        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                print(f"[Google Sheets API Key] Row appended successfully.")
                return True
            else:
                print(f"[Google Sheets API Key] HTTP {response.status}")
                return False

    except Exception as e:
        print(f"[Google Sheets API Key ERROR] {e}")
        return False


# ── Main Entry Point ──

def _log_background(row_data):
    """Try all methods to log the event (runs in background thread)."""
    # Always log to local CSV as backup
    _log_to_csv(row_data)

    # Try Service Account first (most reliable for private sheets)
    creds_path = os.getenv("GOOGLE_SHEETS_CREDENTIALS_PATH")
    if creds_path:
        # Resolve relative path
        if not os.path.isabs(creds_path):
            project_root = os.path.abspath(
                os.path.join(os.path.dirname(__file__), "..", "..")
            )
            creds_path = os.path.join(project_root, creds_path)
        if os.path.exists(creds_path):
            if _append_via_service_account(row_data):
                return

    # Fallback to API Key method
    if os.getenv("GOOGLE_SHEETS_API_KEY"):
        if _append_via_api_key(row_data):
            return

    print("[Google Sheets] No online method available. Data saved to CSV only.")


def log_login_event(
    event_type,
    status="success",
    user=None,
    email=None,
    role=None,
    ip_address=None,
    failure_reason="",
):
    """
    Log a login/signup event asynchronously.

    Data is always saved to a local CSV backup file.
    If Google Sheets credentials are configured, it also writes online.

    Args:
        event_type: One of 'signup', 'login', 'google_auth'
        status: 'success' or 'failed'
        user: User model instance (if available)
        email: Email address (fallback if user is None)
        role: User role (fallback if user is None)
        ip_address: Client IP address
        failure_reason: Reason for failure (if status is 'failed')
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    row = [
        timestamp,
        event_type,
        str(user.id) if user else "N/A",
        user.name if user else "N/A",
        user.email if user else (email or "N/A"),
        user.role if user else (role or "N/A"),
        user.phone if user and user.phone else "N/A",
        ip_address or "N/A",
        status,
        failure_reason,
    ]

    # Fire and forget — run in background thread
    thread = threading.Thread(target=_log_background, args=(row,), daemon=True)
    thread.start()
