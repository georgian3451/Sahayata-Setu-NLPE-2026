"""
Unit Tests for Sahayata Setu Scoring Engine & API Endpoints
"""

import pytest
from backend.scoring_engine import StressScoringEngine, RiskTier, EscalationProtocols


def test_empty_transcript():
    """Empty or whitespace text should return SVI 0 and Low risk tier."""
    res = StressScoringEngine.evaluate_text("", channel="portal")
    assert res["svi_score"] == 0
    assert res["risk_tier"] == RiskTier.LOW
    assert len(res["detected_indicators"]) == 0


def test_tier_1_low_administrative():
    """Routine scholarship / administrative question should be Tier 1 (Low, 0-30)."""
    text = "I want to inquire about my welfare scholarship application status. Documents were submitted last Monday."
    res = StressScoringEngine.evaluate_text(text, channel="portal")
    assert res["svi_score"] <= 30
    assert res["risk_tier"] == RiskTier.LOW
    assert res["witness_protection_flag"] is False
    assert res["police_liaison_required"] is False


def test_tier_2_moderate_discrimination():
    """Social discrimination / drinking water denial with harassment should be Tier 2 (Moderate, 31-55)."""
    text = "We were denied drinking water from the common village well. They are harassing our family and shopkeeper refused ration to us. We need legal counselling."
    res = StressScoringEngine.evaluate_text(text, channel="chatbot")
    assert 31 <= res["svi_score"] <= 55
    assert res["risk_tier"] == RiskTier.MODERATE
    assert any("SOCIAL_ECONOMIC_BOYCOTT" in ind["category_key"] for ind in res["detected_indicators"])


def test_tier_3_high_confinement_and_boycott():
    """Social boycott + locked inside + fear should be Tier 3 (High, 56-78)."""
    text = (
        "They declared social boycott. We are locked inside our home and cannot leave. "
        "The local men threatened to beat us if we go outside. The kids are terrified and crying."
    )
    res = StressScoringEngine.evaluate_text(text, channel="ivrs")
    assert 56 <= res["svi_score"] <= 78
    assert res["risk_tier"] == RiskTier.HIGH
    assert res["police_liaison_required"] is True
    assert res["witness_protection_flag"] is True


def test_tier_4_critical_imminent_threat():
    """Mob gathering with weapons, death threats, arson threat, and immediate urgency should be Tier 4 (Critical, 79-100)."""
    text = (
        "An armed mob has surrounded our house right now with swords and weapons! "
        "They are breaking the door and screaming they will kill us and burn our house! "
        "We are trapped inside screaming and begging for life, please send police immediately!"
    )
    res = StressScoringEngine.evaluate_text(
        text, 
        channel="ivrs",
        audio_telemetry={"pitch_variance_hz": 92.0, "jitter_pct": 3.2, "speech_rate_wpm": 190, "pause_ratio": 0.35}
    )
    assert res["svi_score"] >= 79
    assert res["risk_tier"] == RiskTier.CRITICAL
    assert res["witness_protection_flag"] is True
    assert res["police_liaison_required"] is True
    assert len(res["detected_indicators"]) >= 3


def test_hindi_critical_case():
    """Test Hindi language detection and scoring."""
    text = "भीड़ ने घर घेर लिया है! हथियार लेकर दरवाजा तोड़ रहे हैं, जान से मार डालेंगे और आग लगा देंगे! बचा लो!"
    res = StressScoringEngine.evaluate_text(text, channel="ivrs", preferred_language="hi")
    assert res["svi_score"] >= 79
    assert res["risk_tier"] == RiskTier.CRITICAL
    assert len(res["matched_phrases"]) >= 3


def test_bengali_critical_case():
    """Test Bengali language detection and scoring."""
    text = "জরুরি সাহায্য চাই! এই মুহূর্তে একদল লোক বন্দুক এবং অস্ত্র নিয়ে আমাদের বাড়ি ঘিরে রেখেছে। তারা দরজা ভাঙছে এবং হুমকি দিচ্ছে বাড়ি আগুন লাগিয়ে পুড়িয়ে মারবে। বাচ্চারা ভয়ে কাঁপছে, এখনই পুলিশ পাঠান!"
    res = StressScoringEngine.evaluate_text(
        text, 
        channel="ivrs", 
        preferred_language="bn",
        audio_telemetry={"pitch_variance_hz": 91.5, "jitter_pct": 3.0, "speech_rate_wpm": 182, "pause_ratio": 0.31}
    )
    assert res["svi_score"] >= 79
    assert res["risk_tier"] == RiskTier.CRITICAL
    assert res["witness_protection_flag"] is True
    assert res["police_liaison_required"] is True


def test_tamil_high_case():
    """Test Tamil language detection and scoring."""
    text = "எங்கள் ஊரில் உள்ளவர்கள் சமூக புறக்கணிப்பு செய்துள்ளனர். பொது கிணற்றிலிருந்து தண்ணீர் எடுக்க தடை விதிக்கப்பட்டுள்ளது. வெளியே வந்தால் அடிப்பதாக மிரட்டுகின்றனர்."
    res = StressScoringEngine.evaluate_text(text, channel="chatbot", preferred_language="ta")
    assert res["svi_score"] >= 31
    assert any(ind["category_key"] in ["SOCIAL_ECONOMIC_BOYCOTT", "PHYSICAL_HARASSMENT_INTIMIDATION"] for ind in res["detected_indicators"])


def test_score_bounding():
    """SVI score should strictly be clamped between 0 and 100."""
    extreme_text = "kill murder burn arson mob lynch blood sword knife gun locked inside surrounded trapped right now save us emergency help please " * 10
    res = StressScoringEngine.evaluate_text(
        extreme_text, 
        channel="ivrs", 
        audio_telemetry={"pitch_variance_hz": 120.0, "jitter_pct": 5.0, "speech_rate_wpm": 220, "pause_ratio": 0.50}
    )
    assert res["svi_score"] <= 100
    assert res["svi_score"] >= 0


def test_psychological_crisis_detection_english():
    """Test English detection of Self-Harm & Psychological Crisis Risk category."""
    text = (
        "I have completely lost all hope. There is no reason to live anymore. "
        "I feel so worthless and want to end my life. Everyone has abandoned me."
    )
    res = StressScoringEngine.evaluate_text(text, channel="helpline")
    assert res["has_psychological_crisis"] is True
    assert "KIRAN Mental Health Helpline" in res["crisis_banner_message"]
    assert "1800-599-0019" in res["crisis_banner_message"]
    assert any(ind["category_key"] == "PSYCHOLOGICAL_CRISIS_SELF_HARM" for ind in res["detected_indicators"])


def test_psychological_crisis_detection_hindi():
    """Test Hindi detection of Self-Harm & Psychological Crisis Risk category."""
    text = (
        "अब जीने की कोई वजह नहीं बची, मैं अपनी जिंदगी खत्म करने का सोच रहा हूँ। "
        "कोई उम्मीद नहीं बची है, पूरा परिवार टूट चुका है और समाज ने भी पूरी तरह अकेला छोड़ दिया।"
    )
    res = StressScoringEngine.evaluate_text(text, channel="ivrs", preferred_language="hi")
    assert res["has_psychological_crisis"] is True
    assert "KIRAN" in res["crisis_banner_message"]
    assert any(ind["category_key"] == "PSYCHOLOGICAL_CRISIS_SELF_HARM" for ind in res["detected_indicators"])


def test_medical_assistance_mandate_detection():
    """Test detection of physical harm/injury triggering medical referral mandate."""
    text = (
        "They attacked us with lathis, my brother is severely bleeding with head injury and bone fracture. "
        "My pregnant sister was also pushed to the ground and is in extreme pain."
    )
    res = StressScoringEngine.evaluate_text(text, channel="helpline")
    assert res["medical_assistance_required"] is True
    assert "Primary Health Centre (PHC) / District Hospital Referral" in res["medical_assistance_action"]
    assert len(res["medical_matched_keywords"]) > 0


def test_telugu_scoring_detection():
    """Test Telugu language atrocity text detection and scoring."""
    text = (
        "మా గ్రామంలో మా కుటుంబంపై సామాజిక బహిష్కరణ విధించారు. మంచినీటి బావి నుండి నీళ్లు తోడుకోనివ్వడం లేదు, "
        "దుకాణంలో సామాన్లు ఇవ్వట్లేదు. బయటకు వస్తే కొడతామని బెదిరింపులకు దిగుతున్నారు. మాకు తక్షణ రక్షణ మరియు న్యాయ సహాయం కావాలి."
    )
    res = StressScoringEngine.evaluate_text(text, channel="chatbot", preferred_language="te")
    assert res["svi_score"] >= 31
    assert any(ind["category_key"] in ["SOCIAL_ECONOMIC_BOYCOTT", "PHYSICAL_HARASSMENT_INTIMIDATION"] for ind in res["detected_indicators"])


def test_marathi_scoring_detection():
    """Test Marathi language atrocity text detection and scoring."""
    text = (
        "आमच्या वस्तीवर गावातील लोकांनी सामाजिक बहिष्कार टाकला आहे. सार्वजनिक विहिरीवरून पाणी भरू देत नाहीत आणि मुख्य रस्ता बंद केला आहे. "
        "बाहेर पडल्यास मारहाण करण्याची धमकी दिली जात आहे. पोलिस ठाण्यात गेलो तर पोलिस तक्रार घेत नाहीत आणि तक्रार मागे घेण्यासाठी दबाव आणत आहेत."
    )
    res = StressScoringEngine.evaluate_text(text, channel="portal", preferred_language="mr")
    assert res["svi_score"] >= 31
    assert any(ind["category_key"] in ["SOCIAL_ECONOMIC_BOYCOTT", "RESTRICTED_MOVEMENT_CONFINEMENT", "COERCION_INSTITUTIONAL_PRESSURE"] for ind in res["detected_indicators"])


