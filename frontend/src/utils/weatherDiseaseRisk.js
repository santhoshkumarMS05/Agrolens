/**
 * AgroLens Microclimate Disease Risk Engine
 * Powered by Open-Meteo (Free Open Meteorological Science API)
 * Correlates real-time localized temperature, relative humidity, and rainfall
 * with FAO & ICAR plant pathology disease incubation thresholds.
 */

// Local storage cache key and duration (20 minutes)
const CACHE_KEY = "agrolens_weather_cache";
const CACHE_TTL_MS = 20 * 60 * 1000;

// Default fallback coordinates (Agricultural hub: Madurai / South India)
export const DEFAULT_COORDS = { lat: 9.9252, lon: 78.1198, name: "Madurai / South Zone" };

/**
 * Fetch current device coordinates with fallback
 */
export async function getDeviceCoordinates() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: parseFloat(pos.coords.latitude.toFixed(4)),
          lon: parseFloat(pos.coords.longitude.toFixed(4)),
          name: "Local Field Location"
        });
      },
      () => {
        // Fallback gracefully on permission denial
        resolve(DEFAULT_COORDS);
      },
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}

/**
 * Fetch live weather from Open-Meteo API with caching
 */
export async function fetchLiveWeather(lat, lon) {
  const cacheKey = `${CACHE_KEY}_${lat}_${lon}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed.data;
      }
    }
  } catch (e) {
    // ignore localStorage errors
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&forecast_days=1&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API request failed");
    const json = await res.json();
    const current = json.current;

    const data = {
      temp: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      feelsLike: Math.round(current.apparent_temperature),
      precipitation: current.precipitation || 0,
      windSpeed: Math.round(current.wind_speed_10m || 0),
      weatherCode: current.weather_code,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
    } catch {}

    return data;
  } catch (err) {
    console.warn("Weather API notice, using standard field baseline:", err);
    return {
      temp: 28,
      humidity: 82,
      feelsLike: 31,
      precipitation: 0.2,
      windSpeed: 12,
      weatherCode: 2,
      timestamp: Date.now(),
      isFallback: true
    };
  }
}

/**
 * Reverse geocode city/district name using Open-Meteo Geocoding
 */
export async function reverseGeocodeCity(lat, lon) {
  try {
    // Open-Meteo reverse or fast Nominatim
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { "Accept-Language": "en" } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const place = addr.city || addr.town || addr.county || addr.state_district || addr.state || "Your Field";
      return place;
    }
  } catch {}
  return "Local Agricultural Field";
}

/**
 * Agronomic Disease Risk Evaluator
 * Computes fungal, bacterial spore germination and vector pressure
 * based on Temperature, Relative Humidity, and Precipitation.
 */
export function evaluateDiseaseRisk(weather, cropName = "Rice") {
  const { temp, humidity, precipitation } = weather;
  const crop = (cropName || "").toLowerCase();

  let riskLevel = "LOW"; // 'LOW' | 'MODERATE' | 'HIGH'
  let riskScore = 30;
  let keyThreat = "";
  let threatTa = "";
  let threatHi = "";
  let adviceEn = "";
  let adviceTa = "";
  let adviceHi = "";

  // 1. High-humidity fungal spore explosion window: Humidity >= 82% & Temp 18°C-30°C
  const isHighMoisture = humidity >= 80;
  const isWet = precipitation > 0 || humidity >= 88;
  const isWarmHumid = temp >= 20 && temp <= 32 && isHighMoisture;

  if (crop.includes("potato") || crop.includes("tomato")) {
    if (humidity >= 85 && temp >= 12 && temp <= 25) {
      riskLevel = "HIGH";
      riskScore = 92;
      keyThreat = "Late Blight (Phytophthora) Spore Outbreak";
      threatTa = "லேட் பிளைட் (அழுகல் நோய்) பூஞ்சான் பெருக்கம்";
      threatHi = "पछेती झुलसा (लेट ब्लाइट) फंगल प्रकोप";
      adviceEn = "High risk of rapid foliar blighting. Avoid sprinkler irrigation. Spray preventive copper hydroxide or Trichoderma viride.";
      adviceTa = "இலை கருகல் நோய் பரவும் அபாயம் அதிகம். தெளிப்பு பாசனத்தை தவிர்க்கவும். காப்பர் ஆக்சிகுளோரைடு அல்லது டிரைக்கோடெர்மா தெளிக்கவும்.";
      adviceHi = "पत्ती झुलसने का गंभीर खतरा। छिड़काव सिंचाई से बचें। कॉपर ऑक्सीक्लोराइड या ट्राइकोडर्मा का निवारक छिड़काव करें।";
    } else if (humidity >= 70 && temp >= 15 && temp <= 28) {
      riskLevel = "MODERATE";
      riskScore = 65;
      keyThreat = "Early Blight / Foliar Spot Watch";
      threatTa = "ஆரம்ப இலைப்புள்ளி நோய் முன்னெச்சரிக்கை";
      threatHi = "अगेती झुलसा / पत्ती धब्बा चेतावनी";
      adviceEn = "Moderate moisture promotes lower canopy spots. Ensure row ventilation and prune yellowing bottom leaves.";
      adviceTa = "கீழ் இலைகளில் புள்ளி நோய் வர வாய்ப்புள்ளது. செடிகளுக்கு இடையே காற்றோட்டம் இருப்பதை உறுதிசெய்து பழைய இலைகளை அகற்றவும்.";
      adviceHi = "निचली पत्तियों पर धब्बे संभव हैं। पंक्तियों में हवा का संचार रखें और पुरानी पत्तियों की छंटाई करें।";
    }
  } else if (crop.includes("rice")) {
    if (humidity >= 85 && temp >= 22 && temp <= 30) {
      riskLevel = isWet ? "HIGH" : "MODERATE";
      riskScore = isWet ? 90 : 72;
      keyThreat = "Rice Blast & Bacterial Leaf Blight Risk";
      threatTa = "நெல் குலை நோய் & பாக்டீரியா இலைக்கருகல் அபாயம்";
      threatHi = "धान का झुलसा रोग (ब्लास्ट) और जीवाणु झुलसा";
      adviceEn = "Continuous high humidity triggers blast spores. Avoid excessive nitrogen top-dressing. Keep water levels monitored.";
      adviceTa = "தொடர் காற்றில் ஈரப்பதம் குலை நோயை அதிகரிக்கும். தழைச்சத்து (யூரியா) அதிக அளவு இடுவதைத் தவிர்க்கவும்.";
      adviceHi = "उच्च आर्द्रता से ब्लास्ट रोग पनप सकता है। अत्यधिक यूरिया (नाइट्रोजन) के प्रयोग से बचें।";
    }
  } else if (crop.includes("cotton")) {
    if (isWarmHumid) {
      riskLevel = "MODERATE";
      riskScore = 68;
      keyThreat = "Bacterial Blight / Angular Leaf Spot & Boll Rot";
      threatTa = "பருத்தி கோண இலைப்புள்ளி & காய் அழுகல்";
      threatHi = "कपास का कोणीय पत्ती धब्बा और गूलर सड़न";
      adviceEn = "Warm humid canopy favors bacterial entry through leaf stomata. Inspect leaf undersides for water-soaked spots.";
      adviceTa = "வெப்பமும் ஈரப்பதமும் பாக்டீரியா பரவலைத் தூண்டும். இலையின் அடிப்பகுதியில் நீர் ஊறிய புள்ளிகள் உள்ளதா என கண்காணிக்கவும்.";
      adviceHi = "गर्म और आर्द्र मौसम से बैक्टीरिया फैलता है। पत्तियों की निचली सतह पर पानीदार धब्बों की जांच करें।";
    }
  } else if (crop.includes("groundnut")) {
    if (humidity >= 80 && temp >= 22 && temp <= 31) {
      riskLevel = "HIGH";
      riskScore = 85;
      keyThreat = "Tikka Leaf Spot (Cercospora) & Rust Alert";
      threatTa = "டிக்கா இலைப்புள்ளி & துரு நோய் முன்னெச்சரிக்கை";
      threatHi = "टिक्का पत्ती धब्बा और रतुआ रोग चेतावनी";
      adviceEn = "Warm humid mornings trigger rapid Tikka spot sporulation. Apply Mancozeb or neem-seed kernel extract (NSKE 5%).";
      adviceTa = "காலை நேர ஈரப்பதம் டிக்கா நோயை உண்டாக்கும். மேன்கோசெப் அல்லது வேப்பங்கொட்டை கரைசல் (5%) தெளிக்கவும்.";
      adviceHi = "सुबह की नमी से टिक्का रोग फैलता है। मैंकोजेब या 5% नीम अर्क का छिड़काव करें।";
    }
  } else if (crop.includes("sugarcane")) {
    if (humidity >= 80 && temp >= 26) {
      riskLevel = "MODERATE";
      riskScore = 62;
      keyThreat = "Sugarcane Brown Rust & Red Rot Humidity Stress";
      threatTa = "கரும்பு செவ்வழுகல் & பழுப்பு துரு நோய்";
      threatHi = "गन्ना लाल सड़न और भूरा रतुआ रोग";
      adviceEn = "Moist microclimate promotes fungal pustules on upper leaves. Ensure field drainage to eliminate stagnant water.";
      adviceTa = "ஈரப்பதம் கரும்பு இலைகளில் துரு நோயைத் தோற்றுவிக்கும். வயலில் தேங்கிய தண்ணீரை வடிகட்டவும்.";
      adviceHi = "नमी से पत्तियों पर रतुआ बढ़ सकता है। खेत में जलभराव न होने दें, निकासी सुनिश्चित करें।";
    }
  }

  // General fallback evaluation if crop didn't match specific threshold
  if (riskLevel === "LOW") {
    if (humidity >= 85 && temp >= 20 && temp <= 32) {
      riskLevel = "MODERATE";
      riskScore = 65;
      keyThreat = "Fungal Foliar Spot & Mold Incubation";
      threatTa = "பூஞ்சான் இலைப்புள்ளி & சாம்பல் நோய் அபாயம்";
      threatHi = "फंगल पत्ती धब्बा और फफूंद प्रसार";
      adviceEn = "Elevated relative humidity creates a favorable window for foliar fungi. Monitor leaves closely during early mornings.";
      adviceTa = "அதிக ஈரப்பதம் இலை பூஞ்சான்களை உருவாக்கும். அதிகாலையில் இலைகளைத் தீவிரமாகக் கண்காணிக்கவும்.";
      adviceHi = "हवा में उच्च नमी से फंगल संक्रमण का खतरा रहता है। सुबह के समय पत्तियों की नियमित जांच करें।";
    } else {
      riskScore = Math.max(15, Math.min(45, Math.round((humidity / 100) * 45)));
      keyThreat = "Optimal Microclimate — Low Disease Pressure";
      threatTa = "சாதகமான சூழல் — குறைந்த நோய் அழுத்தம்";
      threatHi = "अनुकूल मौसम — बीमारी का कम जोखिम";
      adviceEn = "Current temperature and dry leaf surface keep fungal spore germination low. Safe for routine field operations.";
      adviceTa = "தற்போதைய வெப்பநிலை மற்றும் உலர்ந்த இலைப்பரப்பு நோய் பரவலைக் கட்டுப்படுத்துகிறது. வழக்கமான பணிகளைத் தொடரலாம்.";
      adviceHi = "वर्तमान मौसम और शुष्क पत्तियां रोग को फैलने से रोकती हैं। नियमित कृषि कार्य सुरक्षित हैं।";
    }
  }

  return {
    riskLevel,
    riskScore,
    keyThreat,
    threatTa,
    threatHi,
    adviceEn,
    adviceTa,
    adviceHi,
    weather
  };
}
