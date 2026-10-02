# Architecture & Scoring Methodology: Sahayata Setu

**Problem Statement:** SIH26093 (Ministry of Social Justice & Empowerment)  
**Platform:** Sahayata Setu — AI Stress & Trauma Assessment Platform for NHAA (14566)  
**Team:** InnovateX

---

## 1. Mathematical Scoring Formulation (SVI)

The **Stress Vulnerability Index (SVI)** is a continuous, auditable metric bounded strictly between $[0, 100]$. Every point generated is mathematically attributable to explicit textual signals, temporal urgency indicators, and acoustic voice telemetry.

$$\text{SVI} = \min\left(100, \max\left(0, \text{Round}\left( W_{\text{base}} + \sum_{c \in \mathcal{C}} S_c + C_{\text{boost}} + A_{\text{acoustic}} \right)\right)\right)$$

Where:
- $W_{\text{base}}$ = Base grievance baseline weight ($12$ if any distress indicator is detected; $0$ otherwise).
- $\mathcal{C}$ = Set of vulnerability indicator categories.
- $S_c$ = Clamped category score:
  $$S_c = \min\left(M_c, N_c \times U_c\right)$$
  - $M_c$: Maximum allowable points for category $c$.
  - $N_c$: Number of distinct matched keywords/phrases in category $c$.
  - $U_c$: Unit weight per hit in category $c$.
- $C_{\text{boost}}$ = Contextual & Multi-Factor Compound Escalator.
- $A_{\text{acoustic}}$ = Acoustic Voice Biomarker modifier (for IVRS channels).

---

## 2. Indicator Category Ontology & Weights Table

| Category Code ($c$) | Category Name | Description | Unit Weight ($U_c$) | Max Cap ($M_c$) | Severity Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `LETHAL_DIRECT_THREAT` | **Lethal & Severe Physical Threat** | Threats of murder, arson, lynching, swords, guns, knives, mob violence | 14 pts | **28 pts** | `CRITICAL` |
| `PHYSICAL_HARASSMENT_INTIMIDATION` | **Physical Harassment & Violence** | Beatings, assault, manhandling, harassment | 6 pts | **12 pts** | `HIGH` |
| `RESTRICTED_MOVEMENT_CONFINEMENT` | **Restricted Confinement** | Barricaded, house surrounded, exit blocked, trapped | 7 pts | **14 pts** | `HIGH` |
| `EXTREME_FEAR_PANIC` | **Acute Fear & Panic** | Pleading for life, screaming, crying children, trembling | 6 pts | **12 pts** | `HIGH` |
| `COERCION_INSTITUTIONAL_PRESSURE` | **Coercion & Impunity** | Police refusal of FIR, forced compromise, threats | 6 pts | **12 pts** | `MODERATE` |
| `SOCIAL_ECONOMIC_BOYCOTT` | **Boycott & Discrimination** | Denial of drinking water, shop/ration refusal, discrimination, village ostracization | 8 pts | **16 pts** | `MODERATE` |
| `TEMPORAL_URGENCY` | **Temporal Imminence** | Signals that violence or attack is unfolding right now, doors being broken | 7 pts | **14 pts** | `HIGH` |
| `PSYCHOLOGICAL_CRISIS_SELF_HARM` | **Self-Harm & Psychological Crisis Risk** | Severe depression, hopelessness, suicidal ideation, extreme isolation | 8 pts | **16 pts** | `CRITICAL` |

---

## 3. Contextual Boosters ($C_{\text{boost}}$)

Helpline crises frequently compound across multiple dimensions. The engine applies transparent deterministic boosters:

1. **IVRS Telephony Baseline (+3 SVI)**:
   - Applied when audio/transcript originates from the emergency 14566 telephony trunk.
2. **Imminent Lethal & Multi-Dimension Escalator (+10 SVI)**:
   - Triggered when `LETHAL_DIRECT_THREAT` is active **and** at least 3 distinct indicator dimensions are detected.
3. **Compounding Multi-Factor Risk (+6 SVI or +3 SVI)**:
   - If $\ge 3$ High/Critical categories are active: $+6\text{ SVI}$.
   - If $2$ High/Critical categories are active: $+3\text{ SVI}$.

---

## 4. Acoustic Biomarker Fusion ($A_{\text{acoustic}}$)

For IVRS voice streams, acoustic telemetry is extracted across 4 primary acoustic features:
- **Pitch Variance ($\sigma_{F0}$ in Hz)**: Stress threshold $> 75\text{ Hz}$ ($+4\text{ pts}$).
- **Jitter Percentage ($J_{\text{pct}}$)**: Vocal instability $> 2.2\%$ ($+4\text{ pts}$).
- **Speech Rate ($R_{\text{wpm}}$)**: Panic velocity $> 175\text{ wpm}$ or shock halting $< 85\text{ wpm}$ ($+2\text{ pts}$).
- **Pause Ratio ($P_{\text{ratio}}$)**: Severe hesitation $> 0.30$ ($+2\text{ pts}$).

### Realistic SER Calibration Note
Per the IIETA Indian Cross-Corpus Speech Emotion Recognition study, SER models on Indian vernacular languages achieve realistic baseline accuracy of **45–70%**. Sahayata Setu explicitly displays this confidence interval to counsellors, avoiding false 100% confidence claims and relying on **multi-modal fusion (text semantics + acoustic markers)**.

---

## 5. 4-Tier Risk Escalation Ladder & SLA Protocols

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               NHAA ESCALATION LADDER                                   │
├──────────────┬──────────┬──────────────┬───────────────────────────────────────────────┤
│ Risk Tier    │ SVI Range│ SLA          │ Action & Dispatch Mandate                     │
├──────────────┼──────────┼──────────────┼───────────────────────────────────────────────┤
│ 🟢 Low       │ 0 - 30   │ 72 Hours     │ Standard administrative grievance queue       │
│ 🟡 Moderate  │ 31 - 55  │ 48 Hours     │ L2 Counsellor callback + Legal Aid kit (PoA)  │
│ 🟠 High      │ 56 - 78  │ 2 Hours      │ Senior Duty Counsellor + District Nodal Alert │
│ 🔴 Critical  │ 79 - 100 │ < 15 Minutes │ RED ALERT: SP Police Liaison + Witness Protect│
└──────────────┴──────────┴──────────────┴───────────────────────────────────────────────┘
```

---

## 6. Human-in-the-Loop (HITL) Gate

The scoring engine strictly enforces a **decision-support architecture** with zero autonomous dispatches:
- **Advisory Mandate**: Every evaluation payload returns the advisory: *"AI provides decision-support triage. Counsellor confirmation is required before dispatching emergency workflows."*
- **Counsellor Confirmation Gate**: Emergency dispatches (police liaison, witness protection, welfare notifications) cannot be triggered automatically by AI scores; they mandate affirmative verification and action logging by a designated duty counsellor.
- **Auditable Recalibration**: Any counsellor override is recorded in immutable audit logs with timestamp, rationale, and pre/post score tracking.

---

## 7. AI4Bharat Indic Extension Architecture (V2 Stretch)

The modular scoring engine (`backend/scoring_engine.py`) is designed with a pluggable feature pipeline:

```
[Raw Audio/Text] 
       │
       ├──► [AI4Bharat IndicWav2Vec] ──► Vernacular Speech-to-Text & Acoustic Embeddings
       │
       └──► [AI4Bharat IndicBERT]   ──► Indic Semantic Intent & Sentiment Vectors
                                             │
                                             ▼
                                [SVI Multi-Modal Fusion Engine]
                                             │
                                             ▼
                                [NHAA Triage Queue & Actions]
```

This decoupled architecture ensures that the rule-based core remains 100% testable, zero-latency, and auditable for judges, while providing a direct path to advanced multilingual neural embeddings.
