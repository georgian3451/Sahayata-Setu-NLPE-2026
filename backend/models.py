"""
Data Models and Schemas for Sahayata Setu Platform
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class AudioTelemetry(BaseModel):
    pitch_variance_hz: Optional[float] = 45.0
    jitter_pct: Optional[float] = 1.2
    speech_rate_wpm: Optional[int] = 130
    pause_ratio: Optional[float] = 0.15


class AssessmentRequest(BaseModel):
    case_id: Optional[str] = Field(default=None, description="Optional existing Case ID for re-analysis on follow-up contact")
    text: str = Field(..., description="Transcript or text input from complainant/caller")
    channel: str = Field(default="portal", description="Source channel: portal, chatbot, or ivrs")
    language: str = Field(default="en", description="Selected or detected language: en, hi, bn, ta, te, mr")
    consent_given: bool = Field(default=True, description="Explicit consent flag")
    caller_alias: Optional[str] = Field(default=None, description="Synthetic caller identifier")
    district: Optional[str] = Field(default=None, description="Complainant or incident district name")
    state: Optional[str] = Field(default=None, description="Complainant or incident state name")
    audio_telemetry: Optional[AudioTelemetry] = None


class SviOverrideRequest(BaseModel):
    adjusted_score: int = Field(..., description="Counsellor adjusted SVI score (clamped to ±10 of original AI score)")
    reason: str = Field(..., min_length=3, description="Mandatory free-text reason for human override")
    counsellor_id: Optional[str] = "COUNSELLOR_NHAA_09"


class EscalationActionRequest(BaseModel):
    action_type: str = Field(..., description="Action: dispatch_police, trigger_witness_protection, assign_counsellor, schedule_callback, routine_queue, resolve")
    counsellor_notes: Optional[str] = None
    counsellor_id: Optional[str] = "COUNSELLOR_NHAA_09"


class TriageActionRequest(BaseModel):
    action_type: str = Field(..., description="Action: confirm_tier, dispatch_police, assign_counsellor, flag_witness_protection, resolve")
    counsellor_notes: Optional[str] = None
    override_tier: Optional[str] = None
    counsellor_id: Optional[str] = "COUNSELLOR_NHAA_09"


class FastForwardRequest(BaseModel):
    days: float = Field(default=8.0, description="Number of days to fast-forward case clock by")
    mode: str = Field(default="add", description="'add' to advance offset, 'set' to set exact days, or 'reset' to reset to 0")


class ContactLogRequest(BaseModel):
    counsellor_id: Optional[str] = "COUNSELLOR_NHAA_09"
    notes: Optional[str] = None


class LegalSectionUpdateRequest(BaseModel):
    section_code: str = Field(..., description="Section code under PoA Act, e.g. Section 3(2)(iv)")
    confirmed_in_fir: bool = Field(default=True, description="Whether section has been verified as invoked in the FIR")
    notes: Optional[str] = None
    officer_id: Optional[str] = "NODAL_OFFICER_01"


class CaseRecord(BaseModel):
    case_id: str
    timestamp: str
    channel: str
    language: str
    caller_alias: str
    district: str
    state: str
    transcript_preview: str
    full_transcript: str
    svi_score: int
    ai_svi_score: int
    risk_tier: str
    ai_risk_tier: str
    tier_color: str
    is_overridden: bool = False
    overridden_svi_score: Optional[int] = None
    override_reason: Optional[str] = None
    override_timestamp: Optional[str] = None
    override_history: List[Dict[str, Any]] = []
    status: str  # Pending Triage, Police Escalated, Counsellor Assigned, Resolved, etc.
    status_timestamp: Optional[str] = None
    audit_package_hash: Optional[str] = None
    audit_package_timestamp: Optional[str] = None
    last_contact_date: Optional[str] = None
    helpline_distress_signal_since_filing: bool = False
    retention_score: Optional[int] = None
    retention_risk: Optional[str] = "Low"
    retention_action: Optional[str] = None
    action_title: str
    action_description: str
    recommended_dispatch: str
    witness_protection_flag: bool
    police_liaison_required: bool
    has_psychological_crisis: bool = False
    crisis_banner_message: Optional[str] = None
    medical_assistance_required: bool = False
    medical_assistance_action: Optional[str] = None
    medical_matched_keywords: List[str] = []
    contact_count: int = 1
    previous_svi_score: Optional[int] = None
    previous_risk_tier: Optional[str] = None
    score_delta: Optional[int] = None
    trend: Optional[str] = None  # "Escalating", "De-escalating", "Stable"
    contact_history: List[Dict[str, Any]] = []
    detected_indicators: List[Dict[str, Any]]
    scoring_breakdown: Dict[str, Any]
    acoustic_telemetry: Optional[Dict[str, Any]] = None
    counsellor_actions: List[Dict[str, Any]] = []
    compensation_entitlement: Optional[Dict[str, Any]] = None
    suggested_legal_sections: Optional[List[Dict[str, Any]]] = None
    has_special_court: Optional[bool] = None
    special_court_flag: Optional[str] = None

