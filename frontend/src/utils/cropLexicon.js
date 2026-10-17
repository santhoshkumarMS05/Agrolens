/**
 * Comprehensive Trilingual Crop Lexicon (English, Tamil, Hindi)
 * Automatically normalizes spoken and typed crops in any language
 * and provides instant language switching for UI and AI models.
 */

export const CROP_LEXICON = [
  // ── Core Trained Crops ──────────────────────────────────────────
  { id: "cotton", en: "Cotton", ta: "பருத்தி", hi: "कपास", aliases: ["cotton", "பருத்தி", "கபாஸ்", "कपास"] },
  { id: "rice", en: "Rice / Paddy", ta: "நெல்", hi: "चावल / धान", aliases: ["rice", "paddy", "நெல்", "அரிசி", "धान", "चावल"] },
  { id: "groundnut", en: "Groundnut", ta: "நிலக்கடலை", hi: "मूंगफली", aliases: ["groundnut", "peanut", "நிலக்கடலை", "வேர்க்கடலை", "மணிலா", "मूंगफली"] },
  { id: "sugarcane", en: "Sugarcane", ta: "கரும்பு", hi: "गन्ना", aliases: ["sugarcane", "கரும்பு", "गन्ना"] },
  { id: "corn", en: "Corn / Maize", ta: "மக்காச்சோளம்", hi: "मक्का", aliases: ["corn", "maize", "மக்காச்சோளம்", "மக்கா சோளம்", "மக்கச்சோளம்", "मक्का", "भुट्टा"] },
  { id: "cassava", en: "Cassava (Tapioca)", ta: "மரவள்ளிக்கிழங்கு", hi: "कसावा", aliases: ["cassava", "tapioca", "மரவள்ளிக்கிழங்கு", "மரவள்ளி", "குச்சிவள்ளி", "कसावा", "टैपिओका"] },
  { id: "sorghum", en: "Sorghum", ta: "சோளம்", hi: "ज्वार", aliases: ["sorghum", "jowar", "சோளம்", "வெள்ளை சோளம்", "ज्वार"] },
  { id: "coconut", en: "Coconut", ta: "தென்னை", hi: "नारियल", aliases: ["coconut", "தென்னை", "தேங்காய்", "தென்னை மரம்", "नारियल"] },
  { id: "tomato", en: "Tomato", ta: "தக்காளி", hi: "टमाटर", aliases: ["tomato", "தக்காளி", "நாட்டு தக்காளி", "टमाटर"] },
  { id: "potato", en: "Potato", ta: "உருளைக்கிழங்கு", hi: "आलू", aliases: ["potato", "உருளைக்கிழங்கு", "உருளை", "ஆलू"] },
  { id: "coffee", en: "Coffee", ta: "காபி", hi: "कॉफ़ी", aliases: ["coffee", "காபி", "காப்பி", "कॉफ़ी", "कॉफी"] },

  // ── High-frequency Vegetables ───────────────────────────────────
  { id: "brinjal", en: "Brinjal (Eggplant)", ta: "கத்திரிக்காய்", hi: "बैंगन", aliases: ["brinjal", "eggplant", "aubergine", "கத்திரிக்காய்", "கத்திரி", "बैंगन"] },
  { id: "okra", en: "Okra (Ladies Finger)", ta: "வெண்டைக்காய்", hi: "भिंडी", aliases: ["okra", "ladies finger", "bhendi", "bhindi", "வெண்டைக்காய்", "வெண்டை", "भिंडी"] },
  { id: "chilli", en: "Chilli / Pepper", ta: "மிளகாய்", hi: "मिर्च", aliases: ["chilli", "chili", "hot pepper", "pepper", "மிளகாய்", "பச்சை மிளகாய்", "मिर्च", "हरी मिर्च"] },
  { id: "onion", en: "Onion", ta: "வெங்காயம்", hi: "प्याज", aliases: ["onion", "வெங்காயம்", "சின்ன வெங்காயம்", "பெரிய வெங்காயம்", "प्याज"] },
  { id: "garlic", en: "Garlic", ta: "பூண்டு", hi: "लहसुन", aliases: ["garlic", "பூண்டு", "வெள்ளைப்பூண்டு", "लहसुन"] },
  { id: "ginger", en: "Ginger", ta: "இஞ்சி", hi: "अदरक", aliases: ["ginger", "இஞ்சி", "अदरक"] },
  { id: "turmeric", en: "Turmeric", ta: "மஞ்சள்", hi: "हल्दी", aliases: ["turmeric", "மஞ்சள்", "விரலி மஞ்சள்", "हल्दी"] },
  { id: "cabbage", en: "Cabbage", ta: "முட்டைக்கோஸ்", hi: "पत्तागोभी", aliases: ["cabbage", "முட்டைக்கோஸ்", "கோஸ்", "பந்துகோஸ்", "पत्तागोभी", "गोभी"] },
  { id: "cauliflower", en: "Cauliflower", ta: "காலிஃபிளவர்", hi: "फूलगोभी", aliases: ["cauliflower", "காலிஃபிளவர்", "காலிப்ளவர்", "பூக்கோசு", "फूलगोभी"] },
  { id: "carrot", en: "Carrot", ta: "கேரட்", hi: "गाजर", aliases: ["carrot", "கேரட்", "गाजर"] },
  { id: "beetroot", en: "Beetroot", ta: "பீட்ரூட்", hi: "चुकंदर", aliases: ["beetroot", "பீட்ரூட்", "चुकंदर"] },
  { id: "radish", en: "Radish", ta: "முள்ளங்கி", hi: "मूली", aliases: ["radish", "முள்ளங்கி", "मूली"] },
  { id: "drumstick", en: "Drumstick (Moringa)", ta: "முருங்கை", hi: "सहजन", aliases: ["drumstick", "moringa", "முருங்கை", "முருங்கைக்காய்", "सहजन"] },
  { id: "bittergourd", en: "Bitter Gourd", ta: "பாகற்காய்", hi: "करेला", aliases: ["bitter gourd", "bittergourd", "பாகற்காய்", "பாவக்காய்", "करेला"] },
  { id: "bottlegourd", en: "Bottle Gourd", ta: "சுரைக்காய்", hi: "लौकी", aliases: ["bottle gourd", "bottlegourd", "சுரைக்காய்", "சுரை", "लौकी"] },
  { id: "snakegourd", en: "Snake Gourd", ta: "புடலங்காய்", hi: "चिचिंडा", aliases: ["snake gourd", "snakegourd", "புடலங்காய்", "புடலை", "चिचिंडा"] },
  { id: "ridgegourd", en: "Ridge Gourd", ta: "பீர்க்கங்காய்", hi: "तोरई", aliases: ["ridge gourd", "ridgegourd", "பீர்க்கங்காய்", "பீர்க்கு", "तोरई"] },
  { id: "ashgourd", en: "Ash Gourd", ta: "சாம்பல் பூசணி", hi: "पेठा", aliases: ["ash gourd", "ashgourd", "சாம்பல் பூசணி", "வெள்ளை பூசணி", "पेठा"] },
  { id: "pumpkin", en: "Pumpkin", ta: "பூசணிக்காய்", hi: "कद्दू", aliases: ["pumpkin", "பூசணிக்காய்", "மஞ்சள் பூசணி", "பரங்கிக்காய்", "कद्दू"] },
  { id: "cucumber", en: "Cucumber", ta: "வெள்ளரிக்காய்", hi: "खीरा", aliases: ["cucumber", "வெள்ளரிக்காய்", "வெள்ளரி", "खीरा"] },
  { id: "beans", en: "French Beans", ta: "பீன்ஸ்", hi: "बीन्स", aliases: ["beans", "french beans", "பீன்ஸ்", "बीन्स"] },
  { id: "broadbeans", en: "Broad Beans", ta: "அவரைக்காய்", hi: "सेम", aliases: ["broad beans", "field beans", "அவரைக்காய்", "அவரை", "सेम"] },
  { id: "clusterbeans", en: "Cluster Beans", ta: "கொத்தவரங்காய்", hi: "ग्वार फली", aliases: ["cluster beans", "கொத்தவரங்காய்", "கொத்தவரை", "ग्वार फली"] },
  { id: "yam", en: "Elephant Yam", ta: "சேனைக்கிழங்கு", hi: "जिमीकंद", aliases: ["elephant yam", "yam", "சேனைக்கிழங்கு", "சேனை", "जिमीकंद"] },
  { id: "taro", en: "Taro (Colocasia)", ta: "சேப்பங்கிழங்கு", hi: "अरबी", aliases: ["taro", "colocasia", "சேப்பங்கிழங்கு", "சேப்பங்கிழங்கு", "अरबी"] },
  { id: "sweetpotato", en: "Sweet Potato", ta: "சர்க்கரைவள்ளிக்கிழங்கு", hi: "शकरकंद", aliases: ["sweet potato", "சர்க்கரைவள்ளிக்கிழங்கு", "வள்ளிக்கிழங்கு", "शकरकंद"] },

  // ── Fruits & Plantation ─────────────────────────────────────────
  { id: "banana", en: "Banana", ta: "வாழை", hi: "केला", aliases: ["banana", "plantain", "வாழை", "வாழை மரம்", "வாழைக்காய்", "வாழைப்பழம்", "केला"] },
  { id: "mango", en: "Mango", ta: "மாம்பழம்", hi: "आम", aliases: ["mango", "மாம்பழம்", "மாங்காய்", "மா", "आम"] },
  { id: "papaya", en: "Papaya", ta: "பப்பாளி", hi: "पपीता", aliases: ["papaya", "பப்பாளி", "பப்பாளி மரம்", "பப்பாளிக்காய்", "पपीता"] },
  { id: "guava", en: "Guava", ta: "கொய்யா", hi: "अमरूद", aliases: ["guava", "கொய்யா", "கொய்யாப்பழம்", "கொய்யாக்காய்", "अमरूद"] },
  { id: "watermelon", en: "Watermelon", ta: "தர்பூசணி", hi: "तरबूज", aliases: ["watermelon", "தர்பூசணி", "தர்பூசணி பழம்", "தர்பூஸ்", "तरबूज"] },
  { id: "muskmelon", en: "Muskmelon", ta: "முலாம் பழம்", hi: "खरबूजा", aliases: ["muskmelon", "முலாம் பழம்", "கிருணி", "खरबूजा"] },
  { id: "pomegranate", en: "Pomegranate", ta: "மாதுளை", hi: "अनार", aliases: ["pomegranate", "மாதுளை", "மாதுளம் பழம்", "अनार"] },
  { id: "lemon", en: "Lemon / Lime", ta: "எலுமிச்சை", hi: "नींबू", aliases: ["lemon", "lime", "எலுமிச்சை", "எலுமிச்சம்பழம்", "நீம்பு", "नींबू"] },
  { id: "orange", en: "Orange / Citrus", ta: "ஆரஞ்சு", hi: "संतरा", aliases: ["orange", "citrus", "ஆரஞ்சு", "ஆரஞ்சு பழம்", "संतरा"] },
  { id: "grapes", en: "Grapes", ta: "திராட்சை", hi: "अंगूर", aliases: ["grapes", "grape", "திராட்சை", "கொடிமுந்திரி", "अंगूर"] },
  { id: "apple", en: "Apple", ta: "ஆப்பிள்", hi: "सेब", aliases: ["apple", "ஆப்பிள்", "सेब"] },
  { id: "sapota", en: "Sapota (Chiku)", ta: "சப்போட்டா", hi: "चीकू", aliases: ["sapota", "chiku", "chikoo", "சப்போட்டா", "चीकू"] },
  { id: "jackfruit", en: "Jackfruit", ta: "பலாப்பழம்", hi: "कटहल", aliases: ["jackfruit", "பலாப்பழம்", "பலா", "कटहल"] },
  { id: "pineapple", en: "Pineapple", ta: "அன்னாசி", hi: "अनानास", aliases: ["pineapple", "அன்னாசி", "அன்னாசிப்பழம்", "अनानास"] },
  { id: "custardapple", en: "Custard Apple", ta: "சீத்தாப்பழம்", hi: "शरीफा", aliases: ["custard apple", "சீத்தாப்பழம்", "சீத்தா", "शरीफा"] },
  { id: "amla", en: "Amla (Gooseberry)", ta: "நெல்லிக்காய்", hi: "आंवला", aliases: ["amla", "gooseberry", "நெல்லிக்காய்", "நெல்லி", "आंवला"] },
  { id: "tea", en: "Tea", ta: "தேயிலை", hi: "चाय", aliases: ["tea", "தேயிலை", "தேயிலை தோட்டம்", "चाय"] },
  { id: "cardamom", en: "Cardamom", ta: "ஏலக்காய்", hi: "इलायची", aliases: ["cardamom", "ஏலக்காய்", "ஏலம்", "इलायची"] },
  { id: "blackpepper", en: "Black Pepper", ta: "மிளகு", hi: "काली मिर्च", aliases: ["black pepper", "pepper", "மிளகு", "கருமிளகு", "काली मिर्च"] },
  { id: "coriander", en: "Coriander", ta: "கொத்தமல்லி", hi: "धनिया", aliases: ["coriander", "கொத்தமல்லி", "கொத்துமல்லி", "மல்லி", "धनिया"] },
  { id: "mint", en: "Mint", ta: "புதினா", hi: "पुदीना", aliases: ["mint", "pudina", "புதினா", "पुदीना"] },
  { id: "curryleaf", en: "Curry Leaves", ta: "கருவேப்பிலை", hi: "कढ़ी पत्ता", aliases: ["curry leaves", "curry leaf", "கருவேப்பிலை", "கறிவேப்பிலை", "कढ़ी पत्ता"] },
  { id: "betel", en: "Betel Leaf", ta: "வெற்றிலை", hi: "पान", aliases: ["betel", "betel leaf", "வெற்றிலை", "पान"] },
  { id: "arecanut", en: "Arecanut", ta: "பாக்கு", hi: "सुपारी", aliases: ["arecanut", "betel nut", "பாக்கு", "பாக்கு மரம்", "सुपारी"] },

  // ── Pulses, Millets & Oilseeds ───────────────────────────────────
  { id: "wheat", en: "Wheat", ta: "கோதுமை", hi: "गेहूं", aliases: ["wheat", "கோதுமை", "गेहूं"] },
  { id: "bajra", en: "Pearl Millet (Bajra)", ta: "கம்பு", hi: "बाजरा", aliases: ["bajra", "pearl millet", "கம்பு", "बाजरा"] },
  { id: "ragi", en: "Finger Millet (Ragi)", ta: "கேழ்வரகு", hi: "रागी", aliases: ["ragi", "finger millet", "கேழ்வரகு", "கேப்பை", "रागी"] },
  { id: "spinach", en: "Spinach / Greens", ta: "கீரை", hi: "पालक", aliases: ["spinach", "greens", "கீரை", "பசலைக் கீரை", "அரைக்கீரை", "சிறுகீரை", "पालक"] },
  { id: "fenugreek", en: "Fenugreek", ta: "வெந்தயம்", hi: "मेथी", aliases: ["fenugreek", "வெந்தயம்", "வெந்தயக்கீரை", "मेथी"] },
  { id: "greengram", en: "Green Gram (Moong)", ta: "பாசிப்பயறு", hi: "मूंग", aliases: ["green gram", "moong", "பாசிப்பயறு", "பச்சைப்பயறு", "பயறு", "मूंग"] },
  { id: "blackgram", en: "Black Gram (Urad)", ta: "உளுந்து", hi: "उड़द", aliases: ["black gram", "urad", "உளுந்து", "உளுந்தம்பயறு", "उड़द"] },
  { id: "bengalgram", en: "Bengal Gram (Chickpea)", ta: "கொண்டைக்கடலை", hi: "चना", aliases: ["bengal gram", "chickpea", "chana", "கொண்டைக்கடலை", "மூக்குக்கடலை", "चना"] },
  { id: "redgram", en: "Red Gram (Pigeon Pea)", ta: "துவரை", hi: "अरहर / तुअर", aliases: ["red gram", "pigeon pea", "toor", "tur", "துவரை", "துவரம்பருப்பு", "अरहर", "तुअर"] },
  { id: "horsegram", en: "Horse Gram", ta: "கொள்ளு", hi: "कुलथी", aliases: ["horse gram", "கொள்ளு", "कुलथी"] },
  { id: "cowpea", en: "Cowpea", ta: "தட்டப்பயறு", hi: "लोबिया", aliases: ["cowpea", "தட்டப்பயறு", "காராமணி", "लोबिया"] },
  { id: "sesame", en: "Sesame (Til)", ta: "எள்ளு", hi: "तिल", aliases: ["sesame", "gingelly", "til", "எள்ளு", "எள்", "நல்லெண்ணெய்", "तिल"] },
  { id: "mustard", en: "Mustard", ta: "கடுகு", hi: "सरसों", aliases: ["mustard", "கடுகு", "सरसों"] },
  { id: "sunflower", en: "Sunflower", ta: "சூரியகாந்தி", hi: "सूरजमुखी", aliases: ["sunflower", "சூரியகாந்தி", "सूरजमुखी"] },
  { id: "soybean", en: "Soybean", ta: "சோயாபீன்", hi: "सोयाबीन", aliases: ["soybean", "soya", "சோயாபீன்", "சோயா", "सोयाबीन"] },
  { id: "castor", en: "Castor", ta: "ஆமணக்கு", hi: "अरंडी", aliases: ["castor", "ஆமணக்கு", "கொட்டைமுத்து", "अरंडी"] }
];

/**
 * Searches and returns the matched crop lexicon entry for any input string.
 */
export function resolveCropEntry(nameOrInput) {
  if (!nameOrInput || typeof nameOrInput !== "string") return null;
  const clean = nameOrInput.trim().toLowerCase();
  if (!clean || clean === "others") return null;

  for (const item of CROP_LEXICON) {
    if (
      item.id.toLowerCase() === clean ||
      item.en.toLowerCase() === clean ||
      item.ta.toLowerCase() === clean ||
      item.hi.toLowerCase() === clean
    ) {
      return item;
    }
    for (const a of item.aliases) {
      const aLower = a.toLowerCase();
      if (clean === aLower || clean.includes(aLower) || aLower.includes(clean)) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Returns the localized crop name in the target language ('en', 'ta', 'hi').
 * If unmapped, gracefully returns the original input.
 */
export function getCropNameInLang(cropNameOrObj, lang = "en") {
  if (!cropNameOrObj) return "Crop";
  if (typeof cropNameOrObj === "object") {
    return cropNameOrObj[lang] || cropNameOrObj.en || cropNameOrObj.ta || cropNameOrObj.hi || "Crop";
  }
  const entry = resolveCropEntry(cropNameOrObj);
  if (entry) {
    return entry[lang] || entry.en;
  }
  return cropNameOrObj;
}

/**
 * Normalizes raw diagnosis string into the target language.
 * E.g., 'கத்திரிக்காய் · Suspected Condition' -> 'Brinjal (Eggplant) · Suspected Condition' in English.
 */
export function formatLocalizedCondition(rawClass, lang = "en") {
  if (!rawClass) return "";
  const str = String(rawClass).trim();

  // Handle "Crop · Condition" pattern
  if (str.includes("·")) {
    const [cPart, ...rest] = str.split("·");
    const cropName = cPart.trim();
    const condName = rest.join("·").trim();

    const localizedCrop = getCropNameInLang(cropName, lang);

    // Localize common condition tags
    let localizedCond = condName;
    const condLower = condName.toLowerCase();
    if (condLower.includes("suspected condition")) {
      localizedCond = lang === "ta" ? "சாத்தியமான பாதிப்பு" : lang === "hi" ? "संभावित स्थिति" : "Suspected Condition";
    } else if (condLower.includes("healthy")) {
      localizedCond = lang === "ta" ? "ஆரோக்கியமானது" : lang === "hi" ? "स्वस्थ" : "Healthy";
    }

    return `${localizedCrop} · ${localizedCond}`;
  }

  // Handle standard model class like 'Earlyleafspot Potato' or 'Healthy Coffee'
  const knownOverrides = {
    "Earlyleafspot Potato": { en: "Potato · Early Blight", ta: "உருளைக்கிழங்கு · ஆரம்ப கருகல் நோய்", hi: "आलू · अगेती झुलसा" },
    "Lateleafspot Potato": { en: "Potato · Late Blight", ta: "உருளைக்கிழங்கு · பின் கருகல் நோய்", hi: "आलू · पछेती झुलसा" },
    "Healthy Potato": { en: "Potato · Healthy", ta: "உருளைக்கிழங்கு · ஆரோக்கியமானது", hi: "आलू · स्वस्थ" },
    "Leafrust Coffee": { en: "Coffee · Leaf Rust", ta: "காபி · இலை துரு நோய்", hi: "कॉफ़ी · पत्ती का रतुआ" },
    "Healthy Coffee": { en: "Coffee · Healthy", ta: "காபி · ஆரோக்கியமானது", hi: "कॉफ़ी · स्वस्थ" }
  };

  if (knownOverrides[str]) {
    return knownOverrides[str][lang] || knownOverrides[str].en;
  }

  return str;
}
