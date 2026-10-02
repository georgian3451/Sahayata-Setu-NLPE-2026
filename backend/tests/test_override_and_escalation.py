"""
Unit Tests for HITL SVI Override & PoA Act Escalation Action Endpoints
"""

from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from backend.main import (
    override_case_score, 
    escalate_case_action, 
    get_override_logs, 
    get_audit_logs,
    create_case,
    fast_forward_case_clock,
    get_stats,
    verify_audit_package,
    get_vigilance_dashboard,
    get_compensation_entitlement,
    compute_retention_risk,
    get_case_legal_sections,
    update_case_legal_section,
    get_case_special_court,
    evaluate_special_court_jurisdiction,
    EXCLUSIVE_SPECIAL_COURT_DISTRICTS,
    CASES_DB, 
    AUDIT_LOGS, 
    load_initial_sample_cases
)
from backend.models import (
    SviOverrideRequest, 
    EscalationActionRequest, 
    AssessmentRequest, 
    FastForwardRequest,
    LegalSectionUpdateRequest
)
from backend.scoring_engine import RiskTier


@pytest.fixture(autouse=True)
def reset_database():
    """Reset the database before each test."""
    CASES_DB.clear()
    AUDIT_LOGS.clear()
    load_initial_sample_cases()


def test_hitl_override_within_bounds_and_tier_recalculation():
    """Test valid override within +-10 points that recalculates tier."""
    case_id = "CASE-2026-0823"
    assert case_id in CASES_DB
    original_score = CASES_DB[case_id]["ai_svi_score"]
    assert original_score < 79  # High tier
    
    target_score = min(100, original_score + 8)
    
    req = SviOverrideRequest(
        adjusted_score=target_score,
        reason="Direct threat to life identified during telephonic intake; escalation required.",
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    
    res = override_case_score(case_id, req)
    assert res["status"] == "success"
    assert res["updated_case"]["svi_score"] == target_score
    assert res["updated_case"]["ai_svi_score"] == original_score
    assert res["updated_case"]["is_overridden"] is True
    assert res["updated_case"]["override_reason"] == "Direct threat to life identified during telephonic intake; escalation required."
    
    if target_score >= 79:
        assert res["updated_case"]["risk_tier"] == RiskTier.CRITICAL
    
    # Check override logs
    log_res = get_override_logs()
    logs = log_res["logs"]
    assert len(logs) == 1
    assert logs[0]["case_id"] == case_id
    assert logs[0]["original_score"] == original_score
    assert logs[0]["overridden_score"] == target_score


def test_hitl_override_rejects_exceeding_ten_points():
    """Test that overrides exceeding +-10 points are rejected with 400 Bad Request."""
    case_id = "CASE-2026-0814"  # Low tier
    original_score = CASES_DB[case_id]["ai_svi_score"]
    
    req = SviOverrideRequest(
        adjusted_score=original_score + 15,
        reason="Trying to boost by too much",
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        override_case_score(case_id, req)
    
    assert exc_info.value.status_code == 400
    assert "hard-capped at ±10 points" in exc_info.value.detail
    assert CASES_DB[case_id]["is_overridden"] is False


def test_hitl_override_requires_non_empty_reason():
    """Test that override fails if reason is empty or whitespace."""
    case_id = "CASE-2026-0819"
    original_score = CASES_DB[case_id]["ai_svi_score"]
    
    req = SviOverrideRequest(
        adjusted_score=original_score + 3,
        reason="   ",
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    
    with pytest.raises(HTTPException) as exc_info:
        override_case_score(case_id, req)
    
    assert exc_info.value.status_code == 400
    assert "reason for override is mandatory" in exc_info.value.detail.lower()


def test_witness_retention_risk_escalates_high_when_last_contact_is_stale_and_distress_signal_arrives():
    """Regression: a witness case should expose a separate retention-risk metric that escalates high when last contact is stale and a new distress signal is present."""
    req = AssessmentRequest(
        text="We are being threatened and need urgent help.",
        channel="portal",
        consent_given=True,
        language="en"
    )

    res = create_case(req)
    case = res["case"]
    case_id = case["case_id"]

    old_date = (datetime.now() - timedelta(days=45)).strftime("%Y-%m-%d")
    CASES_DB[case_id]["last_contact_date"] = old_date
    CASES_DB[case_id]["helpline_distress_signal_since_filing"] = True

    case_from_db = compute_retention_risk(case_id)
    assert case_from_db["retention_risk"] == "High"
    assert case_from_db["retention_badge"] == "High"
    assert "Proactive counsellor check-in recommended" in case_from_db["retention_action"]


def test_override_log_records_cross_boundary_recalculation_and_reason():
    """Regression: a valid override that crosses a tier boundary must store the original AI score, overridden score, reason and timestamp in the override log."""
    case_id = "CASE-2026-0823"
    case = CASES_DB[case_id]
    original_score = case["ai_svi_score"]

    req = SviOverrideRequest(
        adjusted_score=min(100, original_score + 8),
        reason="Escalating threat context confirms a higher current vulnerability level.",
        counsellor_id="COUNSELLOR_NHAA_09"
    )

    res = override_case_score(case_id, req)
    assert res["status"] == "success"
    assert res["updated_case"]["is_overridden"] is True
    assert res["updated_case"]["ai_svi_score"] == original_score
    assert res["updated_case"]["svi_score"] == min(100, original_score + 8)
    assert res["updated_case"]["risk_tier"] == RiskTier.CRITICAL

    log_res = get_override_logs()
    logs = log_res["logs"]
    assert len(logs) >= 1
    latest = logs[0]
    assert latest["case_id"] == case_id
    assert latest["original_score"] == original_score
    assert latest["overridden_score"] == min(100, original_score + 8)
    assert latest["reason"] == "Escalating threat context confirms a higher current vulnerability level."
    assert latest["timestamp"]


def test_audit_package_hash_is_stored_and_detects_tamper():
    """A newly scored case should carry a stored SHA-256 audit package hash and the verifier should report a mismatch after the transcript is manually altered."""
    assessment = AssessmentRequest(
        text="A mob gathered outside our house and threatened to burn us. We are scared and cannot leave.",
        channel="portal",
        language="en",
        consent_given=True,
        caller_alias="Citizen_Audit_Package_01"
    )

    create_response = create_case(assessment)
    case = create_response["case"]
    case_id = case["case_id"]

    assert case.get("audit_package_hash")
    assert case.get("audit_package_timestamp")

    # Tamper with the stored transcript in the in-memory case store to simulate record alteration.
    CASES_DB[case_id]["full_transcript"] = "This is a deliberately altered transcript for integrity testing."

    result = verify_audit_package(case_id)
    assert result["status"] == "success"
    assert result["integrity_ok"] is False
    assert "mismatch" in result["message"].lower()


def test_vigilance_dashboard_aggregates_existing_sample_case_data():
    """The Vigilance Dashboard route should expose the same in-memory case universe and deadline tracker indicators already visible through the triage desk."""
    dashboard = get_vigilance_dashboard()

    assert dashboard["total_cases"] == len(CASES_DB)
    assert dashboard["cases_by_risk_tier"]["Critical"] >= 0
    assert dashboard["cases_by_risk_tier"]["High"] >= 0
    assert dashboard["cases_by_risk_tier"]["Moderate"] >= 0
    assert dashboard["cases_by_risk_tier"]["Low"] >= 0
    assert dashboard["overdue_deadlines_count"] >= 0
    assert dashboard["summary"]["cases_registered_this_period"] == len(CASES_DB)
    expected_poa_cases = len([c for c in CASES_DB.values() if not (str(c.get("risk_tier")).upper() == "LOW" and float(c.get("svi_score", 0)) == 0)])
    assert dashboard["summary"]["chargesheets_on_time"] + dashboard["summary"]["chargesheets_late"] == expected_poa_cases
    assert dashboard["summary"]["relief_payments_on_time"] + dashboard["summary"]["relief_payments_late"] == expected_poa_cases


def test_compensation_entitlement_suggests_arson_case_category_and_tracker():
    """A Critical sample case should be mapped to the PoA compensation schedule and show an editable three-stage tracking table in the detail payload."""
    case_id = "CASE-2026-0831"
    entitlement = get_compensation_entitlement(case_id)

    assert entitlement["case_id"] == case_id
    assert entitlement["category"] == "Arson leading to complete homelessness"
    assert entitlement["amount"] == "Rs 3,00,000"
    assert entitlement["payment_tracker"]["At FIR Registration"]["paid"] is False
    assert entitlement["payment_tracker"]["At Chargesheet Filing"]["paid"] is False
    assert entitlement["payment_tracker"]["At Conviction"]["paid"] is False


def test_escalation_actions_and_status_update():
    """Test tier-specific escalation actions and simulation disclaimer status."""
    case_id = "CASE-2026-0831"  # Critical tier case
    
    # 1. Dispatch Police Liaison
    req1 = EscalationActionRequest(
        action_type="dispatch_police",
        counsellor_notes="Urgent mob threat verified. Liaison officer dispatched.",
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    res1 = escalate_case_action(case_id, req1)
    
    assert res1["updated_case"]["status"] == "Police Liaison Dispatched (Simulation)"
    assert res1["updated_case"]["police_liaison_required"] is True
    assert "simulation" in res1["audit_entry"]["simulation_notice"].lower()
    assert res1["updated_case"]["status_timestamp"]

    # 2. Trigger Witness Protection Assessment on same case
    req2 = EscalationActionRequest(
        action_type="trigger_witness_protection",
        counsellor_notes="Threat assessment indicates need for safe house.",
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    res2 = escalate_case_action(case_id, req2)
    assert res2["updated_case"]["status"] == "Witness Protection Assessment Triggered (Simulation)"
    assert res2["updated_case"]["witness_protection_flag"] is True
    assert res2["updated_case"]["status_timestamp"]
    
    # Step 2: Escalate
    req_escalate = EscalationActionRequest(
        action_type="schedule_callback",
        counsellor_notes="Callback scheduled for tomorrow 10:00 AM.",
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    res_escalate = escalate_case_action(case_id, req_escalate)
    assert res_escalate["status"] == "success"
    
    # Check escalation audit logs recorded per simulated action request.
    audit_res = get_audit_logs()
    logs = audit_res["logs"]
    assert len(logs) == 3
    types = [l["type"] for l in logs]
    assert all(t == "escalation_action" for t in types)


def test_statutory_deadline_case_creation_and_demo_fast_forward_flow():
    """Newly created cases should inherit deadline countdowns and the demo clock API should move Interim Relief into overdue/red."""
    assessment = AssessmentRequest(
        text="We were denied drinking water from the common village well. They are harassing our family and shopkeeper refused ration to us. We need legal counselling.",
        channel="portal",
        language="en",
        consent_given=True,
        caller_alias="Citizen_Test_Deadline"
    )

    create_response = create_case(assessment)
    case = create_response["case"]
    case_id = case["case_id"]

    assert case["deadlines"]["interim_relief"]["status"] == "green"
    assert case["deadlines"]["chargesheet"]["status"] == "green"
    assert case["deadlines"]["interim_relief"]["days_remaining"] == pytest.approx(7.0, abs=0.5)
    assert case["deadlines"]["chargesheet"]["days_remaining"] == pytest.approx(60.0, abs=0.5)

    # Use the existing fast-forward endpoint and simulation model to age the case past the 7-day interim relief window.
    fast_forward_response = fast_forward_case_clock(case_id, FastForwardRequest(days=8, mode="add"))
    updated = fast_forward_response["updated_case"]

    assert updated["deadlines"]["interim_relief"]["status"] == "red"
    assert updated["deadlines"]["interim_relief"]["is_overdue"] is True

    stats = get_stats()
    assert stats["overdue_deadlines_count"] >= 1


def test_suggested_legal_sections_for_mob_arson_case():
    """
    Test that the mob-arson sample case (CASE-2026-0831) surfaces sensible PoA sections
    including Section 3(2)(iv) (Arson), Section 3(2)(v) (Murder Threat), and Section 3(1)(za)/Section 3(1)(n) (Confinement).
    Also confirms advisory disclaimer and confirmation toggle endpoint.
    """
    case_id = "CASE-2026-0831"  # Mob-arson sample case
    res = get_case_legal_sections(case_id)
    
    assert res["case_id"] == case_id
    assert "advisory" in res["advisory_label"].lower()
    assert "never presented as an automatic legal determination" in res["advisory_label"].lower()
    assert "confirm these were invoked in the fir" in res["prompt"].lower()

    sections = res["suggested_sections"]
    section_codes = [s["section_code"] for s in sections]
    
    # Must include arson section
    assert "Section 3(2)(iv)" in section_codes
    # Must include murder threat / 10+ yr IPC offence
    assert "Section 3(2)(v)" in section_codes
    # Must include wrongful confinement / obstruction
    assert "Section 3(1)(za) & Section 3(1)(n)" in section_codes

    # Verify confirmation toggle
    update_res = update_case_legal_section(
        case_id, 
        LegalSectionUpdateRequest(
            section_code="Section 3(2)(iv)",
            confirmed_in_fir=True,
            notes="Verified in FIR No. 104/2026",
            officer_id="NODAL_OFFICER_MP_02"
        )
    )
    assert update_res["status"] == "success"
    assert update_res["confirmed_in_fir"] is True
    
    # Check in database
    case = CASES_DB[case_id]
    arson_sec = next(s for s in case["suggested_legal_sections"] if s["section_code"] == "Section 3(2)(iv)")
    assert arson_sec["confirmed_in_fir"] is True


def test_suggested_legal_sections_for_social_boycott_narrative():
    """Test that newly assessed social boycott narrative surfaces Section 3(1)(zc)."""
    assessment = AssessmentRequest(
        text="The village panchayat ordered a social boycott against us and stopped water from the common village well. Local shop refused ration.",
        channel="portal",
        language="en",
        consent_given=True,
        caller_alias="Citizen_Boycott_Test"
    )

    create_res = create_case(assessment)
    case_id = create_res["case"]["case_id"]

    legal_res = get_case_legal_sections(case_id)
    section_codes = [s["section_code"] for s in legal_res["suggested_sections"]]
    assert "Section 3(1)(zc)" in section_codes  # Social boycott


def test_routine_grievance_excluded_from_statutory_deadlines():
    """LOW risk tier case with SVI 0 (routine administrative grievance) displays N/A and is excluded from overdue counts."""
    assessment = AssessmentRequest(
        text="Hello, I am writing to check the status of my post-matric scholarship application under the welfare scheme. Documents submitted 4 weeks ago.",
        channel="portal",
        language="en",
        consent_given=True,
        caller_alias="Citizen_Routine_Admin"
    )

    create_res = create_case(assessment)
    case = create_res["case"]
    assert case["risk_tier"] == "Low"
    assert case["svi_score"] == 0
    assert case["deadlines"]["is_applicable"] is False
    assert case["deadlines"]["status_text"] == "N/A — Routine Grievance"
    assert case["deadlines"]["is_overdue"] is False


def test_poa_act_spelling_in_moderate_protocol():
    """Verify that EscalationProtocols for Moderate tier uses 'PoA Act, 1989'."""
    from backend.scoring_engine import EscalationProtocols, RiskTier
    mod_protocol = EscalationProtocols.PROTOCOLS[RiskTier.MODERATE]
    assert "PoA Act, 1989" in mod_protocol["action_description"]
    assert "POA Act" not in mod_protocol["action_description"]


def test_all_contributing_factors_sum_to_svi_score():
    """Verify that all contributing factors sum up exactly to the total displayed SVI score."""
    from backend.scoring_engine import StressScoringEngine
    # 1. Moderate case
    res_mod = StressScoringEngine.evaluate_text(
        "We were denied drinking water from the common village well. They are harassing our family and shopkeeper refused ration to us. We need legal counselling.",
        channel="portal"
    )
    factors_mod = res_mod.get("all_contributing_factors", [])
    assert len(factors_mod) > 0
    assert sum(f["points"] for f in factors_mod) == res_mod["svi_score"]

    # 2. Critical case with cap
    res_crit = StressScoringEngine.evaluate_text(
        "An armed mob has surrounded our house right now with swords and weapons! They are breaking the door and screaming they will kill us and burn our house! We are trapped inside screaming and begging for life, please send police immediately!",
        channel="ivrs",
        audio_telemetry={"pitch_variance_hz": 92.0, "jitter_pct": 3.2, "speech_rate_wpm": 190, "pause_ratio": 0.35}
    )
    factors_crit = res_crit.get("all_contributing_factors", [])
    assert len(factors_crit) > 0
    assert sum(f["points"] for f in factors_crit) == res_crit["svi_score"]


def test_follow_up_case_reanalysis_escalating_and_deescalating():
    """Verify that re-analyzing an existing case tracks contact count, score delta, and trend."""
    # Step 1: Create initial low-risk case
    initial_req = AssessmentRequest(
        channel="portal",
        text="I want to check my welfare scholarship status and verify application documents.",
        language="en",
        consent_given=True
    )
    initial_res = create_case(initial_req)
    case_id = initial_res["case"]["case_id"]
    initial_score = initial_res["case"]["svi_score"]
    assert initial_res["case"]["contact_count"] == 1
    assert initial_res["case"]["trend"] == "1st Contact"

    # Step 2: Follow-up 2nd contact with escalating threat
    escalating_req = AssessmentRequest(
        case_id=case_id,
        channel="helpline",
        text="They came to our home and threatened to kill us if we report! We are terrified and locked inside!",
        language="en",
        consent_given=True
    )
    followup_res = create_case(escalating_req)
    updated_record = followup_res["case"]
    assert updated_record["case_id"] == case_id
    assert updated_record["contact_count"] == 2
    assert updated_record["previous_svi_score"] == initial_score
    assert updated_record["score_delta"] > 0
    assert updated_record["trend"] == "Escalating"
    assert len(updated_record["contact_history"]) == 1

    step2_score = updated_record["svi_score"]

    # Step 3: Follow-up 3rd contact with de-escalating situation
    deescalating_req = AssessmentRequest(
        case_id=case_id,
        channel="portal",
        text="Police patrol visited today and the situation is calmer now. We are safe for the moment.",
        language="en",
        consent_given=True
    )
    third_res = create_case(deescalating_req)
    third_record = third_res["case"]
    assert third_record["contact_count"] == 3
    assert third_record["previous_svi_score"] == step2_score
    assert third_record["score_delta"] < 0
    assert third_record["trend"] == "De-escalating"
    assert len(third_record["contact_history"]) == 2


def test_override_with_standard_reason_dropdown_options():
    """Verify counsellor override succeeds with standardized audit reasons."""
    case_id = "CASE-2026-0814"
    original_score = CASES_DB[case_id]["ai_svi_score"]
    
    standard_reason = "AI underestimated severity: Caller revealed off-record physical intimidation during intake."
    req = SviOverrideRequest(
        adjusted_score=original_score + 5,
        reason=standard_reason,
        counsellor_id="COUNSELLOR_NHAA_09"
    )
    res = override_case_score(case_id, req)
    assert res["status"] == "success"
    assert res["updated_case"]["override_reason"] == standard_reason
    
    # Verify in override logs
    logs = get_override_logs()["logs"]
    assert any(log["case_id"] == case_id and log["reason"] == standard_reason for log in logs)


def test_special_court_jurisdiction_flag_behavior():
    """
    Feature 8 Test:
    Verify that creating a case in a district with an Exclusive Special Court (e.g. Belagavi)
    identifies the special court and produces NO delay flag.
    Verify that creating a case in a district without an Exclusive Special Court (e.g. Kanpur Nagar)
    correctly sets has_special_court=False and surfaces the Structural Delay Risk flag.
    """
    # 1. District in sample Exclusive Special Court list
    req_special = AssessmentRequest(
        text="We were barred from the local public hall in Belagavi.",
        channel="portal",
        language="en",
        consent_given=True,
        caller_alias="Citizen_Belagavi_Court_Test",
        district="Belagavi",
        state="Karnataka"
    )
    res_special = create_case(req_special)
    case_special = res_special["case"]
    assert case_special["district"] == "Belagavi"
    assert case_special["has_special_court"] is True
    assert case_special["special_court_flag"] is None

    special_court_endpoint_res = get_case_special_court(case_special["case_id"])
    assert special_court_endpoint_res["has_special_court"] is True
    assert special_court_endpoint_res["special_court_flag"] is None

    # 2. District NOT in sample Exclusive Special Court list
    req_regular = AssessmentRequest(
        text="We were barred from the village well in a district without exclusive special court.",
        channel="portal",
        language="en",
        consent_given=True,
        caller_alias="Citizen_Regular_Court_Test",
        district="Unlisted District",
        state="Sample State"
    )
    res_regular = create_case(req_regular)
    case_regular = res_regular["case"]
    assert case_regular["district"] == "Unlisted District"
    assert case_regular["has_special_court"] is False
    assert "Structural Delay Risk — no Exclusive Special Court identified in this district" in case_regular["special_court_flag"]
    assert "case may route to a regular Sessions Court" in case_regular["special_court_flag"]

    regular_court_endpoint_res = get_case_special_court(case_regular["case_id"])
    assert regular_court_endpoint_res["has_special_court"] is False
    assert "Structural Delay Risk" in regular_court_endpoint_res["special_court_flag"]


def test_atrocity_prone_area_signals_in_vigilance_dashboard():
    """
    Feature 9 Test:
    Verify that Vigilance Dashboard aggregates cases by district and surfaces atrocity-prone signals.
    With the sample cases loaded (including 3 High/Critical cases in Morena), Morena must show up
    in the flagged districts list, and the required 2022 Union Government report context note is present.
    """
    dashboard = get_vigilance_dashboard()
    assert "atrocity_prone_signals" in dashboard

    signals = dashboard["atrocity_prone_signals"]
    assert signals["threshold_value"] == 3
    assert "3 or more Critical/High tier cases" in signals["threshold_description"]
    assert "Per a 2022 union government report" in signals["explanatory_note"]
    assert "zero officially-declared atrocity-prone areas" in signals["explanatory_note"]
    assert "illustrative/configurable" in signals["threshold_disclaimer"]

    flagged = signals["flagged_districts"]
    flagged_district_names = [d["district"] for d in flagged]
    
    # Morena district in sample data has 3 High/Critical cases (CASE-2026-0831, CASE-2026-0832, CASE-2026-0833)
    assert "Morena" in flagged_district_names
    morena_entry = next(d for d in flagged if d["district"] == "Morena")
    assert morena_entry["high_critical_count"] >= 3
    assert morena_entry["is_flagged_atrocity_prone"] is True


