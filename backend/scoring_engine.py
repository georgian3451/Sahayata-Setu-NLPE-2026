"""
Sahayata Setu — Transparent & Explainable Stress Vulnerability Index (SVI) Engine
Problem Statement: SIH26093 (Ministry of Social Justice & Empowerment)
Team: InnovateX

Auditable, rule-based, multi-channel scoring engine for NHAA (14566).
Zero black-box decisions: Every point in the SVI (0-100) is attributable to specific
textual indicators, urgency signals, and acoustic features.
"""

from typing import Dict, List, Any, Optional
import re


class RiskTier:
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"


class EscalationProtocols:
    """NHAA & Caste-Atrocity specific escalation ladder."""
    
    PROTOCOLS = {
        RiskTier.LOW: {
            "tier": RiskTier.LOW,
            "range": "0 - 30",
            "sla": "Within 72 Hours",
            "action_title": "Standard Administrative Queue",
            "action_description": "Log standard grievance ticket; schedule routine follow-up via NHAA portal or automated SMS/IVRS confirmation.",
            "recommended_dispatch": "L1 Helpline Executive",
            "witness_protection_flag": False,
            "police_liaison_required": False,
            "color": "#0d9488",  # Teal-600
            "badge_class": "badge-low",
        },
        RiskTier.MODERATE: {
            "tier": RiskTier.MODERATE,
            "range": "31 - 55",
            "sla": "Within 48 Hours",
            "action_title": "Counsellor Callback & Legal Aid Awareness",
            "action_description": "Dispatch ticket to Tier-2 psychological counsellor; provide legal assistance kit under PoA Act, 1989.",
            "recommended_dispatch": "Assigned District Legal Aid & L2 Counsellor",
            "witness_protection_flag": False,
            "police_liaison_required": False,
            "color": "#d97706",  # Amber-600
            "badge_class": "badge-moderate",
        },
        RiskTier.HIGH: {
            "tier": RiskTier.HIGH,
            "range": "56 - 78",
            "sla": "Within 2 Hours (Same Day)",
            "action_title": "Duty Counsellor Assignment & Welfare Escalation",
            "action_description": "Immediate telephonic triage by Senior Duty Counsellor; alert District Social Welfare / Atrocity Nodal Officer.",
            "recommended_dispatch": "Senior Duty Counsellor & District Nodal Officer",
            "witness_protection_flag": True,
            "police_liaison_required": True,
            "color": "#ea580c",  # Orange-600
            "badge_class": "badge-high",
        },
        RiskTier.CRITICAL: {
            "tier": RiskTier.CRITICAL,
            "range": "79 - 100",
            "sla": "Immediate / < 15 Minutes",
            "action_title": "Emergency Police Liaison & Witness Protection Activation",
            "action_description": "RED ALERT: Direct link with SP/District Police Control Room; trigger Witness Protection Scheme assessment and emergency shelter dispatch.",
            "recommended_dispatch": "Superintendent of Police (Control Room) & Rapid Response Team",
            "witness_protection_flag": True,
            "police_liaison_required": True,
            "color": "#dc2626",  # Red-600
            "badge_class": "badge-critical",
        }
    }


# Comprehensive Multilingual Indicator Ontology for Caste Atrocity & Crisis Contexts
INDICATOR_CATEGORIES = {
    "LETHAL_DIRECT_THREAT": {
        "name": "Lethal & Severe Physical Threat",
        "description": "Explicit threats of murder, weapons, arson, lynching, or severe physical assault.",
        "max_category_weight": 28,
        "unit_weight": 14,
        "severity": "CRITICAL",
        "keywords": {
            "en": [
                "kill", "murder", "kill us", "burn our house", "arson", "torch", "mob", 
                "lynch", "sword", "gun", "knife", "weapons", "cut into pieces", 
                "threatened to shoot", "physically assaulted", "bloodshed", "firearms"
            ],
            "hi": [
                "मार डालेंगे", "जान से मार", "आग लगा", "घर जला", "भीड़", "खून", "तलवार", 
                "बंदूक", "चाकू", "हथियार", "टुकड़े कर देंगे", "गोली मार",
                "maar dalenge", "jaan se maar", "aag laga", "ghar jala", "bheed", 
                "khoon", "talwar", "bandook", "chaku", "hathiyar", "goli maar", "kat dalenge"
            ],
            "bn": [
                "মেরে ফেলবে", "খুন", "আগুন লাগিয়ে", "বাড়ি পোড়ানো", "দলবদ্ধ আক্রমণ", 
                "রক্ত", "তরোয়াল", "বন্দুক", "অস্ত্র", "গুলি করবে", "খুন করার হুমকি", "পুড়িয়ে মারবে"
            ],
            "ta": [
                "கொன்று விடுவோம்", "கொலை", "வீட்டை கொளுத்துவோம்", "தாக்குதல்", 
                "ரத்தம்", "வாள்", "துப்பாக்கி", "ஆயுதம்", "சுட்டு விடுவோம்", "கொலை மிரட்டல்"
            ],
            "te": [
                "చంపేస్తాం", "చంపేస్తామని బెదిరింపు", "ఇంటికి నిప్పు", "హత్య", "తుపాకీ", 
                "కత్తులు", "ఆయుధాలు", "దాడి", "రక్తం", "ప్రాణాలు తీస్తాం"
            ],
            "mr": [
                "जीवे मारू", "मारून टाकू", "घर जाळून टाकू", "हल्ला", "शस्त्रे", 
                "तलवार", "बंदूक", "रक्तपात", "खलास करू"
            ]
        }
    },
    "PHYSICAL_HARASSMENT_INTIMIDATION": {
        "name": "Physical Harassment & Violence Threat",
        "description": "Threats of beatings, harassment, assault without weapons.",
        "max_category_weight": 12,
        "unit_weight": 6,
        "severity": "HIGH",
        "keywords": {
            "en": [
                "beat us", "threatened to beat", "beating", "assault", "slapped", 
                "manhandled", "violence", "threatened with violence", "pushed around",
                "harassing", "harassment", "abusing"
            ],
            "hi": [
                "पीटा", "मारने की धमकी", "पीटेंगे", "हाथापाई", "हमला", "प्रताड़ित", "परेशान कर रहे",
                "peeta", "marne ki dhamki", "peetenge", "hathapai", "hamla", "pareshan"
            ],
            "bn": ["মারধর", "মারার হুমকি", "আঘাত", "হয়রানি", "মারপিট", "গালাগালি", "অত্যাচার"],
            "ta": ["அடித்து", "அடிப்பதற்கு மிரட்டல்", "துன்புறுத்தல்", "அடிப்பதாக மிரட்டுகின்றனர்", "அடிப்பார்களோ", "தாக்குதல்", "மிரட்டல்", "அடிதடி"],
            "te": ["కొట్టారు", "దాడి చేశారు", "దౌర్జన్యం", "కొడతామని బెదిరింపు", "వేధింపులు", "అవమానించారు", "చేతులు చేసుకున్నారు"],
            "mr": ["मारहाण केली", "मारण्याची धमकी", "धक्काबुक्की", "जाचहाट", "शिवीगाळ", "त्रास देत आहेत", "अत्याचार"]
        }
    },
    "RESTRICTED_MOVEMENT_CONFINEMENT": {
        "name": "Restricted Movement & Confinement",
        "description": "Victim barricaded, roads blocked, hostage, surrounded, or forbidden from leaving.",
        "max_category_weight": 14,
        "unit_weight": 7,
        "severity": "HIGH",
        "keywords": {
            "en": [
                "locked inside", "surrounded our house", "barricaded", "cannot leave", 
                "trapped", "blocked the road", "hostage", "cornered", "not letting us step out",
                "village exit blocked", "surrounding the premises", "gate locked from outside",
                "blocked road", "locked in", "surrounded"
            ],
            "hi": [
                "घर घेर लिया", "बाहर नहीं निकलने दे रहे", "रास्ता बंद", "बंधक", "फंसे हुए हैं", 
                "ताला लगा दिया", "निकलने नहीं दे रहे", "चारों तरफ से घेर", 
                "ghar gher liya", "bahar nahi nikalne", "rasta band", "bandhak", "phase hue hain", 
                "tala laga diya", "ghera hua hai"
            ],
            "bn": ["বাড়ি ঘিরে রেখেছে", "বেরোতে দিচ্ছে না", "রাস্তা বন্ধ", "বন্দী", "আটকে পড়েছি", "চারিদিক ঘিরে"],
            "ta": ["வீட்டை சூழ்ந்துள்ளனர்", "வெளியே வர விடவில்லை", "வழி அடைக்கப்பட்டது", "சிறைப்பிடிப்பு", "வெளியே வந்தால்", "அடைத்து வைத்துள்ளனர்", "வீட்டை சுற்றியுள்ளனர்"],
            "te": ["ఇంటిని చుట్టుముట్టారు", "బయటకు రానివ్వడం లేదు", "దారి మూసేశారు", "బంధించారు", "గృహనిర్బంధం", "దారిని అడ్డుకున్నారు"],
            "mr": ["घर घेरले आहे", "बाहेर पडू देत नाहीत", "रस्ता बंद केला", "कोंडून ठेवले", "अडकून पडलो आहोत", "घेराव घातला"]
        }
    },
    "EXTREME_FEAR_PANIC": {
        "name": "Extreme Fear & Acute Panic",
        "description": "Acute psychological trauma, crying, trembling children, pleading for life, severe panic.",
        "max_category_weight": 12,
        "unit_weight": 6,
        "severity": "HIGH",
        "keywords": {
            "en": [
                "terrified", "save us", "begging for life", "kids are crying", "trembling", 
                "screaming", "cannot breathe", "please help us", "we are going to die", 
                "shivering in fear", "panicking", "no one is helping", "crying", "scared", "fear"
            ],
            "hi": [
                "बचा लो", "हाथ जोड़ रहे हैं", "बच्चे रो रहे हैं", "कांप रहे हैं", "बहुत डर लग रहा है", 
                "मर जाएंगे", "मदद करो", "चीख रहे हैं", "सांस नहीं आ रही", 
                "bacha lo", "haath jod rahe", "bacche ro rahe", "kaamp rahe", "dar lag raha hai", 
                "mar jayenge", "madad karo", "bachao", "ro rahe"
            ],
            "bn": ["বাঁচান", "বাচ্চারা কাঁদছে", "ভয়ে কাঁপছি", "মরে যাব", "সাহায্য করুন", "ভয় পাচ্ছি", "চিৎকার করছে"],
            "ta": ["காப்பாற்றுங்கள்", "குழந்தைகள் அழுகிறார்கள்", "பயத்தில் நடுங்குகிறோம்", "உதவி செய்யுங்கள்", "பயப்படுகிறோம்", "அழுது கொண்டிருக்கிறார்கள்", "அலறல்"],
            "te": ["కాపాడండి", "పిల్లలు ఏడుస్తున్నారు", "భయంతో వణికిపోతున్నాం", "చచ్చిపోతాం", "సహాయం చేయండి", "భయం వేస్తుంది", "ఏడుస్తున్నారు"],
            "mr": ["वाचवा", "मुलं रडत आहेत", "भीतीने थरथर कापत आहोत", "मदत करा", "जीव वाचवा", "घाबरलो आहोत", "आकांत"]
        }
    },
    "COERCION_INSTITUTIONAL_PRESSURE": {
        "name": "Coercion & Institutional Impunity",
        "description": "Police refusal of FIR, forced compromise/withdrawal, threat by influential persons.",
        "max_category_weight": 12,
        "unit_weight": 6,
        "severity": "MODERATE",
        "keywords": {
            "en": [
                "police refused", "refused to file fir", "forcing compromise", "withdraw complaint", 
                "threatened to take back case", "sarpanch pressure", "influential people", 
                "threatened in police station", "corrupt officers", "threatened with false case",
                "compromise", "take back case", "withdraw case", "no hearing", "landlord pressure"
            ],
            "hi": [
                "थाने में सुनवाई नहीं", "एफआईआर दर्ज नहीं", "सुलह का दबाव", "केस वापस लेने", 
                "सरपंच की धमकी", "दबाव बना रहे हैं", "झूठा मुकदमा", "कोई सुनवाई नहीं",
                "thana sunwai nahi", "fir darj nahi", "sulah ka dabav", "case wapas lene", 
                "sarpanch dabav", "dabav bana rahe"
            ],
            "bn": ["পুলিশ এফআইআর নিচ্ছে না", "আপস করতে বাধ্য করছে", "অভিযোগ প্রত্যাহার", "মামলা তুলে নেওয়া", "হুমকি দিচ্ছে"],
            "ta": ["காவல்துறை மறுக்கிறது", "சமாதானம் செய்ய வற்புறுத்துகின்றனர்", "வழக்கை வாப斯 பெற", "புகாரை திரும்ப பெற", "அதிகாரிகள் மறுக்கின்றனர்", "சட்ட உதவி"],
            "te": ["పోలీసులు ఎఫ్ఐఆర్ నమోదు చేయలేదు", "కేసు వెనక్కి తీసుకోవాలని ఒత్తిడి", "సయోధ్య చేసుకోవాలని", "ఎవరూ పట్టించుకోవడం లేదు", "రాజీ పడమని", "కేసును వెనక్కి"],
            "mr": ["पोलिस तक्रार घेत नाहीत", "एफआयआर नोंदवत नाहीत", "तक्रार मागे घेण्यासाठी दबाव", "तडजोड करण्याची सक्ती", "सरपंच दबाव आणत आहेत"]
        }
    },
    "SOCIAL_ECONOMIC_BOYCOTT": {
        "name": "Social & Economic Boycott / Discrimination",
        "description": "Denial of drinking water, shop/ration refusal, discrimination, village ostracization.",
        "max_category_weight": 16,
        "unit_weight": 8,
        "severity": "MODERATE",
        "keywords": {
            "en": [
                "drinking water", "denied water", "water from the common village well", "denied drinking water",
                "water denied", "well water", "ration shop refused", "social boycott", "ostracized", 
                "expelled from village", "stopped electricity", "no one speaking with us", "refused farm work", 
                "hukka pani band", "caste discrimination", "caste slur", "untouchability", "handpump", 
                "entry denied", "boycott", "refused ration", "humiliation", "taunting"
            ],
            "hi": [
                "पानी बंद कर दिया", "कुएं से पानी नहीं लेने दे रहे", "दुकान से राशन नहीं", 
                "हुक्का पानी बंद", "गांव से निकाल", "बिजली काट दी", "सामाजिक बहिष्कार", 
                "हैंडपंप से हमें पानी", "ताने मारते हैं", "मना कर रहे हैं", "भेदभाव", 
                "paani band", "kuen se paani nahi", "rashan nahi", "hukka pani band", 
                "gaon se nikal", "samajik bahishkar", "handpump", "taane"
            ],
            "bn": ["জল দেওয়া বন্ধ", "রেশন দোকান অস্বীকার", "সামাজিক বয়কট", "গ্রাম ছাড়া", "জল নিতে বাধা", "হুকা পানি বন্ধ", "জাতিগত বৈষম্য", "জল তুলতে দিচ্ছে না"],
            "ta": ["தண்ணீர் நிறுத்தப்பட்டது", "ரேஷன் கடை மறுப்பு", "சமூக புறக்கணிப்பு", "தீண்டாமை", "தண்ணீர் எடுக்க தடை", "பொது கிணறு", "பொது கிணற்றிலிருந்து", "ஊரை விட்டு நீக்கம்", "சாதி கொடுமை"],
            "te": ["నీళ్లు ఇవ్వడం లేదు", "మంచినీటి బావి", "సామాజిక బహిష్కరణ", "ఊరి నుంచి వెలివేశారు", "రేషన్ ఇవ్వడం లేదు", "కులం పేరుతో దూషించారు", "అంటరానితనం", "దుకాణంలో సామాన్లు ఇవ్వట్లేదు"],
            "mr": ["पाणी बंद केले", "विहिरीवरून पाणी भरू देत नाहीत", "सामाजिक बहिष्कार", "गावातून हुसकावून", "रेशन नाकारले", "हुक्का पाणी बंद", "जातीय भेदभाव", "जातीवाचक शिवीगाळ"]
        }
    },
    "TEMPORAL_URGENCY": {
        "name": "Temporal Imminence & Real-Time Threat",
        "description": "Signals that violence or attack is unfolding right now, doors being broken.",
        "max_category_weight": 14,
        "unit_weight": 7,
        "severity": "HIGH",
        "keywords": {
            "en": [
                "right now", "outside our door right now", "breaking in", "entering now", 
                "happening currently", "immediately send force", "they are at the gate", "urgently", "emergency", "immediately"
            ],
            "hi": [
                "अभी-अभी", "दरवाजे पर खड़े हैं", "दरवाजा तोड़ रहे हैं", "तुरंत पुलिस भेजो", "जल्दी मदद",
                "abhi abhi", "darwaze par khade hain", "darwaza tod rahe", "turant police bhejo", "jaldi madad", "तुरंत"
            ],
            "bn": ["এই মুহূর্তে", "দরজা ভাঙছে", "এখনই পুলিশ পাঠান", "জরুরি সাহায্য", "তাড়াতাড়ি"],
            "ta": ["இப்போதே", "கதவை உடைக்கிறார்கள்", "உடனே போலீசை அனுப்புங்கள்", "அவசர", "உடனடியாக", "இப்பொழுதே"],
            "te": ["ఇప్పుడే", "తలుపులు బద్దలు కొడుతున్నారు", "వెంటనే పోలీసులను పంపండి", "అత్యవసరం", "ప్రస్తుతం"],
            "mr": ["आत्ताच", "दरवाजा तोडत आहेत", "तातडीने पोलिस पाठवा", "त्वरित मदत", "लगेच"]
        }
    },
    "PSYCHOLOGICAL_CRISIS_SELF_HARM": {
        "name": "Self-Harm & Psychological Crisis Risk",
        "description": "Indicators of severe depression, hopelessness, suicidal ideation, extreme isolation, or fear paralysis.",
        "max_category_weight": 16,
        "unit_weight": 8,
        "severity": "CRITICAL",
        "keywords": {
            "en": [
                "lost all hope", "no hope left", "giving up", "feel worthless", "feeling worthless",
                "no point in living", "cannot go on like this", "completely hopeless", "tired of living",
                "no reason to continue living", "no reason to live", "want to end my life", "want to die",
                "better off dead", "end it all", "kill myself", "suicidal ideation", "suicidal",
                "wish i was dead", "completely abandoned", "cut off from everyone", "no one to talk to",
                "completely alone in this world", "completely alone", "isolated and abandoned",
                "no support from anyone", "everyone has deserted us", "paralyzed by fear",
                "mental breakdown", "living like a dead person", "cannot bear this trauma"
            ],
            "hi": [
                "जीने की कोई उम्मीद नहीं", "सब उम्मीद खो दी", "उम्मीद टूट चुकी है", "अब जीने का कोई मतलब नहीं",
                "हार मान चुका", "हार मान चुके", "सब खत्म हो गया", "जिंदगी से तंग आ चुके",
                "अपनी जान दे दूंगा", "जान देने का मन", "आत्महत्या", "मर जाना चाहता", "मर जाने का मन",
                "जीने की कोई वजह नहीं", "जिंदगी खत्म करने", "अपनी जिंदगी खत्म",
                "पूरी तरह अकेले पड़ गए", "कोई बात करने वाला नहीं", "सबने साथ छोड़ दिया", "कोई सहारा नहीं",
                "पूरी तरह अकेला", "समाज ने ठुकरा दिया", "कोई सुनने वाला नहीं", "पूरी तरह टूट चुका",
                "डर के मारे सुन्न", "यह सदमा बर्दाश्त नहीं",
                "jeene ki koi umeed nahi", "jaan dene ka man", "aatmhatya", "mar jana chahta",
                "koi sahara nahi", "puri tarah akele", "sab umeed kho di", "zindagi se tang"
            ],
            "te": [
                "జీవించాలనే ఆశ లేదు", "ఆశలన్నీ కోల్పోయాం", "జీవితం ముగిసిపోయింది", "ఆత్మహత్య",
                "చనిపోవాలనిపిస్తుంది", "జీవించడానికి ఎటువంటి కారణం లేదు", "పూర్తిగా ఒంటరి అయిపోయాము",
                "ఎవరూ మాట్లాడటం లేదు", "ఏ దిక్కూ లేదు", "ఎవరూ సహాయం చేయట్లేదు"
            ],
            "mr": [
                "जगायची इच्छा उरली नाही", "सर्व आशा संपल्या", "आत्महत्या", "जीवन संपवण्याचा विचार",
                "जगणं नकोसं झालंय", "पूर्णपणे एकटे पडलो आहोत", "कोणाचाही आधार नाही",
                "कोणीही बोलायला तयार नाही", "मनोधैर्य खचले आहे"
            ],
            "bn": [
                "বাঁচার আর কোনো আশা নেই", "সব আশা হারিয়ে ফেলেছি", "আত্মহত্যা", "জীবন শেষ করে দিতে চাই",
                "বেঁচে থাকার কোনো মানে নেই", "সম্পূর্ণ একা হয়ে গেছি", "কেউ কথা বলছে না", "কোনো ভরসা নেই"
            ],
            "ta": [
                "வாழ எந்த நம்பிக்கையும் இல்லை", "தற்கொலை", "உயிரை மாய்த்துக்கொள்ள", "வாழ்வதில் அர்த்தமில்லை",
                "முற்றிலும் தனித்து விடப்பட்டோம்", "யாரும் பேசுவதில்லை", "எந்த ஆதரவும் இல்லை"
            ]
        }
    }
}


# Ontology for Physical Harm & Health Indicators Triggering Medical Referral
MEDICAL_HARM_KEYWORDS = {
    "en": [
        "injured", "bleeding", "fracture", "broken bone", "broken bones", "head injury", 
        "beaten unconscious", "wounds", "blood loss", "bruises", "physical injury", 
        "internal bleeding", "hospitalized", "need stitches", "pregnant", "pregnancy", 
        "expecting mother", "elderly mother", "elderly father", "frail grandmother", 
        "old age and unwell", "bedridden", "fragile health", "cannot breathe", 
        "chest pain", "heart patient", "collapsed", "fainted", "unconscious", "asthma attack"
    ],
    "hi": [
        "चोट लगी", "खून बह रहा", "हड्डी टूट", "सिर में चोट", "बेहोश", "जख्मी", "घाव", 
        "अस्पताल", "गर्भवती", "गर्भावस्था", "पेट में बच्चा", "बुजुर्ग मां", "बुजुर्ग पिता", 
        "बूढ़ी मां", "बूढ़े पिता", "बुजुर्ग", "बीमार और लाचार", "सांस नहीं आ रही", 
        "सीने में दर्द", "चक्कर आ रहे हैं", "बेहोश हो गए", "हालत बिगड़ रही है",
        "khoon beh raha", "zakhmi", "haddi toot", "garbhvati", "bujurg", "behoshi"
    ],
    "bn": [
        "আহত", "রক্তপাত", "হাড় ভেঙে", "মারাত্মক জখম", "অজ্ঞান", "হাসপাতাল", 
        "গর্ভবতী", "গর্ভস্থ", "বৃদ্ধ মা", "বৃদ্ধ বাবা", "বয়স্ক", "শ্বাসকষ্ট", "বুকের ব্যথা"
    ],
    "ta": [
        "காயம்", "ரத்தம் வழிகிறது", "எலும்பு முறிவு", "மயக்கம்", "மருத்துவமனை", 
        "கர்ப்பிணி", "கர்ப்பம்", "வயதான தாய்", "முதியவர்", "வயதான தந்தை", "மூச்சு திணறல்", "நெஞ்சு வலி"
    ],
    "te": [
        "గాయపడ్డారు", "రక్తం కారుతోంది", "ఎముక విరిగింది", "స్పృహ తప్పి", "ఆసుపత్రి", 
        "గర్భిణీ", "గర్భవతి", "వృద్ధురాలు", "వృద్ధ", "ముసలి", "ఊపిరాడటం లేదు", "ఛాతీ నొప్పి"
    ],
    "mr": [
        "जखमी", "रक्तस्त्राव", "हाड मोडले", "मारहाणीत दुखापत", "दवाखाना", "रुग्णालय", 
        "गरोदर", "गर्भवती", "वृद्ध आई", "म्हातारे वडील", "वृद्ध", "श्वास घेण्यास त्रास", "छातीत दुखणे"
    ]
}


class StressScoringEngine:
    """
    Transparent, auditable SVI (Stress Vulnerability Index) Engine.
    Formula:
      SVI = clamp(0, 100, BaseGrievanceWeight + CategoryScores + ContextBoosters + AcousticModifier)
    """

    @classmethod
    def evaluate_text(
        cls, 
        text: str, 
        channel: str = "portal", 
        audio_telemetry: Optional[Dict[str, Any]] = None,
        preferred_language: str = "en"
    ) -> Dict[str, Any]:
        """
        Calculates SVI score and produces explainable breakdown.
        """
        if not text or not text.strip():
            return cls._empty_assessment(channel)

        normalized_text = text.lower()
        
        detected_indicators = []
        category_scores: Dict[str, int] = {}
        total_raw_points = 0
        all_matched_phrases = []

        # 1. Rule-based Categorical Keyword & Phrase Scoring
        for cat_key, cat_data in INDICATOR_CATEGORIES.items():
            category_name = cat_data["name"]
            max_weight = cat_data["max_category_weight"]
            unit_weight = cat_data["unit_weight"]
            
            matched_in_category = []
            
            # Search across all language dictionaries
            for lang, word_list in cat_data["keywords"].items():
                for keyword in word_list:
                    pattern = r'(?:\b|_)' + re.escape(keyword.lower()) + r'(?:\b|_)' if lang in ['en', 'hi'] and keyword.isascii() else re.escape(keyword.lower())
                    if re.search(pattern, normalized_text):
                        if keyword not in matched_in_category:
                            matched_in_category.append(keyword)

            if matched_in_category:
                raw_cat_points = len(matched_in_category) * unit_weight
                effective_cat_score = min(max_weight, raw_cat_points)
                category_scores[cat_key] = effective_cat_score
                total_raw_points += effective_cat_score
                all_matched_phrases.extend(matched_in_category)

                detected_indicators.append({
                    "category_key": cat_key,
                    "category_name": category_name,
                    "severity": cat_data["severity"],
                    "matched_keywords": matched_in_category,
                    "points_contributed": effective_cat_score,
                    "max_possible_points": max_weight,
                    "description": cat_data["description"]
                })

        # Base grievance weight (only if actual distress/atrocity indicators are present)
        base_grievance_weight = 12 if detected_indicators else 0

        # 2. Context Boosters & Multi-Factor Compounding
        context_boost = 0
        reasons_for_boost = []
        context_boost_items = []

        if detected_indicators:
            if channel == "ivrs":
                context_boost += 3
                reasons_for_boost.append("IVRS Emergency Telephony Stream (+3 SVI)")
                context_boost_items.append({
                    "name": "IVRS Emergency Telephony Stream",
                    "tags": ["Real-time voice telephony intake", "High-priority intake channel"],
                    "points": 3,
                    "severity": "MODERATE"
                })

            # Check for critical lethal physical threats
            has_lethal_threat = any(ind["category_key"] == "LETHAL_DIRECT_THREAT" for ind in detected_indicators)
            if has_lethal_threat and len(detected_indicators) >= 3:
                lethal_boost = 10
                context_boost += lethal_boost
                reasons_for_boost.append(f"Imminent Lethal & Multi-Dimension Threat Escalator (+{lethal_boost} SVI)")
                context_boost_items.append({
                    "name": "Imminent Lethal & Multi-Dimension Threat Escalator",
                    "tags": ["Lethal physical threat", ">=3 compounding risk vectors active"],
                    "points": lethal_boost,
                    "severity": "CRITICAL"
                })

            # Compounding severe categories
            active_high_categories = sum(
                1 for ind in detected_indicators if ind["severity"] in ["CRITICAL", "HIGH"]
            )
            if active_high_categories >= 3:
                compound_boost = 6
                context_boost += compound_boost
                reasons_for_boost.append(f"Compounding Multi-Factor Critical Risks (+{compound_boost} SVI)")
                context_boost_items.append({
                    "name": "Compounding Multi-Factor Critical Risks",
                    "tags": [f"{active_high_categories} Critical/High severity categories co-occurring"],
                    "points": compound_boost,
                    "severity": "HIGH"
                })
            elif active_high_categories == 2:
                compound_boost = 3
                context_boost += compound_boost
                reasons_for_boost.append(f"Dual Critical Risk Dimensions (+{compound_boost} SVI)")
                context_boost_items.append({
                    "name": "Dual Critical Risk Dimensions",
                    "tags": ["2 Critical/High severity categories co-occurring"],
                    "points": compound_boost,
                    "severity": "MODERATE"
                })

        # 3. Acoustic / Voice-Biomarker Simulation (when IVRS / Voice is present)
        acoustic_modifier = 0
        acoustic_details = None
        ser_confidence = 0.62  # Reflects Indian Cross-Corpus SER benchmark 45-70%

        if audio_telemetry and detected_indicators:
            pitch_variance = audio_telemetry.get("pitch_variance_hz", 45)
            jitter = audio_telemetry.get("jitter_pct", 1.2)
            speech_rate_wpm = audio_telemetry.get("speech_rate_wpm", 130)
            pause_ratio = audio_telemetry.get("pause_ratio", 0.15)

            if pitch_variance > 75 or jitter > 2.2:
                acoustic_modifier += 4
            if speech_rate_wpm > 175 or speech_rate_wpm < 85:
                acoustic_modifier += 2
            if pause_ratio > 0.30:
                acoustic_modifier += 2

            ser_confidence = round(min(0.72, max(0.48, 0.55 + (jitter / 20.0))), 2)

            acoustic_details = {
                "pitch_variance_hz": pitch_variance,
                "jitter_pct": jitter,
                "speech_rate_wpm": speech_rate_wpm,
                "pause_ratio": pause_ratio,
                "acoustic_points_added": acoustic_modifier,
                "ser_confidence_rate": ser_confidence,
                "benchmark_note": "Acoustic stress calibrated to 45–70% SER Indian language confidence benchmark"
            }
        elif channel == "ivrs" and detected_indicators:
            acoustic_modifier = 3
            acoustic_details = {
                "pitch_variance_hz": 68.4,
                "jitter_pct": 1.85,
                "speech_rate_wpm": 162,
                "pause_ratio": 0.28,
                "acoustic_points_added": 3,
                "ser_confidence_rate": 0.64,
                "benchmark_note": "Simulated acoustic biomarker fusion from IVRS call stream"
            }

        # 4. Final SVI Calculation & Tier Mapping
        raw_final_score = base_grievance_weight + total_raw_points + context_boost + acoustic_modifier
        svi_score = max(0, min(100, int(round(raw_final_score))))

        tier_info = cls.resolve_tier_and_protocol(svi_score)
        tier = tier_info["risk_tier"]
        protocol = tier_info["protocol"]

        # Assemble fully transparent list of all contributing factors
        all_contributing_factors = []
        if detected_indicators:
            for ind in detected_indicators:
                all_contributing_factors.append({
                    "factor_type": "categorical_indicator",
                    "name": ind["category_name"],
                    "tags": ind["matched_keywords"],
                    "points": ind["points_contributed"],
                    "severity": ind["severity"]
                })

            if base_grievance_weight > 0:
                all_contributing_factors.append({
                    "factor_type": "base_weight",
                    "name": "Atrocity / Distress Intake Baseline",
                    "tags": ["Verified distress indicators detected", "Statutory intake baseline"],
                    "points": base_grievance_weight,
                    "severity": "MODERATE"
                })

            for b_item in context_boost_items:
                all_contributing_factors.append({
                    "factor_type": "context_boost",
                    "name": b_item["name"],
                    "tags": b_item["tags"],
                    "points": b_item["points"],
                    "severity": b_item["severity"]
                })

            if acoustic_modifier > 0:
                telemetry_tags = []
                if acoustic_details:
                    if acoustic_details.get("pitch_variance_hz", 0) > 75:
                        telemetry_tags.append(f"Pitch variance: {acoustic_details['pitch_variance_hz']}Hz")
                    if acoustic_details.get("jitter_pct", 0) > 2.0:
                        telemetry_tags.append(f"Jitter: {acoustic_details['jitter_pct']}%")
                    if acoustic_details.get("speech_rate_wpm", 0) > 175:
                        telemetry_tags.append(f"Speech rate: {acoustic_details['speech_rate_wpm']} WPM")
                    if acoustic_details.get("pause_ratio", 0) > 0.30:
                        telemetry_tags.append(f"Pause ratio: {round(acoustic_details['pause_ratio'] * 100)}%")
                if not telemetry_tags:
                    telemetry_tags = ["Voice stress telemetry", "Speech emotion biomarkers"]

                all_contributing_factors.append({
                    "factor_type": "acoustic_telemetry",
                    "name": "Acoustic Telemetry & Voice Stress Biomarkers",
                    "tags": telemetry_tags,
                    "points": acoustic_modifier,
                    "severity": "HIGH" if acoustic_modifier >= 5 else "MODERATE"
                })

            raw_sum = sum(f["points"] for f in all_contributing_factors)
            if raw_sum > svi_score:
                all_contributing_factors.append({
                    "factor_type": "normalization_cap",
                    "name": "SVI Scale Normalization Cap",
                    "tags": ["Upper ceiling clamp (0–100 scale)"],
                    "points": svi_score - raw_sum,
                    "severity": "NORMALIZATION"
                })

        # Psychological Crisis / Self-Harm Detection
        has_psychological_crisis = any(ind["category_key"] == "PSYCHOLOGICAL_CRISIS_SELF_HARM" for ind in detected_indicators)
        crisis_banner_message = (
            "MENTAL HEALTH CRISIS INDICATOR DETECTED — Immediate referral to KIRAN Mental Health Helpline (1800-599-0019, toll-free, 24/7) + Same-day Psychiatric/Counselling Consult Mandated"
            if has_psychological_crisis else None
        )

        # Medical Referral Indicators (Physical injury, assault harm, pregnancy, elderly frailty, acute health collapse)
        medical_matched_keywords = []
        for m_lang, m_words in MEDICAL_HARM_KEYWORDS.items():
            for m_kw in m_words:
                m_pat = r'(?:\b|_)' + re.escape(m_kw.lower()) + r'(?:\b|_)' if m_lang in ['en', 'hi'] and m_kw.isascii() else re.escape(m_kw.lower())
                if re.search(m_pat, normalized_text):
                    if m_kw not in medical_matched_keywords:
                        medical_matched_keywords.append(m_kw)

        medical_assistance_required = len(medical_matched_keywords) > 0
        medical_assistance_action = (
            "Medical Assistance Mandated: Nearest Primary Health Centre (PHC) / District Hospital Referral"
            if medical_assistance_required else None
        )

        return {
            "svi_score": svi_score,
            "risk_tier": tier,
            "tier_color": protocol["color"],
            "sla": protocol["sla"],
            "action_title": protocol["action_title"],
            "action_description": protocol["action_description"],
            "recommended_dispatch": protocol["recommended_dispatch"],
            "witness_protection_flag": protocol["witness_protection_flag"],
            "police_liaison_required": protocol["police_liaison_required"],
            "has_psychological_crisis": has_psychological_crisis,
            "crisis_banner_message": crisis_banner_message,
            "medical_assistance_required": medical_assistance_required,
            "medical_assistance_action": medical_assistance_action,
            "medical_matched_keywords": medical_matched_keywords,
            "detected_indicators": detected_indicators,
            "all_contributing_factors": all_contributing_factors,
            "total_indicators_found": len(detected_indicators),
            "matched_phrases": list(set(all_matched_phrases)),
            "scoring_breakdown": {
                "base_grievance_weight": base_grievance_weight,
                "indicator_points": total_raw_points,
                "context_boost": context_boost,
                "boost_reasons": reasons_for_boost,
                "acoustic_modifier": acoustic_modifier,
                "raw_total": raw_final_score,
                "bounded_svi": svi_score
            },
            "acoustic_telemetry": acoustic_details,
            "explainability_summary": cls._build_explainability_summary(
                svi_score, tier, detected_indicators, reasons_for_boost
            ),
            "human_in_the_loop_advisory": (
                "AI provides decision-support triage. Counsellor confirmation is required before dispatching emergency workflows."
            )
        }

    @classmethod
    def resolve_tier_and_protocol(cls, score: int) -> Dict[str, Any]:
        """Resolves risk tier and escalation protocol details for a given SVI score (0-100)."""
        bounded_score = max(0, min(100, int(round(score))))
        if bounded_score >= 79:
            tier = RiskTier.CRITICAL
        elif bounded_score >= 56:
            tier = RiskTier.HIGH
        elif bounded_score >= 31:
            tier = RiskTier.MODERATE
        else:
            tier = RiskTier.LOW

        protocol = EscalationProtocols.PROTOCOLS[tier]
        return {
            "svi_score": bounded_score,
            "risk_tier": tier,
            "tier_color": protocol["color"],
            "sla": protocol["sla"],
            "action_title": protocol["action_title"],
            "action_description": protocol["action_description"],
            "recommended_dispatch": protocol["recommended_dispatch"],
            "witness_protection_flag": protocol["witness_protection_flag"],
            "police_liaison_required": protocol["police_liaison_required"],
            "badge_class": protocol["badge_class"],
            "protocol": protocol
        }

    @staticmethod
    def _build_explainability_summary(
        score: int, 
        tier: str, 
        indicators: List[Dict[str, Any]], 
        boosts: List[str]
    ) -> str:
        """Generates clear, human-readable rationale for counsellors."""
        if not indicators:
            return "No critical distress or atrocity indicators identified. Grievance classified as Routine Administrative."
        
        cats = [ind["category_name"] for ind in indicators]
        cat_str = ", ".join(cats)
        
        reasons = f"Case scored SVI {score}/100 ({tier}) based on {len(indicators)} detected vulnerability dimension(s): {cat_str}."
        if boosts:
            reasons += f" Compounding risk factors: {'; '.join(boosts)}."
        return reasons

    @classmethod
    def _empty_assessment(cls, channel: str) -> Dict[str, Any]:
        protocol = EscalationProtocols.PROTOCOLS[RiskTier.LOW]
        return {
            "svi_score": 0,
            "risk_tier": RiskTier.LOW,
            "tier_color": protocol["color"],
            "sla": protocol["sla"],
            "action_title": protocol["action_title"],
            "action_description": protocol["action_description"],
            "recommended_dispatch": protocol["recommended_dispatch"],
            "witness_protection_flag": False,
            "police_liaison_required": False,
            "has_psychological_crisis": False,
            "crisis_banner_message": None,
            "medical_assistance_required": False,
            "medical_assistance_action": None,
            "medical_matched_keywords": [],
            "detected_indicators": [],
            "all_contributing_factors": [],
            "total_indicators_found": 0,
            "matched_phrases": [],
            "scoring_breakdown": {
                "base_grievance_weight": 0,
                "indicator_points": 0,
                "context_boost": 0,
                "boost_reasons": [],
                "acoustic_modifier": 0,
                "raw_total": 0,
                "bounded_svi": 0
            },
            "acoustic_telemetry": None,
            "explainability_summary": "Empty or neutral transcript submitted.",
            "human_in_the_loop_advisory": "AI provides decision-support triage."
        }
