import React, { useState, useEffect } from "react";
import {
  getDeviceCoordinates,
  fetchLiveWeather,
  reverseGeocodeCity,
  evaluateDiseaseRisk
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

export const WeatherRiskCard = ({ selectedCrop = "Rice", activeLang = "en", onWeatherUpdate = null }) => {
  const [weather, setWeather] = useState(BASELINE_WEATHER);
  const [locationName, setLocationName] = useState("Local Field Area");
  const [riskAssessment, setRiskAssessment] = useState(() =>
    evaluateDiseaseRisk(BASELINE_WEATHER, selectedCrop)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadWeatherData = async () => {
    setIsRefreshing(true);
    try {
      const coords = await getDeviceCoordinates();
      const weatherData = await fetchLiveWeather(coords.lat, coords.lon);
      if (weatherData) {
        setWeather(weatherData);
        if (onWeatherUpdate) onWeatherUpdate(weatherData);
        setRiskAssessment(evaluateDiseaseRisk(weatherData, selectedCrop));
      }
      try {
        const cityName = await reverseGeocodeCity(coords.lat, coords.lon);
        if (cityName) setLocationName(cityName);
      } catch {}
    } catch (e) {
      console.warn("Weather refresh notice:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, []);

  // Re-evaluate whenever selectedCrop changes
  useEffect(() => {
    if (weather) {
      setRiskAssessment(evaluateDiseaseRisk(weather, selectedCrop));
    }
  }, [selectedCrop, weather]);

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

  return (
    <div className={`weather-card ${riskClass}`}>
      {/* Top Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.45rem" }}>🌤️</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="location-title">{locationName}</span>
              <button
                onClick={loadWeatherData}
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
