# Sahayata Setu (सहायता सेतु) — NLPE 2026

[![NLPE 2026](https://img.shields.io/badge/NLPE-2026-blue.svg)]()
[![Problem Statement](https://img.shields.io/badge/Problem%20Statement-SIH26093-orange.svg)]()
[![Ministry](https://img.shields.io/badge/Ministry-Social%20Justice%20%26%20Empowerment-teal.svg)]()
[![Helpline Integration](https://img.shields.io/badge/Helpline-NHAA%2014566-red.svg)]()

> **Repo description suggestion:** SIH 2026 | NLPE 2026 - AI stress and trauma triage for NHAA 14566

---

## 🎯 One-Minute Pitch

### Problem
Victims contacting India's **National Helpline Against Atrocities (NHAA, 14566)** — whether by phone, IVRS, chatbot, or web portal — face a uniform queue with **zero standardized psychological or threat assessment at first contact**. A person facing an armed mob gets the same queue treatment as someone asking about a scholarship.

### Solution
**Sahayata Setu** introduces an **auditable, transparent Stress Vulnerability Index (SVI: 0–100)** that instantly maps intake signals across **4 legal and operational tiers**, prioritizing emergency police intervention and witness protection when life is in immediate danger.

### Impact
- **< 15-minute SLA** for Critical (Tier 4) cases — armed mobs, arson, active violence
- **Explainable scoring** — every SVI point is attributable to specific phrases, urgency signals, and acoustic markers
- **Multilingual** — English, Hindi, Bengali, Tamil, Telugu, Marathi
- **Human-in-the-Loop guarantee** — AI computes triage, human counsellor confirms every dispatch

---

## 🏗️ Architecture Overview

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the complete mathematical formulation. Key highlights:

- **SVI Formula:** `SVI = clamp(0, 100, BaseWeight + ΣCategoryScores + ContextBoosters + AcousticModifier)`
- **7 Indicator Categories** with capped weights (Lethal Threat max 28, Social Boycott max 16, etc.)
- **4-Tier Escalation Ladder:**
  | Tier | SVI Range | SLA | Action |
  |------|-----------|-----|--------|
  | 🟢 Low | 0–30 | 72h | Standard admin queue |
  | 🟡 Moderate | 31–55 | 48h | L2 Counsellor + Legal Aid |
  | 🟠 High | 56–78 | 2h | Senior Counsellor + District Nodal |
  | 🔴 Critical | 79–100 | <15min | SP Police + Witness Protection |
- **Human-in-the-Loop Gate:** Every emergency dispatch requires affirmative counsellor confirmation

---

## ⚡ Demo Steps

### Prerequisites
- Python 3.10+
- Modern web browser (Chrome, Edge, Firefox)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Tests
```bash
python -m pytest backend/tests/ -v
```

### 3. Launch Server
```bash
python run_server.py
```
The app opens at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

### 4. Walk Through 8 Synthetic Cases
The system ships with 8 pre-built synthetic cases spanning all 4 tiers:

| # | Case ID | Channel | Language | Expected Tier |
|---|---------|---------|----------|--------------|
| 1 | `CASE-2026-0814` | Portal | English | 🟢 Low (0–30) |
| 2 | `CASE-2026-0819` | Chatbot | Hindi | 🟡 Moderate (31–55) |
| 3 | `CASE-2026-0823` | IVRS | English | 🟠 High (56–78) |
| 4 | `CASE-2026-0831` | IVRS | Hindi | 🔴 Critical (79–100) |
| 5 | `CASE-2026-0837` | IVRS | English | 🔴 Critical (79–100) |
| 6 | `CASE-2026-0842` | Portal | English | 🟡 Moderate (31–55) |
| 7 | `CASE-2026-0850` | IVRS | Bengali | 🔴 Critical (79–100) |
| 8 | `CASE-2026-0855` | Chatbot | Tamil | 🟠 High (56–78) |

Click **"Load Synthetic Cases"** in the UI to auto-load all 8 cases into the live counsellor triage desk.

---

## 📸 Screenshots

<!-- Add screenshots here -->
_Screenshots to be added._

---

## 📂 Project Structure

```
├── backend/
│   ├── scoring_engine.py      # Core SVI rule-based scoring module
│   ├── models.py              # Pydantic schemas for multi-channel intake
│   ├── main.py                # FastAPI REST API & live queue endpoints
│   └── tests/
│       ├── test_scoring.py    # Unit tests — all 4 tiers & multilingual
│       └── test_override_and_escalation.py
├── frontend/
│   ├── index.html             # Single Page Application
│   ├── style.css              # Responsive stylesheet with SVI gauge
│   └── app.js                 # Multilingual UI, live queue & waveform
├── sample_data/
│   └── synthetic_transcripts.json  # 8 synthetic cases across all 4 tiers
├── ARCHITECTURE.md            # Mathematical scoring formula documentation
├── README.md                  # This file
├── requirements.txt           # Pinned Python dependencies
└── run_server.py              # 1-click startup launcher
```

---

## 🔒 Ethics, Privacy & Safety

1. **Synthetic Data Only** — All demo transcripts use completely synthetic, anonymized text.
2. **No Diagnostic Claim** — Sahayata Setu is an operational triage prioritization aid, not a clinical diagnostic tool.
3. **Human-in-the-Loop Guarantee** — Every emergency escalation requires affirmative human counsellor confirmation.
4. **SER Calibration** — Voice stress analysis is explicitly calibrated with 45–70% accuracy bounds on Indian languages.

---

## 👤 Author

**Aman Kumar**
NIAT Jaipur, Vivekananda Global University

---

## 📜 Credits

Originally developed for **Smart India Hackathon 2026** (PS SIH26093, Ministry of Social Justice & Empowerment).
