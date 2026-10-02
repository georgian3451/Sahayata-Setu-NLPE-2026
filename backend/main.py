"""
FastAPI Application for Sahayata Setu (SIH26093)
AI Stress & Trauma Assessment Platform
"""

import json
import os
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.scoring_engine import StressScoringEngine, RiskTier, EscalationProtocols
from backend.models import (
    AssessmentRequest,
    TriageActionRequest,
    SviOverrideRequest,
    EscalationActionRequest,
    FastForwardRequest,
    ContactLogRequest,
    LegalSectionUpdateRequest,
    CaseRecord
)

app = FastAPI(
    title="Sahayata Setu API",
    description="Explainable AI Stress & Trauma Assessment Platform for NHAA 14566 (SIH26093)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory stores
CASES_DB: Dict[str, Dict[str, Any]] = {}
AUDIT_LOGS: List[Dict[str, Any]] = []

# PoA Rules, 1995 (as amended 2016) schedule reference table for compensation entitlement estimates.
POA_COMPENSATION_SCHEDULE = {
    "Murder/death (earning member)": {
        "category": "Murder/death (earning member)",
        "amount": "Rs 5,00,000",
        "type": "fixed",
        "signals": ["LETHAL_DIRECT_THREAT"]
    },
    "Murder/death (non-earning member)": {
        "category": "Murder/death (non-earning member)",
        "amount": "Rs 2,00,000",
        "type": "fixed",
        "signals": ["LETHAL_DIRECT_THREAT"]
    },
    "Rape": {
        "category": "Rape",
        "amount": "Rs 2,00,000",
        "type": "fixed",
        "signals": ["PHYSICAL_HARASSMENT_INTIMIDATION"]
    },
    "Arson leading to complete homelessness": {
        "category": "Arson leading to complete homelessness",
        "amount": "Rs 3,00,000",
        "type": "fixed",
        "signals": ["LETHAL_DIRECT_THREAT", "SOCIAL_ECONOMIC_BOYCOTT"]
    },
    "Permanent disability (earning member)": {
        "category": "Permanent disability (earning member)",
        "amount": "Rs 3,00,000",
        "type": "fixed",
        "signals": ["PHYSICAL_HARASSMENT_INTIMIDATION"]
    },
    "Permanent disability (non-earning member)": {
        "category": "Permanent disability (non-earning member)",
        "amount": "Rs 1,50,000",
        "type": "fixed",
        "signals": ["PHYSICAL_HARASSMENT_INTIMIDATION"]
    },
    "General/other atrocity offences": {
        "category": "General/other atrocity offences",
        "amount": "Rs 85,000 to Rs 8,25,000 range",
        "type": "range",
        "signals": ["SOCIAL_ECONOMIC_BOYCOTT", "COERCION_INSTITUTIONAL_PRESSURE", "RESTRICTED_MOVEMENT_CONFINEMENT", "EXTREME_FEAR_PANIC", "TEMPORAL_URGENCY"]
    }
}


COMPENSATION_NOTE = "Entitlement estimate based on the national PoA Rules schedule — state governments may have enhanced amounts (e.g. Tamil Nadu: Rs 1,00,000 to Rs 12,00,000); always confirm exact figures with the District Social Welfare Officer."

# Reference list of districts known to have an Exclusive Special Court under PoA Act Section 14A.
# Representative sample for the prototype (e.g. the 11 Karnataka districts: Mysuru, Belagavi, Tumakuru,
# Yadgir, Vijayapura, Raichur, Kolar, Kalaburagi, Bengaluru South/Ramanagara, Shivamogga, Bagalkot —
# plus a few others: Madurai, Warangal, Patna, Ahmedabad, Jaipur), clearly labeled as a sample/illustrative list,
# not nationally exhaustive, since compiling all 194 is outside prototype scope.
EXCLUSIVE_SPECIAL_COURT_DISTRICTS = {
    "mysuru", "belagavi", "tumakuru", "yadgir", "vijayapura",
    "raichur", "kolar", "kalaburagi", "bengaluru south", "ramanagara",
    "bengaluru south/ramanagara", "shivamogga", "bagalkot",
    "madurai", "warangal", "patna", "ahmedabad", "jaipur"
}

SPECIAL_COURT_DELAY_FLAG_TEXT = (
    "Structural Delay Risk — no Exclusive Special Court identified in this district; "
    "case may route to a regular Sessions Court with slower PoA Act case handling."
)


def evaluate_special_court_jurisdiction(district: Optional[str]) -> Dict[str, Any]:
    """
    Checks whether the district has an Exclusive Special Court under PoA Act Section 14A.
    If not found in the representative sample list, surfaces the contextual Structural Delay Risk flag.
    """
    clean_dist = (district or "").strip().lower()
    has_court = clean_dist in EXCLUSIVE_SPECIAL_COURT_DISTRICTS
    flag = None if has_court else SPECIAL_COURT_DELAY_FLAG_TEXT
    return {
        "has_special_court": has_court,
        "special_court_flag": flag,
        "district": district or "Unknown District",
        "sample_notice": "Representative prototype sample per PoA Act Sec 14A (11 Karnataka districts + national sample, illustrative only)."
    }


def ensure_special_court_jurisdiction(case: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure that the case has special court jurisdiction fields populated."""
    info = evaluate_special_court_jurisdiction(case.get("district"))
    case["has_special_court"] = info["has_special_court"]
    case["special_court_flag"] = info["special_court_flag"]
    return info

POA_LEGAL_SECTIONS_FILE = os.path.join(os.path.dirname(__file__), "poa_legal_sections.json")


def load_poa_legal_sections() -> List[Dict[str, Any]]:
    if os.path.exists(POA_LEGAL_SECTIONS_FILE):
        try:
            with open(POA_LEGAL_SECTIONS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []


POA_LEGAL_SECTIONS = load_poa_legal_sections()

LEGAL_SECTIONS_ADVISORY = (
    "Advisory only: For a human legal or nodal officer to verify. "
    "This guidance is provided as an administrative decision-support checklist and is never presented as an automatic legal determination."
)
LEGAL_SECTIONS_PROMPT = "Based on this narrative, the following sections may apply — confirm these were invoked in the FIR:"


def suggest_legal_sections_for_case(case: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Evaluates a case transcript and matched incident-type signals against the SC/ST (PoA) Act
    reference mapping to generate an advisory legal sections checklist for human verification.
    """
    transcript = (case.get("full_transcript") or "").lower()
    matched_phrases = [p.lower() for p in (case.get("matched_phrases") or [])]
    detected_indicators = [ind.get("category_name", "").lower() for ind in (case.get("detected_indicators") or [])]
    combined_text = transcript + " " + " ".join(matched_phrases) + " " + " ".join(detected_indicators)

    # Preserve any existing confirmation checkboxes set by the officer
    existing_state = {}
    for sec in (case.get("suggested_legal_sections") or []):
        if isinstance(sec, dict) and "section_code" in sec:
            existing_state[sec["section_code"]] = sec.get("confirmed_in_fir", False)

    suggestions = []
    for entry in POA_LEGAL_SECTIONS:
        matched_kw = []
        for kw in entry.get("keywords", []):
            if kw.lower() in combined_text:
                matched_kw.append(kw)

        if matched_kw:
            sec_code = entry.get("section_code")
            suggestions.append({
                "incident_type": entry.get("incident_type"),
                "section_code": sec_code,
                "act": entry.get("act"),
                "title": entry.get("title"),
                "punishment": entry.get("punishment"),
                "description": entry.get("description"),
                "matched_keywords": list(dict.fromkeys(matched_kw))[:5],
                "confirmed_in_fir": existing_state.get(sec_code, False)
            })

    case["suggested_legal_sections"] = suggestions
    return suggestions


def ensure_suggested_legal_sections(case: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Ensure that the case has suggested legal sections populated."""
    if "suggested_legal_sections" not in case or case["suggested_legal_sections"] is None:
        return suggest_legal_sections_for_case(case)
    return case["suggested_legal_sections"]



def parse_case_date(value: Optional[str], fallback: Optional[datetime] = None) -> Optional[datetime]:
    """Return a parsed datetime, tolerant to the date-only and timestamp formats the app uses in memory."""
    if not value:
        return fallback
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(value).split(".")[0], fmt)
        except Exception:
            continue
    return fallback


def compute_retention_metrics(case: Dict[str, Any]) -> Dict[str, Any]:
    """Compute the separate Witness Retention Risk metric from first-contact age, last-contact age, and helpline distress state."""
    # Ensure a deterministic fallback for last contact if a case has not yet been enriched.
    if not case.get("last_contact_date"):
        case["last_contact_date"] = parse_case_date(case.get("timestamp"), datetime.now()).strftime("%Y-%m-%d") if parse_case_date(case.get("timestamp"), datetime.now()) else datetime.now().strftime("%Y-%m-%d")

    first_contact_dt = parse_case_date(case.get("timestamp"), datetime.now()) or datetime.now()
    last_contact_dt = parse_case_date(case.get("last_contact_date"), first_contact_dt) or first_contact_dt
    reference_dt = datetime.now()

    case_age_days = max(0, (reference_dt - first_contact_dt).days)
    days_since_contact = max(0, (reference_dt - last_contact_dt).days)
    has_distress_signal = bool(case.get("helpline_distress_signal_since_filing"))

    # Simple, auditable rule-based score. It remains independent of SVI calculations.
    score = 0
    if has_distress_signal:
        score += 45
    if case_age_days >= 14:
        score += 15
    if case_age_days >= 30:
        score += 10
    if days_since_contact >= 14:
        score += 20
    if days_since_contact >= 30:
        score += 25
    if days_since_contact >= 45:
        score += 10

    score = max(0, min(100, score))

    if score >= 70:
        retention_risk = "High"
    elif score >= 35:
        retention_risk = "Medium"
    else:
        retention_risk = "Low"

    retention_action = None
    if retention_risk == "High":
        retention_action = f"Proactive counsellor check-in recommended — no contact in {days_since_contact} days."

    case["retention_score"] = score
    case["retention_risk"] = retention_risk
    case["retention_badge"] = retention_risk
    case["retention_action"] = retention_action
    case["days_since_last_contact"] = days_since_contact
    case["case_age_days"] = case_age_days
    case["helpline_distress_signal_since_filing"] = has_distress_signal

    return {
        "retention_score": score,
        "retention_risk": retention_risk,
        "retention_badge": retention_risk,
        "retention_action": retention_action,
        "days_since_last_contact": days_since_contact,
        "case_age_days": case_age_days,
        "last_contact_date": case.get("last_contact_date")
    }


def ensure_retention_for_case(case: Dict[str, Any]) -> Dict[str, Any]:
    """Hydrate a case object with the computed Witness Retention Risk fields in-place."""
    return compute_retention_metrics(case)


def ensure_compensation_entitlement(case: Dict[str, Any]) -> Dict[str, Any]:
    """Create or refresh the case's compensation entitlement summary stored directly in the case object."""
    if not case.get("compensation_entitlement"):
        case["compensation_entitlement"] = get_compensation_entitlement(case["case_id"])
    return case["compensation_entitlement"]


def get_compensation_entitlement(case_id: str):
    """Return a compensation entitlement estimate for a case and a 3-stage payment tracker, using matched incident categories from the case's detected indicators."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    indicator_keys = {ind.get("category_key") for ind in case.get("detected_indicators") or []}

    transcript_lower = (case.get("full_transcript") or "").lower()
    matched_lower = " ".join(case.get("matched_phrases") or []).lower()

    # Prefer arson / burn / fire / fire-giving cues before giving a lethal-threat default.
    arson_terms = [
        "arson", "burn", "burned", "fire", "fuel", "agni", "आग", "जलाकर", "जलाना",
        "अग्नि", "आग लगा", "भड़क", "jalana", "burning"
    ]
    is_arson_signal = any(term in transcript_lower or term in matched_lower for term in arson_terms)

    # Map detected signal kinds to the reference schedule.
    if is_arson_signal or "arson" in matched_lower:
        chosen = POA_COMPENSATION_SCHEDULE["Arson leading to complete homelessness"]
    elif "LETHAL_DIRECT_THREAT" in indicator_keys:
        chosen = POA_COMPENSATION_SCHEDULE["Murder/death (earning member)"]
    elif "SOCIAL_ECONOMIC_BOYCOTT" in indicator_keys:
        chosen = POA_COMPENSATION_SCHEDULE["General/other atrocity offences"]
    elif "COERCION_INSTITUTIONAL_PRESSURE" in indicator_keys:
        chosen = POA_COMPENSATION_SCHEDULE["General/other atrocity offences"]
    elif "RESTRICTED_MOVEMENT_CONFINEMENT" in indicator_keys:
        chosen = POA_COMPENSATION_SCHEDULE["General/other atrocity offences"]
    elif "EXTREME_FEAR_PANIC" in indicator_keys:
        chosen = POA_COMPENSATION_SCHEDULE["General/other atrocity offences"]
    elif "PHYSICAL_HARASSMENT_INTIMIDATION" in indicator_keys:
        if "rape" in transcript_lower or "rape" in matched_lower:
            chosen = POA_COMPENSATION_SCHEDULE["Rape"]
        elif "disability" in transcript_lower or "disabled" in transcript_lower:
            chosen = POA_COMPENSATION_SCHEDULE["Permanent disability (earning member)"]
        else:
            chosen = POA_COMPENSATION_SCHEDULE["Permanent disability (earning member)"]
    else:
        chosen = POA_COMPENSATION_SCHEDULE["General/other atrocity offences"]

    tracker = {
        "At FIR Registration": {"stage": "At FIR Registration", "paid": False},
        "At Chargesheet Filing": {"stage": "At Chargesheet Filing", "paid": False},
        "At Conviction": {"stage": "At Conviction", "paid": False}
    }

    case["compensation_entitlement"] = {
        "category": chosen["category"],
        "amount": chosen["amount"],
        "payment_tracker": tracker,
        "note": COMPENSATION_NOTE
    }

    return {
        "case_id": case_id,
        "category": chosen["category"],
        "amount": chosen["amount"],
        "payment_tracker": tracker,
        "note": COMPENSATION_NOTE
    }


def build_audit_package_payload(case: Dict[str, Any]) -> Dict[str, Any]:
    """Create a canonical, deterministic payload for the case's tamper-evidence audit package."""
    return {
        "case_id": case.get("case_id"),
        "full_transcript": case.get("full_transcript") or "",
        "detected_indicators": [
            {
                "category_key": ind.get("category_key"),
                "category_name": ind.get("category_name"),
                "points_contributed": ind.get("points_contributed")
            }
            for ind in case.get("detected_indicators") or []
        ],
        "svi_score": case.get("svi_score"),
        "risk_tier": case.get("risk_tier"),
        "timestamp": case.get("timestamp") or case.get("audit_package_timestamp") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


def compute_audit_package_hash(case: Dict[str, Any]) -> str:
    """Create a stable SHA-256 fingerprint using Python's built-in hashlib over canonical JSON."""
    payload = build_audit_package_payload(case)
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def stamp_audit_package(case: Dict[str, Any]) -> Dict[str, Any]:
    """Store the generated audit-package hash and timestamp on the case record in a deterministic way."""
    timestamp = case.get("timestamp") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    case["audit_package_timestamp"] = timestamp
    case["audit_package_hash"] = compute_audit_package_hash(case)
    return case


def compute_statutory_deadlines(case: Dict[str, Any], reference_time: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Computes statutory compliance countdowns under SC/ST (PoA) Act & Rules:
    1. Interim Relief (PoA Rule 12(4)): Mandated within 7 days of incident/intake.
    2. Chargesheet Filing (PoA Section 14(2)): Investigation & chargesheet within 60 days.

    Status thresholds:
    - Green: > 50% of time window remains
    - Amber: <= 50% of time window remains
    - Red: deadline has passed (overdue)
    """
    if reference_time is None:
        reference_time = datetime.now()

    tier_val = str(case.get("risk_tier", "")).strip().upper()
    svi_val = float(case.get("svi_score", 0) or 0)
    if tier_val == "LOW" and svi_val == 0:
        return {
            "is_applicable": False,
            "status_text": "N/A — Routine Grievance",
            "elapsed_days": 0.0,
            "simulated_days_offset": 0.0,
            "interim_relief": {
                "mandated_days": 7,
                "days_remaining": 7.0,
                "status": "none",
                "is_overdue": False,
                "overdue_by_days": 0.0,
                "pct_remaining": 100.0,
                "legal_ref": "PoA Rule 12(4)"
            },
            "chargesheet": {
                "mandated_days": 60,
                "days_remaining": 60.0,
                "status": "none",
                "is_overdue": False,
                "overdue_by_days": 0.0,
                "pct_remaining": 100.0,
                "legal_ref": "PoA Sec 14(2)"
            },
            "is_overdue": False,
            "is_approaching": False
        }

    ts_str = case.get("timestamp")
    created_dt = None
    if ts_str:
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
            try:
                created_dt = datetime.strptime(ts_str.split(".")[0], fmt)
                break
            except Exception:
                pass
    if not created_dt:
        created_dt = reference_time

    base_elapsed_days = (reference_time - created_dt).total_seconds() / 86400.0
    if base_elapsed_days < 0:
        base_elapsed_days = 0.0

    simulated_offset = float(case.get("simulated_days_offset", 0.0))
    total_elapsed_days = max(0.0, base_elapsed_days + simulated_offset)

    # 1. Interim Relief (7-Day window)
    interim_total = 7.0
    interim_remaining = interim_total - total_elapsed_days
    if interim_remaining < 0:
        interim_status = "red"
        interim_pct = 0.0
    elif interim_remaining <= 3.5:
        interim_status = "amber"
        interim_pct = round((interim_remaining / interim_total) * 100, 1)
    else:
        interim_status = "green"
        interim_pct = round((interim_remaining / interim_total) * 100, 1)

    # 2. Chargesheet Filing (60-Day window)
    chargesheet_total = 60.0
    chargesheet_remaining = chargesheet_total - total_elapsed_days
    if chargesheet_remaining < 0:
        chargesheet_status = "red"
        chargesheet_pct = 0.0
    elif chargesheet_remaining <= 30.0:
        chargesheet_status = "amber"
        chargesheet_pct = round((chargesheet_remaining / chargesheet_total) * 100, 1)
    else:
        chargesheet_status = "green"
        chargesheet_pct = round((chargesheet_remaining / chargesheet_total) * 100, 1)

    is_overdue = (interim_status == "red" or chargesheet_status == "red")
    is_approaching = (not is_overdue) and (interim_status == "amber" or chargesheet_status == "amber")

    return {
        "is_applicable": True,
        "status_text": "Active PoA Statutory Tracking",
        "elapsed_days": round(total_elapsed_days, 1),
        "simulated_days_offset": round(simulated_offset, 1),
        "interim_relief": {
            "mandated_days": 7,
            "days_remaining": round(interim_remaining, 1),
            "status": interim_status,
            "is_overdue": interim_remaining < 0,
            "overdue_by_days": round(abs(interim_remaining), 1) if interim_remaining < 0 else 0.0,
            "pct_remaining": interim_pct,
            "legal_ref": "PoA Rule 12(4)"
        },
        "chargesheet": {
            "mandated_days": 60,
            "days_remaining": round(chargesheet_remaining, 1),
            "status": chargesheet_status,
            "is_overdue": chargesheet_remaining < 0,
            "overdue_by_days": round(abs(chargesheet_remaining), 1) if chargesheet_remaining < 0 else 0.0,
            "pct_remaining": chargesheet_pct,
            "legal_ref": "PoA Sec 14(2)"
        },
        "is_overdue": is_overdue,
        "is_approaching": is_approaching
    }


def load_initial_sample_cases():
    """Seed database with synthetic transcripts spanning all 4 risk tiers."""
    sample_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_data", "synthetic_transcripts.json")
    if os.path.exists(sample_file):
        with open(sample_file, "r", encoding="utf-8") as f:
            samples = json.load(f)
            for item in samples:
                audio_dict = item.get("simulated_audio")
                evaluation = StressScoringEngine.evaluate_text(
                    text=item["transcript"],
                    channel=item["channel"],
                    audio_telemetry=audio_dict,
                    preferred_language=item.get("language", "en")
                )
                
                case_id = item["id"]
                case_obj = {
                    "case_id": case_id,
                    "timestamp": item.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                    "channel": item["channel"],
                    "language": item.get("language", "en"),
                    "caller_alias": item.get("caller_alias", "Synthetic_User"),
                    "district": item.get("district", "Central District"),
                    "state": item.get("state", "State"),
                    "transcript_preview": item["transcript"][:110] + "..." if len(item["transcript"]) > 110 else item["transcript"],
                    "full_transcript": item["transcript"],
                    "svi_score": evaluation["svi_score"],
                    "ai_svi_score": evaluation["svi_score"],
                    "risk_tier": evaluation["risk_tier"],
                    "ai_risk_tier": evaluation["risk_tier"],
                    "tier_color": evaluation["tier_color"],
                    "is_overridden": False,
                    "overridden_svi_score": None,
                    "override_reason": None,
                    "override_timestamp": None,
                    "override_history": [],
                    "status": "Pending Triage" if evaluation["risk_tier"] in [RiskTier.HIGH, RiskTier.CRITICAL] else "In Review",
                    "status_timestamp": None,
                    "action_title": evaluation["action_title"],
                    "action_description": evaluation["action_description"],
                    "recommended_dispatch": evaluation["recommended_dispatch"],
                    "witness_protection_flag": evaluation["witness_protection_flag"],
                    "police_liaison_required": evaluation["police_liaison_required"],
                    "has_psychological_crisis": evaluation.get("has_psychological_crisis", False),
                    "crisis_banner_message": evaluation.get("crisis_banner_message"),
                    "medical_assistance_required": evaluation.get("medical_assistance_required", False),
                    "medical_assistance_action": evaluation.get("medical_assistance_action"),
                    "medical_matched_keywords": evaluation.get("medical_matched_keywords", []),
                    "contact_count": item.get("contact_count", 1),
                    "previous_svi_score": item.get("previous_svi_score", None),
                    "previous_risk_tier": item.get("previous_risk_tier", None),
                    "score_delta": item.get("score_delta", None),
                    "trend": item.get("trend", "1st Contact"),
                    "contact_history": item.get("contact_history", []),
                    "detected_indicators": evaluation["detected_indicators"],
                    "all_contributing_factors": evaluation.get("all_contributing_factors", []),
                    "matched_phrases": evaluation["matched_phrases"],
                    "scoring_breakdown": evaluation["scoring_breakdown"],
                    "acoustic_telemetry": evaluation["acoustic_telemetry"],
                    "explainability_summary": evaluation["explainability_summary"],
                    "simulated_days_offset": 0.0,
                    "last_contact_date": item.get("last_contact_date", item.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")).split(" ")[0]),
                    "helpline_distress_signal_since_filing": item.get("helpline_distress_signal_since_filing", False),
                    "retention_score": 0,
                    "retention_risk": "Low",
                    "retention_badge": "Low",
                    "retention_action": None,
                    "days_since_last_contact": 0,
                    "case_age_days": 0,
                    "counsellor_actions": []
                }
                ensure_retention_for_case(case_obj)
                stamp_audit_package(case_obj)
                ensure_special_court_jurisdiction(case_obj)
                case_obj["deadlines"] = compute_statutory_deadlines(case_obj)
                ensure_suggested_legal_sections(case_obj)
                CASES_DB[case_id] = case_obj
                ensure_compensation_entitlement(case_obj)


load_initial_sample_cases()


@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "Sahayata Setu SVI Core",
        "version": "2.4.0",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.post("/api/assess")
def assess_input(req: AssessmentRequest):
    """
    Evaluates text / IVRS audio stream and returns SVI score with full explainability.
    """
    if not req.consent_given:
        raise HTTPException(status_code=400, detail="Processing requires citizen/caller consent confirmation.")
    
    audio_dict = req.audio_telemetry.dict() if req.audio_telemetry else None
    
    evaluation = StressScoringEngine.evaluate_text(
        text=req.text,
        channel=req.channel,
        audio_telemetry=audio_dict,
        preferred_language=req.language
    )
    
    return evaluation


@app.post("/api/cases")
def create_case(req: AssessmentRequest):
    """
    Evaluates input and saves or updates case in the live risk-sorted triage queue.
    Supports follow-up contact re-analysis if existing case_id is supplied.
    """
    if not req.consent_given:
        raise HTTPException(status_code=400, detail="Processing requires citizen/caller consent confirmation.")

    audio_dict = req.audio_telemetry.dict() if req.audio_telemetry else None
    evaluation = StressScoringEngine.evaluate_text(
        text=req.text,
        channel=req.channel,
        audio_telemetry=audio_dict,
        preferred_language=req.language
    )

    now_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    req_case_id = req.case_id.strip() if req.case_id else None

    # Check if case exists in queue for follow-up contact re-analysis
    if req_case_id and req_case_id in CASES_DB:
        existing_case = CASES_DB[req_case_id]
        prev_score = existing_case["svi_score"]
        prev_tier = existing_case["risk_tier"]
        new_score = evaluation["svi_score"]
        new_tier = evaluation["risk_tier"]
        
        score_delta = new_score - prev_score
        if score_delta > 0:
            trend = "Escalating"
        elif score_delta < 0:
            trend = "De-escalating"
        else:
            trend = "Stable"
            
        contact_count = existing_case.get("contact_count", 1) + 1
        
        # Log previous contact into contact history
        contact_entry = {
            "contact_num": existing_case.get("contact_count", 1),
            "timestamp": existing_case.get("timestamp"),
            "svi_score": prev_score,
            "risk_tier": prev_tier,
            "transcript_preview": existing_case.get("transcript_preview"),
            "channel": existing_case.get("channel")
        }
        history = list(existing_case.get("contact_history", []))
        history.append(contact_entry)
        
        existing_case.update({
            "timestamp": now_ts,
            "channel": req.channel,
            "language": req.language,
            "transcript_preview": req.text[:110] + "..." if len(req.text) > 110 else req.text,
            "full_transcript": req.text,
            "previous_svi_score": prev_score,
            "previous_risk_tier": prev_tier,
            "svi_score": new_score,
            "ai_svi_score": new_score,
            "risk_tier": new_tier,
            "ai_risk_tier": new_tier,
            "tier_color": evaluation["tier_color"],
            "score_delta": score_delta,
            "trend": trend,
            "contact_count": contact_count,
            "contact_history": history,
            "has_psychological_crisis": evaluation.get("has_psychological_crisis", False),
            "crisis_banner_message": evaluation.get("crisis_banner_message"),
            "medical_assistance_required": evaluation.get("medical_assistance_required", False),
            "medical_assistance_action": evaluation.get("medical_assistance_action"),
            "medical_matched_keywords": evaluation.get("medical_matched_keywords", []),
            "action_title": evaluation["action_title"],
            "action_description": evaluation["action_description"],
            "recommended_dispatch": evaluation["recommended_dispatch"],
            "witness_protection_flag": evaluation["witness_protection_flag"],
            "police_liaison_required": evaluation["police_liaison_required"],
            "detected_indicators": evaluation["detected_indicators"],
            "all_contributing_factors": evaluation.get("all_contributing_factors", []),
            "matched_phrases": evaluation["matched_phrases"],
            "scoring_breakdown": evaluation["scoring_breakdown"],
            "acoustic_telemetry": evaluation["acoustic_telemetry"],
            "explainability_summary": evaluation["explainability_summary"],
            "last_contact_date": datetime.now().strftime("%Y-%m-%d"),
            "days_since_last_contact": 0
        })
        if req.district and req.district.strip():
            existing_case["district"] = req.district.strip()
        if req.state and req.state.strip():
            existing_case["state"] = req.state.strip()
        ensure_special_court_jurisdiction(existing_case)
        ensure_retention_for_case(existing_case)
        stamp_audit_package(existing_case)
        existing_case["deadlines"] = compute_statutory_deadlines(existing_case)
        ensure_suggested_legal_sections(existing_case)
        return {"case": existing_case, "evaluation": evaluation, "is_follow_up": True}

    # Brand new case creation
    case_id = req_case_id or f"CASE-2026-{uuid.uuid4().hex[:4].upper()}"
    caller_alias = req.caller_alias or f"Citizen_{uuid.uuid4().hex[:3].upper()}"
    district_val = req.district.strip() if req.district and req.district.strip() else "Simulated District"
    state_val = req.state.strip() if req.state and req.state.strip() else "Demo Jurisdiction"
    
    new_case = {
        "case_id": case_id,
        "timestamp": now_ts,
        "channel": req.channel,
        "language": req.language,
        "caller_alias": caller_alias,
        "district": district_val,
        "state": state_val,
        "transcript_preview": req.text[:110] + "..." if len(req.text) > 110 else req.text,
        "full_transcript": req.text,
        "svi_score": evaluation["svi_score"],
        "ai_svi_score": evaluation["svi_score"],
        "risk_tier": evaluation["risk_tier"],
        "ai_risk_tier": evaluation["risk_tier"],
        "tier_color": evaluation["tier_color"],
        "is_overridden": False,
        "overridden_svi_score": None,
        "override_reason": None,
        "override_timestamp": None,
        "override_history": [],
        "status": "Pending Triage" if evaluation["risk_tier"] in [RiskTier.HIGH, RiskTier.CRITICAL] else "In Review",
        "status_timestamp": None,
        "action_title": evaluation["action_title"],
        "action_description": evaluation["action_description"],
        "recommended_dispatch": evaluation["recommended_dispatch"],
        "witness_protection_flag": evaluation["witness_protection_flag"],
        "police_liaison_required": evaluation["police_liaison_required"],
        "has_psychological_crisis": evaluation.get("has_psychological_crisis", False),
        "crisis_banner_message": evaluation.get("crisis_banner_message"),
        "medical_assistance_required": evaluation.get("medical_assistance_required", False),
        "medical_assistance_action": evaluation.get("medical_assistance_action"),
        "medical_matched_keywords": evaluation.get("medical_matched_keywords", []),
        "contact_count": 1,
        "previous_svi_score": None,
        "previous_risk_tier": None,
        "score_delta": None,
        "trend": "1st Contact",
        "contact_history": [],
        "detected_indicators": evaluation["detected_indicators"],
        "all_contributing_factors": evaluation.get("all_contributing_factors", []),
        "matched_phrases": evaluation["matched_phrases"],
        "scoring_breakdown": evaluation["scoring_breakdown"],
        "acoustic_telemetry": evaluation["acoustic_telemetry"],
        "explainability_summary": evaluation["explainability_summary"],
        "simulated_days_offset": 0.0,
        "last_contact_date": datetime.now().strftime("%Y-%m-%d"),
        "helpline_distress_signal_since_filing": False,
        "retention_score": 0,
        "retention_risk": "Low",
        "retention_badge": "Low",
        "retention_action": None,
        "days_since_last_contact": 0,
        "case_age_days": 0,
        "counsellor_actions": []
    }
    ensure_retention_for_case(new_case)
    stamp_audit_package(new_case)
    ensure_special_court_jurisdiction(new_case)
    new_case["deadlines"] = compute_statutory_deadlines(new_case)
    ensure_suggested_legal_sections(new_case)

    CASES_DB[case_id] = new_case
    get_compensation_entitlement(case_id)
    return {"case": new_case, "evaluation": evaluation, "is_follow_up": False}


@app.get("/api/cases")
def list_cases(
    tier: Optional[str] = Query(None, description="Filter by tier: Low, Moderate, High, Critical"),
    channel: Optional[str] = Query(None, description="Filter by channel: portal, chatbot, ivrs"),
    search: Optional[str] = Query(None, description="Keyword search in transcript or ID")
):
    """
    Returns live triage queue sorted by SVI risk (highest first).
    """
    cases_list = list(CASES_DB.values())

    # Dynamically compute current deadlines, update retention risk, and hydrate the simulation compensation tracker.
    for c in cases_list:
        ensure_retention_for_case(c)
        ensure_compensation_entitlement(c)
        ensure_suggested_legal_sections(c)
        ensure_special_court_jurisdiction(c)
        c["deadlines"] = compute_statutory_deadlines(c)

    # Filter by tier
    if tier and tier.lower() != "all":
        cases_list = [c for c in cases_list if c["risk_tier"].lower() == tier.lower()]

    # Filter by channel
    if channel and channel.lower() != "all":
        cases_list = [c for c in cases_list if c["channel"].lower() == channel.lower()]

    # Search filter
    if search:
        s = search.lower()
        cases_list = [
            c for c in cases_list 
            if s in c["case_id"].lower() 
            or s in c["full_transcript"].lower() 
            or s in c["caller_alias"].lower()
        ]

    # Tier sorting priority
    tier_weight = {
        RiskTier.CRITICAL: 4,
        RiskTier.HIGH: 3,
        RiskTier.MODERATE: 2,
        RiskTier.LOW: 1
    }

    # Sort primarily by SVI score descending, then tier
    cases_list.sort(key=lambda x: (x["svi_score"], tier_weight.get(x["risk_tier"], 0)), reverse=True)
    return {
        "total_cases": len(cases_list),
        "cases": cases_list
    }


@app.get("/api/cases/{case_id}/retention-risk")
def compute_retention_risk(case_id: str):
    """Return the computed Witness Retention Risk label and recommended counsellor-facing action for a case."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    metrics = ensure_retention_for_case(case)
    return {
        "case_id": case_id,
        "retention_score": case.get("retention_score"),
        "retention_risk": case.get("retention_risk"),
        "retention_badge": case.get("retention_badge"),
        "retention_action": case.get("retention_action"),
        "days_since_last_contact": case.get("days_since_last_contact"),
        "case_age_days": case.get("case_age_days"),
        "last_contact_date": case.get("last_contact_date"),
        "helpline_distress_signal_since_filing": bool(case.get("helpline_distress_signal_since_filing")),
        "metrics": metrics
    }


@app.get("/api/cases/{case_id}/special-court")
def get_case_special_court(case_id: str):
    """Return the Special Court Jurisdiction status and any Structural Delay Risk flag for a case under PoA Act Section 14A."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    info = ensure_special_court_jurisdiction(case)
    return {
        "case_id": case_id,
        "district": case.get("district"),
        "state": case.get("state"),
        **info
    }


@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")
    c = CASES_DB[case_id]
    ensure_retention_for_case(c)
    ensure_compensation_entitlement(c)
    ensure_suggested_legal_sections(c)
    ensure_special_court_jurisdiction(c)
    c["deadlines"] = compute_statutory_deadlines(c)
    return c


@app.get("/api/cases/{case_id}/compensation")
def get_case_compensation(case_id: str):
    """Return the compensation entitlement estimate, category amount/range, and the three-stage tracker for a case."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    ent = ensure_compensation_entitlement(case)
    return ent


@app.patch("/api/cases/{case_id}/compensation")
def update_case_compensation(case_id: str, req: Dict[str, Any]):
    """Toggle a stage in the payment tracker of a case's compensation entitlement simulation. This does not execute a payment; it records the counsellor's decision-support marker."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    ent = ensure_compensation_entitlement(case)
    tracker = ent.get("payment_tracker") or {}
    stage = req.get("stage")
    paid = bool(req.get("paid"))

    if stage not in tracker:
        raise HTTPException(status_code=400, detail="Unknown compensation payment stage")

    tracker[stage]["paid"] = paid
    ent["payment_tracker"] = tracker
    case["compensation_entitlement"] = ent

    audit_entry = {
        "type": "compensation_tracker_toggle",
        "case_id": case_id,
        "caller_alias": case["caller_alias"],
        "stage": stage,
        "paid": paid,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "counsellor_id": "COUNSELLOR_NHAA_09",
        "simulation_notice": "Decision-support payment tracker only; no real payment event is triggered."
    }
    AUDIT_LOGS.insert(0, audit_entry)

    return {
        "status": "success",
        "message": f"Compensation tracker stage {stage} marked as {'paid' if paid else 'unpaid'} for Case {case_id}",
        "updated_entitlement": ent,
        "updated_case": case
    }


@app.get("/api/cases/{case_id}/legal-sections")
def get_case_legal_sections(case_id: str):
    """
    Return advisory suggested legal sections under the PoA Act for the given case.
    Explicitly labeled as advisory only for human legal/nodal officer verification.
    """
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    sections = ensure_suggested_legal_sections(case)
    return {
        "case_id": case_id,
        "advisory_label": LEGAL_SECTIONS_ADVISORY,
        "prompt": LEGAL_SECTIONS_PROMPT,
        "suggested_sections": sections
    }


@app.patch("/api/cases/{case_id}/legal-sections")
def update_case_legal_section(case_id: str, req: LegalSectionUpdateRequest):
    """
    Toggle or record whether a suggested PoA Act section has been verified as invoked in the FIR.
    """
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    sections = ensure_suggested_legal_sections(case)

    found = False
    for sec in sections:
        if sec.get("section_code") == req.section_code:
            sec["confirmed_in_fir"] = req.confirmed_in_fir
            found = True
            break

    if not found:
        # If not already present, append it as confirmed
        for entry in POA_LEGAL_SECTIONS:
            if entry.get("section_code") == req.section_code:
                sections.append({
                    "incident_type": entry.get("incident_type"),
                    "section_code": entry.get("section_code"),
                    "act": entry.get("act"),
                    "title": entry.get("title"),
                    "punishment": entry.get("punishment"),
                    "description": entry.get("description"),
                    "matched_keywords": [],
                    "confirmed_in_fir": req.confirmed_in_fir
                })
                found = True
                break

    case["suggested_legal_sections"] = sections

    audit_entry = {
        "type": "legal_section_confirmation",
        "case_id": case_id,
        "caller_alias": case["caller_alias"],
        "section_code": req.section_code,
        "confirmed_in_fir": req.confirmed_in_fir,
        "notes": req.notes or "",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "officer_id": req.officer_id or "NODAL_OFFICER_01",
        "simulation_notice": "Advisory verification recorded by human legal/nodal officer."
    }
    case["counsellor_actions"].append(audit_entry)
    AUDIT_LOGS.insert(0, audit_entry)

    return {
        "status": "success",
        "case_id": case_id,
        "section_code": req.section_code,
        "confirmed_in_fir": req.confirmed_in_fir,
        "suggested_sections": sections
    }



@app.get("/api/cases/{case_id}/audit-package")
def get_audit_package(case_id: str):
    """Return the stored tamper-evidence fingerprint package for a scored case."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    return {
        "case_id": case_id,
        "hash": case.get("audit_package_hash"),
        "timestamp": case.get("audit_package_timestamp") or case.get("timestamp"),
        "note": "This hash uniquely fingerprints this assessment's data. If any part of the underlying record is altered afterward, recomputing the hash will produce a different value — this is a tamper-evidence mechanism, a foundation for future legal validation, not a legal certification itself.",
        "integrity_status": "verified",
        "message": "Audit package loaded."
    }


@app.post("/api/cases/{case_id}/verify-integrity")
@app.get("/api/cases/{case_id}/verify-integrity")
def verify_audit_package(case_id: str):
    """Recompute the audit-package hash and report whether the current case data still matches its stored fingerprint."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    recomputed = compute_audit_package_hash(case)
    stored = case.get("audit_package_hash")
    match = stored == recomputed

    if match:
        return {
            "status": "success",
            "integrity_ok": True,
            "case_id": case_id,
            "hash": stored,
            "message": "Verify Integrity: hash matches the current assessment data."
        }

    return {
        "status": "success",
        "integrity_ok": False,
        "case_id": case_id,
        "hash": stored,
        "expected_hash": recomputed,
        "message": "Verify Integrity: mismatch detected — stored transcript or assessment fields differ from the recorded audit package fingerprint."
    }


@app.post("/api/cases/{case_id}/fast-forward")
def fast_forward_case_clock(case_id: str, req: FastForwardRequest):
    """
    Simulation / Dev Demo Control:
    Fast-forwards a selected case's timeline by chosen days to demonstrate
    statutory compliance tracking (7-day Interim Relief & 60-day Chargesheet).
    """
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    if req.mode == "reset":
        case["simulated_days_offset"] = 0.0
        case["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    elif req.mode == "set":
        ts_str = case.get("timestamp")
        created_dt = datetime.now()
        if ts_str:
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
                try:
                    created_dt = datetime.strptime(ts_str.split(".")[0], fmt)
                    break
                except Exception:
                    pass
        base_elapsed = (datetime.now() - created_dt).total_seconds() / 86400.0
        case["simulated_days_offset"] = max(0.0, req.days - base_elapsed)
    else:
        case["simulated_days_offset"] = case.get("simulated_days_offset", 0.0) + req.days

    case["deadlines"] = compute_statutory_deadlines(case)

    audit_entry = {
        "type": "demo_clock_simulation",
        "case_id": case_id,
        "caller_alias": case["caller_alias"],
        "action_type": "fast_forward_clock",
        "action_label": f"Fast-Forward Clock (+{req.days}d)" if req.mode != "reset" else "Clock Reset (0d)",
        "simulated_days_offset": case["simulated_days_offset"],
        "interim_relief_status": case["deadlines"]["interim_relief"]["status"],
        "chargesheet_status": case["deadlines"]["chargesheet"]["status"],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "counsellor_id": "DEMO_SIMULATOR",
        "simulation_notice": "Dev-only clock fast-forward demonstration for PoA legal compliance verification."
    }
    AUDIT_LOGS.insert(0, audit_entry)

    return {
        "status": "success",
        "message": f"Case {case_id} clock fast-forwarded by {req.days} days (Demo Simulation)",
        "case_id": case_id,
        "simulated_days_offset": case["simulated_days_offset"],
        "deadlines": case["deadlines"],
        "updated_case": case
    }


@app.post("/api/cases/{case_id}/override")
@app.patch("/api/cases/{case_id}/override")
def override_case_score(case_id: str, req: SviOverrideRequest):
    """
    Human-in-the-Loop (HITL) SVI Score Override:
    - Allows counsellor to adjust score by up to ±10 points
    - Mandatory reason required
    - Recalculates risk tier and protocol if crossing a boundary
    - Preserves both original AI score and overridden score for audit
    """
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    reason_clean = req.reason.strip() if req.reason else ""
    if len(reason_clean) < 3:
        raise HTTPException(status_code=400, detail="A valid reason for override is mandatory (at least 3 characters).")

    case = CASES_DB[case_id]
    original_ai_score = case["ai_svi_score"]
    delta = req.adjusted_score - original_ai_score

    # Hard-capped at ±10 points
    if abs(delta) > 10:
        raise HTTPException(
            status_code=400, 
            detail=f"Override score is hard-capped at ±10 points. Requested delta: {delta:+d} points (Max allowed: -10 to +10)."
        )

    bounded_new_score = max(0, min(100, req.adjusted_score))
    old_tier = case["risk_tier"]
    
    # Recalculate tier & protocols
    tier_info = StressScoringEngine.resolve_tier_and_protocol(bounded_new_score)
    new_tier = tier_info["risk_tier"]
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update case record
    case["svi_score"] = bounded_new_score
    case["overridden_svi_score"] = bounded_new_score
    case["is_overridden"] = True
    case["override_reason"] = reason_clean
    case["override_timestamp"] = timestamp_str
    case["risk_tier"] = new_tier
    case["tier_color"] = tier_info["tier_color"]
    case["action_title"] = tier_info["action_title"]
    case["action_description"] = tier_info["action_description"]
    case["recommended_dispatch"] = tier_info["recommended_dispatch"]
    case["witness_protection_flag"] = tier_info["witness_protection_flag"]
    case["police_liaison_required"] = tier_info["police_liaison_required"]

    audit_entry = {
        "type": "override",
        "case_id": case_id,
        "caller_alias": case["caller_alias"],
        "original_score": original_ai_score,
        "overridden_score": bounded_new_score,
        "delta": delta,
        "original_tier": old_tier,
        "new_tier": new_tier,
        "tier_shifted": (old_tier != new_tier),
        "reason": reason_clean,
        "timestamp": timestamp_str,
        "counsellor_id": req.counsellor_id or "COUNSELLOR_NHAA_09"
    }

    case["override_history"].append(audit_entry)
    case["counsellor_actions"].append(audit_entry)
    AUDIT_LOGS.insert(0, audit_entry)

    return {
        "status": "success",
        "message": f"Case {case_id} SVI score successfully overridden from {original_ai_score} to {bounded_new_score} ({new_tier})",
        "audit_entry": audit_entry,
        "updated_case": case
    }


@app.post("/api/cases/{case_id}/escalate")
@app.patch("/api/cases/{case_id}/escalate")
def escalate_case_action(case_id: str, req: EscalationActionRequest):
    """
    Tier-specific PoA Act Escalation Action Execution:
    - Dispatches simulated escalation action (Police Liaison, Witness Protection, Duty Counsellor, Callback)
    - Updates case status with prototype simulation notice
    - Records timestamped audit entry
    """
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # keep a per-case timestamp for human-visible status transitions and simulation logs
    case["status_timestamp"] = timestamp_str

    ACTION_MAP = {
        "dispatch_police": {
            "label": "Dispatch Police Liaison",
            "status": "Police Liaison Dispatched (Simulation)",
            "police_flag": True,
            "witness_flag": case["witness_protection_flag"]
        },
        "trigger_witness_protection": {
            "label": "Trigger Witness Protection Assessment",
            "status": "Witness Protection Assessment Triggered (Simulation)",
            "police_flag": case["police_liaison_required"],
            "witness_flag": True
        },
        "assign_counsellor": {
            "label": "Assign Duty Counsellor",
            "status": "Duty Counsellor Assigned (Simulation)",
            "police_flag": case["police_liaison_required"],
            "witness_flag": case["witness_protection_flag"]
        },
        "schedule_callback": {
            "label": "Schedule Counsellor Callback",
            "status": "Counsellor Callback Scheduled (Simulation)",
            "police_flag": case["police_liaison_required"],
            "witness_flag": case["witness_protection_flag"]
        },
        "routine_queue": {
            "label": "Routine Administrative Follow-up",
            "status": "Routine Administrative Follow-up (Simulation)",
            "police_flag": case["police_liaison_required"],
            "witness_flag": case["witness_protection_flag"]
        },
        "resolve": {
            "label": "Resolve / Close Case",
            "status": "Case Resolved (Simulation)",
            "police_flag": False,
            "witness_flag": False
        }
    }

    action_info = ACTION_MAP.get(req.action_type, {
        "label": req.action_type,
        "status": f"Action: {req.action_type} (Simulation)",
        "police_flag": case["police_liaison_required"],
        "witness_flag": case["witness_protection_flag"]
    })

    previous_status = case["status"]
    case["status"] = action_info["status"]
    case["status_timestamp"] = timestamp_str
    case["police_liaison_required"] = action_info["police_flag"]
    case["witness_protection_flag"] = action_info["witness_flag"]

    audit_entry = {
        "type": "escalation_action",
        "case_id": case_id,
        "caller_alias": case["caller_alias"],
        "action_type": req.action_type,
        "action_label": action_info["label"],
        "previous_status": previous_status,
        "new_status": case["status"],
        "counsellor_notes": req.counsellor_notes or "",
        "timestamp": timestamp_str,
        "counsellor_id": req.counsellor_id or "COUNSELLOR_NHAA_09",
        "simulation_notice": "Prototype simulation workflow for NHAA / PoA Act demonstration; zero live external dispatch."
    }

    case["counsellor_actions"].append(audit_entry)
    AUDIT_LOGS.insert(0, audit_entry)

    return {
        "status": "success",
        "message": f"Action '{action_info['label']}' simulated and recorded for Case {case_id}",
        "audit_entry": audit_entry,
        "updated_case": case
    }


@app.post("/api/cases/{case_id}/contact")
def log_case_contact(case_id: str, req: ContactLogRequest):
    """Log a new victim/witness contact, reset the last-contact date, and recompute retention risk immediately."""
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    case["last_contact_date"] = datetime.now().strftime("%Y-%m-%d")
    case["helpline_distress_signal_since_filing"] = bool(case.get("helpline_distress_signal_since_filing"))

    action_entry = {
        "type": "contact_logged",
        "case_id": case_id,
        "caller_alias": case["caller_alias"],
        "notes": req.notes or "Counsellor logged a new contact with the victim/witness.",
        "timestamp": timestamp_str,
        "counsellor_id": req.counsellor_id or "COUNSELLOR_NHAA_09",
        "simulation_notice": "Counsellor contact reset the witness contact freshness clock."
    }

    case["counsellor_actions"].append(action_entry)
    AUDIT_LOGS.insert(0, action_entry)
    ensure_retention_for_case(case)

    return {
        "status": "success",
        "message": f"Contact logged for Case {case_id}. Last contact date reset to today.",
        "updated_case": case,
        "retention_risk": case.get("retention_risk"),
        "retention_action": case.get("retention_action")
    }


@app.patch("/api/cases/{case_id}/triage")
def update_case_triage(case_id: str, action: TriageActionRequest):
    """
    Backwards-compatible triage endpoint.
    """
    if case_id not in CASES_DB:
        raise HTTPException(status_code=404, detail="Case not found in NHAA Triage Queue")

    case = CASES_DB[case_id]
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action_entry = {
        "type": "triage_action",
        "timestamp": timestamp_str,
        "counsellor_id": action.counsellor_id or "COUNSELLOR_NHAA_09",
        "action_type": action.action_type,
        "notes": action.counsellor_notes,
        "previous_status": case["status"]
    }

    if action.action_type == "dispatch_police":
        case["status"] = "Police Liaison Dispatched (Simulation)"
        case["police_liaison_required"] = True
    elif action.action_type in ["flag_witness_protection", "trigger_witness_protection"]:
        case["witness_protection_flag"] = True
        case["status"] = "Witness Protection Assessment Triggered (Simulation)"
    elif action.action_type == "assign_counsellor":
        case["status"] = "Duty Counsellor Assigned (Simulation)"
    elif action.action_type == "schedule_callback":
        case["status"] = "Counsellor Callback Scheduled (Simulation)"
    elif action.action_type == "resolve":
        case["status"] = "Case Resolved (Simulation)"
    elif action.action_type == "confirm_tier":
        if action.override_tier:
            case["risk_tier"] = action.override_tier
            protocol = EscalationProtocols.PROTOCOLS.get(action.override_tier, EscalationProtocols.PROTOCOLS[RiskTier.LOW])
            case["tier_color"] = protocol["color"]
            case["action_title"] = protocol["action_title"]
        case["status"] = "Tier Validated by Counsellor"

    case["counsellor_actions"].append(action_entry)
    AUDIT_LOGS.insert(0, action_entry)
    return {"status": "success", "updated_case": case}


@app.get("/api/override-logs")
def get_override_logs():
    """
    Returns audit trail of all Human-in-the-Loop SVI Overrides.
    """
    overrides = [entry for entry in AUDIT_LOGS if entry.get("type") == "override"]
    return {
        "total_overrides": len(overrides),
        "logs": overrides
    }


@app.get("/api/audit-logs")
def get_audit_logs():
    """
    Returns complete chronological audit log of all human overrides & escalation actions.
    """
    return {
        "total_records": len(AUDIT_LOGS),
        "logs": AUDIT_LOGS
    }


@app.get("/api/vigilance-dashboard")
def get_vigilance_dashboard():
    """Expose the new Vigilance Dashboard aggregate, summary, and reportability metrics from the current in-memory case universe."""
    all_cases = list(CASES_DB.values())
    for c in all_cases:
        c["deadlines"] = compute_statutory_deadlines(c)

    total = len(all_cases)
    tier_counts = {RiskTier.LOW: 0, RiskTier.MODERATE: 0, RiskTier.HIGH: 0, RiskTier.CRITICAL: 0}
    overdue_deadlines = 0
    resolved_durations = []

    def is_applicable_poa(case_item):
        is_routine = (str(case_item.get("risk_tier", "")).strip().upper() == "LOW") and (float(case_item.get("svi_score", 0) or 0) == 0)
        return not is_routine and case_item.get("deadlines", {}).get("is_applicable", True) is not False

    for c in all_cases:
        t = c.get("risk_tier", RiskTier.LOW)
        if t in tier_counts:
            tier_counts[t] += 1

        dl = c.get("deadlines", {}) or compute_statutory_deadlines(c)
        if is_applicable_poa(c) and dl.get("is_overdue"):
            overdue_deadlines += 1

        if "resolved" in str(c.get("status", "")).lower() or "resolved" in str(c.get("action_title", "")).lower():
            start_dt = None
            try:
                start_dt = datetime.strptime(c.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")).split(".")[0], "%Y-%m-%d %H:%M:%S")
            except Exception:
                start_dt = datetime.now()
            end_dt = None
            ts = c.get("status_timestamp")
            if ts:
                try:
                    end_dt = datetime.strptime(ts.split(".")[0], "%Y-%m-%d %H:%M:%S")
                except Exception:
                    end_dt = datetime.now()
            if start_dt and end_dt:
                hours = max(0.0, (end_dt - start_dt).total_seconds() / 3600.0)
                resolved_durations.append(hours)

    chargesheets_on_time = sum(1 for c in all_cases if is_applicable_poa(c) and c.get("deadlines", {}).get("chargesheet", {}).get("status") in ["green", "amber"])
    chargesheets_late = sum(1 for c in all_cases if is_applicable_poa(c) and c.get("deadlines", {}).get("chargesheet", {}).get("status") == "red")
    relief_payments_on_time = sum(1 for c in all_cases if is_applicable_poa(c) and c.get("deadlines", {}).get("interim_relief", {}).get("status") in ["green", "amber"])
    relief_payments_late = sum(1 for c in all_cases if is_applicable_poa(c) and c.get("deadlines", {}).get("interim_relief", {}).get("status") == "red")

    avg_resolution_hours = round(sum(resolved_durations) / len(resolved_durations), 2) if resolved_durations else 0.0

    # Feature 9: Atrocity-Prone Area Signal calculation
    # Group available cases by district and calculate high/critical case density
    district_map: Dict[str, Dict[str, Any]] = {}
    for c in all_cases:
        dist = (c.get("district") or "Unknown District").strip()
        st = (c.get("state") or "State").strip()
        t = c.get("risk_tier", RiskTier.LOW)
        if dist not in district_map:
            district_map[dist] = {
                "district": dist,
                "state": st,
                "total_cases": 0,
                "critical_cases": 0,
                "high_cases": 0,
                "moderate_cases": 0,
                "low_cases": 0,
                "high_critical_count": 0,
                "is_flagged_atrocity_prone": False,
                "has_special_court": dist.lower() in EXCLUSIVE_SPECIAL_COURT_DISTRICTS
            }
        district_map[dist]["total_cases"] += 1
        if t == RiskTier.CRITICAL:
            district_map[dist]["critical_cases"] += 1
            district_map[dist]["high_critical_count"] += 1
        elif t == RiskTier.HIGH:
            district_map[dist]["high_cases"] += 1
            district_map[dist]["high_critical_count"] += 1
        elif t == RiskTier.MODERATE:
            district_map[dist]["moderate_cases"] += 1
        elif t == RiskTier.LOW:
            district_map[dist]["low_cases"] += 1

    ATROCITY_PRONE_THRESHOLD = 3
    flagged_districts = []
    all_district_summaries = []

    for dist, d_data in district_map.items():
        if d_data["high_critical_count"] >= ATROCITY_PRONE_THRESHOLD:
            d_data["is_flagged_atrocity_prone"] = True
            flagged_districts.append(d_data)
        all_district_summaries.append(d_data)

    flagged_districts.sort(key=lambda x: (x["high_critical_count"], x["total_cases"]), reverse=True)
    all_district_summaries.sort(key=lambda x: (x["high_critical_count"], x["total_cases"]), reverse=True)

    atrocity_prone_signals = {
        "title": "Districts showing atrocity-prone-level case density (based on available data) — cross-check against official atrocity-prone declarations.",
        "threshold_description": "3 or more Critical/High tier cases from the same district in the sample data",
        "threshold_value": ATROCITY_PRONE_THRESHOLD,
        "explanatory_note": (
            "Per a 2022 union government report, some states (e.g. Uttar Pradesh) had zero "
            "officially-declared atrocity-prone areas despite high case volumes — this module "
            "demonstrates how case data could proactively surface such gaps rather than relying solely on periodic manual review."
        ),
        "threshold_disclaimer": "Threshold is illustrative/configurable, not an official government criterion (the real declaration process likely uses additional factors this prototype doesn't have access to).",
        "flagged_districts": flagged_districts,
        "flagged_count": len(flagged_districts),
        "all_districts": all_district_summaries
    }

    return {
        "total_cases": total,
        "cases_by_risk_tier": {
            "Low": tier_counts.get(RiskTier.LOW, 0),
            "Moderate": tier_counts.get(RiskTier.MODERATE, 0),
            "High": tier_counts.get(RiskTier.HIGH, 0),
            "Critical": tier_counts.get(RiskTier.CRITICAL, 0)
        },
        "average_time_to_resolution_hours": avg_resolution_hours,
        "overdue_deadlines_count": overdue_deadlines,
        "summary": {
            "cases_registered_this_period": total,
            "chargesheets_filed_on_time": chargesheets_on_time,
            "chargesheets_filed_late": chargesheets_late,
            "relief_payments_made_on_time": relief_payments_on_time,
            "relief_payments_made_late": relief_payments_late,
            "chargesheets_on_time": chargesheets_on_time,
            "chargesheets_late": chargesheets_late,
            "relief_payments_on_time": relief_payments_on_time,
            "relief_payments_late": relief_payments_late
        },
        "atrocity_prone_signals": atrocity_prone_signals,
        "note": "PoA Rules, 1995 require Vigilance & Monitoring Committees to review case progress only twice yearly (January, July). This dashboard makes that review continuous instead of periodic, using the same underlying case data already captured by this system.",
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@app.get("/api/vigilance-dashboard/export")
def export_vigilance_dashboard():
    """Return the JSON snapshot for the dashboard's current summary and export it to a downloadable report file in the frontend."""
    return get_vigilance_dashboard()


@app.get("/api/samples")
def get_samples():
    sample_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_data", "synthetic_transcripts.json")
    if os.path.exists(sample_file):
        with open(sample_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


@app.get("/api/stats")
def get_stats():
    """Returns real-time triage statistics across the 4 tiers and statutory compliance counts."""
    all_cases = list(CASES_DB.values())
    total = len(all_cases)
    
    tier_counts = {RiskTier.LOW: 0, RiskTier.MODERATE: 0, RiskTier.HIGH: 0, RiskTier.CRITICAL: 0}
    channel_counts = {"portal": 0, "chatbot": 0, "ivrs": 0}
    pending_critical = 0
    approaching_deadlines = 0
    overdue_deadlines = 0

    for c in all_cases:
        t = c.get("risk_tier", RiskTier.LOW)
        if t in tier_counts:
            tier_counts[t] += 1
        ch = c.get("channel", "portal")
        channel_counts[ch] = channel_counts.get(ch, 0) + 1
        
        if t == RiskTier.CRITICAL and "Resolved" not in c.get("status", ""):
            pending_critical += 1

        # Calculate deadline status
        dl = compute_statutory_deadlines(c)
        c["deadlines"] = dl
        is_routine = (str(c.get("risk_tier", "")).strip().upper() == "LOW") and (float(c.get("svi_score", 0) or 0) == 0)
        if not is_routine and dl.get("is_applicable", True) is not False:
            if dl["is_overdue"]:
                overdue_deadlines += 1
            elif dl["is_approaching"]:
                approaching_deadlines += 1

    return {
        "total_cases": total,
        "tier_counts": tier_counts,
        "channel_counts": channel_counts,
        "pending_critical_alerts": pending_critical,
        "avg_svi": round(sum(c["svi_score"] for c in all_cases) / total, 1) if total > 0 else 0,
        "approaching_deadlines_count": approaching_deadlines,
        "overdue_deadlines_count": overdue_deadlines
    }


# Mount static frontend files if directory exists
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))
