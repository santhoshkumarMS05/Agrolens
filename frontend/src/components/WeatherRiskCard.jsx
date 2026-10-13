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

export const WeatherRiskCard = ({ selectedCrop = "Rice", activeLang = "en" }) => {
  const [weather, setWeather] = useState(BASELINE_WEATHER);
  const [locationName, setLocationName] = useState("Local Field Area");
  const [riskAssessment, setRiskAssessment] = useState(() =>
    evaluateDiseaseRisk(BASELINE_WEATHER, selectedCrop)
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWeatherData = async () => {
    setIsRefreshing(true);
    try {
      const coords = await getDeviceCoordinates();
      const weatherData = await fetchLiveWeather(coords.lat, coords.lon);
      if (weatherData) {
        setWeather(weatherData);
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
        </div>
      </div>

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
    </div>
  );
};

export default WeatherRiskCard;
