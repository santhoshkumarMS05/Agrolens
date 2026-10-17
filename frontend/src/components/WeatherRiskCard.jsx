import React, { useState, useEffect } from "react";
import {
  getDeviceCoordinates,
  fetchLiveWeather,
  reverseGeocodeCity,
  evaluateDiseaseRisk,
  TN_AGRICULTURAL_DISTRICTS,
  getDistrictCoords,
  getLocalizedDistrictName,
  DEFAULT_COORDS
} from "../utils/weatherDiseaseRisk";

const BASELINE_WEATHER = {
  temp: 28,
  humidity: 78,
  feelsLike: 31,
  precipitation: 0.0,
  windSpeed: 10,
  weatherCode: 1,
  timestamp: Date.now()
};

export const WeatherRiskCard = ({
  selectedCrop = "Rice",
  activeLang = "en",
  userDistrict = null,
  onDistrictChange = null,
  onWeatherUpdate = null
}) => {
  const [weather, setWeather] = useState(BASELINE_WEATHER);
  const [locationName, setLocationName] = useState(() => userDistrict || "Madurai");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedDistrictChoice, setSelectedDistrictChoice] = useState(() => userDistrict || "Madurai");
  const [customDistrictText, setCustomDistrictText] = useState("");
  const [isTypingCustom, setIsTypingCustom] = useState(false);
  const [locatingGps, setLocatingGps] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState(() =>
    evaluateDiseaseRisk(BASELINE_WEATHER, selectedCrop)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load weather for a given district or fallback coords
  const fetchWeatherForDistrict = async (districtName, customCoords = null) => {
    setIsRefreshing(true);
    try {
      let coords = customCoords;
      if (!coords && districtName) {
        coords = getDistrictCoords(districtName);
      }
      if (!coords) {
        coords = DEFAULT_COORDS;
      }

      const weatherData = await fetchLiveWeather(coords.lat, coords.lon);
      const effectiveDistrict = districtName || coords.name || "Local Field Area";

      if (weatherData) {
        const enrichedWeather = {
          ...weatherData,
          district: effectiveDistrict,
          city: effectiveDistrict
        };
        setWeather(enrichedWeather);
        setLocationName(effectiveDistrict);
        if (onWeatherUpdate) onWeatherUpdate(enrichedWeather);
        setRiskAssessment(evaluateDiseaseRisk(enrichedWeather, selectedCrop));
      }
    } catch (e) {
      console.warn("Weather load notice:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userDistrict && userDistrict.trim()) {
      setLocationName(userDistrict.trim());
      setSelectedDistrictChoice(userDistrict.trim());
      fetchWeatherForDistrict(userDistrict.trim());
    } else {
      // First-time or not-set: load fallback and suggest setting location
      fetchWeatherForDistrict("Madurai");
    }
  }, [userDistrict]);

  // Re-evaluate whenever selectedCrop changes
  useEffect(() => {
    if (weather) {
      setRiskAssessment(evaluateDiseaseRisk(weather, selectedCrop));
    }
  }, [selectedCrop, weather]);

  const handleApplyDistrict = (targetDistrict) => {
    const finalDistrict = (targetDistrict || (isTypingCustom ? customDistrictText : selectedDistrictChoice) || "").trim();
    if (!finalDistrict) return;

    setLocationName(finalDistrict);
    setShowLocationPicker(false);
    fetchWeatherForDistrict(finalDistrict);

    if (onDistrictChange) {
      onDistrictChange(finalDistrict);
    }
  };

  const handleGpsAutoDetect = async () => {
    setLocatingGps(true);
    try {
      const coords = await getDeviceCoordinates();
      let detectedName = "Local Field Area";
      try {
        const resolved = await reverseGeocodeCity(coords.lat, coords.lon);
        if (resolved && resolved !== "Local Agricultural Field" && resolved !== "Your Field") {
          detectedName = resolved;
        } else {
          detectedName = coords.name || "Madurai";
        }
      } catch {
        detectedName = coords.name || "Madurai";
      }

      setLocationName(detectedName);
      setSelectedDistrictChoice(detectedName);
      setShowLocationPicker(false);
      await fetchWeatherForDistrict(detectedName, coords);

      if (onDistrictChange) {
        onDistrictChange(detectedName);
      }
    } catch (err) {
      console.warn("GPS detection failed:", err);
    } finally {
      setLocatingGps(false);
    }
  };

  const { riskLevel, riskScore } = riskAssessment;

  // Language content selection
  const threatTitle =
    activeLang === "ta"
      ? riskAssessment.threatTa
      : activeLang === "hi"
      ? riskAssessment.threatHi
      : riskAssessment.keyThreat;

  const adviceText =
    activeLang === "ta"
      ? riskAssessment.adviceTa
      : activeLang === "hi"
      ? riskAssessment.adviceHi
      : riskAssessment.adviceEn;

  const badgeText =
    riskLevel === "HIGH"
      ? activeLang === "ta" ? "🚨 அதிக அபாயம்" : activeLang === "hi" ? "🚨 उच्च जोखिम" : "🚨 HIGH RISK"
      : riskLevel === "MODERATE"
      ? activeLang === "ta" ? "⚠️ மிதமான அபாயம்" : activeLang === "hi" ? "⚠️ मध्यम जोखिम" : "⚠️ MODERATE RISK"
      : activeLang === "ta" ? "✅ குறைந்த அபாயம்" : activeLang === "hi" ? "✅ कम जोखिम" : "✅ LOW RISK";

  const riskClass = `risk-${riskLevel.toLowerCase()}`;

  const isLocationUnset = !userDistrict || userDistrict.trim() === "";

  return (
    <div className={`weather-card ${riskClass}`}>
      {/* First-time / Unset Location Prompt Banner */}
      {isLocationUnset && !showLocationPicker && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px dashed #10b981",
            borderRadius: "10px",
            padding: "8px 12px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>📍</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--ink)" }}>
              {activeLang === "ta"
                ? "பண்ணை இடம் அமைக்கப்படவில்லை: துல்லியமான வானிலை மற்றும் நோய் எச்சரிக்கைகளுக்கு மாவட்டத்தை தேர்ந்தெடுக்கவும்."
                : activeLang === "hi"
                ? "खेत का स्थान सेट नहीं है: सटीक मौसम और रोग अलर्ट के लिए अपना जिला चुनें।"
                : "Farm location not set: Set your district for accurate microclimate weather & outbreak warnings."}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={handleGpsAutoDetect}
              disabled={locatingGps}
              style={{
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {locatingGps ? "⏳..." : "🎯 Auto GPS"}
            </button>
            <button
              type="button"
              onClick={() => setShowLocationPicker(true)}
              style={{
                background: "var(--paper-2)",
                color: "var(--ink)",
                border: "1px solid var(--line)",
                borderRadius: "6px",
                padding: "4px 10px",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ✏️ {activeLang === "ta" ? "தேர்ந்தெடு / தட்டச்சு" : activeLang === "hi" ? "चुनें / टाइप करें" : "Select / Type"}
            </button>
          </div>
        </div>
      )}

      {/* Inline Location Picker / Changer Drawer */}
      {showLocationPicker && (
        <div
          style={{
            background: "var(--paper-2)",
            border: "1.5px solid var(--green)",
            borderRadius: "12px",
            padding: "12px 14px",
            marginBottom: "14px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--ink)" }}>
              📍 {activeLang === "ta" ? "பண்ணை மாவட்டத்தைத் தேர்ந்தெடுக்கவும்" : activeLang === "hi" ? "कृषि जिला चुनें" : "Select or Type Farm District"}
            </span>
            <button
              type="button"
              onClick={() => setShowLocationPicker(false)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "var(--muted)" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            {!isTypingCustom ? (
              <select
                value={selectedDistrictChoice}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setIsTypingCustom(true);
                  } else {
                    setSelectedDistrictChoice(e.target.value);
                  }
                }}
                style={{
                  flex: 1,
                  minWidth: "180px",
                  padding: "7px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontSize: "0.86rem",
                  fontWeight: 600
                }}
              >
                {TN_AGRICULTURAL_DISTRICTS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} {activeLang === "ta" ? `(${d.ta})` : activeLang === "hi" ? `(${d.hi})` : ""}
                  </option>
                ))}
                <option value="__custom__">
                  ✏️ {activeLang === "ta" ? "+ வேறு மாவட்டம் தட்டச்சு செய்யவும்..." : activeLang === "hi" ? "+ अन्य जिला टाइप करें..." : "+ Other / Type Custom District..."}
                </option>
              </select>
            ) : (
              <div style={{ display: "flex", gap: "6px", flex: 1, minWidth: "180px" }}>
                <input
                  type="text"
                  placeholder={activeLang === "ta" ? "மாவட்ட பெயரை உள்ளிடவும்..." : activeLang === "hi" ? "जिले का नाम दर्ज करें..." : "Enter district name..."}
                  value={customDistrictText}
                  onChange={(e) => setCustomDistrictText(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--line)",
                    background: "var(--paper)",
                    color: "var(--ink)",
                    fontSize: "0.86rem"
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsTypingCustom(false)}
                  style={{
                    background: "var(--paper-2)",
                    border: "1px solid var(--line)",
                    borderRadius: "8px",
                    padding: "6px 8px",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    color: "var(--muted)"
                  }}
                >
                  ↩ List
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleApplyDistrict()}
              style={{
                background: "var(--green)",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              💾 {activeLang === "ta" ? "சேமி" : activeLang === "hi" ? "सहेजें" : "Save District"}
            </button>

            <button
              type="button"
              onClick={handleGpsAutoDetect}
              disabled={locatingGps}
              style={{
                background: "rgba(16, 185, 129, 0.12)",
                color: "var(--green)",
                border: "1px solid var(--green)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {locatingGps ? "⏳..." : "🎯 Auto GPS"}
            </button>
          </div>
        </div>
      )}

      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.45rem" }}>🌤️</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="location-title" style={{ fontWeight: 800 }}>
                {getLocalizedDistrictName(locationName, activeLang)}
              </span>
              <button
                type="button"
                onClick={() => setShowLocationPicker((prev) => !prev)}
                title="Change District"
                style={{
                  background: "rgba(0,0,0,0.06)",
                  border: "1px solid var(--line)",
                  borderRadius: "6px",
                  color: "var(--ink)",
                  cursor: "pointer",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  padding: "2px 7px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px"
                }}
              >
                <span>✏️</span>
                <span>{activeLang === "ta" ? "மாற்று" : activeLang === "hi" ? "बदलें" : "Change"}</span>
              </button>
              <button
                type="button"
                onClick={() => fetchWeatherForDistrict(locationName)}
                title="Refresh Weather"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  padding: "2px 4px",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                {isRefreshing ? "⏳" : "🔄"}
              </button>
            </div>
            <span className="location-sub">
              {activeLang === "ta"
                ? "நேரடி காலநிலை & நுண்ணிய நோய் பரவல் அபாய எச்சரிக்கை"
                : activeLang === "hi"
                ? "वास्तविक समय मौसम और सूक्ष्म-जलवायु रोग प्रकोप चेतावनी"
                : "Real-time Field Microclimate & Outbreak Alert"}
            </span>
          </div>
        </div>

        {/* Live Weather Metrics Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span className="metric-pill">
            🌡️ {weather.temp}°C
          </span>
          <span className="metric-pill">
            💧 {weather.humidity}% {activeLang === "ta" ? "ஈரப்பதம்" : activeLang === "hi" ? "नमी" : "Humidity"}
          </span>
          {weather.precipitation > 0 && (
            <span className="rain-pill">
              🌧️ {weather.precipitation} mm {activeLang === "ta" ? "மழை" : activeLang === "hi" ? "वर्षा" : "Rain"}
            </span>
          )}
          <span className="risk-badge">
            {badgeText} ({riskScore}%)
          </span>

          <button
            type="button"
            className="weather-dropdown-btn"
            id="weatherDropdownBtn"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            title={isExpanded ? "Collapse Details" : "View Full Details"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              background: isExpanded ? "var(--green)" : "var(--paper-2)",
              color: isExpanded ? "#ffffff" : "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "99px",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <span>
              {isExpanded
                ? (activeLang === "ta" ? "மறைக்க" : activeLang === "hi" ? "संक्षिप्त करें" : "Collapse")
                : (activeLang === "ta" ? "விவரங்கள்" : activeLang === "hi" ? "पूर्ण விவரம்" : "Details")}
            </span>
            <span style={{ fontSize: "0.72rem" }}>{isExpanded ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Outbreak Threat Box & 3-Day Forecast */}
      {isExpanded && (
        <div className="weather-expanded-drawer" style={{ marginTop: "12px" }}>
          {/* Outbreak Threat Box */}
          <div className="threat-box">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span style={{ fontSize: "1.25rem", marginTop: "1px" }}>
                {riskLevel === "HIGH" ? "🚨" : riskLevel === "MODERATE" ? "⚠️" : "🛡️"}
              </span>
              <div style={{ flex: 1 }}>
                <div className="threat-title">
                  {selectedCrop}: {threatTitle}
                </div>
                <div className="threat-advice">
                  {adviceText}
                </div>
              </div>
            </div>
          </div>

          {/* 3-Day Best Spray Windows Forecast */}
          {weather.sprayWindows && weather.sprayWindows.length > 0 && (
            <div className="spray-forecast-section" style={{ marginTop: "14px", borderTop: "1px dashed rgba(0,0,0,0.08)", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--green)" }}>
                  🌤️ {activeLang === "ta" ? "3 நாள் சிறந்த மருந்து தெளிப்பு நேரம்" : activeLang === "hi" ? "3-दिवसीय सटीक छिड़काव समय खिड़की" : "3-Day Best Spray Window Forecast"}
                </span>
                <span style={{ fontSize: "0.74rem", opacity: 0.8, color: "var(--muted)" }}>
                  {activeLang === "ta" ? "குறைந்த காற்று & உலர் இலை நேரம்" : activeLang === "hi" ? "शांत हवा एवं अनुकूल समय" : "Low Drift & Rainfast Hours"}
                </span>
              </div>

              <div className="spray-windows-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {weather.sprayWindows.map((win, idx) => {
                  const dayTitle = activeLang === "ta" ? win.dayTa : activeLang === "hi" ? win.dayHi : win.day;
                  const noteText = activeLang === "ta" ? win.noteTa : activeLang === "hi" ? win.noteHi : win.noteEn;
                  const isOptimal = win.status === "OPTIMAL";
                  const isUnsafe = win.status === "UNSAFE";
                  const badgeBg = isOptimal ? "#dcfce7" : isUnsafe ? "#fee2e2" : "#fef9c3";
                  const badgeColor = isOptimal ? "#15803d" : isUnsafe ? "#b91c1c" : "#854d0e";
                  const badgeLabel = isOptimal
                    ? (activeLang === "ta" ? "🟢 சிறந்த நேரம்" : activeLang === "hi" ? "🟢 सर्वोत्तम खिड़की" : "🟢 Optimal Window")
                    : isUnsafe
                    ? (activeLang === "ta" ? "🔴 தவிர்க்கவும்" : activeLang === "hi" ? "🔴 छिड़काव न करें" : "🔴 Unsafe Window")
                    : (activeLang === "ta" ? "🟡 மிதமானது" : activeLang === "hi" ? "🟡 मध्यम खिड़की" : "🟡 Fair Window");

                  return (
                    <div key={idx} className="spray-window-card" style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "10px", padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--fg)" }}>{dayTitle}</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "99px", background: badgeBg, color: badgeColor }}>
                          {badgeLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--green-l)", marginBottom: "4px" }}>
                        ⏰ {win.timeWindow}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--muted)", marginBottom: "4px" }}>
                        💨 {win.wind} km/h &bull; 🌧️ {win.rainPop}% Rain &bull; 💧 {win.humidity}% Hum
                      </div>
                      <div style={{ fontSize: "0.76rem", lineHeight: 1.35, color: "var(--fg)", opacity: 0.9 }}>
                        {noteText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeatherRiskCard;
