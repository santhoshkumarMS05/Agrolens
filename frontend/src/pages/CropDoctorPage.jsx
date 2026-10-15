import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import ThemeToggle from "../components/ThemeToggle";
import MarkdownRenderer from "../components/MarkdownRenderer";
import voiceReader from "../utils/voiceReader";
import { exportToPdf } from "../utils/advisoryExport";
import { generateOfflineDoctorResponse } from "../utils/offlineDoctorData";

const UI_STRINGS = {
  en: {
    back: "Dashboard",
    title: "AI Crop Doctor & Precision Spray Assistant",
    online: "Online",
    offline: "Offline Mode",
    downloadPrescription: "Prescription PDF",
    cropLabel: "Crop",
    conditionLabel: "Condition",
    weatherLabel: "Field Microclimate",
    dosageCalcBtn: "Precision Spray Dosage Calculator",
    dosageCalcTitle: "Field Spray & Chemical Dilution Calculator",
    acreageLabel: "Field Area (Acres)",
    tankLabel: "Spray Tank Capacity",
    knapsack16: "16-Liter Manual Knapsack Tank",
    battery10: "10-Liter Battery Sprayer",
    tractor200: "200-Liter Tractor Tank",
    calcAction: "Calculate Exact Mixture",
    quick1: "🧪 Calculate spray dosage for my field",
    quick2: "🌧️ Can I spray with today's weather?",
    quick3: "🌿 Give me an organic eco-friendly remedy",
    quick4: "🛡️ How to prevent this next season?",
    inputPlaceholder: "Ask Crop Doctor or speak in microphone...",
    send: "Send",
    listen: "Listen",
    stop: "Stop",
    listening: "Listening to your voice...",
    calculating: "Calculating..."
  },
  ta: {
    back: "முகப்பு பலகை",
    title: "AI பயிர் மருத்துவர் & துல்லிய தெளிப்பு உதவியாளர்",
    online: "செயலில்",
    offline: "செயலற்ற நிலை (Offline)",
    downloadPrescription: "மருந்து சீட்டு PDF",
    cropLabel: "பயிர்",
    conditionLabel: "நிலை",
    weatherLabel: "வயல் வானிலை",
    dosageCalcBtn: "துல்லிய மருந்து தெளிப்பு அளவீட்டு கால்குலேட்டர்",
    dosageCalcTitle: "வயல் மருந்து மற்றும் தண்ணீர் கலவை கால்குலேட்டர்",
    acreageLabel: "நிலப் பரப்பு (ஏக்கர்)",
    tankLabel: "தெளிப்பான் டேங்க் அளவு",
    knapsack16: "16 லிட்டர் கைத்தெளிப்பான் (Knapsack)",
    battery10: "10 லிட்டர் பேட்டரி தெளிப்பான்",
    tractor200: "200 லிட்டர் டிராக்டர் டேங்க்",
    calcAction: "சரியான கலவையை கணக்கிடு",
    quick1: "🧪 என் வயலுக்கு தெளிக்க வேண்டிய மருந்து அளவு",
    quick2: "🌧️ இன்றைய வானிலையில் மருந்து தெளிக்கலாமா?",
    quick3: "🌿 இயற்கை / அங்கக மாற்று முறை சொல்லுங்கள்",
    quick4: "🛡️ அடுத்த பருவத்தில் இது வராமல் தடுப்பது எப்படி?",
    inputPlaceholder: "மருத்துவரிடம் கேளுங்கள் அல்லது மைக் அழுத்தவும்...",
    send: "அனுப்பு",
    listen: "கேளுங்கள்",
    stop: "நிறுத்து",
    listening: "உங்கள் குரலைக் கேட்கிறது...",
    calculating: "கணக்கிடுகிறது..."
  },
  hi: {
    back: "डैशबोर्ड",
    title: "AI फसल डॉक्टर एवं सटीक छिड़काव सहायक",
    online: "ऑनलाइन",
    offline: "ऑफलाइन मोड",
    downloadPrescription: "पर्चा PDF डाउनलोड",
    cropLabel: "फसल",
    conditionLabel: "स्थिति",
    weatherLabel: "खेत का मौसम",
    dosageCalcBtn: "सटीक छिड़काव एवं खुराक कैलकुलेटर",
    dosageCalcTitle: "खेत कीटनाशक एवं घोल मात्रा कैलकुलेटर",
    acreageLabel: "खेत का क्षेत्रफल (एकड़)",
    tankLabel: "स्प्रे टंकी की क्षमता",
    knapsack16: "16 लीटर नैपसैक स्प्रे टंकी",
    battery10: "10 लीटर बैटरी स्प्रेयर",
    tractor200: "200 लीटर ट्रैक्टर टंकी",
    calcAction: "सटीक मात्रा की गणना करें",
    quick1: "🧪 मेरे खेत के लिए कीटनाशक की सटीक मात्रा",
    quick2: "🌧️ क्या आज के मौसम में छिड़काव करना सही है?",
    quick3: "🌿 कोई जैविक या प्राकृतिक उपाय बताएं",
    quick4: "🛡️ अगली फसल में इस रोग से कैसे बचें?",
    inputPlaceholder: "डॉक्टर से पूछें या माइक दबाकर बोलें...",
    send: "भेजें",
    listen: "सुनें",
    stop: "रोकें",
    listening: "आपकी आवाज़ सुनी जा रही है...",
    calculating: "गणना हो रही है..."
  }
};

export const CropDoctorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve context passed from dashboard diagnosis
  const stateData = location.state || {};
  const crop = stateData.crop || "Rice";
  const disease = stateData.disease || "General Foliage Condition";
  const severity = stateData.severity || "Standard";
  const confidence = stateData.confidence || 90;
  const weather = stateData.weather || { temp: 28, humidity: 75, windSpeed: 10, precipitation: 0.0 };
  const diagnosisDetails = stateData.diagnosisDetails || {};

  const [activeLang, setActiveLang] = useState(() => stateData.activeLang || "en");
  const ui = UI_STRINGS[activeLang] || UI_STRINGS.en;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [acreage, setAcreage] = useState(1.0);
  const [tankCapacity, setTankCapacity] = useState(16);
  const [playingMsgIndex, setPlayingMsgIndex] = useState(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Track online/offline connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize or re-create greeting when active language or crop changes
  useEffect(() => {
    let welcome = "";
    if (activeLang === "ta") {
      welcome = `வணக்கம் விவசாயி அவர்களே! நான் உங்கள் **AgroLens AI பயிர் மருத்துவர்**. உங்கள் **${crop}** பயிரில் கண்டறியப்பட்ட **${disease}** (${severity}) நிலைக்கு தேவையான ஆலோசனை, மருந்துகள், இயற்கை முறைகள் மற்றும் தெளிப்பு அளவுகளை துல்லியமாக வழங்க தயாராக உள்ளேன். ஏதேனும் சந்தேகங்களை கேட்கலாம் அல்லது உங்கள் வயலின் ஏக்கருக்குரிய மருந்து அளவை கணக்கிடலாம்.`;
    } else if (activeLang === "hi") {
      welcome = `नमस्ते किसान भाई! मैं आपका **AgroLens AI फसल डॉक्टर** हूँ। आपकी **${crop}** फसल में पहचानी गई **${disease}** (${severity}) स्थिति के लिए सटीक कीटनाशक, जैविक उपचार तथा छिड़काव की सही मात्रा बताने के लिए तैयार हूँ। आप कोई भी सवाल पूछ सकते हैं या अपने खेत के क्षेत्रफल के अनुसार सटीक खुराक की गणना कर सकते हैं।`;
    } else {
      welcome = `Hello! I am your **AgroLens AI Crop Doctor**. I am ready to advise you on **${disease}** diagnosed on your **${crop}** (${severity} severity, ${confidence ? confidence.toFixed(1) : "90"}% confidence). Ask me any follow-up question, check weather spray feasibility, or calculate the exact chemical dosage dilution for your field.`;
    }

    setMessages([
      {
        role: "assistant",
        content: welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [activeLang, crop, disease, severity, confidence]);

  // Auto-scroll chat feed on new user or doctor message
  useEffect(() => {
    if (messages.length > 1 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  // Speech Recognition (STT) setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = activeLang === "ta" ? "ta-IN" : activeLang === "hi" ? "hi-IN" : "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    }
  }, [activeLang]);

  useEffect(() => {
    return () => {
      voiceReader.stopSpeaking();
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.lang = activeLang === "ta" ? "ta-IN" : activeLang === "hi" ? "hi-IN" : "en-US";
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Speech recognition error:", err);
        setIsRecording(false);
      }
    }
  };

  const sendMessage = async (overrideText = null, customAcreage = null, customTank = null) => {
    const textToSend = (overrideText !== null ? overrideText : input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (overrideText === null) setInput("");
    setLoading(true);

    // If client is offline or network is disconnected, use offline agronomic engine
    if (!navigator.onLine || !isOnline) {
      const offlineReply = generateOfflineDoctorResponse({
        crop,
        disease,
        severity,
        weather,
        acreage: customAcreage || acreage,
        tankCapacity: customTank || tankCapacity,
        userPrompt: textToSend,
        lang: activeLang
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: offlineReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        message: textToSend,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        crop,
        disease,
        severity,
        confidence,
        weather,
        lang: activeLang,
        acreage: customAcreage || acreage,
        tank_capacity: customTank || tankCapacity,
        diagnosis_details: diagnosisDetails
      };

      const res = await fetch("/api/doctor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data && data.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } else {
        throw new Error(data?.error || "Failed to get AI Doctor response.");
      }
    } catch (err) {
      console.warn("Doctor chat network error, falling back to offline agronomic engine:", err);
      try {
        const offlineReply = generateOfflineDoctorResponse({
          crop,
          disease,
          severity,
          weather,
          acreage: customAcreage || acreage,
          tankCapacity: customTank || tankCapacity,
          userPrompt: textToSend,
          lang: activeLang
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: offlineReply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      } catch (fallbackErr) {
        const errorMsg =
          activeLang === "ta"
            ? "மருத்துவருடன் இணைப்பதில் தாமதம் ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்."
            : activeLang === "hi"
            ? "डॉक्टर से संपर्क करने में समस्या आई है। कृपया पुनः प्रयास करें।"
            : "Could not reach AgroLens AI Doctor. Please try asking again.";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: errorMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdfPrescription = () => {
    exportToPdf({
      isStage: false,
      language: activeLang,
      crop,
      condition: disease,
      severity,
      diagnosis: diagnosisDetails?.symptoms || "Diagnosed foliar crop condition.",
      treatment: diagnosisDetails?.treatment || "",
      fertilizer: diagnosisDetails?.fertilizer || "",
      organic_tip: diagnosisDetails?.organic_tip || "",
      imageSrc: stateData.imageSrc || "",
      gradcamSrc: stateData.gradcamSrc || "",
      weather,
      acreage,
      tankCapacity,
      farmerName: "AgroLens Farmer"
    });
  };

  const handleCalculateDosage = () => {
    let calcPrompt = "";
    if (activeLang === "ta") {
      calcPrompt = `எனது ${crop} பயிரில் உள்ள ${disease} நோய்க்கு, ${acreage} ஏக்கர் பரப்பளவிற்கும் ${tankCapacity} லிட்டர் தெளிப்பான் டேங்கிற்கும் தேவையான துல்லியமான மருந்து மற்றும் தண்ணீர் அளவை கணக்கிட்டு சொல்லுங்கள்.`;
    } else if (activeLang === "hi") {
      calcPrompt = `मेरी ${crop} फसल में ${disease} के लिए, ${acreage} एकड़ खेत और ${tankCapacity} लीटर स्प्रे टंकी के अनुसार सटीक कीटनाशक और पानी की मात्रा का हिसाब बताएं।`;
    } else {
      calcPrompt = `Please calculate the exact spray dosage and water requirement for my ${acreage} Acre(s) of ${crop} affected with ${disease}, using a ${tankCapacity}-Liter spray tank.`;
    }
    sendMessage(calcPrompt, acreage, tankCapacity);
    setShowCalculator(false);
  };

  const handlePlayVoice = (text, index) => {
    if (playingMsgIndex === index) {
      voiceReader.stopSpeaking();
      setPlayingMsgIndex(null);
      return;
    }
    setPlayingMsgIndex(index);
    voiceReader.speakText(
      text.replace(/[*#_`>]/g, ""),
      activeLang,
      null,
      "",
      () => setPlayingMsgIndex(null)
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="doctor-page">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="doctor-header">
        <div className="doctor-header-in">
          <div className="doctor-header-left">
            <button
              type="button"
              className="doctor-back-btn"
              onClick={() => navigate("/dashboard")}
              title="Return to Dashboard"
            >
              <span>←</span>
              <span>{ui.back}</span>
            </button>

            <div className="doctor-brand-wrap">
              <BrandLogo size={32} />
              <div className="doctor-title-box">
                <h1>
                  <span className="doctor-title-text">AgroLens AI Doctor</span>
                  <span className={`doctor-status-badge ${isOnline ? "" : "offline"}`}>
                    <span className={`doctor-status-dot ${isOnline ? "" : "offline"}`}></span>
                    {isOnline ? ui.online : ui.offline}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Top Right: Language Dropdown & Theme Toggle */}
          <div className="doctor-header-right">
            <div className="doctor-lang-select-wrap">
              <select
                className="doctor-lang-select"
                id="doctorLangSelect"
                value={activeLang}
                onChange={(e) => setActiveLang(e.target.value)}
                aria-label="Select Language"
              >
                <option value="en">🌐 English</option>
                <option value="ta">🌐 தமிழ்</option>
                <option value="hi">🌐 हिंदी</option>
              </select>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Context & Dosage Sub-Bar ──────────────────────────── */}
      <div className="doctor-context-bar">
        <div className="doctor-context-in">
          <div className="doctor-meta-tags">
            <span className="doctor-tag crop">🌱 {crop}</span>
            <span className="doctor-tag condition">🔬 {disease} ({severity})</span>
            <span className="doctor-tag weather">
              🌦️ {weather.temp || 28}°C &bull; {weather.humidity || 75}% Hum &bull; {weather.windSpeed || 10} km/h Wind
            </span>
          </div>

          <div className="doctor-context-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="doctor-pdf-export-btn"
              id="doctorPdfBtn"
              onClick={handleExportPdfPrescription}
              title="Download Precision Prescription PDF"
            >
              <span>📄</span>
              <span>{ui.downloadPrescription}</span>
            </button>

            <button
              type="button"
              className="doctor-calc-toggle-btn"
              onClick={() => setShowCalculator((prev) => !prev)}
              aria-expanded={showCalculator}
            >
              <span>🧪</span>
              <span>{ui.dosageCalcBtn}</span>
              <span>{showCalculator ? "▲" : "▼"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Precision Spray Dosage Calculator Drawer ──────────── */}
      {showCalculator && (
        <section className="doctor-calc-drawer" aria-label="Dosage Calculator">
          <div className="doctor-calc-in">
            <div className="doctor-calc-header">
              <h3>
                <span>🧪</span>
                <span>{ui.dosageCalcTitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCalculator(false)}
                style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div className="doctor-calc-fields">
              <div className="doctor-calc-field">
                <label htmlFor="fieldAcreage">{ui.acreageLabel}:</label>
                <input
                  id="fieldAcreage"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="100"
                  value={acreage}
                  onChange={(e) => setAcreage(parseFloat(e.target.value) || 1.0)}
                />
              </div>

              <div className="doctor-calc-field">
                <label htmlFor="tankCapacitySelect">{ui.tankLabel}:</label>
                <select
                  id="tankCapacitySelect"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(parseInt(e.target.value, 10))}
                >
                  <option value={16}>{ui.knapsack16}</option>
                  <option value={10}>{ui.battery10}</option>
                  <option value={200}>{ui.tractor200}</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  className="doctor-calc-submit-btn"
                  onClick={handleCalculateDosage}
                  disabled={loading}
                >
                  <span>⚡</span>
                  <span>{ui.calcAction}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Main Chat Feed ────────────────────────────────────── */}
      <main className="doctor-chat-container">
        <div className="doctor-messages-feed">
          {messages.map((m, idx) => (
            <div key={idx} className={`doctor-msg-row ${m.role}`}>
              <div className={`doctor-msg-avatar ${m.role}`}>
                {m.role === "assistant" ? "👨‍⚕️" : "👨‍🌾"}
              </div>

              <div className="doctor-msg-bubble">
                {m.role === "assistant" && (
                  <div className="doctor-msg-header">
                    <span className="doctor-msg-author">
                      <span>🌱</span>
                      <span>AgroLens Agronomist</span>
                    </span>
                    <button
                      type="button"
                      className={`doctor-listen-btn ${playingMsgIndex === idx ? "playing" : ""}`}
                      onClick={() => handlePlayVoice(m.content, idx)}
                      title="Audio Read Aloud"
                    >
                      <span>{playingMsgIndex === idx ? "⏹" : "🔊"}</span>
                      <span>{playingMsgIndex === idx ? ui.stop : ui.listen}</span>
                    </button>
                  </div>
                )}

                <MarkdownRenderer content={m.content} />

                <div className="doctor-msg-time">{m.timestamp}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="doctor-msg-row doctor">
              <div className="doctor-msg-avatar doctor">👨‍⚕️</div>
              <div className="doctor-msg-bubble" style={{ padding: "14px 20px" }}>
                <span style={{ fontSize: ".86rem", color: "var(--muted)", marginRight: "8px" }}>
                  {ui.calculating}
                </span>
                <span className="doctor-typing-indicator">
                  <span className="doctor-typing-dot"></span>
                  <span className="doctor-typing-dot"></span>
                  <span className="doctor-typing-dot"></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Prompt Chips */}
        <div className="doctor-quick-chips">
          <button type="button" className="doctor-quick-chip" onClick={() => sendMessage(ui.quick1)}>
            {ui.quick1}
          </button>
          <button type="button" className="doctor-quick-chip" onClick={() => sendMessage(ui.quick2)}>
            {ui.quick2}
          </button>
          <button type="button" className="doctor-quick-chip" onClick={() => sendMessage(ui.quick3)}>
            {ui.quick3}
          </button>
          <button type="button" className="doctor-quick-chip" onClick={() => sendMessage(ui.quick4)}>
            {ui.quick4}
          </button>
        </div>
      </main>

      {/* ── Fixed Bottom Input Bar ────────────────────────────── */}
      <footer className="doctor-bottom-bar">
        <div className="doctor-bottom-in">
          <div className="doctor-input-row">
            <button
              type="button"
              className={`doctor-mic-btn ${isRecording ? "recording" : ""}`}
              onClick={toggleRecording}
              title={isRecording ? ui.listening : "Speak into microphone"}
            >
              🎤
            </button>

            <input
              type="text"
              className="doctor-input-field"
              placeholder={isRecording ? ui.listening : ui.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              type="button"
              className="doctor-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <span>{ui.send}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CropDoctorPage;
