/**
 * Sahayata Setu (सहायता सेतु) — Frontend Application Logic
 * Problem Statement: SIH26093 (Ministry of Social Justice & Empowerment)
 * Team: InnovateX
 */

const API_BASE = window.location.origin;

// State Management
const state = {
  currentLang: 'en',
  currentChannel: 'portal',
  activeAssessment: null,
  cachedCases: [],
  audioSimulating: false,
  sampleDatabase: [],
  currentTriageView: 'queue',
  activeOverrideCase: null,
  activeEscalationCase: null,
  activeEscalationAction: null,
  cachedAuditLogs: []
};

// Multilingual i18n Strings (English, Hindi, Bengali, Tamil)
const TRANSLATIONS = {
  en: {
    // Top Bar & Navigation
    ministry_title: "Ministry of Social Justice & Empowerment",
    gov_sub: "Government of India • Smart India Hackathon 2026 (SIH26093)",
    helpline_label: "NHAA Toll-Free:",
    badge_synthetic: "SYNTHETIC DATA ONLY",
    prototype_disclaimer: "Prototype Demonstration: Contains zero citizen PII. AI operates strictly as a decision-support triage aid with Human-in-the-Loop verification.",
    team_label: "Team:",
    brand_tagline: "Intelligent Stress & Trauma Assessment for Atrocity Helpline Triage",
    tab_intake: "Multi-Channel Intake",
    tab_queue: "Counsellor Triage Desk",
    tab_audit: "Explainability & Landscape",
    tab_vigilance: "Vigilance Dashboard",
    vigilance_note: "PoA Rules, 1995 require Vigilance & Monitoring Committees to review case progress only twice yearly (January, July). This dashboard makes that review continuous instead of periodic, using the same underlying case data already captured by this system.",


    // Channel Pills & Titles
    channel_portal: "Portal Form",
    channel_chatbot: "Chatbot",
    channel_ivrs: "IVRS Stream",
    channel_portal_title: "Portal Web Form",
    channel_chatbot_title: "Interactive Chatbot",
    channel_ivrs_title: "14566 IVRS Voice Call",

    // Tab 1: Intake Studio
    intake_title: "Multi-Channel Intake Simulator",
    intake_subtitle: "Ingest statements via Portal Web Form, Chatbot, or IVRS Speech Audio",
    quick_presets: "Quick Test Cases:",
    preset_t1_low: "T1: Low (Admin)",
    preset_t2_mod: "T2: Moderate (Water Denial - Hindi)",
    preset_t3_high: "T3: High (Confinement)",
    preset_t4_crit_hi: "T4: Critical (Mob Arson - Hindi)",
    preset_t4_crit_bn: "T4: Critical (Siege - Bengali)",
    preset_t3_high_ta: "T3: High (Boycott - Tamil)",

    // Audio Stream Telemetry
    audio_telemetry_title: "📞 14566 IVRS Voice Biomarker Telemetry",
    ser_confidence_tag: "SER Confidence:",
    audio_sim_btn: "Simulate Live Voice Stream",
    audio_sim_pause: "Pause Voice Simulation",
    lbl_pitch_var: "Pitch Var:",
    lbl_jitter: "Jitter:",
    lbl_rate: "Rate:",

    // Input Form
    transcript_label: "Citizen Statement / Speech-to-Text Transcript:",
    transcript_placeholder: "Enter or paste caller statement / incident description (English, Hindi, Bengali, Tamil)...",
    char_count_suffix: "characters",
    consent_statement: "Citizen Consent Gate: I consent to AI-assisted distress screening for emergency triage prioritization under NHAA protocol.",
    btn_evaluate: "Analyze Stress & Risk Tier",
    btn_evaluating: "Analyzing Signals...",
    btn_clear: "Clear",
    btn_save_queue: "Push to Live Triage Queue",

    // Tab 1: SVI Result Card
    analysis_title: "Stress Vulnerability Index (SVI)",
    analysis_subtitle: "Transparent mathematical scoring with explainable signal drivers",
    awaiting_input: "Awaiting Input",
    gauge_low: "0 Low",
    gauge_mod: "31 Mod",
    gauge_high: "56 High",
    gauge_crit: "79-100 Crit",
    sla_awaiting: "SLA: --",
    protocol_awaiting_title: "Awaiting Assessment",
    protocol_awaiting_desc: "Submit a statement or select a test case to compute the transparent Stress Vulnerability Index and view mandated NHAA escalation steps.",
    mandated_action_label: "Mandated Action:",
    explainable_signals_title: "🔍 Explainable Vulnerability Signals",
    no_indicators_text: "No active indicators evaluated yet.",
    no_indicators_routine: "No critical atrocity or trauma indicators identified. Routine grievance.",
    math_formula_title: "📐 Auditable SVI Math Formula:",
    math_base: "Base",
    math_indicators: "Indicators",
    math_context: "Context",
    math_acoustic: "Acoustic",
    flag_police_liaison: "🚨 Same-Day Police Liaison Triggered",
    flag_witness_protection: "🛡️ Witness Protection Scheme Check Mandated",
    flag_medical_referral: "🏥 Medical Assistance Mandated: Nearest Primary Health Centre (PHC) / District Hospital Referral",
    lbl_medical_short: "Medical Mandated (PHC)",
    ind_crisis: "Self-Harm & Psychological Crisis Risk",
    crisis_banner_heading: "MENTAL HEALTH CRISIS INDICATOR DETECTED",
    crisis_banner_text: "Immediate referral to KIRAN Mental Health Helpline (1800-599-0019, toll-free, 24/7) + Same-day Psychiatric/Counselling Consult Mandated",
    preset_t5_crisis_hi: "T5: Psychological Crisis (Hindi)",
    preset_t6_high_te: "T6: High (Boycott - Telugu)",
    preset_t7_high_mr: "T7: High (Boycott/Pressure - Marathi)",
    trend_escalating: "Escalating",
    trend_deescalating: "De-escalating",
    trend_stable: "Stable",
    trend_first_contact: "1st Contact",
    lbl_existing_case_id: "Case ID (Optional — For Follow-up Contact Re-Analysis):",
    hint_existing_case_id: "Tracks score trend on repeat touchpoint",
    placeholder_existing_case_id: "Leave blank for new case, or enter existing ID (e.g. CASE-2026-0814)...",
    opt_reason_placeholder: "-- Select Reason for Override --",
    opt_reason_underestimated: "AI underestimated severity",
    opt_reason_overestimated: "AI overestimated severity",
    opt_reason_followup: "Additional context from follow-up call",
    opt_reason_other: "Other (specify)",

    // Tab 2: Counsellor Triage Desk Metrics & Toolbar
    stat_total_cases: "Total Intake Cases",
    stat_crit_alerts: "Critical Red Alerts",
    stat_high_priority: "High Priority (Same Day)",
    stat_avg_svi: "Average SVI Stress Score",
    stat_statutory_deadlines: "PoA Statutory Deadlines (7d/60d)",
    lbl_stat_overdue: "Overdue",
    lbl_stat_approaching: "Approaching",
    subnav_live_queue: "Live Risk-Prioritized Queue",
    subnav_override_log: "Override Log",
    subnav_hitl_audit: "HITL Override & Audit Trail",
    queue_title: "Live Atrocity Helpline Triage Queue",
    queue_subtitle: "Real-time risk-sorted queue: Highest trauma/threat cases elevated first",
    filter_risk_tier: "Risk Tier:",
    opt_all_tiers: "All Tiers",
    opt_tier_crit: "🚨 Critical (79-100)",
    opt_tier_high: "⚠️ High (56-78)",
    opt_tier_mod: "🟡 Moderate (31-55)",
    opt_tier_low: "🟢 Low (0-30)",
    filter_channel: "Channel:",
    opt_all_channels: "All Channels",
    opt_channel_ivrs: "📞 IVRS",
    opt_channel_chatbot: "💬 Chatbot",
    opt_channel_portal: "📋 Portal",
    search_placeholder: "Search case ID, keyword, district...",
    btn_refresh: "Refresh",

    // Tab 2: Queue Table Headers & Actions
    th_case_id: "Case ID",
    th_channel: "Channel",
    th_svi_score: "SVI Score",
    th_risk_tier: "Risk Tier & Override",
    th_sla_action: "SLA & Recommended Action",
    th_deadlines: "Statutory Deadlines (PoA)",
    th_key_triggers: "Key Trigger Signals",
    th_status: "Status",
    th_actions: "Actions",
    demo_clock_tag: "DEMO CLOCK:",
    lbl_interim_relief_short: "Interim Relief (7d)",
    lbl_chargesheet_short: "Chargesheet (60d)",
    lbl_deadline_overdue: "OVERDUE",
    lbl_deadline_rem: "rem",
    lbl_reset_clock: "Reset",
    loading_queue: "Loading live triage queue...",
    empty_queue: "No matching cases found in queue.",
    override_log_title: "Override Log",
    override_log_subtitle: "Case ID, original AI score, overridden score, reason, and timestamp.",
    loading_override_log: "Loading override log entries...",
    btn_refresh_override_logs: "Refresh Override Log",
    search_override_log: "Filter by Case ID or reason...",
    btn_override: "Override",
    btn_overridden_label: "Overridden by counsellor (AI: {score})",
    btn_act_police: "🚨 Dispatch Police Liaison",
    btn_act_witness: "🛡️ Trigger Witness Protection",
    btn_act_counsellor: "🧑‍⚕️ Assign Duty Counsellor",
    btn_act_callback: "📞 Schedule Callback",
    btn_act_routine: "📋 Routine Queue",
    btn_act_details: "👁️ Case Details",
    routine_query: "Routine query",

    // Tab 2: Audit Trail Card & Table
    audit_trail_title: "HITL SVI Override & Action Audit Trail",
    audit_trail_subtitle: "Complete chronological record proving human oversight, score adjustments, and triage actions",
    btn_refresh_audit: "Refresh Audit Trail",
    th_timestamp: "Timestamp",
    th_event_type: "Event Type",
    th_case_citizen: "Case ID & Citizen",
    th_ai_score: "AI Score",
    th_overridden_score: "Overridden Score",
    th_tier_shift: "Tier Shift",
    th_justification_notes: "Counsellor Justification / Action Notes",
    th_counsellor_id: "Counsellor ID",
    loading_audit: "Loading audit log entries...",
    empty_audit: "No override or escalation audit events recorded yet.",
    badge_svi_override: "⚖️ SVI Override",
    badge_esc_action: "🚨 Escalation Action",
    unchanged_tier: "Unchanged",
    lbl_override_reason_prefix: "Override Reason:",
    lbl_action_prefix: "Action:",
    counsellor_default_note: "Standard protocol executed.",

    // Tab 3: Explainability, Landscape & Ethics
    tab3_title: "Explainability Architecture, Competitive Landscape & Ethical Guardrails",
    tab3_subtitle: "SIH26093 Problem Statement Context — Ministry of Social Justice & Empowerment",
    sec1_title: "1. Landscape Analysis: How Sahayata Setu Fills the Operational Gap",
    sec1_intro: "While general-purpose voice AI exists (e.g. Manodayam for defence personnel, Vocalysis for hospital stress, and academic SER benchmarks), none are tailored to India's caste-atrocity legal and helpline workflow (NHAA 14566).",
    th_comp_platform: "Platform / System",
    th_comp_focus: "Primary Focus",
    th_comp_models: "Speech/Text Models",
    th_comp_legal: "Legal & Escalation Mapping",
    th_comp_explain: "Explainability Layer",
    th_comp_channel: "NHAA Multi-Channel (14566)",
    comp_manodayam_focus: "Armed forces / Defence stress screening",
    comp_manodayam_models: "Acoustic voice biomarkers",
    comp_manodayam_legal: "❌ Military wellness only",
    comp_manodayam_explain: "⚠️ Black-box risk index",
    comp_manodayam_channel: "❌ Telephony / IVRS only",
    comp_vocalysis_focus: "Hospital & school mental health",
    comp_vocalysis_models: "Speech acoustics",
    comp_vocalysis_legal: "❌ Generic counselling advice",
    comp_vocalysis_explain: "⚠️ Score only without signals",
    comp_vocalysis_channel: "❌ App / Single-channel",
    comp_ser_focus: "Cross-corpus emotion recognition",
    comp_ser_models: "RAVDESS / IEMOCAP / IndicSER",
    comp_ser_legal: "❌ Academic benchmark only (45–70% accuracy)",
    comp_ser_explain: "❌ Raw softmax class",
    comp_ser_channel: "❌ No helpline queue integration",
    comp_setu_focus: "NHAA 14566 Caste Atrocity Triage",
    comp_setu_models: "Multilingual Indic + Acoustic Fusion",
    comp_setu_legal: "✅ 4-Tier Legal Ladder (Police/PoA Act/Witness Protection)",
    comp_setu_explain: "✅ Full transparent keyword & factor breakdown",
    comp_setu_channel: "✅ Native IVRS + Chatbot + Portal Queue",

    sec2_title: "2. Auditable Stress Vulnerability Index (SVI) Formula",
    weight_lethal_title: "Lethal Physical Threat (Max 28 pts)",
    weight_lethal_desc: "Murder, arson, mob violence, weapons, swords, firearms (Unit: 14 pts/hit)",
    weight_confinement_title: "Restricted Confinement (Max 14 pts)",
    weight_confinement_desc: "Barricaded, roads blocked, surrounded, hostage (Unit: 7 pts/hit)",
    weight_panic_title: "Panic & Extreme Fear (Max 12 pts)",
    weight_panic_desc: "Screaming, crying children, pleading for life (Unit: 6 pts/hit)",
    weight_boycott_title: "Boycott & Discrimination (Max 16 pts)",
    weight_boycott_desc: "Water well denial, ration boycott, village ostracization (Unit: 8 pts/hit)",
    weight_pressure_title: "Institutional Pressure (Max 12 pts)",
    weight_pressure_desc: "Police refusal of FIR, forced compromise, threats to withdraw (Unit: 6 pts/hit)",
    weight_urgency_title: "Temporal Urgency (Max 14 pts)",
    weight_urgency_desc: "Happening right now, breaking in at door (Unit: 7 pts/hit)",

    sec3_title: "3. Privacy-by-Design & Human-in-the-Loop Ethics",
    ethics_pii_title: "Zero-PII Storage",
    ethics_pii_desc: "Transcripts are processed in-memory. Citizen names and numbers are replaced with synthetic cryptographic aliases (e.g. Citizen_R_71).",
    ethics_consent_title: "Consent-Gated Processing",
    ethics_consent_desc: "Screening requires affirmative citizen consent. Emergency callers can opt-out to receive standard linear queueing.",
    ethics_hitl_title: "Human-in-the-Loop Guarantee",
    ethics_hitl_desc: "AI suggests priority; trained NHAA duty counsellors and nodal officers must validate every police dispatch or witness protection flag.",
    ethics_ser_title: "Acoustic Confidence Transparency",
    ethics_ser_desc: "Explicitly factors in the 45–70% Indian language SER accuracy limitation rather than claiming artificial 100% precision.",

    // Modals Common
    btn_close: "Close",
    btn_cancel: "Cancel",

    // Case Details Modal
    modal_case_details_title: "Triage Desk: Case",
    modal_risk_suffix: "Risk",
    modal_channel_lbl: "Channel:",
    modal_district_lbl: "District:",
    modal_statement_header: "Full Intake Statement / Audio Transcript",
    modal_mandated_header: "Mandated NHAA Escalation Action:",
    modal_assigned_unit_lbl: "Assigned Unit:",
    modal_counsellor_notes_lbl: "Counsellor Triage Notes & Simulation Actions:",
    modal_counsellor_notes_ph: "Enter counsellor triage remarks, case verification notes, or liaison dispatch details...",
    modal_override_banner_title: "⚖️ Counsellor Override Active:",
    modal_override_orig_ai: "Original AI Score was",
    modal_override_by: "Overridden by counsellor on",
    modal_override_justification: "Justification:",

    // HITL Override Modal
    modal_override_title: "⚖️ Human-in-the-Loop (HITL) SVI Override",
    modal_override_subtitle: "Empowering counsellor clinical discretion over AI recommendation",
    lbl_case_id: "Case Identifier:",
    lbl_complainant: "Complainant / Alias:",
    lbl_channel: "Channel:",
    lbl_ai_baseline: "Current AI Baseline:",
    lbl_bound_max: "🔒 Bound: ±10 pts max",
    lbl_adjust_svi: "Adjust SVI Score (Hard-Capped at ±10 points):",
    lbl_min_bound: "Min -10",
    lbl_max_bound: "Max +10",
    lbl_resulting_tier: "Resulting Risk Tier & Protocol:",
    lbl_override_reason: "Reason for Human Override",
    lbl_override_mandatory: "(Mandatory Audit Trail Justification)",
    placeholder_override_reason: "Document clinical judgment, newly discovered threat factors, family vulnerability, or community risk context that justifies adjusting AI score...",
    hint_override_reason: "This reason will be permanently recorded with timestamp in the NHAA compliance audit trail.",
    btn_confirm_override: "Confirm Override & Update Tier",
    btn_saving_override: "Saving Override...",

    // Escalation Modal
    modal_esc_title: "Confirm PoA Act Escalation Action",
    modal_esc_subtitle: "Simulated National Helpline Escalation Workflow",
    lbl_sim_notice: "PROTOTYPE SIMULATION NOTICE",
    lbl_current_tier: "Current Tier:",
    lbl_triggering_action: "Triggering Action:",
    lbl_esc_remarks: "Counsellor Triage Remarks / Liaison Dispatch Notes (Optional):",
    placeholder_esc_notes: "Add operational notes, dispatch instructions, or emergency shelter allocation details...",
    btn_confirm_esc_action: "Confirm & Record Action (Simulation)",
    btn_recording_action: "Recording Action...",

    // Risk Tiers
    tier_low: "Low",
    tier_moderate: "Moderate",
    tier_high: "High",
    tier_critical: "Critical",

    // SLAs
    sla_low: "Within 72 Hours",
    sla_mod: "Within 48 Hours",
    sla_high: "Within 2 Hours (Same Day Escalation)",
    sla_crit: "Immediate / < 15 Min (RED ALERT)",

    // Escalation Action Metadata
    esc_dispatch_police_title: "🚨 Dispatch Police Liaison",
    esc_dispatch_police_name: "Immediate Police Liaison Dispatch",
    esc_dispatch_police_disc: "This will flag CASE-{ID} for Dispatch Police Liaison in this prototype simulation. No real dispatch occurs — this demonstrates the intended workflow for future production integration with NHAA/police systems.",
    esc_trigger_witness_title: "🛡️ Trigger Witness Protection Assessment",
    esc_trigger_witness_name: "Witness Protection Scheme Assessment",
    esc_trigger_witness_disc: "This will flag CASE-{ID} for Trigger Witness Protection Assessment in this prototype simulation. No real witness protection or government action occurs — this demonstrates the intended workflow for future production integration with NHAA/police systems.",
    esc_assign_counsellor_title: "🧑‍⚕️ Assign Duty Counsellor",
    esc_assign_counsellor_name: "Assign Senior Atrocity Trauma Counsellor",
    esc_assign_counsellor_disc: "This will flag CASE-{ID} for Assign Duty Counsellor in this prototype simulation. No real assignment occurs — this demonstrates the intended workflow for future production integration with NHAA/police systems.",
    esc_schedule_callback_title: "📞 Schedule Counsellor Callback",
    esc_schedule_callback_name: "Schedule 48-Hour Legal & Psychological Callback",
    esc_schedule_callback_disc: "This will flag CASE-{ID} for Schedule Counsellor Callback in this prototype simulation. No real callback or dispatch occurs — this demonstrates the intended workflow for future production integration with NHAA/police systems.",
    esc_routine_queue_title: "📋 Routine Queue Follow-up",
    esc_routine_queue_name: "Standard Administrative Ticket Follow-up",
    esc_routine_queue_disc: "This will flag CASE-{ID} for Routine Queue Follow-up in this prototype simulation. No real dispatch occurs — this demonstrates the intended workflow for future production integration with NHAA/police systems.",

    // Protocol Actions
    action_title_low: "Standard Administrative Queue",
    action_desc_low: "Log standard grievance ticket; schedule routine follow-up via NHAA portal or automated SMS/IVRS confirmation.",
    dispatch_low: "L1 Helpline Executive",
    action_title_mod: "Counsellor Callback & Legal Aid Awareness",
    action_desc_mod: "Dispatch ticket to Tier-2 psychological counsellor; provide legal assistance kit under PoA Act, 1989.",
    dispatch_mod: "Assigned District Legal Aid & L2 Counsellor",
    action_title_high: "Duty Counsellor Assignment & Welfare Escalation",
    action_desc_high: "Immediate telephonic triage by Senior Duty Counsellor; alert District Social Welfare / Atrocity Nodal Officer.",
    dispatch_high: "Senior Duty Counsellor & District Nodal Officer",
    action_title_crit: "Emergency Police Liaison & Witness Protection Activation",
    action_desc_crit: "RED ALERT: Direct link with SP/District Police Control Room; trigger Witness Protection Scheme assessment and emergency shelter dispatch.",
    dispatch_crit: "Superintendent of Police (Control Room) & Rapid Response Team",

    // Indicator Names
    ind_lethal: "Lethal & Severe Physical Threat",
    ind_confinement: "Restricted Movement & Confinement",
    ind_panic: "Severe Panic & Existential Terror",
    ind_boycott: "Economic / Social Boycott & Basic Resource Denial",
    ind_pressure: "Institutional Pressure & Compromise Coercion",
    ind_urgency: "Temporal Imminence & Real-Time Threat"
  },
  hi: {
    // Top Bar & Navigation
    ministry_title: "सामाजिक न्याय एवं अधिकारिता मंत्रालय",
    gov_sub: "भारत सरकार • स्मार्ट इंडिया हैकथॉन 2026 (SIH26093)",
    helpline_label: "एनएचएए टोल-फ्री:",
    badge_synthetic: "केवल सिंथेटिक डेटा",
    prototype_disclaimer: "प्रोटोटाइप प्रदर्शन: इसमें कोई वास्तविक व्यक्तिगत डेटा नहीं है। एआई केवल परामर्शदाता के निर्णय-समर्थन हेतु कार्य करता है।",
    team_label: "टीम:",
    brand_tagline: "अत्याचार हेल्पलाइन के लिए एआई आधारित तनाव एवं आघात मूल्यांकन प्रणाली",
    tab_intake: "मल्टी-चैनल शिकायत प्रविष्टि",
    tab_queue: "परामर्शदाता ट्राइएज डेस्क",
    tab_audit: "पारदर्शिता एवं तुलनात्मक विश्लेषण",

    // Channel Pills & Titles
    channel_portal: "पोर्टल फॉर्म",
    channel_chatbot: "चैटबॉट",
    channel_ivrs: "आईवीआरएस कॉल",
    channel_portal_title: "वेब पोर्टल फॉर्म",
    channel_chatbot_title: "इंटरएक्टिव चैटबॉट",
    channel_ivrs_title: "14566 आईवीआरएस वॉयस कॉल",

    // Tab 1: Intake Studio
    intake_title: "मल्टी-चैनल शिकायत सिम्युलेटर",
    intake_subtitle: "वेब पोर्टल, चैटबॉट या आईवीआरएस वॉयस कॉल के माध्यम से विवरण दर्ज करें",
    quick_presets: "त्वरित परीक्षण मामले:",
    preset_t1_low: "T1: निम्न (प्रशासनिक)",
    preset_t2_mod: "T2: मध्यम (जल निषेध - हिन्दी)",
    preset_t3_high: "T3: उच्च (अवैध बंधक)",
    preset_t4_crit_hi: "T4: गंभीर (भीड़ हिंसा - हिन्दी)",
    preset_t4_crit_bn: "T4: गंभीर (घेराबंदी - बंगाली)",
    preset_t3_high_ta: "T3: उच्च (सामाजिक बहिष्कार - तमिल)",

    // Audio Stream Telemetry
    audio_telemetry_title: "📞 14566 आईवीआरएस वॉयस बायोमार्कर टेलीमेट्री",
    ser_confidence_tag: "SER सटीकता स्तर:",
    audio_sim_btn: "लाइव वॉयस स्ट्रीम प्रारंभ करें",
    audio_sim_pause: "वॉयस सिमुलेशन रोकें",
    lbl_pitch_var: "पिच विचलन:",
    lbl_jitter: "जिटर:",
    lbl_rate: "गति:",

    // Input Form
    transcript_label: "नागरिक का बयान / कॉल ट्रांसक्रिप्ट:",
    transcript_placeholder: "कॉलर का बयान / घटना विवरण दर्ज करें (अंग्रेजी, हिन्दी, बंगाली, तमिल)...",
    char_count_suffix: "अक्षर",
    consent_statement: "नागरिक सहमति: मैं एनएचएए आपातकालीन प्राथमिकता हेतु एआई आधारित तनाव स्क्रीनिंग की सहमति देता/देती हूँ।",
    btn_evaluate: "तनाव एवं जोखिम स्तर का विश्लेषण करें",
    btn_evaluating: "संकेतों का विश्लेषण जारी...",
    btn_clear: "साफ़ करें",
    btn_save_queue: "लाइव ट्राइएज कतार में जोड़ें",

    // Tab 1: SVI Result Card
    analysis_title: "तनाव सुभेद्यता सूचकांक (SVI)",
    analysis_subtitle: "स्पष्ट एवं पारदर्शी गणितीय स्कोरिंग और पहचाने गए संकेत",
    awaiting_input: "प्रविष्टि की प्रतीक्षा",
    gauge_low: "0 निम्न",
    gauge_mod: "31 मध्यम",
    gauge_high: "56 उच्च",
    gauge_crit: "79-100 गंभीर",
    sla_awaiting: "समय-सीमा: --",
    protocol_awaiting_title: "मूल्यांकन की प्रतीक्षा",
    protocol_awaiting_desc: "पारदर्शी तनाव सुभेद्यता सूचकांक की गणना और अनिवार्य एनएचएए प्रोटोकॉल देखने हेतु विवरण दर्ज करें या परीक्षण केस चुनें।",
    mandated_action_label: "अनिवार्य कार्रवाई:",
    explainable_signals_title: "🔍 पहचाने गए सुभेद्यता संकेत",
    no_indicators_text: "अभी तक कोई सक्रिय संकेत विश्लेषित नहीं किए गए हैं।",
    no_indicators_routine: "कोई गंभीर अत्याचार या आघात संकेत नहीं मिले। सामान्य शिकायत।",
    math_formula_title: "📐 पारदर्शी SVI गणितीय सूत्र:",
    math_base: "मूल",
    math_indicators: "संकेतक",
    math_context: "संदर्भ",
    math_acoustic: "ध्वनि",
    flag_police_liaison: "🚨 तत्काल पुलिस संपर्क सक्रिय",
    flag_witness_protection: "🛡️ गवाह संरक्षण योजना जांच अनिवार्य",

    // Tab 2: Counsellor Triage Desk Metrics & Toolbar
    stat_total_cases: "कुल प्राप्त मामले",
    stat_crit_alerts: "गंभीर रेड अलर्ट",
    stat_high_priority: "उच्च प्राथमिकता (उसी दिन)",
    stat_avg_svi: "औसत SVI तनाव स्कोर",
    stat_statutory_deadlines: "पीओए वैधानिक समय-सीमा (7 दिन/60 दिन)",
    lbl_stat_overdue: "अतिदेय",
    lbl_stat_approaching: "निकट",
    subnav_live_queue: "लाइव जोखिम-प्राथमिकता कतार",
    subnav_hitl_audit: "मानवीय संशोधन एवं ऑडिट ट्रेल",
    queue_title: "लाइव अत्याचार हेल्पलाइन ट्राइएज कतार",
    queue_subtitle: "वास्तविक समय जोखिम-आधारित कतार: सर्वाधिक खतरे के मामले स्वतः शीर्ष पर",
    filter_risk_tier: "जोखिम स्तर:",
    opt_all_tiers: "सभी स्तर",
    opt_tier_crit: "🚨 गंभीर (79-100)",
    opt_tier_high: "⚠️ उच्च (56-78)",
    opt_tier_mod: "🟡 मध्यम (31-55)",
    opt_tier_low: "🟢 निम्न (0-30)",
    filter_channel: "माध्यम:",
    opt_all_channels: "सभी माध्यम",
    opt_channel_ivrs: "📞 आईवीआरएस",
    opt_channel_chatbot: "💬 चैटबॉट",
    opt_channel_portal: "📋 पोर्टल",
    search_placeholder: "केस आईडी, मुख्य शब्द, जिला खोजें...",
    btn_refresh: "ताज़ा करें",

    // Tab 2: Queue Table Headers & Actions
    th_case_id: "केस आईडी",
    th_channel: "माध्यम",
    th_svi_score: "SVI स्कोर",
    th_risk_tier: "जोखिम स्तर एवं संशोधन",
    th_sla_action: "समय-सीमा एवं अनुशंसित कार्रवाई",
    th_deadlines: "वैधानिक समय-सीमा (पीओए)",
    th_key_triggers: "पहचाने गए मुख्य संकेत",
    th_status: "स्थिति",
    th_actions: "कार्रवाई",
    demo_clock_tag: "डेमो घड़ी:",
    lbl_interim_relief_short: "अंतरिम राहत (7 दिन)",
    lbl_chargesheet_short: "आरोप पत्र (60 दिन)",
    lbl_deadline_overdue: "अतिदेय",
    lbl_deadline_rem: "शेष",
    lbl_reset_clock: "रीसेट",
    loading_queue: "लाइव ट्राइएज कतार लोड हो रही है...",
    empty_queue: "कतार में कोई मेल खाने वाला मामला नहीं मिला।",
    btn_override: "संशोधन",
    btn_overridden_label: "संशोधित (एआई: {score})",
    btn_act_police: "🚨 पुलिस संपर्क भेजें",
    btn_act_witness: "🛡️ गवाह संरक्षण सक्रिय करें",
    btn_act_counsellor: "🧑‍⚕️ परामर्शदाता नियुक्त करें",
    btn_act_callback: "📞 कॉलबैक शेड्यूल करें",
    btn_act_routine: "📋 सामान्य कतार",
    btn_act_details: "👁️ केस विवरण",
    routine_query: "सामान्य पूछताछ",

    // Tab 2: Audit Trail Card & Table
    audit_trail_title: "मानवीय SVI संशोधन एवं कार्रवाई ऑडिट ट्रेल",
    audit_trail_subtitle: "मानवीय सत्यापन, स्कोर संशोधन और ट्राइएज निर्णयों का स्थायी कालानुक्रमिक रिकॉर्ड",
    btn_refresh_audit: "ऑडिट ट्रेल ताज़ा करें",
    th_timestamp: "समय",
    th_event_type: "इवेंट प्रकार",
    th_case_citizen: "केस आईडी एवं नागरिक",
    th_ai_score: "एआई स्कोर",
    th_overridden_score: "संशोधित स्कोर",
    th_tier_shift: "स्तर परिवर्तन",
    th_justification_notes: "परामर्शदाता का कारण / कार्रवाई विवरण",
    th_counsellor_id: "परामर्शदाता आईडी",
    loading_audit: "ऑडिट लॉग प्रविष्टियां लोड हो रही हैं...",
    empty_audit: "अभी तक कोई संशोधन या कार्रवाई इवेंट दर्ज नहीं हुआ है।",
    badge_svi_override: "⚖️ SVI संशोधन",
    badge_esc_action: "🚨 एस्केलेशन कार्रवाई",
    unchanged_tier: "अपरिवर्तित",
    lbl_override_reason_prefix: "संशोधन का कारण:",
    lbl_action_prefix: "कार्रवाई:",
    counsellor_default_note: "मानक प्रोटोकॉल निष्पादित।",

    // Tab 3: Explainability, Landscape & Ethics
    tab3_title: "पारदर्शिता संरचना, तुलनात्मक विश्लेषण एवं नैतिक मानक",
    tab3_subtitle: "SIH26093 समस्या विवरण संदर्भ — सामाजिक न्याय एवं अधिकारिता मंत्रालय",
    sec1_title: "1. तुलनात्मक विश्लेषण: सहायता सेतु कैसे व्यवस्थागत कमी को पूरा करता है",
    sec1_intro: "यद्यपि सामान्य वॉयस एआई मौजूद हैं (जैसे रक्षा हेतु मनोदयम, अस्पताल हेतु वोकालिसिस), लेकिन कोई भी भारत के जातिगत अत्याचार कानून और हेल्पलाइन (NHAA 14566) के अनुकूल नहीं है।",
    th_comp_platform: "प्लेटफ़ॉर्म / प्रणाली",
    th_comp_focus: "मुख्य फोकस",
    th_comp_models: "स्पीच/टेक्स्ट मॉडल",
    th_comp_legal: "कानूनी व एस्केलेशन मैपिंग",
    th_comp_explain: "पारदर्शिता एवं व्याख्या परत",
    th_comp_channel: "एनएचएए मल्टी-चैनल (14566)",
    comp_manodayam_focus: "सशस्त्र बल / रक्षा तनाव स्क्रीनिंग",
    comp_manodayam_models: "ध्वनि बायोमार्कर",
    comp_manodayam_legal: "❌ केवल सैन्य स्वास्थ्य हेतु",
    comp_manodayam_explain: "⚠️ ब्लैक-बॉक्स रिस्क इंडेक्स",
    comp_manodayam_channel: "❌ केवल टेलीफोनी / आईवीआरएस",
    comp_vocalysis_focus: "अस्पताल एवं विद्यालय मानसिक स्वास्थ्य",
    comp_vocalysis_models: "ध्वनि विश्लेषण",
    comp_vocalysis_legal: "❌ सामान्य परामर्श सलाह",
    comp_vocalysis_explain: "⚠️ बिना संकेतों के केवल स्कोर",
    comp_vocalysis_channel: "❌ केवल ऐप / सिंगल-चैनल",
    comp_ser_focus: "क्रॉस-कॉर्पस भावना पहचान",
    comp_ser_models: "RAVDESS / IEMOCAP / IndicSER",
    comp_ser_legal: "❌ केवल शैक्षणिक बेंचमार्क (45–70% सटीकता)",
    comp_ser_explain: "❌ कच्चा सॉफ्टमैक्स क्लास",
    comp_ser_channel: "❌ हेल्पलाइन कतार एकीकरण नहीं",
    comp_setu_focus: "NHAA 14566 जातिगत अत्याचार ट्राइएज",
    comp_setu_models: "बहुभाषी भारतीय + ध्वनिक संलयन",
    comp_setu_legal: "✅ 4-स्तरीय कानूनी ढांचा (पुलिस/PoA एक्ट/गवाह संरक्षण)",
    comp_setu_explain: "✅ पूर्ण पारदर्शी कीवर्ड एवं कारक विश्लेषण",
    comp_setu_channel: "✅ पूर्णतः एकीकृत IVRS + चैटबॉट + पोर्टल",

    sec2_title: "2. पारदर्शी तनाव सुभेद्यता सूचकांक (SVI) गणितीय सूत्र",
    weight_lethal_title: "घातक शारीरिक खतरा (अधिकतम 28 अंक)",
    weight_lethal_desc: "हत्या, आगजनी, भीड़ हिंसा, हथियार, तलवारें, आग्नेयास्त्र (प्रति हिट: 14 अंक)",
    weight_confinement_title: "अवैध बंधक व घेराबंदी (अधिकतम 14 अंक)",
    weight_confinement_desc: "रास्ते बंद, घेरना, बंधक बनाना, आवागमन रोकना (प्रति हिट: 7 अंक)",
    weight_panic_title: "अत्यधिक भय व चीख-पुकार (अधिकतम 12 अंक)",
    weight_panic_desc: "चीखना, रोते बच्चे, जान की भीख मांगना (प्रति हिट: 6 अंक)",
    weight_boycott_title: "सामाजिक व आर्थिक बहिष्कार (अधिकतम 16 अंक)",
    weight_boycott_desc: "कुएं से पानी रोकने, राशन बहिष्कार, हुक्का-पानी बंद (प्रति हिट: 8 अंक)",
    weight_pressure_title: "संस्थागत दबाव व समझौता (अधिकतम 12 अंक)",
    weight_pressure_desc: "एफआईआर दर्ज न करना, जबरन समझौता, वापस लेने की धमकी (प्रति हिट: 6 अंक)",
    weight_urgency_title: "तात्कालिकता व समय की गंभीरता (अधिकतम 14 अंक)",
    weight_urgency_desc: "घटना अभी हो रही है, दरवाजा तोड़ा जा रहा है (प्रति हिट: 7 अंक)",

    sec3_title: "3. निजता-अनुकूल डिजाइन एवं मानवीय पर्यवेक्षण",
    ethics_pii_title: "शून्य-पीआईआई भंडारण",
    ethics_pii_desc: "विवरण मेमोरी में प्रोसेस होता है। नागरिकों के नाम व नंबर सिंथेटिक उपनाम (उदा. Citizen_R_71) से बदले जाते हैं।",
    ethics_consent_title: "सहमति-आधारित स्क्रीनिंग",
    ethics_consent_desc: "एआई स्क्रीनिंग के लिए नागरिक की स्पष्ट सहमति आवश्यक है। असहमति पर सामान्य कतार मिलती है।",
    ethics_hitl_title: "मानवीय पर्यवेक्षण की गारंटी",
    ethics_hitl_desc: "एआई केवल प्राथमिकता सुझाता है; पुलिस कार्रवाई या सुरक्षा का निर्णय प्रशिक्षित परामर्शदाता ही लेते हैं।",
    ethics_ser_title: "ध्वनिक सटीकता की पारदर्शिता",
    ethics_ser_desc: "भारतीय भाषाओं में 45-70% सटीकता सीमा को स्पष्ट स्वीकार कर पारदर्शी निर्णय लिया जाता है।",

    // Modals Common
    btn_close: "बंद करें",
    btn_cancel: "रद्द करें",

    // Case Details Modal
    modal_case_details_title: "ट्राइएज डेस्क: केस",
    modal_risk_suffix: "जोखिम",
    modal_channel_lbl: "माध्यम:",
    modal_district_lbl: "जिला:",
    modal_statement_header: "पूर्ण शिकायत बयान / ऑडियो ट्रांसक्रिप्ट",
    modal_mandated_header: "अनिवार्य एनएचएए एस्केलेशन कार्रवाई:",
    modal_assigned_unit_lbl: "नियुक्त इकाई:",
    modal_counsellor_notes_lbl: "परामर्शदाता ट्राइएज नोट्स एवं सिमुलेशन कार्रवाइयां:",
    modal_counsellor_notes_ph: "परामर्शदाता टिप्पणी, केस सत्यापन या पुलिस समन्वय निर्देश दर्ज करें...",
    modal_override_banner_title: "⚖️ मानवीय संशोधन सक्रिय:",
    modal_override_orig_ai: "मूल एआई स्कोर था",
    modal_override_by: "परामर्शदाता द्वारा संशोधित दिनांक",
    modal_override_justification: "कारण:",

    // HITL Override Modal
    modal_override_title: "⚖️ मानवीय (HITL) SVI स्कोर संशोधन",
    modal_override_subtitle: "एआई सुझाव के ऊपर परामर्शदाता के क्लिनिकल विवेक को प्राथमिकता",
    lbl_case_id: "केस पहचानकर्ता:",
    lbl_complainant: "शिकायतकर्ता / उपनाम:",
    lbl_channel: "माध्यम:",
    lbl_ai_baseline: "वर्तमान एआई बेसलाइन:",
    lbl_bound_max: "🔒 सीमा: अधिकतम ±10 अंक",
    lbl_adjust_svi: "SVI स्कोर समायोजित करें (अधिकतम ±10 अंक):",
    lbl_min_bound: "न्यूनतम -10",
    lbl_max_bound: "अधिकतम +10",
    lbl_resulting_tier: "अंतिम जोखिम स्तर एवं प्रोटोकॉल:",
    lbl_override_reason: "मानवीय संशोधन का कारण",
    lbl_override_mandatory: "(अनिवार्य ऑडिट ट्रेल औचित्य)",
    placeholder_override_reason: "नैदानिक निर्णय, नए खतरे के कारक, पारिवारिक सुभेद्यता या सामुदायिक संदर्भ दर्ज करें...",
    hint_override_reason: "यह कारण एनएचएए अनुपालन ऑडिट ट्रेल में टाइमस्टैम्प के साथ स्थायी रूप से दर्ज होगा।",
    btn_confirm_override: "संशोधन की पुष्टि करें व स्तर बदलें",
    btn_saving_override: "संशोधन सहेजा जा रहा है...",

    // Escalation Modal
    modal_esc_title: "PoA अधिनियम एस्केलेशन कार्रवाई की पुष्टि",
    modal_esc_subtitle: "सिम्युलेटेड राष्ट्रीय हेल्पलाइन एस्केलेशन वर्कफ़्लो",
    lbl_sim_notice: "प्रोटोटाइप सिमुलेशन सूचना",
    lbl_current_tier: "वर्तमान स्तर:",
    lbl_triggering_action: "ट्रिगर की गई कार्रवाई:",
    lbl_esc_remarks: "परामर्शदाता टिप्पणी / पुलिस समन्वय नोट्स (वैकल्पिक):",
    placeholder_esc_notes: "परिचालन नोट्स, प्रेषण निर्देश, या आपातकालीन आश्रय आवंटन विवरण जोड़ें...",
    btn_confirm_esc_action: "पुष्टि करें एवं कार्रवाई दर्ज करें (सिमुलेशन)",
    btn_recording_action: "कार्रवाई दर्ज हो रही है...",

    // Risk Tiers
    tier_low: "निम्न",
    tier_moderate: "मध्यम",
    tier_high: "उच्च",
    tier_critical: "गंभीर",

    // SLAs
    sla_low: "72 घंटे के भीतर",
    sla_mod: "48 घंटे के भीतर",
    sla_high: "2 घंटे के भीतर (उसी दिन एस्केलेशन)",
    sla_crit: "तत्काल / < 15 मिनट (रेड अलर्ट)",

    // Escalation Action Metadata
    esc_dispatch_police_title: "🚨 पुलिस संपर्क भेजें",
    esc_dispatch_police_name: "तत्काल पुलिस संपर्क प्रेषण",
    esc_dispatch_police_disc: "यह इस प्रोटोटाइप सिमुलेशन में CASE-{ID} को पुलिस समन्वय हेतु चिह्नित करेगा। कोई वास्तविक प्रेषण नहीं होता — यह SC/ST (PoA) अधिनियम के तहत उत्पादन प्रणाली के वर्कफ़्लो को प्रदर्शित करता है।",
    esc_trigger_witness_title: "🛡️ गवाह संरक्षण मूल्यांकन प्रारंभ करें",
    esc_trigger_witness_name: "गवाह संरक्षण योजना मूल्यांकन",
    esc_trigger_witness_disc: "यह गवाह संरक्षण योजना 2018 के तहत CASE-{ID} के लिए मूल्यांकन ध्वज ट्रिगर करेगा।",
    esc_assign_counsellor_title: "🧑‍⚕️ वरिष्ठ परामर्शदाता नियुक्त करें",
    esc_assign_counsellor_name: "वरिष्ठ आघात परामर्शदाता आवंटन",
    esc_assign_counsellor_disc: "यह CASE-{ID} को वरिष्ठ ड्यूटी परामर्शदाता को आवंटित करेगा।",
    esc_schedule_callback_title: "📞 कॉलबैक शेड्यूल करें",
    esc_schedule_callback_name: "48 घंटे में कानूनी व मानसिक सहायता कॉलबैक",
    esc_schedule_callback_disc: "यह PoA कानूनी सहायता जागरूकता के तहत CASE-{ID} के लिए कॉलबैक निर्धारित करेगा।",
    esc_routine_queue_title: "📋 सामान्य कतार अनुवर्ती",
    esc_routine_queue_name: "मानक प्रशासनिक टिकट अनुवर्ती",
    esc_routine_queue_disc: "यह CASE-{ID} को सामान्य शिकायत कतार में दर्ज करेगा।",

    // Protocol Actions
    action_title_low: "मानक प्रशासनिक कतार",
    action_desc_low: "मानक शिकायत टिकट दर्ज करें; एनएचएए पोर्टल या स्वचालित एसएमएस द्वारा अनुवर्ती कार्रवाई।",
    dispatch_low: "स्तर 1 हेल्पलाइन अधिकारी",
    action_title_mod: "परामर्शदाता कॉलबैक एवं कानूनी सहायता जागरूकता",
    action_desc_mod: "स्तर 2 मनोवैज्ञानिक परामर्शदाता को टिकट भेजें; PoA अधिनियम 1989 के तहत कानूनी सहायता किट प्रदान करें।",
    dispatch_mod: "जिला कानूनी सहायता एवं स्तर 2 परामर्शदाता",
    action_title_high: "ड्यूटी परामर्शदाता नियुक्ति एवं कल्याणकारी कार्रवाई",
    action_desc_high: "वरिष्ठ ड्यूटी परामर्शदाता द्वारा तत्काल टेलीफोनिक मूल्यांकन; जिला समाज कल्याण अधिकारी को सतर्क करें।",
    dispatch_high: "वरिष्ठ ड्यूटी परामर्शदाता एवं जिला नोडल अधिकारी",
    action_title_crit: "आपातकालीन पुलिस संपर्क एवं गवाह संरक्षण सक्रियण",
    action_desc_crit: "रेड अलर्ट: एसपी / जिला पुलिस नियंत्रण कक्ष से सीधा संपर्क; गवाह संरक्षण और आपातकालीन आश्रय सक्रिय करें।",
    dispatch_crit: "पुलिस अधीक्षक (नियंत्रण कक्ष) एवं त्वरित प्रतिक्रिया दल",

    // Indicator Names
    ind_lethal: "घातक एवं गंभीर शारीरिक खतरा",
    ind_confinement: "प्रतिबंधित आवागमन एवं अवैध बंधक",
    ind_panic: "गंभीर भय एवं अस्तित्वगत आतंक",
    ind_boycott: "आर्थिक/सामाजिक बहिष्कार एवं बुनियादी संसाधन निषेध",
    ind_pressure: "संस्थागत दबाव एवं समझौता हेतु विवश करना",
    ind_urgency: "तात्कालिकता एवं वास्तविक समय का खतरा"
  },
  bn: {
    // Top Bar & Navigation
    ministry_title: "সামাজিক ন্যায় ও ক্ষমতায়ন মন্ত্রক",
    gov_sub: "ভারত সরকার • স্মার্ট ইন্ডিয়া হ্যাকাথন ২০২৬ (SIH26093)",
    helpline_label: "এনএইচএএ টোল-ফ্রি:",
    badge_synthetic: "শুধুমাত্র সিন্থেটিক ডেটা",
    prototype_disclaimer: "প্রোটোটাইপ ডেমো: কোনো বাস্তব ব্যক্তিগত তথ্য নেই। মানুষের যাচাইকরণ বাধ্যতামূলক।",
    team_label: "দল:",
    brand_tagline: "জাতীয় হেল্পলাইনের জন্য এআই ভিত্তিক মানসিক চাপ ও ট্রমা মূল্যায়ন",
    tab_intake: "মাল্টি-চ্যানেল অভিযোগ গ্রহণ",
    tab_queue: "কাউন্সেলর ট্রায়াজ ডেস্ক",
    tab_audit: "ব্যাখ্যাযোগ্যতা ও বিশ্লেষণ",

    // Channel Pills & Titles
    channel_portal: "পোর্টাল ফর্ম",
    channel_chatbot: "চ্যাটবট",
    channel_ivrs: "আইভিআরএস কল",
    channel_portal_title: "ওয়েব পোর্টাল ফর্ম",
    channel_chatbot_title: "ইন্টারেক্টিভ চ্যাটবট",
    channel_ivrs_title: "14566 আইভিআরএস ভয়েস কল",

    // Tab 1: Intake Studio
    intake_title: "মাল্টি-চ্যানেল সিমুলেটর",
    intake_subtitle: "ওয়েব পোর্টাল, চ্যাটবট বা আইভিআরএস ভয়েসের মাধ্যমে জমা দিন",
    quick_presets: "নমুনা পরীক্ষামূলক কেস:",
    preset_t1_low: "T1: নিম্ন (প্রশাসনিক)",
    preset_t2_mod: "T2: মাঝারি (জল নিষেধাজ্ঞা - হিন্দি)",
    preset_t3_high: "T3: উচ্চ (আটকে রাখা)",
    preset_t4_crit_hi: "T4: সংকটজনক (হিংসা - হিন্দি)",
    preset_t4_crit_bn: "T4: সংকটজনক (অবরোধ - বাংলা)",
    preset_t3_high_ta: "T3: উচ্চ (বয়কট - তামিল)",

    // Audio Stream Telemetry
    audio_telemetry_title: "📞 14566 আইভিআরএস ভয়েস বায়োমার্কার টেলিমেট্রি",
    ser_confidence_tag: "SER নির্ভুলতা স্তর:",
    audio_sim_btn: "লাইভ ভয়েস স্ট্রিম শুরু করুন",
    audio_sim_pause: "ভয়েস সিমুলেশন থামান",
    lbl_pitch_var: "পিচ পরিবর্তন:",
    lbl_jitter: "জিটার:",
    lbl_rate: "গতি:",

    // Input Form
    transcript_label: "নাগরিকের বক্তব্য / ভয়েস ট্রান্সক্রিপ্ট:",
    transcript_placeholder: "অভিযোগের বিবরণ লিখুন বা পেস্ট করুন (ইংরেজি, হিন্দি, বাংলা, তামিল)...",
    char_count_suffix: "অক্ষর",
    consent_statement: "নাগরিক সম্মতি: আমি জরুরি ট্রায়াজ মূল্যায়নের জন্য এআই স্ক্রিনিংয়ে সম্মতি দিচ্ছি।",
    btn_evaluate: "চাপ ও ঝুঁকির স্তর বিশ্লেষণ করুন",
    btn_evaluating: "সংকেত বিশ্লেষণ চলছে...",
    btn_clear: "মুছুন",
    btn_save_queue: "লাইভ ট্রায়াজ সারিতে পাঠান",

    // Tab 1: SVI Result Card
    analysis_title: "স্ট্রেস ভালনারেবিলিটি ইনডেক্স (SVI)",
    analysis_subtitle: "স্বচ্ছ গাণিতিক স্কোর এবং চিহ্নিত কারণসমূহ",
    awaiting_input: "ইনপুটের অপেক্ষায়",
    gauge_low: "0 নিম্ন",
    gauge_mod: "31 মাঝারি",
    gauge_high: "56 উচ্চ",
    gauge_crit: "79-100 সংকটজনক",
    sla_awaiting: "সময়সীমা: --",
    protocol_awaiting_title: "মূল্যায়নের অপেক্ষায়",
    protocol_awaiting_desc: "স্বচ্ছ SVI স্কোর এবং বাধ্যতামূলক পদক্ষেপ দেখতে বক্তব্য লিখুন বা নমুনা নির্বাচন করুন।",
    mandated_action_label: "বাধ্যতামূলক ব্যবস্থা:",
    explainable_signals_title: "🔍 চিহ্নিত দুর্বলতা সংকেত",
    no_indicators_text: "এখনও কোনো সংকেত মূল্যায়ন করা হয়নি।",
    no_indicators_routine: "কোনো গুরুতর হুমকি বা ট্রমা সংকেত পাওয়া যায়নি। সাধারণ অভিযোগ।",
    math_formula_title: "📐 নিরীক্ষণযোগ্য SVI গাণিতিক সূত্র:",
    math_base: "মূল",
    math_indicators: "সূচকসমূহ",
    math_context: "প্রেক্ষাপট",
    math_acoustic: "শব্দ",
    flag_police_liaison: "🚨 জরুরি পুলিশ যোগাযোগ সক্রিয়",
    flag_witness_protection: "🛡️ সাক্ষী সুরক্ষা যাচাই বাধ্যতামূলক",

    // Tab 2: Counsellor Triage Desk Metrics & Toolbar
    stat_total_cases: "মোট অভিযোগের সংখ্যা",
    stat_crit_alerts: "সংকটজনক রেড অ্যালার্ট",
    stat_high_priority: "উচ্চ অগ্রাধিকার (একই দিনে)",
    stat_avg_svi: "গড় SVI স্ট্রেস স্কোর",
    stat_statutory_deadlines: "পিওএ সংবিধিবদ্ধ সময়সীমা (৭ দিন/৬০ দিন)",
    lbl_stat_overdue: "সময়োত্তীর্ণ",
    lbl_stat_approaching: "আসন্ন",
    subnav_live_queue: "লাইভ ঝুঁকি-অগ্রাধিকার সারি",
    subnav_hitl_audit: "মানবিক সংশোধন ও অডিট ট্রেইল",
    queue_title: "লাইভ ট্রায়াজ সারি",
    queue_subtitle: "রিয়েল-টাইম ঝুঁকি-ভিত্তিক সারি: সর্বোচ্চ ঝুঁকির কেস স্বয়ংক্রিয়ভাবে শীর্ষে",
    filter_risk_tier: "ঝুঁকির স্তর:",
    opt_all_tiers: "সকল স্তর",
    opt_tier_crit: "🚨 সংকটজনক (79-100)",
    opt_tier_high: "⚠️ উচ্চ (56-78)",
    opt_tier_mod: "🟡 মাঝারি (31-55)",
    opt_tier_low: "🟢 নিম্ন (0-30)",
    filter_channel: "মাধ্যম:",
    opt_all_channels: "সকল মাধ্যম",
    opt_channel_ivrs: "📞 আইভিআরএস",
    opt_channel_chatbot: "💬 চ্যাটবট",
    opt_channel_portal: "📋 পোর্টাল",
    search_placeholder: "কেস আইডি, শব্দ বা জেলা খুঁজুন...",
    btn_refresh: "রিফ্রেশ",

    // Tab 2: Queue Table Headers & Actions
    th_case_id: "কেস আইডি",
    th_channel: "মাধ্যম",
    th_svi_score: "SVI স্কোর",
    th_risk_tier: "ঝুঁকির স্তর ও সংশোধন",
    th_sla_action: "সময়সীমা ও সুপারিশকৃত ব্যবস্থা",
    th_deadlines: "সংবিধিবদ্ধ সময়সীমা (পিওএ)",
    th_key_triggers: "চিহ্নিত প্রধান সংকেত",
    th_status: "অবস্থা",
    th_actions: "পদক্ষেপ",
    demo_clock_tag: "ডেমো ঘড়ি:",
    lbl_interim_relief_short: "অন্তর্বর্তীকালীন ত্রাণ (৭ দিন)",
    lbl_chargesheet_short: "চার্জশিট (৬০ দিন)",
    lbl_deadline_overdue: "সময়োত্তীর্ণ",
    lbl_deadline_rem: "বাকি",
    lbl_reset_clock: "রিসেট",
    loading_queue: "লাইভ ট্রায়াজ সারি লোড হচ্ছে...",
    empty_queue: "সারিতে কোনো মেলানো কেস পাওয়া যায়নি।",
    btn_override: "সংশোধন",
    btn_overridden_label: "সংশোধিত (AI: {score})",
    btn_act_police: "🚨 পুলিশ পাঠান",
    btn_act_witness: "🛡️ সাক্ষী সুরক্ষা দিন",
    btn_act_counsellor: "🧑‍⚕️ কাউন্সেলর নিয়োগ করুন",
    btn_act_callback: "📞 কলব্যাক শিডিউল করুন",
    btn_act_routine: "📋 সাধারণ সারি",
    btn_act_details: "👁️ কেস বিবরণ",
    routine_query: "সাধারণ অনুসন্ধান",

    // Tab 2: Audit Trail Card & Table
    audit_trail_title: "মানবিক SVI সংশোধন ও পদক্ষেপ অডিট ট্রেইল",
    audit_trail_subtitle: "মানবিক তদারকি, স্কোর সমন্বয় ও পদক্ষেপের স্থায়ী ক্রমানুসারী রেকর্ড",
    btn_refresh_audit: "অডিট ট্রেইল রিফ্রেশ করুন",
    th_timestamp: "সময়",
    th_event_type: "ঘটনার ধরন",
    th_case_citizen: "কেস আইডি ও নাগরিক",
    th_ai_score: "এআই স্কোর",
    th_overridden_score: "সংশোধিত স্কোর",
    th_tier_shift: "স্তরের পরিবর্তন",
    th_justification_notes: "কাউন্সেলরের কারণ / পদক্ষেপের নোট",
    th_counsellor_id: "কাউন্সেলর আইডি",
    loading_audit: "অডিট লগ এন্ট্রি লোড হচ্ছে...",
    empty_audit: "এখনও কোনো সংশোধন বা এস্কেলেশন রেকর্ড করা হয়নি।",
    badge_svi_override: "⚖️ SVI সংশোধন",
    badge_esc_action: "🚨 জরুরি পদক্ষেপ",
    unchanged_tier: "অপরিবর্তিত",
    lbl_override_reason_prefix: "সংশোধনের কারণ:",
    lbl_action_prefix: "পদক্ষেপ:",
    counsellor_default_note: "মানক প্রোটোকল কার্যকর করা হয়েছে।",

    // Tab 3: Explainability, Landscape & Ethics
    tab3_title: "ব্যাখ্যাযোগ্যতা পরিকাঠামো, বিশ্লেষণ ও নৈতিক মানদণ্ড",
    tab3_subtitle: "SIH26093 সমস্যা প্রেক্ষাপট — সামাজিক ন্যায় ও ক্ষমতায়ন মন্ত্রক",
    sec1_title: "১. তুলনামূলক বিশ্লেষণ: সহায়তা সেতু কীভাবে ব্যবধান দূর করে",
    sec1_intro: "সাধারণ ভয়েস এআই থাকলেও, ভারতের জাতিগত নির্যাতন আইন ও হেল্পলাইন (NHAA 14566) প্রক্রিয়ার জন্য কোনোটিই উপযুক্ত নয়।",
    th_comp_platform: "প্ল্যাটফর্ম / সিস্টেম",
    th_comp_focus: "প্রধান ক্ষেত্র",
    th_comp_models: "স্পিচ/টেক্সট মডেল",
    th_comp_legal: "আইনি ও জরুরি ম্যাপিং",
    th_comp_explain: "স্বচ্ছতা ও ব্যাখ্যা স্তর",
    th_comp_channel: "NHAA মাল্টি-চ্যানেল (14566)",
    comp_manodayam_focus: "প্রতিরক্ষা বাহিনীর মানসিক চাপ স্ক্রিনিং",
    comp_manodayam_models: "শব্দ বায়োমার্কার",
    comp_manodayam_legal: "❌ শুধুমাত্র সামরিক স্বাস্থ্য",
    comp_manodayam_explain: "⚠️ ব্ল্যাক-বক্স ঝুঁকি সূচক",
    comp_manodayam_channel: "❌ শুধুমাত্র আইভিআরএস",
    comp_vocalysis_focus: "হাসপাতাল ও বিদ্যালয়ের মানসিক স্বাস্থ্য",
    comp_vocalysis_models: "শব্দ বিশ্লেষণ",
    comp_vocalysis_legal: "❌ সাধারণ কাউন্সেলিং পরামর্শ",
    comp_vocalysis_explain: "⚠️ সংকেত ছাড়া শুধু স্কোর",
    comp_vocalysis_channel: "❌ শুধুমাত্র অ্যাপ",
    comp_ser_focus: "আবেগ শনাক্তকরণ গবেষণা",
    comp_ser_models: "RAVDESS / IEMOCAP / IndicSER",
    comp_ser_legal: "❌ শুধুমাত্র একাডেমিক বেঞ্চমার্ক (45–70%)",
    comp_ser_explain: "❌ প্রাথমিক সফটম্যাক্স ক্লাস",
    comp_ser_channel: "❌ কোনো হেল্পলাইন ইন্টিগ্রেশন নেই",
    comp_setu_focus: "NHAA 14566 জাতিগত নির্যাতন ট্রায়াজ",
    comp_setu_models: "বহুভাষিক ভারতীয় + শাব্দিক ফিউশন",
    comp_setu_legal: "✅ ৪-স্তরের আইনি পরিকাঠামো (পুলিশ/PoA/সাক্ষী সুরক্ষা)",
    comp_setu_explain: "✅ সম্পূর্ণ স্বচ্ছ কিওয়ার্ড ও উপাদান বিশ্লেষণ",
    comp_setu_channel: "✅ সম্পূর্ণ সমন্বিত IVRS + চ্যাটবট + পোর্টাল",

    sec2_title: "২. নিরীক্ষণযোগ্য স্ট্রেস ভালনারেবিলিটি ইনডেক্স (SVI) সূত্র",
    weight_lethal_title: "মারাত্মক শারীরিক হুমকি (সর্বোচ্চ ২৮ পয়েন্ট)",
    weight_lethal_desc: "খুন, অগ্নিসংযোগ, গণসহিংসতা, অস্ত্র, তলোয়ার, বন্দুক (প্রতি হিটে: ১৪ পয়েন্ট)",
    weight_confinement_title: "আটকে রাখা ও অবরুদ্ধ করা (সর্বোচ্চ ১৪ পয়েন্ট)",
    weight_confinement_desc: "ব্যারিকেড, রাস্তা বন্ধ, ঘেরাও, পণবন্দী (প্রতি হিটে: ৭ পয়েন্ট)",
    weight_panic_title: "চরম আতঙ্ক ও ভয় (সর্বোচ্চ ১২ পয়েন্ট)",
    weight_panic_desc: "চিৎকার, শিশুদের কান্না, জীবনের আকুতি (প্রতি হিটে: ৬ পয়েন্ট)",
    weight_boycott_title: "সামাজিক ও অর্থনৈতিক বয়কট (সর্বোচ্চ ১৬ পয়েন্ট)",
    weight_boycott_desc: "কুয়ো থেকে জল বন্ধ, রেশন বয়কট, একঘরে করা (প্রতি হিটে: ৮ পয়েন্ট)",
    weight_pressure_title: "প্রাতিষ্ঠানিক চাপ ও আপস (সর্বোচ্চ ১২ পয়েন্ট)",
    weight_pressure_desc: "এফআইআর না নেওয়া, জোরপূর্বক আপস, হুমকি (প্রতি হিটে: ৬ পয়েন্ট)",
    weight_urgency_title: "জরুরি তাৎক্ষণিক বিপদ (সর্বোচ্চ ১৪ পয়েন্ট)",
    weight_urgency_desc: "এই মুহূর্তে ঘটছে, দরজা ভাঙার চেষ্টা (প্রতি হিটে: ৭ পয়েন্ট)",

    sec3_title: "৩. গোপনীয়তা ও মানবিক তত্ত্বাবধানের নীতি",
    ethics_pii_title: "জিরো-পিআইআই স্টোরেজ",
    ethics_pii_desc: "নাগরিকের নাম ও নম্বর কৃত্রিম সাংকেতিক নামে (যেমন Citizen_R_71) প্রক্রিয়াজাত হয়।",
    ethics_consent_title: "সম্মতি-ভিত্তিক প্রক্রিয়াকরণ",
    ethics_consent_desc: "এআই স্ক্রিনিংয়ের জন্য নাগরিকের সুস্পষ্ট সম্মতি বাধ্যতামূলক।",
    ethics_hitl_title: "মানবিক তত্ত্বাবধানের গ্যারান্টি",
    ethics_hitl_desc: "এআই অগ্রাধিকার নির্ধারণে সাহায্য করে; পুলিশ বা সুরক্ষার চূড়ান্ত সিদ্ধান্ত মানব বিশেষজ্ঞই নেন।",
    ethics_ser_title: "স্বচ্ছ শাব্দিক নির্ভুলতা",
    ethics_ser_desc: "ভারতীয় ভাষায় ৪৫-৭০% নির্ভুলতার সীমাবদ্ধতাকে সরাসরি বিবেচনা করা হয়।",

    // Modals Common
    btn_close: "বন্ধ করুন",
    btn_cancel: "বাতিল করুন",

    // Case Details Modal
    modal_case_details_title: "ট্রায়াজ ডেস্ক: কেস",
    modal_risk_suffix: "ঝুঁকি",
    modal_channel_lbl: "মাধ্যম:",
    modal_district_lbl: "জেলা:",
    modal_statement_header: "সম্পূর্ণ অভিযোগের বিবরণ / অডিও ট্রান্সক্রিপ্ট",
    modal_mandated_header: "বাধ্যতামূলক এনএইচএএ পদক্ষেপ:",
    modal_assigned_unit_lbl: "দায়িত্বপ্রাপ্ত ইউনিট:",
    modal_counsellor_notes_lbl: "কাউন্সেলর ট্রায়াজ নোট ও পদক্ষেপ:",
    modal_counsellor_notes_ph: "কাউন্সেলরের মন্তব্য, কেস যাচাইকরণ বা পুলিশ সমন্বয় নির্দেশ দিন...",
    modal_override_banner_title: "⚖️ মানবিক সংশোধন সক্রিয়:",
    modal_override_orig_ai: "মূল এআই স্কোর ছিল",
    modal_override_by: "কাউন্সেলর দ্বারা সংশোধিত",
    modal_override_justification: "কারণ:",

    // HITL Override Modal
    modal_override_title: "⚖️ মানবিক (HITL) SVI স্কোর সংশোধন",
    modal_override_subtitle: "এআই সুপারিশের ওপর কাউন্সেলরের সুবিবেচনাকে অগ্রাধিকার",
    lbl_case_id: "কেস আইডেন্টিফায়ার:",
    lbl_complainant: "অভিযোগকারী / ছদ্মনাম:",
    lbl_channel: "মাধ্যম:",
    lbl_ai_baseline: "বর্তমান এআই বেসলাইন:",
    lbl_bound_max: "🔒 সীমা: সর্বোচ্চ ±১০ পয়েন্ট",
    lbl_adjust_svi: "SVI স্কোর সমন্বয় করুন (সর্বোচ্চ ±১০ পয়েন্ট):",
    lbl_min_bound: "সর্বনিম্ন -১০",
    lbl_max_bound: "সর্বোচ্চ +১০",
    lbl_resulting_tier: "চূড়ান্ত ঝুঁকির স্তর ও প্রোটোকল:",
    lbl_override_reason: "মানবিক সংশোধনের কারণ",
    lbl_override_mandatory: "(বাধ্যতামূলক অডিট ট্রেইল যৌক্তিকতা)",
    placeholder_override_reason: "ক্লিনিকাল বিচার, নতুন হুমকি, পারিবারিক সংবেদনশীলতা বা সামাজিক প্রেক্ষাপট লিখুন...",
    hint_override_reason: "এই কারণটি এনএইচএএ অডিট ট্রেইলে সময়সহ স্থায়ীভাবে সংরক্ষিত হবে।",
    btn_confirm_override: "সংশোধন নিশ্চিত করুন ও স্তর পরিবর্তন করুন",
    btn_saving_override: "সংশোধন সংরক্ষণ হচ্ছে...",

    // Escalation Modal
    modal_esc_title: "PoA আইন এস্কেলেশন পদক্ষেপ নিশ্চিতকরণ",
    modal_esc_subtitle: "সিমুলেটেড জাতীয় হেল্পলাইন ওয়ার্কফ্লো",
    lbl_sim_notice: "প্রোটোটাইপ সিমুলেশন বিজ্ঞপ্তি",
    lbl_current_tier: "বর্তমান স্তর:",
    lbl_triggering_action: "পদক্ষেপের ধরন:",
    lbl_esc_remarks: "কাউন্সেলর ট্রায়াজ নোট / পুলিশ নির্দেশ (ঐচ্ছিক):",
    placeholder_esc_notes: "অপারেশনাল নোট বা জরুরি আশ্রয়ের বিবরণ যোগ করুন...",
    btn_confirm_esc_action: "নিশ্চিত করুন ও পদক্ষেপ রেকর্ড করুন (সিমুলেশন)",
    btn_recording_action: "পদক্ষেপ রেকর্ড হচ্ছে...",

    // Risk Tiers
    tier_low: "निम्न (Low)",
    tier_moderate: "মাঝারি (Moderate)",
    tier_high: "উচ্চ (High)",
    tier_critical: "সংকটজনক (Critical)",

    // SLAs
    sla_low: "৭২ ঘণ্টার মধ্যে",
    sla_mod: "৪৮ ঘণ্টার মধ্যে",
    sla_high: "২ ঘণ্টার মধ্যে (একই দিনে)",
    sla_crit: "অবিলম্বে / < ১৫ মিনিট (রেড অ্যালার্ট)",

    // Escalation Action Metadata
    esc_dispatch_police_title: "🚨 জরুরি পুলিশ পাঠান",
    esc_dispatch_police_name: "অবিলম্বে পুলিশ সমন্বয় প্রেরণ",
    esc_dispatch_police_disc: "এটি এই প্রোটোটাইপে CASE-{ID}-এর জন্য পুলিশ এস্কেলেশন চিহ্নিত করবে। বাস্তব কোনো পুলিশ যায় না — এটি SC/ST (PoA) আইনের আওতায় ওয়ার্কফ্লো প্রদর্শন করে।",
    esc_trigger_witness_title: "🛡️ সাক্ষী সুরক্ষা মূল্যায়ন সক্রিয় করুন",
    esc_trigger_witness_name: "সাক্ষী সুরক্ষা প্রকল্প মূল্যায়ন",
    esc_trigger_witness_disc: "এটি সাক্ষী সুরক্ষা স্কিম ২০১৮-এর অধীনে CASE-{ID}-এর জন্য মূল্যায়ন ফ্ল্যাগ করবে।",
    esc_assign_counsellor_title: "🧑‍⚕️ সিনিয়র কাউন্সেলর নিয়োগ করুন",
    esc_assign_counsellor_name: "সিনিয়র ট্রমা কাউন্সেলর নিয়োগ",
    esc_assign_counsellor_disc: "এটি CASE-{ID}-কে সিনিয়র ডিউটি কাউন্সেলরকে বরাদ্দ করবে।",
    esc_schedule_callback_title: "📞 কলব্যাক শিডিউল করুন",
    esc_schedule_callback_name: "৪৮ ঘণ্টার আইনি ও মানসিক কলব্যাক",
    esc_schedule_callback_disc: "এটি CASE-{ID}-এর জন্য আইনি সহায়তা সচেতনতামূলক কলব্যাক নির্ধারণ করবে।",
    esc_routine_queue_title: "📋 সাধারণ সারি ফলো-আপ",
    esc_routine_queue_name: "মানক প্রশাসনিক টিকিট ফলো-আপ",
    esc_routine_queue_disc: "এটি CASE-{ID}-কে সাধারণ অভিযোগ সারিতে যুক্ত করবে।",

    // Protocol Actions
    action_title_low: "মানক প্রশাসনিক সারি",
    action_desc_low: "সাধারণ অভিযোগ টিকিট তৈরি করুন; এনএইচএএ পোর্টাল বা এসএমএসের মাধ্যমে নিয়মিত ফলো-আপ।",
    dispatch_low: "স্তর ১ হেল্পলাইন কর্মকর্তা",
    action_title_mod: "কাউন্সেলর কলব্যাক ও আইনি সহায়তা সচেতনতা",
    action_desc_mod: "স্তর ২ মানসিক কাউন্সেলরের কাছে টিকিট পাঠান; PoA আইন ১৯৮৯ অনুযায়ী আইনি নির্দেশিকা দিন।",
    dispatch_mod: "জেলা আইনি সহায়তা ও স্তর ২ কাউন্সেলর",
    action_title_high: "ডিউটি কাউন্সেলর নিয়োগ ও জরুরি ব্যবস্থা",
    action_desc_high: "সিনিয়র কাউন্সেলর দ্বারা তাৎক্ষণিক টেলিফোনিক ট্রায়াজ; জেলা সমাজকল্যাণ কর্মকর্তাকে সতর্ক করুন।",
    dispatch_high: "সিনিয়র ডিউটি কাউন্সেলর ও জেলা নোডাল অফিসার",
    action_title_crit: "জরুরি পুলিশ যোগাযোগ ও সাক্ষী সুরক্ষা সক্রিয়করণ",
    action_desc_crit: "রেড অ্যালার্ট: এসপি / জেলা পুলিশ কন্ট্রোল রুমের সাথে সরাসরি যোগাযোগ; জরুরি সুরক্ষা ব্যবস্থা।",
    dispatch_crit: "পুলিশ সুপার (কন্ট্রোল রুম) ও র্যাপিড রেসপন্স টিম",

    // Indicator Names
    ind_lethal: "মারাত্মক ও গুরুতর শারীরিক হুমকি",
    ind_confinement: "আটকে রাখা ও অবরুদ্ধ করা",
    ind_panic: "চরম আতঙ্ক ও মৃত্যুভয়",
    ind_boycott: "সামাজিক ও অর্থনৈতিক বয়কট এবং সম্পদ নিষেধ",
    ind_pressure: "প্রাতিষ্ঠানিক চাপ ও আপসে বাধ্য করা",
    ind_urgency: "তাৎক্ষণিক বিপদ ও রিয়েল-টাইম সংকট"
  },
  ta: {
    // Top Bar & Navigation
    ministry_title: "சமூக நீதி மற்றும் அதிகாரமளித்தல் அமைச்சகம்",
    gov_sub: "இந்திய அரசு • ஸ்மார்ட் இந்தியா ஹேக்கத்தான் 2026 (SIH26093)",
    helpline_label: "NHAA இலவச எண்:",
    badge_synthetic: "மாதிரி தரவு மட்டுமே",
    prototype_disclaimer: "மாதிரி விளக்கம்: உண்மையான தனிநபர் தரவு இல்லை. மனித மேற்பார்வை அவசியம்.",
    team_label: "குழு:",
    brand_tagline: "வன்கொடுமை உதவி மையத்திற்கான AI மன அழுத்த மதிப்பீட்டு தளம்",
    tab_intake: "உள்ளீட்டு தளம்",
    tab_queue: "ஆலோசகர் முன்னுரிமை மேசை",
    tab_audit: "வெளிப்படைத்தன்மை மற்றும் கட்டமைப்பு",

    // Channel Pills & Titles
    channel_portal: "வலைத்தள படிவம்",
    channel_chatbot: "சாட்பாட்",
    channel_ivrs: "IVRS அழைப்பு",
    channel_portal_title: "வலைத்தள படிவம்",
    channel_chatbot_title: "உரையாடல் சாட்பாட்",
    channel_ivrs_title: "14566 IVRS குரல் அழைப்பு",

    // Tab 1: Intake Studio
    intake_title: "பல வழி உள்ளீட்டு உருவகப்படுத்துதல்",
    intake_subtitle: "வலைத்தளம், சாட்பாட் அல்லது IVRS குரல் அழைப்பு மூலம் பதிவு செய்யவும்",
    quick_presets: "மாதிரி வழக்குகள்:",
    preset_t1_low: "T1: குறைவு (நிர்வாகம்)",
    preset_t2_mod: "T2: நடுத்தரம் (தண்ணீர் மறுப்பு - இந்தி)",
    preset_t3_high: "T3: அதிகம் (அடைத்து வைத்தல்)",
    preset_t4_crit_hi: "T4: அவசரம் (கலவரம் - இந்தி)",
    preset_t4_crit_bn: "T4: அவசரம் (முற்றுகை - பெங்காலி)",
    preset_t3_high_ta: "T3: அதிகம் (புறக்கணிப்பு - தமிழ்)",

    // Audio Stream Telemetry
    audio_telemetry_title: "📞 14566 IVRS குரல் பயோமார்க் டெலிமெட்ரி",
    ser_confidence_tag: "SER துல்லிய நிலை:",
    audio_sim_btn: "நேரலை குரல் ஓட்டத்தை உருவகப்படுத்துக",
    audio_sim_pause: "குரல் உருவகப்படுத்துதலை நிறுத்து",
    lbl_pitch_var: "சுருதி மாறுபாடு:",
    lbl_jitter: "அதிர்வு:",
    lbl_rate: "வேகம்:",

    // Input Form
    transcript_label: "குடிமகன் அறிக்கை / குரல் உரை:",
    transcript_placeholder: "புகார் விவரத்தை உள்ளிடவும் அல்லது ஒட்டவும் (ஆங்கிலம், இந்தி, பெங்காலி, தமிழ்)...",
    char_count_suffix: "எழுத்துக்கள்",
    consent_statement: "குடிமகன் ஒப்புதல்: அவசர முன்னுரிமை மதிப்பீட்டிற்கு AI பரிசோதனைக்கு ஒப்புதல் அளிக்கிறேன்.",
    btn_evaluate: "மன அழுத்தம் மற்றும் அபாய நிலையை பகுப்பாய்வு செய்க",
    btn_evaluating: "சமிக்ஞைகள் பகுப்பாய்வு செய்யப்படுகின்றன...",
    btn_clear: "அழிக்க",
    btn_save_queue: "நேரலை வரிசையில் சேர்க்க",

    // Tab 1: SVI Result Card
    analysis_title: "மன அழுத்த பாதிப்பு குறியீடு (SVI)",
    analysis_subtitle: "வெளிப்படையான கணித மதிப்பீடு மற்றும் கண்டறியப்பட்ட சமிக்ஞைகள்",
    awaiting_input: "உள்ளீட்டிற்காக காத்திருக்கிறது",
    gauge_low: "0 குறைவு",
    gauge_mod: "31 நடுத்தரம்",
    gauge_high: "56 அதிகம்",
    gauge_crit: "79-100 அவசரம்",
    sla_awaiting: "காலக்கெடு: --",
    protocol_awaiting_title: "மதிப்பீட்டிற்கு காத்திருக்கிறது",
    protocol_awaiting_desc: "வெளிப்படையான SVI குறியீட்டைக் கணக்கிட மற்றும் NHAA நடவடிக்கைகளைக் காண விவரங்களை உள்ளிடவும்.",
    mandated_action_label: "கட்டாய நடவடிக்கை:",
    explainable_signals_title: "🔍 கண்டறியப்பட்ட பாதிப்பு சமிக்ஞைகள்",
    no_indicators_text: "இதுவரை எந்த சமிக்ஞைகளும் மதிப்பிடப்படவில்லை.",
    no_indicators_routine: "தீவிர அச்சுறுத்தல் சமிக்ஞைகள் ஏதுமில்லை. வழக்கமான புகார்.",
    math_formula_title: "📐 தணிக்கை செய்யக்கூடிய SVI கணித சூத்திரம்:",
    math_base: "அடிப்படை",
    math_indicators: "குறியீடுகள்",
    math_context: "சூழல்",
    math_acoustic: "ஒலியியல்",
    flag_police_liaison: "🚨 அவசர காவல் தொடர்பு தூண்டப்பட்டது",
    flag_witness_protection: "🛡️ சாட்சி பாதுகாப்பு மதிப்பீடு கட்டாயம்",

    // Tab 2: Counsellor Triage Desk Metrics & Toolbar
    stat_total_cases: "மொத்த புகார்கள்",
    stat_crit_alerts: "அவசர சிவப்பு எச்சரிக்கைகள்",
    stat_high_priority: "அதிமுக்கிய முன்னுரிமை (அன்றே)",
    stat_avg_svi: "சராசரி SVI அழுத்த மதிப்பெண்",
    stat_statutory_deadlines: "பிஓஏ சட்டப்பூர்வ காலக்கெடு (7 நாட்கள்/60 நாட்கள்)",
    lbl_stat_overdue: "காலாவதியானது",
    lbl_stat_approaching: "நெருங்குகிறது",
    subnav_live_queue: "நேரலை அபாய-முன்னுரிமை வரிசை",
    subnav_hitl_audit: "மனித திருத்தம் & தணிக்கை பதிவு",
    queue_title: "நேரலை வன்கொடுமை உதவி மேசை வரிசை",
    queue_subtitle: "நிகழ்நேர வரிசை: அதிக பாதிப்பு உள்ள வழக்குகள் தானாகவே மேலே வரும்",
    filter_risk_tier: "அபாய நிலை:",
    opt_all_tiers: "அனைத்து நிலைகளும்",
    opt_tier_crit: "🚨 அவசரம் (79-100)",
    opt_tier_high: "⚠️ அதிகம் (56-78)",
    opt_tier_mod: "🟡 நடுத்தரம் (31-55)",
    opt_tier_low: "🟢 குறைவு (0-30)",
    filter_channel: "சேவை வழி:",
    opt_all_channels: "அனைத்து வழிகளும்",
    opt_channel_ivrs: "📞 IVRS",
    opt_channel_chatbot: "💬 சாட்பாட்",
    opt_channel_portal: "📋 வலைத்தளம்",
    search_placeholder: "வழக்கு எண், முக்கிய சொல் அல்லது மாவட்டம் தேடுக...",
    btn_refresh: "புதுப்பி",

    // Tab 2: Queue Table Headers & Actions
    th_case_id: "வழக்கு எண்",
    th_channel: "சேவை வழி",
    th_svi_score: "SVI மதிப்பெண்",
    th_risk_tier: "அபாய நிலை & திருத்தம்",
    th_sla_action: "காலக்கெடு & பரிந்துரைக்கப்பட்ட நடவடிக்கை",
    th_deadlines: "சட்டப்பூர்வ காலக்கெடு (பிஓஏ)",
    th_key_triggers: "கண்டறியப்பட்ட சமிக்ஞைகள்",
    th_status: "நிலை",
    th_actions: "நடவடிக்கைகள்",
    demo_clock_tag: "டெமோ கடிகாரம்:",
    lbl_interim_relief_short: "இடைக்கால நிவாரணம் (7 நாட்கள்)",
    lbl_chargesheet_short: "குற்றப்பத்திரிகை (60 நாட்கள்)",
    lbl_deadline_overdue: "காலாவதியானது",
    lbl_deadline_rem: "மீதம்",
    lbl_reset_clock: "மீட்டமை",
    loading_queue: "நேரலை வரிசை ஏற்றப்படுகிறது...",
    empty_queue: "வரிசையில் பொருந்தும் வழக்குகள் ஏதுமில்லை.",
    btn_override: "திருத்து",
    btn_overridden_label: "திருத்தப்பட்டது (AI: {score})",
    btn_act_police: "🚨 காவல் துறையை அனுப்புக",
    btn_act_witness: "🛡️ சாட்சி பாதுகாப்பு வழங்குக",
    btn_act_counsellor: "🧑‍⚕️ ஆலோசகரை நியமிக்கவும்",
    btn_act_callback: "📞 திரும்ப அழைப்பை திட்டமிடுக",
    btn_act_routine: "📋 வழக்கமான வரிசை",
    btn_act_details: "👁️ வழக்கு விவரம்",
    routine_query: "வழக்கமான விசாரணை",

    // Tab 2: Audit Trail Card & Table
    audit_trail_title: "மனித SVI திருத்தம் & நடவடிக்கை தணிக்கை பதிவு",
    audit_trail_subtitle: "மனித மேற்பார்வை, மதிப்பெண் திருத்தம் மற்றும் நடவடிக்கைகளின் நிரந்தர பதிவு",
    btn_refresh_audit: "தணிக்கை பதிவை புதுப்பி",
    th_timestamp: "நேரம்",
    th_event_type: "நிகழ்வு வகை",
    th_case_citizen: "வழக்கு எண் & குடிமகன்",
    th_ai_score: "AI மதிப்பெண்",
    th_overridden_score: "திருத்தப்பட்ட மதிப்பெண்",
    th_tier_shift: "நிலை மாற்றம்",
    th_justification_notes: "ஆலோசகரின் நியாயப்படுத்துதல் / குறிப்புகள்",
    th_counsellor_id: "ஆலோசகர் எண்",
    loading_audit: "தணிக்கை பதிவுகள் ஏற்றப்படுகின்றன...",
    empty_audit: "இதுவரை திருத்தங்கள் அல்லது நடவடிக்கைகள் பதிவாகவில்லை.",
    badge_svi_override: "⚖️ SVI திருத்தம்",
    badge_esc_action: "🚨 அவசர நடவடிக்கை",
    unchanged_tier: "மாற்றமில்லை",
    lbl_override_reason_prefix: "திருத்தத்திற்கான காரணம்:",
    lbl_action_prefix: "நடவடிக்கை:",
    counsellor_default_note: "நிலையான நெறிமுறை செயல்படுத்தப்பட்டது.",

    // Tab 3: Explainability, Landscape & Ethics
    tab3_title: "வெளிப்படைத்தன்மை கட்டமைப்பு, ஒப்பீட்டு பகுப்பாய்வு மற்றும் நெறிமுறைகள்",
    tab3_subtitle: "SIH26093 பிரச்சனை சூழல் — சமூக நீதி மற்றும் அதிகாரமளித்தல் அமைச்சகம்",
    sec1_title: "1. ஒப்பீட்டு பகுப்பாய்வு: சகாயதா சேது எவ்வாறு இடைவெளியை நிரப்புகிறது",
    sec1_intro: "பொதுவான குரல் AI தொழில்நுட்பங்கள் இருந்தாலும், இந்தியாவின் சாதிய வன்கொடுமை சட்ட நடைமுறைகளுக்கு (NHAA 14566) உகந்ததாக எதுவுமில்லை.",
    th_comp_platform: "தளம் / கட்டமைப்பு",
    th_comp_focus: "முதன்மை கவனம்",
    th_comp_models: "குரல்/உரை மாதிரிகள்",
    th_comp_legal: "சட்ட & அவசர இணைப்பு",
    th_comp_explain: "வெளிப்படைத்தன்மை அடுக்கு",
    th_comp_channel: "NHAA பல வழித்தடம் (14566)",
    comp_manodayam_focus: "பாதுகாப்புப் படை மன அழுத்த பரிசோதனை",
    comp_manodayam_models: "குரல் பயோமார்க்ஸ்",
    comp_manodayam_legal: "❌ இராணுவ நல்வாழ்வு மட்டுமே",
    comp_manodayam_explain: "⚠️ வெளிப்படையற்ற அபாய குறியீடு",
    comp_manodayam_channel: "❌ IVRS மட்டுமே",
    comp_vocalysis_focus: "மருத்துவமனை & பள்ளி மனநலம்",
    comp_vocalysis_models: "குரல் ஒலியியல்",
    comp_vocalysis_legal: "❌ பொதுவான ஆலோசனை",
    comp_vocalysis_explain: "⚠️ சமிக்ஞைகள் இல்லாத வெறும் மதிப்பெண்",
    comp_vocalysis_channel: "❌ செயலி மட்டுமே",
    comp_ser_focus: "உணர்ச்சி அங்கீகார ஆராய்ச்சி",
    comp_ser_models: "RAVDESS / IEMOCAP / IndicSER",
    comp_ser_legal: "❌ கல்வி ஆராய்ச்சி மட்டுமே (45–70%)",
    comp_ser_explain: "❌ நேரடி சாப்ட்மேக்ஸ் வகை",
    comp_ser_channel: "❌ உதவி மைய இணைப்பு இல்லை",
    comp_setu_focus: "NHAA 14566 சாதிய வன்கொடுமை மேலாண்மை",
    comp_setu_models: "பன்மொழி இந்திய + ஒலியியல் இணைப்பு",
    comp_setu_legal: "✅ 4-நிலை சட்ட ஏணி (காவல்துறை/PoA சட்டம்/சாட்சி பாதுகாப்பு)",
    comp_setu_explain: "✅ முழு வெளிப்படையான முக்கிய சொல் பகுப்பாய்வு",
    comp_setu_channel: "✅ ஒருங்கிணைந்த IVRS + சாட்பாட் + தளம்",

    sec2_title: "2. தணிக்கை செய்யக்கூடிய SVI கணித சூத்திரம்",
    weight_lethal_title: "உயிருக்கு ஆபத்தான அச்சுறுத்தல் (அதிகபட்சம் 28 புள்ளிகள்)",
    weight_lethal_desc: "கொலை, தீவைப்பு, கும்பல் தாக்குதல், ஆயுதங்கள், துப்பாக்கிகள் (ஒரு தாக்குதலுக்கு: 14 புள்ளிகள்)",
    weight_confinement_title: "முடக்கம் & அடைத்து வைத்தல் (அதிகபட்சம் 14 புள்ளிகள்)",
    weight_confinement_desc: "சாலை அடைப்பு, சூழ்ந்துகொள்ளுதல், பணயக்கைதி (ஒரு முறைக்கு: 7 புள்ளிகள்)",
    weight_panic_title: "தீவிர பீதி & மரண பயம் (அதிகபட்சம் 12 புள்ளிகள்)",
    weight_panic_desc: "அலறல், குழந்தைகளின் அழுகை, உயிருக்காக கெஞ்சுதல் (ஒரு முறைக்கு: 6 புள்ளிகள்)",
    weight_boycott_title: "பொருளாதார & சமூக புறக்கணிப்பு (அதிகபட்சம் 16 புள்ளிகள்)",
    weight_boycott_desc: "குடிநீர் மறுப்பு, ரேஷன் புறக்கணிப்பு, ஊர் நீக்கம் (ஒரு முறைக்கு: 8 புள்ளிகள்)",
    weight_pressure_title: "நிறுவன அழுத்தம் & கட்டாய சமரசம் (அதிகபட்சம் 12 புள்ளிகள்)",
    weight_pressure_desc: "FIR மறுப்பு, கட்டாய சமரசம், திரும்பப் பெற மிரட்டல் (ஒரு முறைக்கு: 6 புள்ளிகள்)",
    weight_urgency_title: "உடனடி அச்சுறுத்தல் (அதிகபட்சம் 14 புள்ளிகள்)",
    weight_urgency_desc: "தற்போது நடக்கிறது, கதவை உடைக்க முயற்சி (ஒரு முறைக்கு: 7 புள்ளிகள்)",

    sec3_title: "3. தனியுரிமை வடிவமைப்பு மற்றும் மனித மேற்பார்வை",
    ethics_pii_title: "பூஜ்ஜிய-PII சேமிப்பு",
    ethics_pii_desc: "குடிமக்களின் பெயர்கள் மற்றும் எண்கள் குறியாக்க புனைப்பெயர்களாக (எ.கா. Citizen_R_71) மாற்றப்படுகின்றன.",
    ethics_consent_title: "ஒப்புதல் அடிப்படையிலான செயல்முறை",
    ethics_consent_desc: "AI பரிசோதனைக்கு குடிமகனின் வெளிப்படையான ஒப்புதல் தேவை.",
    ethics_hitl_title: "மனித மேற்பார்வை உத்தரவாதம்",
    ethics_hitl_desc: "AI முன்னுரிமையை மட்டுமே பரிந்துரைக்கிறது; இறுதி நடவடிக்கைகளை பயிற்சி பெற்ற ஆலோசகரே மேற்கொள்வார்.",
    ethics_ser_title: "குரல் துல்லிய வெளிப்படைத்தன்மை",
    ethics_ser_desc: "இந்திய மொழிகளில் உள்ள 45-70% துல்லிய வரம்பை வெளிப்படையாக ஏற்றுக்கொள்கிறது.",

    // Modals Common
    btn_close: "மூடுக",
    btn_cancel: "ரத்து செய்",

    // Case Details Modal
    modal_case_details_title: "மேலாண்மை மேசை: வழக்கு",
    modal_risk_suffix: "அபாயம்",
    modal_channel_lbl: "சேவை வழி:",
    modal_district_lbl: "மாவட்டம்:",
    modal_statement_header: "முழு அறிக்கை / ஆடியோ உரை",
    modal_mandated_header: "கட்டாய NHAA நடவடிக்கை:",
    modal_assigned_unit_lbl: "ஒதுக்கப்பட்ட பிரிவு:",
    modal_counsellor_notes_lbl: "ஆலோசகர் குறிப்புகள் & நடவடிக்கைகள்:",
    modal_counsellor_notes_ph: "ஆலோசகர் கருத்துக்கள், வழக்கு சரிபார்ப்பு அல்லது காவல் ஒருங்கிணைப்பு விவரங்களை உள்ளிடவும்...",
    modal_override_banner_title: "⚖️ மனித திருத்தம் செயலில் உள்ளது:",
    modal_override_orig_ai: "அசல் AI மதிப்பெண்",
    modal_override_by: "ஆலோசகரால் திருத்தப்பட்ட தேதி",
    modal_override_justification: "காரணம்:",

    // HITL Override Modal
    modal_override_title: "⚖️ மனித (HITL) SVI மதிப்பெண் திருத்தம்",
    modal_override_subtitle: "AI பரிந்துரையை விட ஆலோசகரின் முடிவுக்கு முன்னுரிமை",
    lbl_case_id: "வழக்கு அடையாளம்:",
    lbl_complainant: "புகார்தாரர் / புனைப்பெயர்:",
    lbl_channel: "சேவை வழி:",
    lbl_ai_baseline: "தற்போதைய AI அடிப்படை:",
    lbl_bound_max: "🔒 வரம்பு: அதிகபட்சம் ±10 புள்ளிகள்",
    lbl_adjust_svi: "SVI மதிப்பெண்ணை மாற்றியமைக்கவும் (அதிகபட்சம் ±10 புள்ளிகள்):",
    lbl_min_bound: "குறைந்தபட்சம் -10",
    lbl_max_bound: "அதிகபட்சம் +10",
    lbl_resulting_tier: "இறுதி அபாய நிலை & நெறிமுறை:",
    lbl_override_reason: "மனித திருத்தத்திற்கான காரணம்",
    lbl_override_mandatory: "(கட்டாய தணிக்கை நியாயப்படுத்துதல்)",
    placeholder_override_reason: "மருத்துவ தீர்ப்பு, புதிதாக கண்டறியப்பட்ட அச்சுறுத்தல் காரணிகள் அல்லது சமூக சூழலை பதிவு செய்யவும்...",
    hint_override_reason: "இந்த காரணம் NHAA தணிக்கை பதிவில் நேரத்துடன் நிரந்தரமாக சேமிக்கப்படும்.",
    btn_confirm_override: "திருத்தத்தை உறுதிசெய்து நிலையை மாற்றுக",
    btn_saving_override: "திருத்தம் சேமிக்கப்படுகிறது...",

    // Escalation Modal
    modal_esc_title: "PoA சட்ட அவசர நடவடிக்கையை உறுதிப்படுத்துக",
    modal_esc_subtitle: "உருவகப்படுத்தப்பட்ட தேசிய உதவி மைய பணிப்பாய்வு",
    lbl_sim_notice: "மாதிரி உருவகப்படுத்துதல் அறிவிப்பு",
    lbl_current_tier: "தற்போதைய நிலை:",
    lbl_triggering_action: "தூண்டப்பட்ட நடவடிக்கை:",
    lbl_esc_remarks: "ஆலோசகர் குறிப்புகள் / காவல் தொடர்பு விவரங்கள் (விருப்பத்தேர்வு):",
    placeholder_esc_notes: "செயல்பாட்டுக் குறிப்புகள் அல்லது அவசர தங்குமிட ஒதுக்கீட்டு விவரங்களைச் சேர்க்கவும்...",
    btn_confirm_esc_action: "உறுதிசெய்து பதிவு செய்க (மாதிரி)",
    btn_recording_action: "நடவடிக்கை பதிவாகிறது...",

    // Risk Tiers
    tier_low: "குறைவு (Low)",
    tier_moderate: "நடுத்தரம் (Moderate)",
    tier_high: "அதிகம் (High)",
    tier_critical: "அவசரம் (Critical)",

    // SLAs
    sla_low: "72 மணி நேரத்திற்குள்",
    sla_mod: "48 மணி நேரத்திற்குள்",
    sla_high: "2 மணி நேரத்திற்குள் (அன்றே)",
    sla_crit: "உடனடியாக / < 15 நிமிடங்கள் (சிவப்பு எச்சரிக்கை)",

    // Escalation Action Metadata
    esc_dispatch_police_title: "🚨 காவல் துறையை அனுப்புக",
    esc_dispatch_police_name: "உடனடி காவல் தொடர்பு அனுப்புதல்",
    esc_dispatch_police_disc: "இது CASE-{ID} வழக்கை காவல் தொடர்புக்காக அடையாளப்படுத்தும். உண்மையான போலீஸ் அனுப்பப்படாது — இது SC/ST (PoA) சட்டத்தின் கீழ் உள்ள பணிப்பாய்வை விளக்குகிறது.",
    esc_trigger_witness_title: "🛡️ சாட்சி பாதுகாப்பு மதிப்பீட்டைத் தொடங்கு",
    esc_trigger_witness_name: "சாட்சி பாதுகாப்பு திட்ட மதிப்பீடு",
    esc_trigger_witness_disc: "இது சாட்சி பாதுகாப்பு திட்டம் 2018 இன் கீழ் CASE-{ID} க்கான மதிப்பீட்டுக் கொடியைத் தூண்டும்.",
    esc_assign_counsellor_title: "🧑‍⚕️ மூத்த ஆலோசகரை நியமிக்கவும்",
    esc_assign_counsellor_name: "மூத்த மன அழுத்த ஆலோசகரை நியமித்தல்",
    esc_assign_counsellor_disc: "இது CASE-{ID} வழக்கை மூத்த ஆலோசகருக்கு ஒதுக்கும்.",
    esc_schedule_callback_title: "📞 திரும்ப அழைப்பை திட்டமிடுக",
    esc_schedule_callback_name: "48 மணி நேர சட்ட & உளவியல் திரும்ப அழைப்பு",
    esc_schedule_callback_disc: "இது CASE-{ID} க்கு சட்ட உதவி வழிகாட்டுதல் அழைப்பை திட்டமிடும்.",
    esc_routine_queue_title: "📋 வழக்கமான வரிசை தொடர்ச்சி",
    esc_routine_queue_name: "நிலையான நிர்வாக டிக்கெட் தொடர்ச்சி",
    esc_routine_queue_disc: "இது CASE-{ID} வழக்கை வழக்கமான புகார் வரிசையில் சேர்க்கும்.",

    // Protocol Actions
    action_title_low: "வழக்கமான நிர்வாக வரிசை",
    action_desc_low: "நிலையான புகார் டிக்கெட்டைப் பதிவுசெய்க; NHAA தளம் அல்லது SMS வழியாக வழக்கமான பின்தொடர்தல்.",
    dispatch_low: "நிலை 1 உதவி மைய நிர்வாகி",
    action_title_mod: "ஆலோசகர் திரும்ப அழைப்பு & சட்ட உதவி விழிப்புணர்வு",
    action_desc_mod: "நிலை 2 உளவியல் ஆலோசகருக்கு அனுப்பவும்; PoA சட்டம் 1989 இன் கீழ் சட்ட உதவி வழங்கவும்.",
    dispatch_mod: "மாவட்ட சட்ட உதவி & நிலை 2 ஆலோசகர்",
    action_title_high: "ஆலோசகர் நியமனம் & சமூக நல மேம்பாடு",
    action_desc_high: "மூத்த ஆலோசகரின் உடனடி தொலைபேசி மதிப்பீடு; மாவட்ட வன்கொடுமை தடுப்பு அதிகாரியை எச்சரிக்கவும்.",
    dispatch_high: "மூத்த ஆலோசகர் & மாவட்ட ஒருங்கிணைப்பு அதிகாரி",
    action_title_crit: "அவசர காவல் தொடர்பு & சாட்சி பாதுகாப்பு செயல்படுத்துதல்",
    action_desc_crit: "சிவப்பு எச்சரிக்கை: மாவட்ட காவல் கட்டுப்பாட்டு அறையுடன் நேரடி இணைப்பு; சாட்சி பாதுகாப்பு மற்றும் தங்குமிடம் ஒதுக்கீடு.",
    dispatch_crit: "காவல் கண்காணிப்பாளர் (கட்டுப்பாட்டு அறை) & விரைவு அதிரடிப் படை",

    // Indicator Names
    ind_lethal: "உயிருக்கு ஆபத்தான தீவிர உடல் அச்சுறுத்தல்",
    ind_confinement: "தடைசெய்யப்பட்ட இயக்கம் & சிறைப்பிடித்தல்",
    ind_panic: "தீவிர பீதி & மரண பயம்",
    ind_boycott: "பொருளாதார/சமூக புறக்கணிப்பு & வள மறுப்பு",
    ind_pressure: "நிறுவன அழுத்தம் & கட்டாய சமரசம்",
    ind_urgency: "உடனடி ஆபத்து & நிகழ்நேர அச்சுறுத்தல்"
  }
};

// Translation Helper Functions
function t(key, fallback = '') {
  const lang = state.currentLang || 'en';
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en?.[key] || fallback || key;
}

function tTier(tier) {
  if (!tier) return '';
  const key = `tier_${tier.toLowerCase()}`;
  return t(key, tier);
}

function tSla(tier) {
  if (!tier) return '--';
  const norm = tier.toLowerCase();
  if (norm.includes('crit')) return t('sla_crit');
  if (norm.includes('high')) return t('sla_high');
  if (norm.includes('mod')) return t('sla_mod');
  return t('sla_low');
}

function tActionTitle(tier) {
  if (!tier) return '';
  const norm = tier.toLowerCase();
  if (norm.includes('crit')) return t('action_title_crit');
  if (norm.includes('high')) return t('action_title_high');
  if (norm.includes('mod')) return t('action_title_mod');
  return t('action_title_low');
}

function tActionDesc(tier) {
  if (!tier) return '';
  const norm = tier.toLowerCase();
  if (norm.includes('crit')) return t('action_desc_crit');
  if (norm.includes('high')) return t('action_desc_high');
  if (norm.includes('mod')) return t('action_desc_mod');
  return t('action_desc_low');
}

function tDispatch(tier) {
  if (!tier) return '--';
  const norm = tier.toLowerCase();
  if (norm.includes('crit')) return t('dispatch_crit');
  if (norm.includes('high')) return t('dispatch_high');
  if (norm.includes('mod')) return t('dispatch_mod');
  return t('dispatch_low');
}

function tCategoryName(catName) {
  if (!catName) return '';
  const c = catName.toLowerCase();
  if (c.includes('self-harm') || c.includes('psychological') || c.includes('crisis') || c.includes('suicidal')) return t('ind_crisis', catName);
  if (c.includes('lethal') || c.includes('physical')) return t('ind_lethal', catName);
  if (c.includes('confinement') || c.includes('movement')) return t('ind_confinement', catName);
  if (c.includes('panic') || c.includes('terror') || c.includes('fear')) return t('ind_panic', catName);
  if (c.includes('boycott') || c.includes('resource') || c.includes('denial')) return t('ind_boycott', catName);
  if (c.includes('pressure') || c.includes('compromise') || c.includes('institutional')) return t('ind_pressure', catName);
  if (c.includes('urgency') || c.includes('imminence') || c.includes('temporal')) return t('ind_urgency', catName);
  return catName;
}

async function refreshVigilanceDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/vigilance-dashboard`);
    if (!res.ok) return;
    const dashboard = await res.json();
    if (!dashboard) return;

    document.getElementById('vigTotalCases').textContent = dashboard.total_cases || 0;
    document.getElementById('vigCriticalCases').textContent = dashboard.cases_by_risk_tier?.Critical || 0;
    document.getElementById('vigHighCases').textContent = dashboard.cases_by_risk_tier?.High || 0;
    document.getElementById('vigAvgResolution').textContent = `${dashboard.average_time_to_resolution_hours || 0}h`;
    document.getElementById('vigOverdueCases').textContent = dashboard.overdue_deadlines_count || 0;

    document.getElementById('vigCasesRegistered').textContent = dashboard.summary?.cases_registered_this_period || 0;
    document.getElementById('vigChargesheetsOnTime').textContent = dashboard.summary?.chargesheets_on_time || dashboard.summary?.chargesheets_filed_on_time || 0;
    document.getElementById('vigChargesheetsLate').textContent = dashboard.summary?.chargesheets_late || dashboard.summary?.chargesheets_filed_late || 0;
    document.getElementById('vigReliefOnTime').textContent = dashboard.summary?.relief_payments_on_time || 0;
    document.getElementById('vigReliefLate').textContent = dashboard.summary?.relief_payments_late || 0;

    // Feature 9: Render Atrocity-Prone Area Signals table
    const tableBody = document.getElementById('atrocityProneTableBody');
    if (tableBody) {
      const signals = dashboard.atrocity_prone_signals || {};
      const allDistricts = signals.all_districts || [];
      if (allDistricts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 16px;">No district density signals available yet.</td></tr>`;
      } else {
        tableBody.innerHTML = allDistricts.map(d => {
          const isFlagged = !!d.is_flagged_atrocity_prone;
          const specialCourtBadge = d.has_special_court
            ? `<span style="background:rgba(16,185,129,0.18); color:#34d399; border:1px solid rgba(16,185,129,0.4); padding:2px 8px; border-radius:12px; font-size:0.72rem; font-weight:600;">🏛️ Sec 14A Court</span>`
            : `<span style="background:rgba(239,68,68,0.18); color:#f87171; border:1px solid rgba(239,68,68,0.4); padding:2px 8px; border-radius:12px; font-size:0.72rem; font-weight:600;" title="Structural Delay Risk: no Exclusive Special Court identified">⚠️ Regular Sessions Court</span>`;

          const densityIndicator = isFlagged
            ? `<div style="display:flex; flex-direction:column; gap:3px;">
                 <span style="background:rgba(220,38,38,0.25); color:#fca5a5; border:1px solid #dc2626; padding:3px 8px; border-radius:12px; font-weight:700; font-size:0.75rem; display:inline-block; width:fit-content;">🚨 ATROCITY-PRONE SIGNAL (>= 3 High/Crit)</span>
                 <span style="font-size:0.72rem; color:#fca5a5;">Cross-check against official state atrocity-prone declarations</span>
               </div>`
            : `<span style="color:#94a3b8; font-size:0.75rem;">Standard Density (Below threshold)</span>`;

          return `
            <tr style="${isFlagged ? 'background: rgba(220, 38, 38, 0.08);' : ''}">
              <td><strong style="color: #f8fafc;">${escapeHtml(d.district)}</strong></td>
              <td><span style="color: #cbd5e1;">${escapeHtml(d.state)}</span></td>
              <td>
                <span class="text-mono" style="font-weight:700; color:${d.high_critical_count >= 3 ? '#ef4444' : (d.high_critical_count > 0 ? '#f59e0b' : '#94a3b8')};">
                  ${d.high_critical_count} (${d.critical_cases} Crit / ${d.high_cases} High)
                </span>
              </td>
              <td><span class="text-mono" style="color: #cbd5e1;">${d.total_cases}</span></td>
              <td>${specialCourtBadge}</td>
              <td>${densityIndicator}</td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Failed to fetch Vigilance Dashboard data', err);
  }
}

async function generateMonthlyReport() {
  try {
    const res = await fetch(`${API_BASE}/api/vigilance-dashboard/export`);
    if (!res.ok) return;
    const dashboard = await res.json();
    const output = document.getElementById('vigilanceExportOutput');
    if (output) {
      window._latestVigilanceSnapshot = dashboard;
      const jsonStr = JSON.stringify(dashboard, null, 2);
      const flaggedDistricts = dashboard.atrocity_prone_signals?.flagged_districts || [];
      const flaggedListText = flaggedDistricts.length > 0
        ? flaggedDistricts.map(d => `  * ${d.district} (${d.state}): ${d.high_critical_count} High/Crit Cases (Total: ${d.total_cases}) [${d.has_special_court ? 'Sec 14A Court Active' : 'Delay Risk: No Exclusive Special Court'}]`).join('\n')
        : '  * None exceeding illustrative threshold in available sample data.';

      const textSummary = `================================================================================
DISTRICT VIGILANCE & MONITORING COMMITTEE — MONTHLY CASE PROGRESS REPORT
Statutory Compliance & Review under SC/ST (Prevention of Atrocities) Rules, 1995
Generated: ${dashboard.generated_at || new Date().toISOString()}
================================================================================

1. EXECUTIVE CASE SUMMARY
--------------------------------------------------------------------------------
Total Cases Registered This Period:        ${dashboard.summary?.cases_registered_this_period || 0}
Average Time-to-Resolution:               ${dashboard.average_time_to_resolution_hours || 0} hours
Total Overdue Statutory Deadlines:        ${dashboard.overdue_deadlines_count || 0}

2. RISK TIER CONCENTRATION
--------------------------------------------------------------------------------
- Critical Tier:                          ${dashboard.cases_by_risk_tier?.Critical || 0}
- High Tier:                              ${dashboard.cases_by_risk_tier?.High || 0}
- Moderate Tier:                          ${dashboard.cases_by_risk_tier?.Moderate || 0}
- Low Tier:                               ${dashboard.cases_by_risk_tier?.Low || 0}

3. STATUTORY COMPLIANCE BENCHMARKS
--------------------------------------------------------------------------------
- Chargesheets Filed On Time (<= 60d):    ${dashboard.summary?.chargesheets_on_time || 0}
- Chargesheets Overdue / Late (> 60d):    ${dashboard.summary?.chargesheets_late || 0}
- Interim Relief Paid On Time (<= 7d):     ${dashboard.summary?.relief_payments_on_time || 0}
- Interim Relief Overdue / Late (> 7d):   ${dashboard.summary?.relief_payments_late || 0}

4. ATROCITY-PRONE AREA SIGNALS (SAMPLE DENSITY CROSS-CHECK)
--------------------------------------------------------------------------------
Illustrative Threshold: 3+ High/Critical tier cases from the same district
Flagged Districts Count: ${dashboard.atrocity_prone_signals?.flagged_count || 0}
${flaggedListText}

National Context Note:
Per a 2022 union government report, some states (e.g. Uttar Pradesh) had zero officially-declared atrocity-prone areas despite high case volumes — this module demonstrates how case data could proactively surface such gaps rather than relying solely on periodic manual review.

5. STATUTORY MANDATE NOTE
--------------------------------------------------------------------------------
${dashboard.note || 'PoA Rules, 1995 require Vigilance & Monitoring Committees to review case progress only twice yearly (January, July). This dashboard makes that review continuous instead of periodic, using the same underlying case data already captured by this system.'}

================================================================================
Report Snapshot End • Decision-support automated compilation for District Magistrate
================================================================================`;

      window._latestVigilanceText = textSummary;

      output.innerHTML = `
        <div style="background:rgba(15,23,42,0.85); border:1px solid #334155; border-radius:8px; padding:16px; margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; gap:8px; flex-wrap:wrap;">
            <div>
              <strong style="color:#f8fafc; font-size:0.9rem;">📄 District Magistrate Statutory Case Progress Summary</strong>
              <div style="font-size:0.75rem; color:#94a3b8;">Automated continuous monitoring snapshot per PoA Rules, 1995</div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn btn-primary btn-xs" onclick="downloadReportFile('dm_monthly_vigilance_report.txt', window._latestVigilanceText, 'text/plain')">
                📥 Download Text Report
              </button>
              <button class="btn btn-outline btn-xs" onclick="downloadReportFile('dm_monthly_vigilance_snapshot.json', JSON.stringify(window._latestVigilanceSnapshot, null, 2), 'application/json')">
                📥 Download JSON Snapshot
              </button>
              <button class="btn btn-outline btn-xs" onclick="copyReportSnapshot()">
                📋 Copy Text
              </button>
            </div>
          </div>
          <pre id="rawReportText" style="background:#091322; border:1px solid #1e293b; border-radius:6px; padding:14px; font-size:0.75rem; color:#cbd5e1; max-height:300px; overflow-y:auto; white-space:pre-wrap; font-family:'JetBrains Mono', monospace; line-height:1.45;">${escapeHtml(textSummary)}</pre>
        </div>
      `;
      showToast('Monthly vigilance report generated successfully.', 'success');
    }
  } catch (err) {
    console.error('Failed to export monthly report', err);
    showToast('Failed to generate monthly report snapshot', 'error');
  }
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupLanguageSwitcher();
  setupChannelSelector();
  setupFormHandlers();
  setupWaveformCanvas();
  fetchSamplePresets();
  refreshQueue();
  refreshStats();
});

// Setup Navigation Tabs
function setupNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const pane = document.getElementById(targetId);
      if (pane) pane.classList.add('active');

      if (targetId === 'queue-tab') {
        refreshQueue();
        refreshStats();
      }

      if (targetId === 'vigilance-tab') {
        refreshVigilanceDashboard();
      }
    });
  });
}

// Setup Language Switcher
function setupLanguageSwitcher() {
  const switchEl = document.getElementById('langSwitch');
  if (!switchEl) return;
  
  switchEl.addEventListener('change', (e) => {
    state.currentLang = e.target.value;
    applyLanguage(state.currentLang);
  });
}

function applyLanguage(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Translate all [data-i18n] text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Translate all [data-i18n-placeholder] attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.setAttribute('placeholder', dict[key]);
    }
  });

  // Translate all [data-i18n-title] attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key]) {
      el.setAttribute('title', dict[key]);
    }
  });

  // Update dynamic waveform button
  const audioSimText = document.getElementById('audioSimText');
  if (audioSimText) {
    audioSimText.textContent = state.audioSimulating ? t('audio_sim_pause') : t('audio_sim_btn');
  }

  // Update char counter in intake form
  const textarea = document.getElementById('transcriptInput');
  const charCounter = document.getElementById('charCount');
  if (textarea && charCounter) {
    charCounter.textContent = `${textarea.value.length} ${t('char_count_suffix')}`;
  }

  // Re-render active assessment result if present
  if (state.activeAssessment) {
    renderAssessmentResult(state.activeAssessment);
  }

  // Re-render cached cases in live queue
  if (state.cachedCases && state.cachedCases.length > 0) {
    renderCasesTable(state.cachedCases);
  }

  // Re-render cached audit logs if on audit view
  if (state.cachedAuditLogs && state.cachedAuditLogs.length > 0) {
    renderAuditTable(state.cachedAuditLogs);
  }
}

// Setup Multi-channel Selector
function setupChannelSelector() {
  const pills = document.querySelectorAll('.channel-pill');
  const ivrsSection = document.getElementById('ivrsAudioSection');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.currentChannel = pill.getAttribute('data-channel');

      if (state.currentChannel === 'ivrs') {
        ivrsSection.classList.add('visible');
      } else {
        ivrsSection.classList.remove('visible');
      }
    });
  });
}

// Setup Form Handlers & Char Counter
function setupFormHandlers() {
  const textarea = document.getElementById('transcriptInput');
  const charCounter = document.getElementById('charCount');
  const form = document.getElementById('assessmentForm');
  const clearBtn = document.getElementById('clearBtn');
  const pushBtn = document.getElementById('pushToQueueBtn');

  if (textarea && charCounter) {
    textarea.addEventListener('input', () => {
      charCounter.textContent = `${textarea.value.length} ${t('char_count_suffix')}`;
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      charCounter.textContent = `0 ${t('char_count_suffix')}`;
      pushBtn.disabled = true;
      resetGauge();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await runAssessment();
    });
  }

  if (pushBtn) {
    pushBtn.addEventListener('click', async () => {
      await pushCurrentCaseToQueue();
    });
  }

  // Queue Filters & Search
  const filterTier = document.getElementById('filterTier');
  const filterChannel = document.getElementById('filterChannel');
  const queueSearch = document.getElementById('queueSearch');
  const refreshBtn = document.getElementById('refreshQueueBtn');
  const reportBtn = document.getElementById('generateMonthlyReportBtn');

  if (filterTier) filterTier.addEventListener('change', () => refreshQueue());
  if (filterChannel) filterChannel.addEventListener('change', () => refreshQueue());
  if (queueSearch) queueSearch.addEventListener('input', debounce(() => refreshQueue(), 300));
  if (refreshBtn) refreshBtn.addEventListener('click', () => { refreshQueue(); refreshStats(); });
  if (reportBtn) reportBtn.addEventListener('click', () => generateMonthlyReport());

  const overrideLogSearch = document.getElementById('overrideLogSearch');
  if (overrideLogSearch) {
    overrideLogSearch.addEventListener('input', debounce(() => {
      const val = overrideLogSearch.value.trim();
      fetchOverrideLogs(true, val);
    }, 250));
  }

  // Override Slider & Number Input Sync Handlers
  const overrideSlider = document.getElementById('overrideSlider');
  const overrideNumberInput = document.getElementById('overrideNumberInput');
  const overrideReasonInput = document.getElementById('overrideReasonInput');
  const ovReasonCharCount = document.getElementById('ovReasonCharCount');

  if (overrideSlider && overrideNumberInput) {
    overrideSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      overrideNumberInput.value = val;
      updateOverridePreview(val);
    });

    overrideNumberInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) return;
      const min = parseInt(overrideSlider.min, 10);
      const max = parseInt(overrideSlider.max, 10);
      if (val < min) val = min;
      if (val > max) val = max;
      overrideSlider.value = val;
      updateOverridePreview(val);
    });
  }

  if (overrideReasonInput && ovReasonCharCount) {
    overrideReasonInput.addEventListener('input', () => {
      ovReasonCharCount.textContent = `${overrideReasonInput.value.length} ${t('char_count_suffix')}`;
    });
  }
}

// Run SVI Assessment against FastAPI Backend
async function runAssessment() {
  const text = document.getElementById('transcriptInput').value.trim();
  const consent = document.getElementById('consentCheckbox').checked;

  if (!text) {
    showToast(t('transcript_placeholder'), 'warn');
    return;
  }

  if (!consent) {
    showToast(t('consent_statement'), 'error');
    return;
  }

  const evaluateBtn = document.getElementById('evaluateBtn');
  evaluateBtn.disabled = true;
  evaluateBtn.innerHTML = `<span>⏳</span> ${t('btn_evaluating')}`;

  try {
    const payload = {
      text: text,
      channel: state.currentChannel,
      language: state.currentLang,
      consent_given: consent,
      audio_telemetry: state.currentChannel === 'ivrs' ? {
        pitch_variance_hz: 74.5,
        jitter_pct: 2.1,
        speech_rate_wpm: 172,
        pause_ratio: 0.30
      } : null
    };

    const res = await fetch(`${API_BASE}/api/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Assessment failed: ${res.statusText}`);

    const data = await res.json();
    state.activeAssessment = data;
    renderAssessmentResult(data);
    
    document.getElementById('pushToQueueBtn').disabled = false;
    showToast(`SVI: ${data.svi_score}/100 (${tTier(data.risk_tier)})`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Error connecting to SVI scoring server.', 'error');
  } finally {
    evaluateBtn.disabled = false;
    evaluateBtn.innerHTML = `<span>⚡</span> <span data-i18n="btn_evaluate">${t('btn_evaluate')}</span>`;
  }
}

// Push Evaluated Case to Live Counsellor Queue
async function pushCurrentCaseToQueue() {
  const text = document.getElementById('transcriptInput').value.trim();
  const consent = document.getElementById('consentCheckbox').checked;
  const existingCaseId = (document.getElementById('existingCaseIdInput')?.value || '').trim();

  if (!text || !state.activeAssessment) return;

  try {
    const payload = {
      case_id: existingCaseId || undefined,
      text: text,
      channel: state.currentChannel,
      language: state.currentLang,
      consent_given: consent,
      audio_telemetry: state.currentChannel === 'ivrs' ? {
        pitch_variance_hz: 74.5,
        jitter_pct: 2.1,
        speech_rate_wpm: 172,
        pause_ratio: 0.30
      } : null
    };

    const res = await fetch(`${API_BASE}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to save case');

    const result = await res.json();
    if (result.is_follow_up) {
      const dSign = result.case.score_delta > 0 ? `+${result.case.score_delta}` : `${result.case.score_delta}`;
      showToast(`Case ${result.case.case_id} follow-up contact recorded! SVI: ${result.case.svi_score} (${result.case.trend} ${dSign})`, 'success');
    } else {
      showToast(`Case ${result.case.case_id} added to Live Triage Queue!`, 'success');
    }
    refreshQueue();
    refreshStats();
  } catch (err) {
    console.error(err);
    showToast('Failed to push case to queue.', 'error');
  }
}

// Render SVI Assessment Results & Animate Gauge
function renderAssessmentResult(data) {
  const scoreValEl = document.getElementById('sviScoreVal');
  const badgeTopEl = document.getElementById('tierBadgeTop');

  scoreValEl.textContent = data.svi_score;
  scoreValEl.style.color = data.tier_color;

  const translatedTier = tTier(data.risk_tier);
  badgeTopEl.textContent = translatedTier;
  badgeTopEl.className = `tier-badge badge-${data.risk_tier.toLowerCase()}`;

  // Animate Gauge Needle & Arc
  animateGaugeNeedle(data.svi_score, data.tier_color);

  // Psychological Crisis Banner (Always visible when signal fires, independent of risk tier)
  const crisisBanner = document.getElementById('psychologicalCrisisBanner');
  if (crisisBanner) {
    if (data.has_psychological_crisis) {
      crisisBanner.style.display = 'flex';
      const textEl = crisisBanner.querySelector('.crisis-text');
      if (textEl && data.crisis_banner_message) {
        textEl.innerHTML = `Immediate referral to <strong>KIRAN Mental Health Helpline (1800-599-0019, toll-free, 24/7)</strong> + Same-day Psychiatric/Counselling Consult Mandated`;
      }
    } else {
      crisisBanner.style.display = 'none';
    }
  }

  // Update Protocol Box with Translated Strings
  const protocolBox = document.getElementById('protocolBox');
  protocolBox.style.borderLeftColor = data.tier_color;

  document.getElementById('protocolSla').textContent = `${t('sla_awaiting').replace('--', '')}${tSla(data.risk_tier)}`;
  document.getElementById('protocolTitle').textContent = tActionTitle(data.risk_tier) || data.action_title;
  document.getElementById('protocolDesc').textContent = tActionDesc(data.risk_tier) || data.action_description;
  document.getElementById('protocolDispatch').textContent = tDispatch(data.risk_tier) || data.recommended_dispatch;

  // Protocol Flags
  const flagsContainer = document.getElementById('protocolFlags');
  flagsContainer.innerHTML = '';

  if (data.police_liaison_required) {
    flagsContainer.innerHTML += `
      <span class="flag-chip flag-police">
        <span>🚨</span> <span>${t('flag_police_liaison')}</span>
      </span>
    `;
  }
  if (data.witness_protection_flag) {
    flagsContainer.innerHTML += `
      <span class="flag-chip flag-witness">
        <span>🛡️</span> <span>${t('flag_witness_protection')}</span>
      </span>
    `;
  }
  if (data.medical_assistance_required) {
    flagsContainer.innerHTML += `
      <span class="flag-chip flag-medical">
        <span>🏥</span> <span>${t('flag_medical_referral', 'Medical Assistance Mandated: Nearest Primary Health Centre (PHC) / District Hospital Referral')}</span>
      </span>
    `;
  }

  // Explainability Indicators & Contributing Factors
  const indContainer = document.getElementById('indicatorsContainer');
  indContainer.innerHTML = '';

  let factors = (data.all_contributing_factors && data.all_contributing_factors.length > 0)
    ? [...data.all_contributing_factors]
    : [];

  if (factors.length === 0 && data.detected_indicators && data.detected_indicators.length > 0) {
    // Fallback: assemble factors from detected_indicators + scoring_breakdown
    data.detected_indicators.forEach(ind => {
      factors.push({
        name: ind.category_name,
        tags: ind.matched_keywords,
        points: ind.points_contributed
      });
    });

    const b = data.scoring_breakdown || {};
    if (b.base_grievance_weight > 0) {
      factors.push({
        name: "Atrocity / Distress Intake Baseline",
        tags: ["Verified distress indicators detected", "Statutory intake baseline"],
        points: b.base_grievance_weight
      });
    }
    if (b.boost_reasons && Array.isArray(b.boost_reasons)) {
      b.boost_reasons.forEach(r => {
        const ptsMatch = r.match(/\(\+(\d+)\s*SVI\)/i);
        const pts = ptsMatch ? parseInt(ptsMatch[1], 10) : 0;
        const cleanName = r.replace(/\s*\(\+\d+\s*SVI\)/i, '').trim();
        factors.push({
          name: cleanName,
          tags: ["Compounding risk elevator"],
          points: pts
        });
      });
    }
    if (b.acoustic_modifier > 0) {
      factors.push({
        name: "Acoustic Telemetry & Voice Stress Biomarkers",
        tags: ["SER acoustic biometric fusion"],
        points: b.acoustic_modifier
      });
    }
    const rawSum = factors.reduce((sum, f) => sum + (Number(f.points) || 0), 0);
    const targetSvi = Number(data.svi_score || 0);
    if (rawSum > targetSvi) {
      factors.push({
        name: "SVI Scale Normalization Cap",
        tags: ["Upper ceiling clamp (0–100 scale)"],
        points: targetSvi - rawSum
      });
    }
  }

  if (!factors || factors.length === 0) {
    indContainer.innerHTML = `<div class="empty-state-text">${t('no_indicators_routine')}</div>`;
  } else {
    factors.forEach(factor => {
      const row = document.createElement('div');
      row.className = 'indicator-row';
      
      const rawTags = factor.tags || factor.matched_keywords || [];
      const keywordsHtml = rawTags.map(kw => `<span class="phrase-chip">"${escapeHtml(kw)}"</span>`).join(' ');
      const localizedCategory = tCategoryName(factor.name || factor.category_name);
      const pts = factor.points !== undefined ? factor.points : factor.points_contributed;
      const ptsStr = pts > 0 ? `+${pts} SVI` : `${pts} SVI`;
      const ptsStyle = pts < 0 ? 'color: #f87171;' : '';

      row.innerHTML = `
        <div>
          <div class="indicator-name">${escapeHtml(localizedCategory)}</div>
          <div class="phrase-tags">${keywordsHtml}</div>
        </div>
        <div class="indicator-points" style="${ptsStyle}">${ptsStr}</div>
      `;
      indContainer.appendChild(row);
    });
  }

  // Math Breakdown with Translated Terms
  const b = data.scoring_breakdown || {};
  const mathFormula = document.getElementById('mathFormula');
  mathFormula.innerHTML = `
    ${t('math_base')}(${b.base_grievance_weight || 0}) + ${t('math_indicators')}(${b.indicator_points || 0}) + ${t('math_context')}(${b.context_boost || 0}) + ${t('math_acoustic')}(${b.acoustic_modifier || 0}) = <strong>${data.svi_score}/100</strong>
  `;
}

// Animate Needle on Gauge
function animateGaugeNeedle(score, color) {
  const needle = document.getElementById('gaugeNeedle');
  const activeArc = document.getElementById('gaugeActiveArc');
  if (!needle || !activeArc) return;

  const rad = Math.PI - (score / 100) * Math.PI;
  const cx = 120;
  const cy = 120;
  const len = 85;

  const targetX = cx + len * Math.cos(rad);
  const targetY = cy - len * Math.sin(rad);

  needle.setAttribute('x2', targetX);
  needle.setAttribute('y2', targetY);
  needle.setAttribute('stroke', color || '#f8fafc');

  const arcX = cx - 90 * Math.cos(rad);
  const arcY = cy - 90 * Math.sin(rad);
  
  activeArc.setAttribute('d', `M 30 120 A 90 90 0 0 1 ${arcX} ${arcY}`);
  activeArc.setAttribute('stroke', color);
}

function resetGauge() {
  document.getElementById('sviScoreVal').textContent = '--';
  document.getElementById('sviScoreVal').style.color = '#ffffff';
  document.getElementById('tierBadgeTop').textContent = t('awaiting_input');
  document.getElementById('tierBadgeTop').className = 'tier-badge badge-neutral';
  
  const needle = document.getElementById('gaugeNeedle');
  if (needle) {
    needle.setAttribute('x2', '35');
    needle.setAttribute('y2', '120');
    needle.setAttribute('stroke', '#f8fafc');
  }

  document.getElementById('indicatorsContainer').innerHTML = `<div class="empty-state-text">${t('no_indicators_text')}</div>`;
  document.getElementById('protocolSla').textContent = t('sla_awaiting');
  document.getElementById('protocolTitle').textContent = t('protocol_awaiting_title');
  document.getElementById('protocolDesc').textContent = t('protocol_awaiting_desc');
  document.getElementById('protocolDispatch').textContent = '--';
  document.getElementById('protocolFlags').innerHTML = '';
  const crisisBanner = document.getElementById('psychologicalCrisisBanner');
  if (crisisBanner) crisisBanner.style.display = 'none';
}

// Fetch Sample Presets
async function fetchSamplePresets() {
  try {
    const res = await fetch(`${API_BASE}/api/samples`);
    if (res.ok) {
      state.sampleDatabase = await res.json();
    }
  } catch (err) {
    console.error('Failed to load sample presets', err);
  }
}

// Load Preset Case
window.loadPreset = function(caseId) {
  const found = (state.sampleDatabase || []).find(c => c.id === caseId);
  if (!found) return;

  const textarea = document.getElementById('transcriptInput');
  textarea.value = found.transcript;
  document.getElementById('charCount').textContent = `${found.transcript.length} ${t('char_count_suffix')}`;

  const caseIdInput = document.getElementById('existingCaseIdInput');
  if (caseIdInput) caseIdInput.value = found.id;

  // Select channel
  const pill = document.querySelector(`.channel-pill[data-channel="${found.channel}"]`);
  if (pill) pill.click();

  // Run assessment automatically
  runAssessment();
};

// Refresh Live Triage Queue
async function refreshQueue() {
  const tbody = document.getElementById('casesTableBody');
  if (!tbody) return;

  const tier = document.getElementById('filterTier').value;
  const channel = document.getElementById('filterChannel').value;
  const search = document.getElementById('queueSearch').value.trim();

  let url = `${API_BASE}/api/cases?`;
  if (tier && tier !== 'all') url += `tier=${encodeURIComponent(tier)}&`;
  if (channel && channel !== 'all') url += `channel=${encodeURIComponent(channel)}&`;
  if (search) url += `search=${encodeURIComponent(search)}&`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch cases');

    const data = await res.json();
    state.cachedCases = data.cases;

    const badge = document.getElementById('queueBadge');
    if (badge) badge.textContent = data.cases.length;

    renderCasesTable(data.cases);
    fetchAuditLogs(false);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">${t('empty_queue')}</td></tr>`;
  }
}

// Render Queue Table Rows with Tier-Specific Actions & Override Triggers
function renderCasesTable(cases) {
  const tbody = document.getElementById('casesTableBody');
  if (!tbody) return;

  if (cases.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 24px;">${t('empty_queue')}</td></tr>`;
    return;
  }

  tbody.innerHTML = cases.map(c => {
    const channelIcon = c.channel === 'ivrs' ? '📞' : (c.channel === 'chatbot' ? '💬' : '📋');
    const channelName = t(`channel_${c.channel.toLowerCase()}`, c.channel.toUpperCase());
    const signals = (c.matched_phrases || []).slice(0, 3).map(p => `<span class="phrase-chip">${escapeHtml(p)}</span>`).join(' ');

    const translatedTier = tTier(c.risk_tier);
    const translatedActionTitle = tActionTitle(c.risk_tier) || c.action_title;
    const translatedActionDesc = tActionDesc(c.risk_tier) || c.action_description;

    // Overridden indicator tag
    const overrideBadgeHtml = c.is_overridden ? `
      <div class="override-tag-wrapper">
        <span class="badge-overridden" title="Original AI SVI: ${c.ai_svi_score} • Overridden: ${c.svi_score} • Justification: ${escapeHtml(c.override_reason || 'Manual override')}">
          ⚖️ Overridden by counsellor
        </span>
      </div>
    ` : '';

    // Statutory Deadlines Countdown Badges (PoA Rule 12(4) & PoA Sec 14(2))
    const isRoutineGrievance = (String(c.risk_tier || '').toUpperCase() === 'LOW' && Number(c.svi_score || 0) === 0) || (c.deadlines && c.deadlines.is_applicable === false);

    let deadlinesHtml = '';
    if (isRoutineGrievance) {
      deadlinesHtml = `
        <div class="deadlines-cell-group">
          <span class="deadline-badge deadline-neutral" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px dashed rgba(148, 163, 184, 0.4); font-size: 0.74rem; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" title="PoA statutory deadlines apply only to atrocity complaints under PoA Act, 1989. Routine administrative grievances are excluded.">
            ℹ️ N/A — Routine Grievance
          </span>
        </div>
      `;
    } else {
      const dl = c.deadlines || {};
      const interim = dl.interim_relief || { days_remaining: 7.0, status: 'green', is_overdue: false, overdue_by_days: 0.0 };
      const chargesheet = dl.chargesheet || { days_remaining: 60.0, status: 'green', is_overdue: false, overdue_by_days: 0.0 };

      let interimText = '';
      if (interim.is_overdue) {
        const daysOver = interim.overdue_by_days || Math.abs(interim.days_remaining) || 0;
        interimText = `⚡ ${t('lbl_interim_relief_short')}: <strong class="text-crit">${t('lbl_deadline_overdue')} (+${daysOver}d)</strong>`;
      } else {
        interimText = `⏱️ ${t('lbl_interim_relief_short')}: <strong>${interim.days_remaining}d</strong> ${t('lbl_deadline_rem')}`;
      }

      let chargesheetText = '';
      if (chargesheet.is_overdue) {
        const daysOver = chargesheet.overdue_by_days || Math.abs(chargesheet.days_remaining) || 0;
        chargesheetText = `⚡ ${t('lbl_chargesheet_short')}: <strong class="text-crit">${t('lbl_deadline_overdue')} (+${daysOver}d)</strong>`;
      } else {
        chargesheetText = `⏱️ ${t('lbl_chargesheet_short')}: <strong>${chargesheet.days_remaining}d</strong> ${t('lbl_deadline_rem')}`;
      }

      deadlinesHtml = `
        <div class="deadlines-cell-group">
          <div class="deadline-badge deadline-${interim.status}" title="PoA Rule 12(4): Mandated 7-Day Interim Relief">
            ${interimText}
          </div>
          <div class="deadline-badge deadline-${chargesheet.status}" title="PoA Sec 14(2): 60-Day Investigation & Chargesheet Deadline">
            ${chargesheetText}
          </div>
          <div class="demo-ff-control" title="Demo Presentation Control: Fast-forward or reset simulated case clock">
            <span class="demo-ff-label">${t('demo_clock_tag')}</span>
            <button class="btn-ff" onclick="fastForwardCase('${c.case_id}', 4, 'add')" title="Advance case clock by +4 days">+4d</button>
            <button class="btn-ff" onclick="fastForwardCase('${c.case_id}', 8, 'add')" title="Advance case clock by +8 days (Interim Overdue)">+8d</button>
            <button class="btn-ff" onclick="fastForwardCase('${c.case_id}', 65, 'add')" title="Advance case clock by +65 days (Chargesheet Overdue)">+65d</button>
            <button class="btn-ff btn-ff-reset" onclick="fastForwardCase('${c.case_id}', 0, 'reset')" title="Reset case clock to Day 0">↺</button>
          </div>
        </div>
      `;
    }

    const retentionRisk = (c.retention_risk || c.retention_badge || 'Low');
    const retentionRiskClass = retentionRisk.toLowerCase();
    const retentionAction = c.retention_action || '';
    const retentionHtml = `
      <div class="retention-cell">
        <span class="retention-badge badge-${retentionRiskClass}">${retentionRisk}</span>
        ${retentionAction ? `<span class="retention-action">${escapeHtml(retentionAction)}</span>` : ''}
      </div>
    `;

    // Action buttons based on Risk Tier
    let actionButtonsHtml = '';
    const logContactButton = `<button class="btn btn-outline btn-xs" onclick="logCaseContact('${c.case_id}')">Log Contact</button>`;
    const auditPackageButton = `<button class="btn btn-outline btn-xs" onclick="openAuditPackageModal('${c.case_id}')">View Audit Package</button>`;
    if (c.risk_tier === 'Critical') {
      actionButtonsHtml = `
        <div class="tier-actions-stack">
          <button class="btn btn-action-police btn-xs" onclick="openEscalationModal('${c.case_id}', 'dispatch_police')">
            ${t('btn_act_police')}
          </button>
          <button class="btn btn-action-witness btn-xs" onclick="openEscalationModal('${c.case_id}', 'trigger_witness_protection')">
            ${t('btn_act_witness')}
          </button>
          <button class="btn btn-outline btn-xs" onclick="openCaseModal('${c.case_id}')">
            ${t('btn_act_details')}
          </button>
          ${logContactButton}
          ${auditPackageButton}
        </div>
      `;
    } else if (c.risk_tier === 'High') {
      actionButtonsHtml = `
        <div class="tier-actions-stack">
          <button class="btn btn-action-counsellor btn-xs" onclick="openEscalationModal('${c.case_id}', 'assign_counsellor')">
            ${t('btn_act_counsellor')}
          </button>
          <button class="btn btn-outline btn-xs" onclick="openCaseModal('${c.case_id}')">
            ${t('btn_act_details')}
          </button>
          ${logContactButton}
          ${auditPackageButton}
        </div>
      `;
    } else if (c.risk_tier === 'Moderate') {
      actionButtonsHtml = `
        <div class="tier-actions-stack">
          <button class="btn btn-action-callback btn-xs" onclick="openEscalationModal('${c.case_id}', 'schedule_callback')">
            ${t('btn_act_callback')}
          </button>
          <button class="btn btn-outline btn-xs" onclick="openCaseModal('${c.case_id}')">
            ${t('btn_act_details')}
          </button>
          ${logContactButton}
          ${auditPackageButton}
        </div>
      `;
    } else {
      actionButtonsHtml = `
        <div class="tier-actions-stack">
          <button class="btn btn-action-routine btn-xs" onclick="openEscalationModal('${c.case_id}', 'routine_queue')">
            ${t('btn_act_routine')}
          </button>
          <button class="btn btn-outline btn-xs" onclick="openCaseModal('${c.case_id}')">
            ${t('btn_act_details')}
          </button>
          ${logContactButton}
          ${auditPackageButton}
        </div>
      `;
    }

    // Touchpoint / Repeat Contact Trend Indicator
    let trendBadgeHtml = '';
    if (c.contact_count && c.contact_count > 1) {
      const d = c.score_delta !== undefined && c.score_delta !== null ? c.score_delta : (c.previous_svi_score !== undefined && c.previous_svi_score !== null ? c.svi_score - c.previous_svi_score : 0);
      const dSign = d > 0 ? `+${d}` : `${d}`;
      if (c.trend === 'Escalating' || d > 0) {
        trendBadgeHtml = `<div class="trend-badge trend-escalating" title="Follow-up contact (${c.contact_count}th contact): Prev SVI ${c.previous_svi_score ?? '--'} ➜ Current ${c.svi_score} (${dSign})">▲ ${t('trend_escalating', 'Escalating')} (${dSign})</div>`;
      } else if (c.trend === 'De-escalating' || d < 0) {
        trendBadgeHtml = `<div class="trend-badge trend-deescalating" title="Follow-up contact (${c.contact_count}th contact): Prev SVI ${c.previous_svi_score ?? '--'} ➜ Current ${c.svi_score} (${dSign})">▼ ${t('trend_deescalating', 'De-escalating')} (${dSign})</div>`;
      } else {
        trendBadgeHtml = `<div class="trend-badge trend-stable" title="Follow-up contact (${c.contact_count}th contact): Prev SVI ${c.previous_svi_score ?? '--'} ➜ Current ${c.svi_score} (±0)">▬ ${t('trend_stable', 'Stable')}</div>`;
      }
    } else {
      trendBadgeHtml = `<div class="trend-badge trend-first" title="Initial Intake Contact">${t('trend_first_contact', '1st Contact')}</div>`;
    }

    // Medical Referral Action Badge
    const medicalBadgeHtml = c.medical_assistance_required ? `
      <div style="margin-top: 4px;">
        <span class="flag-chip flag-medical" style="font-size: 0.68rem; padding: 2px 6px;">
          <span>🏥</span> <span>${t('lbl_medical_short', 'Medical Mandated (PHC)')}</span>
        </span>
      </div>
    ` : '';

    // Crisis Banner Badge
    const crisisBadgeHtml = c.has_psychological_crisis ? `
      <div style="margin-top: 4px;">
        <span class="flag-chip" style="background: rgba(147, 51, 234, 0.2); border: 1px solid #a855f7; color: #d8b4fe; font-size: 0.68rem; padding: 2px 6px;">
          <span>💜</span> <span>KIRAN 24/7 Mandated</span>
        </span>
      </div>
    ` : '';

    return `
      <tr class="${c.is_overridden ? 'row-overridden' : ''}">
        <td class="case-id-cell">
          <strong>${escapeHtml(c.case_id)}</strong>
          <span class="case-district">${escapeHtml(c.district || 'District')}, ${escapeHtml(c.state || 'State')}</span>
          ${c.has_special_court === false ? `<span class="special-court-tag tag-delay" title="Structural Delay Risk: No Exclusive Special Court under PoA Act Sec 14A">⚠️ No Special Court</span>` : (c.has_special_court === true ? `<span class="special-court-tag tag-active" title="Exclusive Special Court designated under PoA Act Sec 14A">🏛️ Sec 14A Court</span>` : '')}
        </td>
        <td>
          <span class="channel-tag">${channelIcon} ${escapeHtml(channelName)}</span>
        </td>
        <td>
          <div class="table-svi-group">
            <span class="table-svi-val" style="color: ${c.tier_color || '#38bdf8'};">${c.svi_score}</span>
            <span class="table-svi-max">/100</span>
          </div>
          ${trendBadgeHtml}
        </td>
        <td>
          <div class="tier-cell-group">
            <div class="tier-badge-row">
              <span class="tier-badge badge-${c.risk_tier.toLowerCase()}">${translatedTier}</span>
              <button class="btn-override-icon" onclick="openOverrideModal('${c.case_id}')" title="Adjust SVI Score (Human-in-the-Loop, ±10 pts)">
                <span>⚖️</span> ${t('btn_override')}
              </button>
            </div>
            ${overrideBadgeHtml}
          </div>
        </td>
        <td>
          <div style="font-weight: 600; color: #fff; font-size: 0.82rem;">${escapeHtml(translatedActionTitle)}</div>
          <div style="font-size: 0.72rem; color: #94a3b8;">${escapeHtml(translatedActionDesc?.slice(0, 52) || '')}...</div>
          ${medicalBadgeHtml}
          ${crisisBadgeHtml}
        </td>
        <td>
          ${retentionHtml}
        </td>
        <td>
          ${deadlinesHtml}
        </td>
        <td>
          <div class="phrase-tags">${signals || `<span class="text-dim">${t('routine_query')}</span>`}</div>
        </td>
        <td>
          <span class="badge-synthetic status-badge ${c.status.includes('Dispatched') ? 'status-dispatched' : (c.status.includes('Witness') ? 'status-witness' : '')}" title="${escapeHtml(c.status)}">
            ${escapeHtml(c.status || 'Pending')}
          </span>
        </td>
        <td class="action-cell">
          ${actionButtonsHtml}
        </td>
      </tr>
    `;
  }).join('');
}

// Demo Simulation Fast-Forward Controller
window.fastForwardCase = async function(caseId, days, mode = 'add') {
  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/fast-forward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: days, mode: mode })
    });
    if (!res.ok) throw new Error('Fast-forward request failed');
    const result = await res.json();

    // Update case in cached array
    const idx = state.cachedCases.findIndex(item => item.case_id === caseId);
    if (idx !== -1 && result.updated_case) {
      state.cachedCases[idx] = result.updated_case;
    }

    renderCasesTable(state.cachedCases);
    refreshStats();

    const desc = mode === 'reset' ? 'Reset clock to baseline (Day 0)' : `Advanced clock by +${days} days`;
    showToast(`Case ${caseId} Demo Clock: ${desc}`, 'info');
  } catch (err) {
    console.error('Failed to fast forward case clock', err);
    showToast('Failed to advance case clock', 'error');
  }
};

// Sub-view Toggle inside Triage Desk (Queue vs Audit Trail)
window.switchTriageView = function(view) {
  state.currentTriageView = view;
  const queueBtn = document.getElementById('subnavQueueBtn');
  const overrideLogBtn = document.getElementById('subnavOverrideLogBtn');
  const auditBtn = document.getElementById('subnavAuditBtn');
  const queueCard = document.getElementById('queueTableCard');
  const overrideLogCard = document.getElementById('overrideLogCard');
  const auditCard = document.getElementById('auditTrailCard');

  if (view === 'queue') {
    queueBtn?.classList.add('active');
    overrideLogBtn?.classList.remove('active');
    auditBtn?.classList.remove('active');
    if (queueCard) queueCard.style.display = 'block';
    if (overrideLogCard) overrideLogCard.style.display = 'none';
    if (auditCard) auditCard.style.display = 'none';
    refreshQueue();
  } else if (view === 'override-log') {
    queueBtn?.classList.remove('active');
    overrideLogBtn?.classList.add('active');
    auditBtn?.classList.remove('active');
    if (queueCard) queueCard.style.display = 'none';
    if (overrideLogCard) overrideLogCard.style.display = 'block';
    if (auditCard) auditCard.style.display = 'none';
    fetchOverrideLogs(true);
  } else {
    queueBtn?.classList.remove('active');
    overrideLogBtn?.classList.remove('active');
    auditBtn?.classList.add('active');
    if (queueCard) queueCard.style.display = 'none';
    if (overrideLogCard) overrideLogCard.style.display = 'none';
    if (auditCard) auditCard.style.display = 'block';
    fetchAuditLogs(true);
  }
};

// Fetch and Render Override Logs
window.fetchOverrideLogs = async function(renderTable = true, search = '') {
  try {
    const res = await fetch(`${API_BASE}/api/override-logs`);
    if (!res.ok) return;
    const data = await res.json();
    const logs = data.logs || [];
    const filteredLogs = search
      ? logs.filter(l => `${l.case_id || ''} ${l.reason || ''}`.toLowerCase().includes(search.toLowerCase()))
      : logs;

    const badge = document.getElementById('overrideLogCountBadge');
    if (badge) badge.textContent = logs.length;

    if (renderTable) {
      renderOverrideLogTable(filteredLogs);
    }
  } catch (err) {
    console.error('Failed to fetch override logs', err);
  }
};

function renderOverrideLogTable(logs) {
  const tbody = document.getElementById('overrideLogTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">No override log entries found.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const tierShiftHtml = (l.original_tier && l.new_tier)
      ? `<div style="margin-top: 3px; font-size: 0.72rem;"><span class="tier-badge badge-${l.original_tier.toLowerCase()}" style="font-size: 0.65rem; padding: 1px 5px;">${tTier(l.original_tier)}</span> ➜ <span class="tier-badge badge-${l.new_tier.toLowerCase()}" style="font-size: 0.65rem; padding: 1px 5px;">${tTier(l.new_tier)}</span></div>`
      : '';
    return `
      <tr>
        <td>
          <strong class="text-mono" style="color: #38bdf8;">${escapeHtml(l.case_id || '')}</strong>
          ${tierShiftHtml}
        </td>
        <td><strong class="text-mono">${l.original_score ?? '--'}</strong></td>
        <td><strong class="text-mono" style="color: #fbbf24;">${l.overridden_score ?? '--'}</strong></td>
        <td><div style="font-weight: 500; color: #f1f5f9;">${escapeHtml(l.reason || '')}</div></td>
        <td class="text-mono text-dim">${escapeHtml(l.timestamp || '')}</td>
      </tr>
    `;
  }).join('');
}

// Fetch and Render Audit Logs
window.fetchAuditLogs = async function(renderTable = true) {
  try {
    const res = await fetch(`${API_BASE}/api/audit-logs`);
    if (!res.ok) return;
    const data = await res.json();
    state.cachedAuditLogs = data.logs || [];

    const badge = document.getElementById('auditCountBadge');
    if (badge) badge.textContent = state.cachedAuditLogs.length;

    if (renderTable) {
      renderAuditTable(state.cachedAuditLogs);
    }
  } catch (err) {
    console.error('Failed to fetch audit logs', err);
  }
};

function renderAuditTable(logs) {
  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 24px;">${t('empty_audit')}</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const isOverride = l.type === 'override';
    const typeBadge = isOverride
      ? `<span class="audit-badge badge-audit-override">${t('badge_svi_override')}</span>`
      : `<span class="audit-badge badge-audit-action">${t('badge_esc_action')}</span>`;

    const aiScoreHtml = isOverride 
      ? `<strong class="text-mono" style="color: #94a3b8;">${l.original_score}/100</strong>` 
      : '<span class="text-dim">--</span>';

    const deltaSign = l.delta > 0 ? `+${l.delta}` : `${l.delta}`;
    const deltaClass = l.delta > 0 ? 'delta-pos' : (l.delta < 0 ? 'delta-neg' : 'delta-zero');
    
    const overriddenScoreHtml = isOverride
      ? `<strong class="text-mono" style="color: #38bdf8;">${l.overridden_score}/100</strong> <span class="delta-chip ${deltaClass}">(${deltaSign})</span>`
      : '<span class="text-dim">--</span>';

    const origTierT = tTier(l.original_tier);
    const newTierT = tTier(l.new_tier);

    const tierShiftHtml = isOverride
      ? (l.tier_shifted 
          ? `<span class="tier-badge badge-${l.original_tier.toLowerCase()}">${origTierT}</span> ➜ <span class="tier-badge badge-${l.new_tier.toLowerCase()}">${newTierT}</span>`
          : `<span class="tier-badge badge-${l.new_tier.toLowerCase()}">${newTierT}</span> (${t('unchanged_tier')})`)
      : `<span class="status-chip">${escapeHtml(l.action_label || l.action_type || '')}</span>`;

    const justificationHtml = isOverride
      ? `<strong>${t('lbl_override_reason_prefix')}</strong> ${escapeHtml(l.reason || '')}`
      : `<strong>${t('lbl_action_prefix')}</strong> ${escapeHtml(l.action_label || '')}<br><span class="text-dim">${escapeHtml(l.counsellor_notes || t('counsellor_default_note'))}</span>`;

    return `
      <tr>
        <td class="text-mono text-dim" style="font-size: 0.75rem;">${escapeHtml(l.timestamp || '')}</td>
        <td>${typeBadge}</td>
        <td>
          <strong class="text-mono" style="color: #38bdf8;">${escapeHtml(l.case_id || '')}</strong>
          <span class="case-district">${escapeHtml(l.caller_alias || 'Citizen')}</span>
        </td>
        <td>${aiScoreHtml}</td>
        <td>${overriddenScoreHtml}</td>
        <td>${tierShiftHtml}</td>
        <td style="max-width: 280px; font-size: 0.8rem; line-height: 1.4;">
          ${justificationHtml}
        </td>
        <td class="text-mono" style="font-size: 0.75rem; color: #cbd5e1;">${escapeHtml(l.counsellor_id || 'COUNSELLOR_NHAA_09')}</td>
      </tr>
    `;
  }).join('');
}

// ==========================================
// FEATURE 1: HITL SVI OVERRIDE MODAL LOGIC
// ==========================================

window.handleOverrideReasonSelectChange = function(val) {
  const reasonInput = document.getElementById('overrideReasonInput');
  if (!reasonInput) return;
  if (!val) {
    reasonInput.value = '';
  } else if (val === 'Other (specify)') {
    reasonInput.value = '';
    reasonInput.placeholder = 'Please specify detailed justification for override...';
    reasonInput.focus();
  } else {
    reasonInput.value = val;
  }
  const counter = document.getElementById('ovReasonCharCount');
  if (counter) counter.textContent = `${reasonInput.value.length} ${t('char_count_suffix')}`;
};

window.openOverrideModal = function(caseId) {
  const c = state.cachedCases.find(item => item.case_id === caseId);
  if (!c) return;

  state.activeOverrideCase = c;

  const modal = document.getElementById('overrideModal');
  document.getElementById('ovCaseId').textContent = c.case_id;
  document.getElementById('ovCallerAlias').textContent = `${c.caller_alias} (${c.district || 'Simulated District'})`;
  document.getElementById('ovChannel').textContent = `${t(`channel_${c.channel.toLowerCase()}`, c.channel.toUpperCase())}`;

  const aiScore = c.ai_svi_score ?? c.svi_score;
  document.getElementById('ovAiScore').textContent = `${aiScore}/100`;

  const aiTier = c.ai_risk_tier || c.risk_tier;
  const aiBadge = document.getElementById('ovAiTierBadge');
  aiBadge.textContent = tTier(aiTier);
  aiBadge.className = `tier-badge badge-${aiTier.toLowerCase()}`;

  const minBound = Math.max(0, aiScore - 10);
  const maxBound = Math.min(100, aiScore + 10);
  const currentVal = c.svi_score;

  const slider = document.getElementById('overrideSlider');
  const numberInput = document.getElementById('overrideNumberInput');

  slider.min = minBound;
  slider.max = maxBound;
  slider.value = currentVal;

  numberInput.min = minBound;
  numberInput.max = maxBound;
  numberInput.value = currentVal;

  document.getElementById('ovMinBound').textContent = `${minBound} (${t('lbl_min_bound')})`;
  document.getElementById('ovMaxBound').textContent = `${maxBound} (${t('lbl_max_bound')})`;

  const reasonInput = document.getElementById('overrideReasonInput');
  reasonInput.value = c.override_reason || '';
  document.getElementById('ovReasonCharCount').textContent = `${reasonInput.value.length} ${t('char_count_suffix')}`;

  const reasonSelect = document.getElementById('overrideReasonSelect');
  if (reasonSelect) {
    const knownOptions = ['AI underestimated severity', 'AI overestimated severity', 'Additional context from follow-up call'];
    if (knownOptions.includes(c.override_reason)) {
      reasonSelect.value = c.override_reason;
    } else if (c.override_reason) {
      reasonSelect.value = 'Other (specify)';
    } else {
      reasonSelect.value = '';
    }
  }

  updateOverridePreview(currentVal, aiScore);
  applyLanguage(state.currentLang);

  modal.classList.add('open');
};

window.closeOverrideModal = function() {
  const modal = document.getElementById('overrideModal');
  if (modal) modal.classList.remove('open');
  state.activeOverrideCase = null;
};

function updateOverridePreview(val, baseScore) {
  const score = parseInt(val, 10) || 0;
  const original = baseScore !== undefined ? baseScore : (state.activeOverrideCase?.ai_svi_score || score);
  const delta = score - original;

  const deltaBadge = document.getElementById('ovDeltaBadge');
  const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;
  deltaBadge.textContent = `Delta: ${deltaSign} pts`;
  deltaBadge.className = `score-delta-badge ${delta > 0 ? 'delta-pos' : (delta < 0 ? 'delta-neg' : 'delta-zero')}`;

  let newTier = 'Low';
  if (score >= 79) newTier = 'Critical';
  else if (score >= 56) newTier = 'High';
  else if (score >= 31) newTier = 'Moderate';

  const newTierBadge = document.getElementById('ovNewTierBadge');
  newTierBadge.textContent = `${tTier(newTier)} (${score}/100)`;
  newTierBadge.className = `tier-badge badge-${newTier.toLowerCase()}`;

  document.getElementById('ovNewSla').textContent = `${t('sla_awaiting').replace('--', '')}${tSla(newTier)}`;
}

window.submitScoreOverride = async function() {
  if (!state.activeOverrideCase) return;

  const caseId = state.activeOverrideCase.case_id;
  const slider = document.getElementById('overrideSlider');
  const adjustedScore = parseInt(slider.value, 10);
  const reason = document.getElementById('overrideReasonInput').value.trim();

  if (!reason || reason.length < 3) {
    showToast('A mandatory override reason (at least 3 characters) is required for audit.', 'error');
    document.getElementById('overrideReasonInput').focus();
    return;
  }

  const confirmBtn = document.getElementById('confirmOverrideBtn');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = `<span>⏳</span> ${t('btn_saving_override')}`;

  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/override`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adjusted_score: adjustedScore,
        reason: reason,
        counsellor_id: 'COUNSELLOR_NHAA_09'
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Override failed');
    }

    const result = await res.json();
    showToast(`SVI for Case ${caseId} overridden to ${adjustedScore}/100 (${tTier(result.updated_case.risk_tier)})!`, 'success');
    closeOverrideModal();
    refreshQueue();
    refreshStats();
  } catch (err) {
    console.error(err);
    showToast(`Override error: ${err.message}`, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<span>⚖️</span> <span data-i18n="btn_confirm_override">${t('btn_confirm_override')}</span>`;
  }
};

// ==========================================
// FEATURE 2: PoA ACT ESCALATION ACTION MODAL
// ==========================================

function getEscalationMetadata(actionType) {
  const titles = {
    dispatch_police: t('esc_dispatch_police_title'),
    trigger_witness_protection: t('esc_trigger_witness_title'),
    assign_counsellor: t('esc_assign_counsellor_title'),
    schedule_callback: t('esc_schedule_callback_title'),
    routine_queue: t('esc_routine_queue_title')
  };

  const names = {
    dispatch_police: t('esc_dispatch_police_name'),
    trigger_witness_protection: t('esc_trigger_witness_name'),
    assign_counsellor: t('esc_assign_counsellor_name'),
    schedule_callback: t('esc_schedule_callback_name'),
    routine_queue: t('esc_routine_queue_name')
  };

  const disclaimers = {
    dispatch_police: t('esc_dispatch_police_disc'),
    trigger_witness_protection: t('esc_trigger_witness_disc'),
    assign_counsellor: t('esc_assign_counsellor_disc'),
    schedule_callback: t('esc_schedule_callback_disc'),
    routine_queue: t('esc_routine_queue_disc')
  };

  return {
    title: titles[actionType] || actionType,
    actionName: names[actionType] || actionType,
    disclaimer: disclaimers[actionType] || `Simulation action for CASE-{ID}.`
  };
}

window.openEscalationModal = function(caseId, actionType) {
  const c = state.cachedCases.find(item => item.case_id === caseId);
  if (!c) return;

  state.activeEscalationCase = c;
  state.activeEscalationAction = actionType;

  const meta = getEscalationMetadata(actionType);
  const modal = document.getElementById('escalationConfirmModal');

  document.getElementById('escModalTitle').textContent = meta.title;
  document.getElementById('escActionName').textContent = meta.actionName;
  document.getElementById('escCaseId').textContent = c.case_id;

  const tierBadge = document.getElementById('escTierBadge');
  tierBadge.textContent = tTier(c.risk_tier);
  tierBadge.className = `tier-badge badge-${c.risk_tier.toLowerCase()}`;

  document.getElementById('escSviScore').textContent = `${c.svi_score}/100`;
  const cleanDisclaimer = meta.disclaimer
    .replace('CASE-{ID}', c.case_id)
    .replace('{case_id}', c.case_id)
    .replace('{ID}', c.case_id);
  document.getElementById('escDisclaimerText').textContent = cleanDisclaimer;

  document.getElementById('escNotesInput').value = '';
  applyLanguage(state.currentLang);

  modal.classList.add('open');
};

window.closeEscalationModal = function() {
  const modal = document.getElementById('escalationConfirmModal');
  if (modal) modal.classList.remove('open');
  state.activeEscalationCase = null;
  state.activeEscalationAction = null;
};

window.submitEscalationAction = async function() {
  if (!state.activeEscalationCase || !state.activeEscalationAction) return;

  const caseId = state.activeEscalationCase.case_id;
  const actionType = state.activeEscalationAction;
  const notes = document.getElementById('escNotesInput').value.trim();

  const confirmBtn = document.getElementById('confirmEscalationBtn');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = `<span>⏳</span> ${t('btn_recording_action')}`;

  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: actionType,
        counsellor_notes: notes,
        counsellor_id: 'COUNSELLOR_NHAA_09'
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.detail || 'Escalation failed');
    }

    const result = await res.json();
    showToast(`Action Recorded: ${result.updated_case.status}`, 'success');
    closeEscalationModal();
    refreshQueue();
    refreshStats();
  } catch (err) {
    console.error(err);
    showToast(`Escalation error: ${err.message}`, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<span>✅</span> <span data-i18n="btn_confirm_esc_action">${t('btn_confirm_esc_action')}</span>`;
  }
};

window.openAuditPackageModal = async function(caseId) {
  const c = state.cachedCases.find(item => item.case_id === caseId);
  if (!c) return;

  const modal = document.getElementById('auditPackageModal');
  const caseIdEl = document.getElementById('auditPackageCaseId');
  const timestampEl = document.getElementById('auditPackageTimestamp');
  const hashEl = document.getElementById('auditPackageHash');
  const noteEl = document.getElementById('auditPackageNote');
  const statusEl = document.getElementById('auditPackageStatus');

  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/audit-package`);
    if (!res.ok) throw new Error('Audit package unavailable');
    const data = await res.json();

    caseIdEl.textContent = data.case_id || caseId;
    timestampEl.textContent = data.timestamp || c.timestamp || '--';
    hashEl.textContent = data.hash || 'not available';
    noteEl.textContent = data.note;
    statusEl.textContent = data.integrity_status === 'verified' ? 'Integrity status: verified' : 'Integrity status: pending';

    state.activeAuditPackageCase = caseId;
    modal.classList.add('open');
  } catch (err) {
    console.error(err);
    showToast('Unable to load Audit Package', 'error');
  }
};

window.closeAuditPackageModal = function() {
  const modal = document.getElementById('auditPackageModal');
  if (modal) modal.classList.remove('open');
  state.activeAuditPackageCase = null;
};

window.verifyAuditPackage = async function() {
  const caseId = state.activeAuditPackageCase;
  if (!caseId) return;

  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/verify-integrity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Verification failed');
    const data = await res.json();

    const hashEl = document.getElementById('auditPackageHash');
    const statusEl = document.getElementById('auditPackageStatus');
    const noteEl = document.getElementById('auditPackageNote');
    const msg = data.integrity_ok ? 'Verify Integrity: hash matches the current assessment data.' : data.message;

    hashEl.textContent = data.hash || hashEl.textContent;
    statusEl.textContent = data.integrity_ok ? 'Integrity status: verified' : 'Integrity status: mismatch';
    noteEl.textContent = msg;

    showToast(msg, data.integrity_ok ? 'success' : 'error');
  } catch (err) {
    console.error(err);
    showToast('Integrity verification failed', 'error');
  }
};

// Refresh Metrics & Stats
async function refreshStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById('statTotalCases').textContent = stats.total_cases;
    document.getElementById('statPendingCrit').textContent = stats.pending_critical_alerts;
    document.getElementById('statHighCases').textContent = stats.tier_counts.High || 0;
    document.getElementById('statAvgSvi').textContent = `${stats.avg_svi}/100`;

    const overdueEl = document.getElementById('statOverdueCount');
    if (overdueEl) overdueEl.textContent = stats.overdue_deadlines_count !== undefined ? stats.overdue_deadlines_count : 0;
    const approachingEl = document.getElementById('statApproachingCount');
    if (approachingEl) approachingEl.textContent = stats.approaching_deadlines_count !== undefined ? stats.approaching_deadlines_count : 0;
  } catch (err) {
    console.error('Failed to fetch stats', err);
  }
}

// Open Counsellor Detailed Action Modal (Deep Dive)
window.openCaseModal = function(caseId) {
  const c = state.cachedCases.find(item => item.case_id === caseId);
  if (!c) return;

  const modal = document.getElementById('actionModal');
  const title = document.getElementById('modalCaseTitle');
  const body = document.getElementById('modalBody');
  const footer = document.getElementById('modalFooter');

  title.textContent = `${t('modal_case_details_title')} ${c.case_id} (${c.caller_alias || 'Citizen'})`;

  const highlightedText = highlightKeywords(c.full_transcript, c.matched_phrases || []);
  const translatedTier = tTier(c.risk_tier);
  const translatedChannel = t(`channel_${c.channel.toLowerCase()}`, c.channel.toUpperCase());
  const translatedActionDesc = tActionDesc(c.risk_tier) || c.action_description;
  const translatedDispatch = tDispatch(c.risk_tier) || c.recommended_dispatch;

  // Suggested Legal Sections (Advisory Checklist under PoA Act)
  let legalSectionsHtml = '';
  try {
    const sections = c.suggested_legal_sections || [];
    const sectionListHtml = sections.length > 0 ? sections.map(sec => {
      const isConfirmed = !!sec.confirmed_in_fir;
      const kwBadges = (sec.matched_keywords || []).map(kw => `<span class="phrase-chip">${escapeHtml(kw)}</span>`).join(' ');
      return `
        <div class="legal-section-item">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
            <label style="display:flex; align-items:flex-start; gap:10px; cursor:pointer; flex:1;">
              <input type="checkbox" style="margin-top:3px; accent-color:var(--primary); cursor:pointer;" 
                     ${isConfirmed ? 'checked' : ''} 
                     onchange="toggleLegalSectionFIR('${c.case_id}', '${escapeHtml(sec.section_code)}', this.checked)">
              <div>
                <div style="font-weight:700; color:#38bdf8; font-size:0.86rem;">
                  ${escapeHtml(sec.section_code)}: <span style="color:#f8fafc;">${escapeHtml(sec.title)}</span>
                </div>
                <div style="font-size:0.78rem; color:#94a3b8; margin-top:3px; line-height:1.4;">
                  ${escapeHtml(sec.description)}
                </div>
                <div style="font-size:0.75rem; color:#cbd5e1; margin-top:4px;">
                  <strong style="color:#fbbf24;">Trigger signals:</strong> ${kwBadges || '<span class="text-dim">Narrative context</span>'}
                </div>
              </div>
            </label>
            <span class="status-chip ${isConfirmed ? 'status-paid' : 'status-pending'}" style="white-space:nowrap; font-size:0.72rem;">
              ${isConfirmed ? '✓ Invoked in FIR' : 'Pending Verification'}
            </span>
          </div>
        </div>
      `;
    }).join('') : `<div style="font-size:0.8rem; color:#94a3b8; font-style:italic; padding:6px 0;">No specific atrocity offence sections triggered by current narrative keywords.</div>`;

    legalSectionsHtml = `
      <div class="legal-sections-panel">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="font-weight: 800; color: #fff; font-size: 0.86rem;">⚖️ Suggested Legal Sections (PoA Act, 1989)</div>
          <span style="background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 12px;">ADVISORY ONLY</span>
        </div>
        <p style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 8px; line-height: 1.4;">
          <strong>Based on this narrative, the following sections may apply — confirm these were invoked in the FIR:</strong>
        </p>
        <div style="font-size: 0.72rem; color: #cbd5e1; background: rgba(30,41,59,0.7); border-left: 3px solid #f59e0b; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px;">
          ⚠️ <strong>Advisory Notice for Legal / Nodal Officer:</strong> Advisory only for human legal/nodal officer verification — never presented as an automatic legal determination.
        </div>
        <div class="legal-sections-checklist">
          ${sectionListHtml}
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Error rendering legal sections in modal', err);
    legalSectionsHtml = '';
  }

  // Witness Retention Risk Section in Case Deep Dive
  const retRisk = c.retention_risk || c.retention_badge || 'Low';
  const retRiskClass = retRisk.toLowerCase();
  const retAction = c.retention_action || `Contact freshness in normal range (${c.days_since_last_contact !== undefined ? c.days_since_last_contact : 0} days since last contact).`;
  const retentionModalHtml = `
    <div style="background: rgba(15,23,42,0.85); border: 1px solid #334155; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-weight: 800; color: #fff; font-size: 0.86rem;">🛡️ Witness Retention Risk Assessment</div>
        <span class="retention-badge badge-${retRiskClass}" style="font-size:0.75rem;">${retRisk} Retention Risk</span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap:8px; margin-bottom:10px; font-size:0.78rem;">
        <div style="background:#091322; padding:6px 10px; border-radius:4px; border:1px solid #1e293b;">
          <span style="color:#94a3b8;">Days Since Contact:</span> <strong style="color:#f8fafc;">${c.days_since_last_contact !== undefined ? c.days_since_last_contact : 0}d</strong>
        </div>
        <div style="background:#091322; padding:6px 10px; border-radius:4px; border:1px solid #1e293b;">
          <span style="color:#94a3b8;">Case Age:</span> <strong style="color:#f8fafc;">${c.case_age_days !== undefined ? c.case_age_days : 0}d</strong>
        </div>
        <div style="background:#091322; padding:6px 10px; border-radius:4px; border:1px solid #1e293b;">
          <span style="color:#94a3b8;">Last Contact:</span> <strong style="color:#f8fafc;">${escapeHtml(c.last_contact_date || 'Today')}</strong>
        </div>
      </div>
      <div style="font-size: 0.78rem; color: #cbd5e1; margin-bottom: 10px;">
        <strong style="color:#fbbf24;">Action Guidance:</strong> ${escapeHtml(retAction)}
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-primary btn-xs" onclick="logCaseContact('${c.case_id}')">
          📞 Log New Victim/Witness Contact (Reset Clock)
        </button>
        <button class="btn btn-outline btn-xs" style="color:#f59e0b; border-color:rgba(245,158,11,0.5);" onclick="backdateCaseContact('${c.case_id}', 45)" title="Simulation test: simulate 45 days of no contact + distress signal">
          🧪 Test: Backdate Contact (-45d)
        </button>
      </div>
    </div>
  `;

  // Compensation Entitlement panel: suggest category + amount/range + 3-stage tracker.
  let entitlementHtml = '';
  try {
    const ent = c.compensation_entitlement || null;
    const tracker = ent && ent.payment_tracker ? ent.payment_tracker : {};
    const stageOrder = ['At FIR Registration', 'At Chargesheet Filing', 'At Conviction'];
    const trackerRows = stageOrder.map(stage => {
      const row = tracker[stage] || { paid: false, stage };
      const paid = row.paid ? 'Paid' : 'Not paid';
      const toggleText = row.paid ? 'Mark unpaid' : 'Mark paid';
      const chipClass = row.paid ? 'status-paid' : 'status-pending';
      const nextPaid = !row.paid;
      return `<div class="comp-tracker-row" style="display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid #334155;padding:8px 0;">
          <span class="text-mono" style="color:#cbd5e1;">${stage}</span>
          <span class="status-chip ${chipClass}">${paid}</span>
          <button class="btn btn-outline btn-xs" onclick="toggleCompensationStage('${c.case_id}', '${stage}', ${nextPaid})">${toggleText}</button>
      </div>`;
    }).join('');

    const cat = ent && ent.category ? ent.category : 'General/other atrocity offences';
    const amt = ent && ent.amount ? ent.amount : 'Rs 85,000 to Rs 8,25,000 range';
    const note = ent && ent.note ? ent.note : 'Entitlement estimate based on the national PoA Rules schedule — state governments may have enhanced amounts (e.g. Tamil Nadu: Rs 1,00,000 to Rs 12,00,000); always confirm exact figures with the District Social Welfare Officer.';

    entitlementHtml = `
      <div style="background: rgba(15,23,42,0.84); border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
        <div style="font-weight: 800; color: #fff; font-size: 0.86rem; margin-bottom: 8px;">💰 Compensation Entitlement</div>
        <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 8px;">
          <span style="font-weight:700; color:#fff;">Suggested category:</span> <span class="text-mono">${escapeHtml(cat)}</span>
        </div>
        <div style="font-size: 0.82rem; color: #cbd5e1; margin-bottom: 8px;">
          <span style="font-weight:700; color:#fff;">Amount/range:</span> <span class="text-mono">${escapeHtml(amt)}</span>
        </div>
        <div style="font-size: 0.78rem; color: #94a3b8; margin-bottom: 10px;">${escapeHtml(note)}</div>
        <div style="font-size: 0.78rem; color: #cbd5e1;">
          <div style="font-weight:700; color:#fff; margin-bottom:4px;">3-stage payment tracker</div>
          ${trackerRows}
        </div>
      </div>
    `;
  } catch (e) {
    entitlementHtml = '';
  }

  // Statutory Deadlines in Modal
  const isRoutineGrievanceModal = (String(c.risk_tier || '').toUpperCase() === 'LOW' && Number(c.svi_score || 0) === 0) || (c.deadlines && c.deadlines.is_applicable === false);
  const dlModal = c.deadlines || {};
  const interimModal = dlModal.interim_relief || { days_remaining: 7.0, status: 'green', is_overdue: false };
  const chargesheetModal = dlModal.chargesheet || { days_remaining: 60.0, status: 'green', is_overdue: false };

  const modalDeadlinesHtml = isRoutineGrievanceModal ? `
    <div style="background: rgba(15,23,42,0.85); border: 1px solid #334155; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px;">
      <div style="font-weight: 700; color: #fff; font-size: 0.85rem; margin-bottom: 6px;">⚖️ ${t('th_deadlines')}</div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="deadline-badge deadline-neutral" style="background: rgba(148, 163, 184, 0.12); color: #94a3b8; border: 1px dashed rgba(148, 163, 184, 0.4); font-size: 0.76rem; padding: 4px 8px; border-radius: 4px;">
          ℹ️ N/A — Routine Grievance
        </span>
        <span style="font-size: 0.75rem; color: #64748b;">(Statutory PoA countdowns apply to confirmed atrocity cases only)</span>
      </div>
    </div>
  ` : `
    <div style="background: rgba(15,23,42,0.85); border: 1px solid #334155; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px;">
      <div style="font-weight: 700; color: #fff; font-size: 0.85rem; margin-bottom: 8px;">⚖️ ${t('th_deadlines')}</div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <span class="deadline-badge deadline-${interimModal.status}">
          ${interimModal.is_overdue ? `⚡ ${t('lbl_interim_relief_short')}: <strong class="text-crit">${t('lbl_deadline_overdue')} (+${interimModal.overdue_by_days || Math.abs(interimModal.days_remaining)}d)</strong>` : `⏱️ ${t('lbl_interim_relief_short')}: <strong>${interimModal.days_remaining}d</strong> ${t('lbl_deadline_rem')}`}
        </span>
        <span class="deadline-badge deadline-${chargesheetModal.status}">
          ${chargesheetModal.is_overdue ? `⚡ ${t('lbl_chargesheet_short')}: <strong class="text-crit">${t('lbl_deadline_overdue')} (+${chargesheetModal.overdue_by_days || Math.abs(chargesheetModal.days_remaining)}d)</strong>` : `⏱️ ${t('lbl_chargesheet_short')}: <strong>${chargesheetModal.days_remaining}d</strong> ${t('lbl_deadline_rem')}`}
        </span>
      </div>
    </div>
  `;

  const overrideBanner = c.is_overridden ? `
    <div style="background: rgba(13, 148, 136, 0.15); border: 1px solid var(--primary); padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 0.8rem;">
      <strong>${t('modal_override_banner_title')}</strong> ${t('modal_override_orig_ai')} <strong>${c.ai_svi_score}/100 (${tTier(c.ai_risk_tier)})</strong>. ${t('modal_override_by')} <em>${c.override_timestamp || 'Recent'}</em>.<br>
      <strong>${t('modal_override_justification')}</strong> ${escapeHtml(c.override_reason || '')}
    </div>
  ` : '';

  // Feature 8: Special Court Jurisdiction Flag (PoA Act Section 14A)
  const specialCourtBanner = c.has_special_court === false ? `
    <div class="special-court-alert" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 10px;">
      <span style="font-size: 1.2rem;">⚠️</span>
      <div>
        <strong style="color: #f87171; font-size: 0.84rem;">Special Court Jurisdiction Flag (PoA Act Section 14A):</strong>
        <p style="margin: 3px 0 0 0; font-size: 0.78rem; color: #fca5a5; line-height: 1.4;">
          Structural Delay Risk — no Exclusive Special Court identified in this district; case may route to a regular Sessions Court with slower PoA Act case handling.
        </p>
        <span style="font-size: 0.7rem; color: #94a3b8; display: block; margin-top: 4px;">Contextual administrative advisory for Counsellor / Nodal Officer (representative sample list, non-blocking).</span>
      </div>
    </div>
  ` : (c.has_special_court === true ? `
    <div class="special-court-verified" style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: flex-start; gap: 10px;">
      <span style="font-size: 1.2rem;">🏛️</span>
      <div>
        <strong style="color: #34d399; font-size: 0.84rem;">Special Court Jurisdiction Active (PoA Act Section 14A):</strong>
        <p style="margin: 3px 0 0 0; font-size: 0.78rem; color: #a7f3d0; line-height: 1.4;">
          District <strong>${escapeHtml(c.district || '')}</strong> has an Exclusive Special Court established under PoA Act Section 14A for accelerated trial proceedings.
        </p>
      </div>
    </div>
  ` : '');

  body.innerHTML = `
    ${overrideBanner}
    ${specialCourtBanner}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
      <div>
        <span class="tier-badge badge-${c.risk_tier.toLowerCase()}">${translatedTier} ${t('modal_risk_suffix')}</span>
        <span style="margin-left: 10px; font-weight: 700; font-family: 'JetBrains Mono'; color: ${c.tier_color};">SVI: ${c.svi_score}/100</span>
      </div>
      <span style="font-size: 0.8rem; color: #94a3b8;">${t('modal_channel_lbl')} <strong>${translatedChannel}</strong> • ${t('modal_district_lbl')} <strong>${c.district}</strong></span>
    </div>

    <div style="background: #091322; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
      <h4 style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px;">${t('modal_statement_header')}</h4>
      <p style="font-size: 0.9rem; line-height: 1.6; color: #f1f5f9;">${highlightedText}</p>
    </div>

    ${modalDeadlinesHtml}

    ${retentionModalHtml}

    ${legalSectionsHtml}

    ${entitlementHtml}

    <div style="background: rgba(15,23,42,0.8); border-left: 3px solid ${c.tier_color}; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px;">
      <div style="font-weight: 700; color: #fff; font-size: 0.85rem;">${t('modal_mandated_header')}</div>
      <div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 2px;">${translatedActionDesc}</div>
      <div style="font-size: 0.78rem; color: #38bdf8; margin-top: 4px;">${t('modal_assigned_unit_lbl')} <strong>${translatedDispatch}</strong></div>
    </div>

    <div style="margin-bottom: 14px;">
      <label style="font-size: 0.8rem; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 6px;">${t('modal_counsellor_notes_lbl')}</label>
      <textarea id="counsellorNotes" rows="2" class="form-textarea" placeholder="${t('modal_counsellor_notes_ph')}"></textarea>
    </div>
  `;

  footer.innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">${t('btn_close')}</button>
    <button class="btn btn-action-police btn-sm" onclick="closeModal(); openEscalationModal('${c.case_id}', 'dispatch_police')">
      ${t('btn_act_police')}
    </button>
    <button class="btn btn-action-witness btn-sm" onclick="closeModal(); openEscalationModal('${c.case_id}', 'trigger_witness_protection')">
      ${t('btn_act_witness')}
    </button>
    <button class="btn btn-action-counsellor btn-sm" onclick="closeModal(); openEscalationModal('${c.case_id}', 'assign_counsellor')">
      ${t('btn_act_counsellor')}
    </button>
    <button class="btn btn-primary btn-sm" onclick="logCaseContact('${c.case_id}')">
      📞 Log Contact
    </button>
    <button class="btn btn-outline btn-sm" onclick="openOverrideModal('${c.case_id}'); closeModal();">
      ⚖️ ${t('btn_override')}
    </button>
  `;

  modal.classList.add('open');
};

window.closeModal = function() {
  const modal = document.getElementById('actionModal');
  if (modal) modal.classList.remove('open');
};

window.toggleCompensationStage = async function(caseId, stage, paid) {
  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/compensation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: stage, paid: paid })
    });
    if (!res.ok) throw new Error('Compensation tracker update failed');
    const data = await res.json();
    const c = state.cachedCases.find(item => item.case_id === caseId);
    if (c) {
      c.compensation_entitlement = data.updated_entitlement;
    }
    showToast(`Compensation tracker ${stage} marked ${paid ? 'paid' : 'unpaid'} (simulation).`, 'success');
    openCaseModal(caseId);
  } catch (err) {
    console.error(err);
    showToast('Unable to update compensation tracker', 'error');
  }
};

window.toggleLegalSectionFIR = async function(caseId, sectionCode, confirmed) {
  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/legal-sections`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        section_code: sectionCode,
        confirmed_in_fir: confirmed,
        officer_id: 'NODAL_OFFICER_01'
      })
    });
    if (!res.ok) throw new Error('Failed to update legal section status');
    const data = await res.json();
    const c = state.cachedCases.find(item => item.case_id === caseId);
    if (c) {
      c.suggested_legal_sections = data.suggested_sections;
    }
    showToast(`${sectionCode} marked ${confirmed ? 'invoked in FIR' : 'unconfirmed'}.`, 'success');
    openCaseModal(caseId);
  } catch (err) {
    console.error(err);
    showToast('Failed to update legal section confirmation', 'error');
  }
};

window.logCaseContact = async function(caseId, notes) {
  try {
    const noteText = notes || prompt(`Log victim/witness contact for Case ${caseId}:`, "Routine counsellor check-in conducted; victim confirmed in safe location.") || "Counsellor logged contact with victim/witness.";
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: noteText,
        counsellor_id: 'COUNSELLOR_NHAA_09'
      })
    });
    if (!res.ok) throw new Error('Failed to log contact');
    const data = await res.json();
    const c = state.cachedCases.find(item => item.case_id === caseId);
    if (c && data.updated_case) {
      Object.assign(c, data.updated_case);
    }
    showToast(`Contact recorded for ${caseId}. Contact freshness reset to today.`, 'success');
    refreshQueue();
    refreshStats();
    if (document.getElementById('actionModal').classList.contains('open')) {
      openCaseModal(caseId);
    }
  } catch (err) {
    console.error(err);
    showToast('Failed to log contact', 'error');
  }
};

window.backdateCaseContact = async function(caseId, daysAgo = 45) {
  const c = state.cachedCases.find(item => item.case_id === caseId);
  if (!c) return;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const backdatedStr = d.toISOString().split('T')[0];
  c.last_contact_date = backdatedStr;
  c.helpline_distress_signal_since_filing = true;
  try {
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/retention-risk`);
    if (res.ok) {
      const data = await res.json();
      Object.assign(c, data.metrics);
      c.retention_risk = data.retention_risk;
      c.retention_badge = data.retention_badge;
      c.retention_action = data.retention_action;
    }
  } catch(e) {}
  showToast(`Case ${caseId} last contact backdated to ${backdatedStr} (-${daysAgo}d). Retention risk escalated to ${c.retention_risk}!`, 'warning');
  renderCasesTable(state.cachedCases);
  if (document.getElementById('actionModal').classList.contains('open')) {
    openCaseModal(caseId);
  }
};

window.downloadReportFile = function(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Downloaded: ${filename}`, 'success');
};

window.copyReportSnapshot = function() {
  const pre = document.getElementById('rawReportText');
  if (pre) {
    navigator.clipboard.writeText(pre.textContent).then(() => {
      showToast('Report copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Copy failed, please select manually', 'warn');
    });
  }
};


// Real-Time Waveform Visualizer for IVRS Audio Simulation
function setupWaveformCanvas() {
  const canvas = document.getElementById('waveformCanvas');
  const toggleBtn = document.getElementById('toggleAudioSimBtn');
  if (!canvas || !toggleBtn) return;

  const ctx = canvas.getContext('2d');
  let phase = 0;

  function drawWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.audioSimulating ? '#14b8a6' : '#475569';
    ctx.beginPath();

    const sliceWidth = canvas.width / 50;
    let x = 0;

    for (let i = 0; i < 50; i++) {
      const amp = state.audioSimulating ? 18 * Math.sin(i * 0.3 + phase) * Math.cos(phase * 0.7) : 2;
      const y = canvas.height / 2 + amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.stroke();
    phase += state.audioSimulating ? 0.15 : 0.02;
    requestAnimationFrame(drawWave);
  }

  drawWave();

  toggleBtn.addEventListener('click', () => {
    state.audioSimulating = !state.audioSimulating;
    document.getElementById('audioSimText').textContent = state.audioSimulating ? t('audio_sim_pause') : t('audio_sim_btn');
  });
}

// Utility: Keyword Highlighter
function highlightKeywords(text, phrases) {
  if (!phrases || phrases.length === 0) return escapeHtml(text);
  let safe = escapeHtml(text);
  phrases.forEach(phrase => {
    if (!phrase || phrase.length < 2) return;
    const regex = new RegExp(`(${escapeRegex(phrase)})`, 'gi');
    safe = safe.replace(regex, '<mark style="background: rgba(234, 88, 12, 0.4); color: #fff; padding: 1px 4px; border-radius: 3px;">$1</mark>');
  });
  return safe;
}

// Utility: Toasts
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'error' ? '❌' : (type === 'warn' ? '⚠️' : '✅');
  toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(msg)}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// Helpers
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function escapeRegex(string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

