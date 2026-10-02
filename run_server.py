"""
Sahayata Setu — Application Launcher
Runs FastAPI backend on http://127.0.0.1:8000
"""

import uvicorn
import webbrowser
import sys
import time
import threading

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def open_browser():
    time.sleep(1.2)
    print("Opening Sahayata Setu in default web browser...")
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("=" * 65)
    print("  SAHAYATA SETU (सहायता सेतु) — AI Stress & Trauma Assessment")
    print("  Smart India Hackathon 2026 (SIH26093) | Team: InnovateX")
    print("  National Helpline Against Atrocities (14566)")
    print("=" * 65)
    print("  Backend & Frontend serving on: http://127.0.0.1:8000")
    print("  API Docs available at:        http://127.0.0.1:8000/docs")
    print("=" * 65)

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
