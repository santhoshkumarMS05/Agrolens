/**
 * AgroLens — Full Offline Doctor Engine & Agronomic Knowledge Base
 * Provides instant, verified client-side agronomic calculations,
 * disease remedies, and spray dilution charts with zero internet connectivity.
 */

// Standard agronomic dilution rules (ICAR & TNAU standards)
export const OFFLINE_DISEASE_DB = {
  "Rice Blast": {
    crop: "Rice",
    disease: "Rice Blast (Pyricularia oryzae)",
    chemical: "Tricyclazole 75% WP @ 0.6 g/L OR Azoxystrobin 25% SC @ 1 ml/L",
    dosePerLiter: 0.6,
    doseUnit: "g",
    organic: "Spray 5% Neem Seed Kernel Extract (NSKE) or Pseudomonas fluorescens @ 2.5 g/L",
    symptoms: "Spindle-shaped lesions with grayish centers and brown borders on leaves and neck nodes.",
    prevention: "Avoid excessive urea/nitrogen fertilizer; split nitrogen into 3 doses. Maintain field aeration.",
    ta: {
      disease: "நெல் குலை நோய் (Rice Blast)",
      chemical: "ட்ரைசைக்ளசோல் 75% WP @ 0.6 கிராம்/லிட்டர் அல்லது அசோக்ஸிஸ்ட்ரோபின் 25% SC @ 1 மி.லி/லிட்டர்",
      organic: "5% வேப்பங்கொட்டை சாறு (NSKE) அல்லது சூடோமோனாஸ் ஃபுளோரசன்ஸ் @ 2.5 கிராம்/லிட்டர் தெளிக்கவும்",
      symptoms: "இலைகளில் சுழல் வடிவ சாம்பல் நிற மையத்துடன் பழுப்பு நிற ஓரங்கள் கொண்ட புள்ளிகள் தோன்றும்.",
      prevention: "அதிகப்படியான யூரியா இடுவதை தவிர்க்கவும்; தழைச்சத்தை 3 பிரிவாக பிரித்து இடவும்."
    },
    hi: {
      disease: "धान का झुलसा रोग (Rice Blast)",
      chemical: "ट्राइसाइक्लाजोल 75% WP @ 0.6 ग्राम/लीटर अथवा एजोक्सीस्ट्रोबिन 25% SC @ 1 मिली/लीटर",
      organic: "5% नीम बीज अर्क (NSKE) या स्यूडोमोनास फ्लोरेसेंस @ 2.5 ग्राम/लीटर का छिड़काव करें",
      symptoms: "पत्तियों पर आंख के आकार के धब्बे, जिनका केंद्र राख जैसा और किनारे भूरे होते हैं।",
      prevention: "अधिक यूरिया डालने से बचें; नाइट्रोजन को 3 बार में विभाजित करके दें।"
    }
  },
  "Brown Spot": {
    crop: "Rice",
    disease: "Brown Spot (Bipolaris oryzae)",
    chemical: "Mancozeb 75% WP @ 2.5 g/L OR Propiconazole 25% EC @ 1 ml/L",
    dosePerLiter: 2.5,
    doseUnit: "g",
    organic: "Spray 5% NSKE or foliar application of Potassium silicate @ 2 g/L",
    symptoms: "Oval or circular brown lesions with yellow halos on leaf blades.",
    prevention: "Apply balanced potassium (MOP) to correct potash deficiency; treat seeds with Thiram before sowing.",
    ta: {
      disease: "நெல் பழுப்பு இலைப்புள்ளி நோய் (Brown Spot)",
      chemical: "மேன்கோசெப் 75% WP @ 2.5 கிராம்/லிட்டர் அல்லது புரோபிகோனசோல் 25% EC @ 1 மி.லி/லிட்டர்",
      organic: "5% வேப்பங்கொட்டை சாறு அல்லது பொட்டாசியம் சிலிகேட் @ 2 கிராம்/லிட்டர் தெளிக்கவும்",
      symptoms: "இலைகளில் மஞ்சள் நிற வளையத்துடன் கூடிய பழுப்பு நிற வட்டப் புள்ளிகள் தோன்றும்.",
      prevention: "பொட்டாஷ் உரத்தை சரியான அளவில் இடவும்; விதை நேர்த்தி செய்து விதைக்கவும்."
    },
    hi: {
      disease: "धान का भूरा धब्बा रोग (Brown Spot)",
      chemical: "मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर अथवा प्रोपिकोनाजोल 25% EC @ 1 मिली/लीटर",
      organic: "5% नीम का अर्क या पोटेशियम सिलिकेट @ 2 ग्राम/लीटर का छिड़काव करें",
      symptoms: "पत्तियों पर पीले घेरे वाले भूरे रंग के गोल या अंडाकार धब्बे।",
      prevention: "पोटाश की कमी दूर करें; बुवाई से पहले बीजोपचार अवश्य करें।"
    }
  },
  "Tomato Late Blight": {
    crop: "Tomato",
    disease: "Late Blight (Phytophthora infestans)",
    chemical: "Cymoxanil 8% + Mancozeb 64% WP @ 2 g/L OR Metalaxyl 8% + Mancozeb 64% WP @ 2.5 g/L",
    dosePerLiter: 2.0,
    doseUnit: "g",
    organic: "Copper Hydroxide 77% WP @ 2 g/L or Bordeaux mixture 1%",
    symptoms: "Water-soaked irregular dark green/brown patches on leaves with white fuzzy mold on leaf undersides in high humidity.",
    prevention: "Provide proper plant spacing, stake plants off soil, and avoid sprinkler irrigation that wets leaves.",
    ta: {
      disease: "தக்காளி பின் பருவ கருகல் நோய் (Late Blight)",
      chemical: "சைமோக்சனில் 8% + மேன்கோசெப் 64% WP @ 2 கிராம்/லிட்டர் அல்லது மெட்டலாக்சில் 8% + மேன்கோசெப் @ 2.5 கிராம்/லிட்டர்",
      organic: "காப்பர் ஹைட்ராக்சைடு 77% WP @ 2 கிராம்/லிட்டர் அல்லது 1% போர்டோ கலவை தெளிக்கவும்",
      symptoms: "இலைகளில் நீர் ஊறிய கரும்பச்சை/பழுப்பு நிற புள்ளிகள் மற்றும் இலைகளின் அடியில் வெண்பூஞ்சாணம் தோன்றும்.",
      prevention: "செடிகளுக்கு போதிய இடைவெளி விட்டு நடவும்; சொட்டுநீர்ப் பாசனம் மூலம் நீர் பாய்ச்சவும்."
    },
    hi: {
      disease: "टमाटर का पछेती झुलसा (Late Blight)",
      chemical: "साइमोक्सानिल 8% + मैंकोजेब 64% WP @ 2 ग्राम/लीटर या मेटालेक्सिल @ 2.5 ग्राम/लीटर",
      organic: "कॉपर हाइड्रोक्साइड @ 2 ग्राम/लीटर अथवा 1% बोर्डो मिश्रण का छिड़काव करें",
      symptoms: "पत्तियों पर पानी से भीगे भूरे-काले धब्बे और निचली सतह पर सफेद फफूंद।",
      prevention: "पौधों के बीच उचित दूरी रखें और पत्तियों को ज्यादा गीला न होने दें।"
    }
  },
  "Tomato Early Blight": {
    crop: "Tomato",
    disease: "Early Blight (Alternaria solani)",
    chemical: "Chlorothalonil 75% WP @ 2 g/L OR Mancozeb 75% WP @ 2.5 g/L",
    dosePerLiter: 2.5,
    doseUnit: "g",
    organic: "Trichoderma viride @ 4 g/L or 5% Neem Seed Kernel Extract",
    symptoms: "Concentric target-board rings on older lower leaves with yellow halos.",
    prevention: "Prune lower leaves touching soil; mulch around plants and practice crop rotation.",
    ta: {
      disease: "தக்காளி முன் பருவ கருகல் நோய் (Early Blight)",
      chemical: "குளோரோதலோனில் 75% WP @ 2 கிராம்/லிட்டர் அல்லது மேன்கோசெப் 75% WP @ 2.5 கிராம்/லிட்டர்",
      organic: "டிரைக்கோடெர்மா விரிடி @ 4 கிராம்/லிட்டர் அல்லது 5% வேப்பங்கொட்டை சாறு",
      symptoms: "கீழ் இலைகளில் வட்ட வளையங்கள் கொண்ட பழுப்பு நிற புள்ளிகள் தோன்றும்.",
      prevention: "மண்ணில் படும் அடி இலைகளை கவாத்து செய்யவும்; பயிர் சுழற்சி முறையை பின்பற்றவும்."
    },
    hi: {
      disease: "टमाटर का अगेती झुलसा (Early Blight)",
      chemical: "क्लोरोथैलोनिल 75% WP @ 2 ग्राम/लीटर या मैंकोजेब 75% WP @ 2.5 ग्राम/लीटर",
      organic: "ट्राइकोडर्मा विरिडी @ 4 ग्राम/लीटर अथवा 5% नीम का अर्क",
      symptoms: "पुरानी निचली पत्तियों पर गोल छल्लों वाले भूरे धब्बे।",
      prevention: "जमीन से छूने वाली निचली पत्तियों को काट दें और फसल चक्र अपनाएं।"
    }
  },
  "Coconut Leaf Rot": {
    crop: "Coconut",
    disease: "Coconut Leaf Rot (Colletotrichum / Fusarium)",
    chemical: "Contaf (Hexaconazole 5% EC) @ 2 ml/300 ml water per palm OR Mancozeb @ 5 g/palm",
    dosePerLiter: 2.0,
    doseUnit: "g",
    organic: "Pour 1% Bordeaux mixture or Trichoderma viride enriched compost in the crown basin",
    symptoms: "Blackening, rotting and shriveling of distal ends of leaflets in spindle leaves.",
    prevention: "Cut and burn all rotten portions of spindle leaves before pouring fungicide.",
    ta: {
      disease: "தென்னை இலை அழுகல் நோய் (Coconut Leaf Rot)",
      chemical: "ஹெக்ஸாகோனசோல் 5% EC @ 2 மி.லி / 300 மி.லி நீர் ஒரு மரத்திற்கு அல்லது மேன்கோசெப் @ 5 கிராம்/மரம்",
      organic: "1% போர்டோ கலவை அல்லது டிரைக்கோடெர்மா விரிடி கலந்த மக்கிய உரத்தை குருத்தில் இடவும்",
      symptoms: "குருத்து மற்றும் இளம் இலைகளின் நுனிகள் கறுத்து அழுகி சுருங்கிப் போகும்.",
      prevention: "மருந்து இடுவதற்கு முன் அழுகிய பகுதிகளை முழுமையாக வெட்டி எரிக்கவும்."
    },
    hi: {
      disease: "नारियल पत्ती सड़न रोग (Leaf Rot)",
      chemical: "हेक्साकोनाजोल 5% EC @ 2 मिली अथवा मैंकोजेब 5 ग्राम प्रति पेड़",
      organic: "1% बोर्डो मिश्रण का घोल मुकुट में डालें",
      symptoms: "नई पत्तियों और टहनियों के सिरों का काला पड़ना और सड़ना।",
      prevention: "दवा डालने से पहले सड़े हुए हिस्से को काटकर नष्ट करें।"
    }
  }
};

/**
 * Calculates offline spray volume and tank dilution
 */
export function calculateOfflineDosage(crop, condition, acreage = 1.0, tankCapacity = 16) {
  const normCrop = (crop || "").trim();
  const normCond = (condition || "").trim();

  // Search DB entry
  let matchKey = Object.keys(OFFLINE_DISEASE_DB).find(
    k => normCond.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(normCond.toLowerCase())
  );
  if (!matchKey) {
    matchKey = Object.keys(OFFLINE_DISEASE_DB).find(
      k => OFFLINE_DISEASE_DB[k].crop.toLowerCase() === normCrop.toLowerCase()
    );
  }

  const entry = matchKey ? OFFLINE_DISEASE_DB[matchKey] : OFFLINE_DISEASE_DB["Brown Spot"];

  const area = parseFloat(acreage) || 1.0;
  const tankCap = parseInt(tankCapacity, 10) || 16;
  const waterPerAcre = 150; // Standard foliar spray rate
  const totalWater = Math.round(area * waterPerAcre);
  const tanksNeeded = Math.ceil(totalWater / tankCap);
  const dosePerTank = Math.round(entry.dosePerLiter * tankCap * 10) / 10;
  const totalChemical = Math.round(entry.dosePerLiter * totalWater);

  return {
    entry,
    area,
    tankCap,
    totalWater,
    tanksNeeded,
    dosePerTank,
    totalChemical,
    unit: entry.doseUnit || "g"
  };
}

/**
 * Generates an instant offline expert reply formatted in Markdown
 */
export function generateOfflineDoctorResponse(userMessage, crop, condition, acreage = 1.0, tankCapacity = 16, lang = "en") {
  let msg = userMessage;
  let cCrop = crop;
  let cCond = condition;
  let cAcre = acreage;
  let cTank = tankCapacity;
  let cLang = lang;

  if (typeof userMessage === "object" && userMessage !== null) {
    msg = userMessage.userPrompt || userMessage.message || userMessage.userMessage || "";
    cCrop = userMessage.crop || cCrop;
    cCond = userMessage.disease || userMessage.condition || cCond;
    cAcre = userMessage.acreage !== undefined ? userMessage.acreage : cAcre;
    cTank = (userMessage.tankCapacity || userMessage.tank_capacity) ?? cTank;
    cLang = userMessage.lang || userMessage.language || cLang;
  }

  crop = cCrop;
  condition = cCond;
  acreage = cAcre;
  tankCapacity = cTank;
  lang = cLang;

  const calc = calculateOfflineDosage(crop, condition, acreage, tankCapacity);
  const e = calc.entry;
  const msgLower = (typeof msg === "string" ? msg : "").toLowerCase();

  // 1. Organic remedy prompt
  if (msgLower.includes("organic") || msgLower.includes("இயற்கை") || msgLower.includes("जैविक") || msgLower.includes("eco")) {
    if (lang === "ta") {
      return `### 🌿 இயற்கை & அங்கக பயிர் பாதுகாப்பு தீர்வு (Offline)
**பயிர்:** ${crop} | **பாதிப்பு:** ${e.ta ? e.ta.disease : condition}

* **பரிந்துரைக்கப்படும் இயற்கை முறை:** ${e.ta ? e.ta.organic : e.organic}
* **வேப்பங்கொட்டை கரைசல் தயாரிப்பு (5% NSKE):** 50 கிராம் உலர்ந்த வேப்பங்கொட்டை பொடியை 1 லிட்டர் நீரில் இரவு முழுவதும் ஊறவைத்து, வடிகட்டி, 1 லிட்டருக்கு 1 மி.லி காதி சோப்பு சேர்த்து தெளிக்கவும்.
* **பயன்:** நன்மை செய்யும் பூச்சிகளை அழிக்காமல், பூஞ்சாண வித்திகளை அழித்து செடியின் நோய் எதிர்ப்பு சக்தியை அதிகரிக்கிறது.
* **தெளிக்கும் நேரம்:** அதிகாலை 6–9 மணி அல்லது மாலை 4–6 மணி.

*(இணைப்பு இல்லாத போதும் இந்நடவடிக்கை வழிகாட்டி கிடைக்கிறது)*`;
    }
    if (lang === "hi") {
      return `### 🌿 जैविक एवं प्राकृतिक फसल सुरक्षा उपाय (Offline)
**फसल:** ${crop} | **रोग:** ${e.hi ? e.hi.disease : condition}

* **जैविक उपचार:** ${e.hi ? e.hi.organic : e.organic}
* **नीम अर्क (5% NSKE):** 50 ग्राम नीम बीज पाउडर को 1 लीटर पानी में रात भर भिगोएं, छानकर प्रति लीटर 1 मिली साबुन घोल मिलाकर छिड़कें।
* **लाभ:** मित्र कीटों को नुकसान पहुंचाए बिना फफूंद को नष्ट करता है और पौधों की रोग प्रतिरोधक क्षमता बढ़ाता है।
* **समय:** सुबह 6–9 बजे अथवा शाम 4–6 बजे।

*(इंटरनेट कनेक्शन के बिना यह ऑफलाइन मार्गदर्शन उपलब्ध है)*`;
    }
    return `### 🌿 Eco-Friendly Organic Remedy (Offline Mode)
**Target Crop:** ${crop} | **Diagnosed Condition:** ${e.disease}

* **Recommended Organic Treatment:** ${e.organic}
* **5% NSKE Preparation:** Soak 50g crushed neem seeds in 1 Liter water overnight, filter through muslin cloth, add 1 ml liquid soap sticker per liter, and spray immediately.
* **Foliar Bio-agents:** Spray *Trichoderma viride* or *Pseudomonas fluorescens* @ 2.5 g/L early morning.
* **Agronomic Benefit:** Restores natural foliar biome without chemical residue or beneficial insect harm.

*(Loaded securely from AgroLens Offline Agronomy Cache)*`;
  }

  // 2. Weather & Spray feasibility prompt
  if (msgLower.includes("weather") || msgLower.includes("வானிலை") || msgLower.includes("मौसम") || msgLower.includes("rain") || msgLower.includes("spray")) {
    if (lang === "ta") {
      return `### 🌦️ தெளிப்பு பாதுகாப்பு & வானிலை வழிகாட்டி (Offline)
* **வானிலை விதி 1 (மழை பாதுகாப்பு):** தெளித்த 4 மணி நேரத்திற்குள் மழை பெய்யும் வாய்ப்பு இருந்தால் மருந்து தெளிக்க வேண்டாம்.
* **வானிலை விதி 2 (காற்று விரயம்):** காற்றின் வேகம் 15 கி.மீ/மணிக்கு அதிகமாக இருந்தால் மருந்து அடித்துச் செல்லப்பட்டு வீணாகும். காற்று உங்கள் முதுகுக்குப் பின்னால் இருக்கும்படி தெளிக்கவும்.
* **வானிலை விதி 3 (வெப்பம்):** நண்பகல் உச்சி வெயிலில் (11:00 AM – 3:00 PM) தெளிக்கக் கூடாது; இலைகள் கருக வாய்ப்புண்டு.
* **சிறந்த நேரம்:** அதிகாலை 6:30 – 9:00 AM அல்லது மாலை 4:30 – 6:30 PM.`;
    }
    if (lang === "hi") {
      return `### 🌦️ छिड़काव सुरक्षा एवं मौसम परामर्श (Offline)
* **वर्षा सुरक्षा:** यदि अगले 4 घंटों में बारिश की संभावना हो तो छिड़काव स्थगित करें।
* **हवा की गति:** हवा 15 किमी/घंटा से अधिक होने पर दवा उड़कर नष्ट हो जाती है। हवा की दिशा में ही नोजल रखें।
* **धूप से बचाव:** दोपहर (11 AM - 3 PM) की तेज धूप में छिड़काव न करें; इससे पत्तियां जल सकती हैं।
* **सर्वोत्तम समय:** सुबह 6:30 - 9:00 बजे अथवा शाम 4:30 - 6:30 बजे।`;
    }
    return `### 🌦️ Weather & Spray Feasibility Guide (Offline Mode)
* **Rainfastness Rule:** Do not spray if rainfall is expected within 3–4 hours; chemicals will wash away into soil.
* **Wind Drift Barrier:** Never spray in wind speeds exceeding 15 km/h. Keep nozzle low and walk with wind at your back.
* **Heat Stress Rule:** Avoid spraying during scorching midday hours (11:00 AM – 3:00 PM) to prevent leaf phototoxicity.
* **Best Window:** Early morning (6:30 AM – 9:00 AM) or late afternoon (4:30 PM – 6:30 PM).`;
  }

  // 3. Prevention & Next season prompt
  if (msgLower.includes("prevent") || msgLower.includes("தடுப்பது") || msgLower.includes("बचाव") || msgLower.includes("season") || msgLower.includes("பருவம்")) {
    if (lang === "ta") {
      return `### 🛡️ அடுத்த பருவத்தில் நோய் வராமல் தடுக்கும் வழிகள் (Offline)
**பயிர்:** ${crop} | **நிலை:** ${e.ta ? e.ta.disease : condition}

* **விதை நேர்த்தி:** விதைப்பதற்கு முன் திராம் அல்லது சூடோமோனாஸ் @ 10 கிராம்/கிலோ விதை நேர்த்தி செய்யவும்.
* **பயிர் சுழற்சி:** ஒரே பயிரைத் தொடர்ந்து பயிரிடாமல் பயறு வகைகள் அல்லது மாற்றுப் பயிர்களை சுழற்சி முறையில் பயிரிடவும்.
* **வயல் சுகாதாரம்:** அறுவடைக்கு பின் பாதிக்கப்பட்ட பயிர் கழிவுகளை வயலில் இருந்து அகற்றி எரிக்கவும்.
* **உர சமநிலை:** தழைச்சத்து (யூரியா) அதிகமாக இடுவதை தவிர்த்து, தகுந்த பொட்டாஷ் மற்றும் சாம்பல் சத்து இடவும்.`;
    }
    if (lang === "hi") {
      return `### 🛡️ अगली फसल में रोग से बचाव के नियम (Offline)
**फसल:** ${crop} | **रोग:** ${e.hi ? e.hi.disease : condition}

* **बीजोपचार:** बुवाई से पहले बीजों को थीरम या ट्राइकोडर्मा @ 10 ग्राम/किग्रा से उपचारित करें।
* **फसल चक्र:** लगातार एक ही फसल न लगाएं; दलहनी फसलों के साथ फसल चक्र अपनाएं।
* **खेत स्वच्छता:** कटाई के बाद संक्रमित फसल अवशेषों को इकट्ठा करके नष्ट कर दें।
* **संतुलित पोषण:** अत्यधिक यूरिया के प्रयोग से बचें और पर्याप्त पोटाश डालें।`;
    }
    return `### 🛡️ Prevention Protocol for Next Season (Offline Mode)
**Target Crop:** ${crop} | **Condition:** ${e.disease}

* **Certified Seed Treatment:** Treat seeds with *Trichoderma viride* @ 10 g/kg or Carbendazim @ 2 g/kg before sowing.
* **Crop Rotation:** Rotate with non-host legume or pulse crops to break fungal soil resting spores.
* **Sanitation & Stubble Management:** Deep summer plow the field and remove infected crop residues.
* **Balanced Nutrition:** Avoid excessive early nitrogen that produces succulent, susceptible tissue. Ensure adequate potassium (MOP).`;
  }

  // 4. Default: Precision spray dosage calculation
  if (lang === "ta") {
    return `### 🧪 துல்லிய மருந்து தெளிப்பு & டேங்க் கலவை அளவீடு (Offline)
**கண்டறியப்பட்ட பாதிப்பு:** ${e.ta ? e.ta.disease : condition}
**நிலப் பரப்பு:** ${calc.area} ஏக்கர் | **தெளிப்பான்:** ${calc.tankCap} லிட்டர் கைத்தெளிப்பான்

#### 1. பரிந்துரைக்கப்படும் பூஞ்சாணக் கொல்லி / மருந்து:
* **பரிந்துரை:** ${e.ta ? e.ta.chemical : e.chemical}
* **அளவீட்டு விகிதம்:** 1 லிட்டர் நீருக்கு ${e.dosePerLiter} ${calc.unit}

#### 2. வயல் நீர் மற்றும் டேங்க் கணக்கீடு:
* **மொத்த வயல் நீர் தேவை:** **${calc.totalWater} லிட்டர்** (${calc.area} ஏக்கருக்கு)
* **தேவைப்படும் டேங்குகள்:** **${calc.tanksNeeded} டேங்குகள்** (${calc.tankCap} லிட்டர் அளவு)
* **ஒரு டேங்கிற்கு போட வேண்டிய மருந்து:** **${calc.dosePerTank} ${calc.unit}**
* **மொத்த வயலுக்கு தேவையான மொத்த மருந்து:** **${calc.totalChemical} ${calc.unit}**

#### 3. பாதுகாப்பான தெளிப்பு செயல்முறை:
1. ஒரு சிறு வாளியில் சிறிதளவு தண்ணீர் எடுத்து **${calc.dosePerTank} ${calc.unit}** மருந்தை கட்டி இல்லாமல் கரைக்கவும்.
2. அதை தெளிப்பான் டேங்கில் ஊற்றி மீதமுள்ள நீரை நிரப்பவும்.
3. கையுறை மற்றும் முகக்கவசம் அணிந்து காலையில் தெளிக்கவும்.`;
  }

  if (lang === "hi") {
    return `### 🧪 सटीक कीटनाशक खुराक एवं स्प्रे टंकी गणना (Offline)
**पहचाना गया रोग:** ${e.hi ? e.hi.disease : condition}
**खेत का रकबा:** ${calc.area} एकड़ | **स्प्रे टंकी:** ${calc.tankCap} लीटर नैपसैक टंकी

#### 1. अनुशंसित कीटनाशक / फफूंदनाशक:
* **दवा:** ${e.hi ? e.hi.chemical : e.chemical}
* **खुराक दर:** 1 लीटर पानी में ${e.dosePerLiter} ${calc.unit}

#### 2. पानी एवं टंकी घोल गणना:
* **खेत के लिए कुल पानी:** **${calc.totalWater} लीटर** (${calc.area} एकड़)
* **आवश्यक टंकियों की संख्या:** **${calc.tanksNeeded} टंकियां** (${calc.tankCap} लीटर क्षमता)
* **प्रत्येक टंकी में दवा की मात्रा:** **${calc.dosePerTank} ${calc.unit}**
* **खेत हेतु कुल दवा मात्रा:** **${calc.totalChemical} ${calc.unit}**

#### 3. घोल तैयार करने की सही विधि:
1. एक बाल्टी में थोड़ा पानी लेकर **${calc.dosePerTank} ${calc.unit}** दवा को अच्छी तरह घोलें।
2. फिर इसे स्प्रेयर टंकी में डालकर बाकी पानी भर लें।
3. दस्ताने व मास्क पहनकर सुबह या शाम के समय छिड़काव करें।`;
  }

  return `### 🧪 Precision Field Dosage & Spray Tank Dilution (Offline Mode)
**Crop:** ${crop} | **Diagnosed Condition:** ${e.disease}
**Field Size:** ${calc.area} Acre(s) | **Sprayer Tank:** ${calc.tankCap}-Liter Knapsack

#### 1. Recommended Treatment Protocol:
* **Active Chemical:** ${e.chemical}
* **Dilution Rate:** ${e.dosePerLiter} ${calc.unit} per Liter of water

#### 2. Precision Field Calculations:
* **Total Water Volume Needed:** **${calc.totalWater} Liters** (at 150 L/Acre foliar standard)
* **Spray Tanks to Prepare:** **${calc.tanksNeeded} Tanks** (${calc.tankCap} L each)
* **Exact Chemical per Tank:** **${calc.dosePerTank} ${calc.unit}**
* **Total Field Chemical Needed:** **${calc.totalChemical} ${calc.unit}**

#### 3. Mixing & Application Steps:
1. In a clean plastic bucket, pre-mix **${calc.dosePerTank} ${calc.unit}** of chemical with 2 Liters of water into a smooth slurry.
2. Pour slurry through the sprayer tank filter basket, then top up with clean water to ${calc.tankCap} Liters.
3. Wear gloves and mask. Spray with the wind at your back early in the morning.`;
}
