import React, { useState, useEffect, useRef } from "react";
import voiceReader from "../utils/voiceReader";

const STRINGS = {
  en: {
    title: "AI Crop Doctor & Precision Spray Assistant",
    subtitle: "Ask follow-up questions, weather feasibility, or calculate exact spray tank mixtures.",
    online: "Online",
    listening: "Listening to your voice...",
    placeholder: "Ask Crop Doctor or speak in microphone...",
    send: "Send",
    calculating: "Calculating...",
    calcHeading: "Precision Spray Dosage Calculator",
    acreageLabel: "Field Area (Acres):",
    tankLabel: "Spray Tank Capacity:",
    knapsack16: "16-Liter Manual Knapsack Tank",
    battery10: "10-Liter Battery Sprayer",
    tractor200: "200-Liter Tractor Tank",
    calculateBtn: "Calculate Exact Mixture",
    quick1: "🧪 Calculate spray dosage for my field",
    quick2: "🌧️ Can I spray with today's weather?",
    quick3: "🌿 Give me an organic eco-friendly remedy",
    quick4: "🛡️ How to prevent this next season?",
    listenAudio: "Listen",
    stopAudio: "Stop",
    voiceInputNotice: "Click to speak in English"
  },
  ta: {
    title: "AI பயிர் மருத்துவர் & துல்லிய தெளிப்பு உதவியாளர்",
    subtitle: "நோய் பரவல், மருந்து கலவை அல்லது இன்றைய வானிலையில் தெளிக்கலாமா என கேளுங்கள்.",
    online: "செயலில்",
    listening: "உங்கள் குரலைக் கேட்கிறது...",
    placeholder: "மருத்துவரிடம் கேளுங்கள் அல்லது மைக் அழுத்தவும்...",
    send: "அனுப்பு",
    calculating: "கணக்கிடுகிறது...",
    calcHeading: "துல்லிய மருந்து தெளிப்பு அளவீட்டு கால்குலேட்டர்",
    acreageLabel: "நிலப் பரப்பு (ஏக்கர்):",
    tankLabel: "தெளிப்பான் டேங்க் அளவு:",
    knapsack16: "16 லிட்டர் கைத்தெளிப்பான் (Knapsack)",
    battery10: "10 லிட்டர் பேட்டரி தெளிப்பான்",
    tractor200: "200 லிட்டர் டிராக்டர் டேங்க்",
    calculateBtn: "சரியான கலவையை கணக்கிடு",
    quick1: "🧪 என் வயலுக்கு தெளிக்க வேண்டிய மருந்து அளவு",
    quick2: "🌧️ இன்றைய வானிலையில் மருந்து தெளிக்கலாமா?",
    quick3: "🌿 இயற்கை / அங்கக மாற்று முறை சொல்லுங்கள்",
    quick4: "🛡️ அடுத்த பருவத்தில் இது வராமல் தடுப்பது எப்படி?",
    listenAudio: "கேளுங்கள்",
    stopAudio: "நிறுத்து",
    voiceInputNotice: "தமிழில் பேச மைக்-ஐ அழுத்தவும்"
  },
  hi: {
    title: "AI फसल डॉक्टर एवं सटीक छिड़काव सहायक",
    subtitle: "रोग उपचार, कीटनाशक की मात्रा अथवा आज के मौसम में छिड़काव के बारे में पूछें।",
    online: "ऑनलाइन",
    listening: "आपकी आवाज़ सुनी जा रही है...",
    placeholder: "डॉक्टर से पूछें या माइक दबाकर बोलें...",
    send: "भेजें",
    calculating: "गणना हो रही है...",
    calcHeading: "सटीक छिड़काव एवं खुराक कैलकुलेटर",
    acreageLabel: "खेत का क्षेत्रफल (एकड़):",
    tankLabel: "स्प्रे टंकी की क्षमता:",
    knapsack16: "16 लीटर नैपसैक स्प्रे टंकी",
    battery10: "10 लीटर बैटरी स्प्रेयर",
    tractor200: "200 लीटर ट्रैक्टर टंकी",
    calculateBtn: "सटीक मात्रा की गणना करें",
    quick1: "🧪 मेरे खेत के लिए कीटनाशक की सटीक मात्रा",
    quick2: "🌧️ क्या आज के मौसम में छिड़काव करना सही है?",
    quick3: "🌿 कोई जैविक या प्राकृतिक उपाय बताएं",
    quick4: "🛡️ अगली फसल में इस रोग से कैसे बचें?",
    listenAudio: "सुनें",
    stopAudio: "रोकें",
    voiceInputNotice: "हिंदी में बोलने के लिए माइक दबाएं"
  }
};

export const CropDoctorChat = ({
  crop = "Rice",
  disease = "Healthy Foliage",
  severity = "Moderate",
  confidence = 90,
  weather = {},
  activeLang = "en"
}) => {
  const ui = STRINGS[activeLang] || STRINGS.en;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [acreage, setAcreage] = useState(1.0);
  const [tankCapacity, setTankCapacity] = useState(16);
  const [playingMsgIndex, setPlayingMsgIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize welcome greeting whenever crop or disease changes
  useEffect(() => {
    let welcome = "";
    if (activeLang === "ta") {
      welcome = `வணக்கம் விவசாயி அவர்களே! நான் உங்கள் அக்ரோலென்ஸ் AI பயிர் மருத்துவர். உங்கள் **${crop}** பயிரில் கண்டறியப்பட்ட **${disease}** (${severity}) குறித்த கேள்விகள் அல்லது ஏக்கருக்கு தேவையான மருந்து தெளிப்பு அளவுகளை என்னிடம் கேட்டுத் தெரிந்து கொள்ளலாம்.`;
    } else if (activeLang === "hi") {
      welcome = `नमस्ते किसान भाई! मैं आपका एग्रोलेंस AI फसल डॉक्टर हूँ। आपकी **${crop}** फसल में पहचाने गए **${disease}** (${severity}) के समाधान, दवा की मात्रा या मौसम अनुसार छिड़काव के बारे में मुझसे पूछें।`;
    } else {
      welcome = `Hello! I am your AgroLens AI Crop Doctor. I am ready to advise you on **${disease}** detected in your **${crop}** (${severity} severity). Ask me anything, or calculate the exact spray dosage for your field acreage.`;
    }

    setMessages([
      {
        role: "assistant",
        content: welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [crop, disease, severity, activeLang]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Setup Web Speech API for Multilingual Voice Input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = activeLang === "ta" ? "ta-IN" : activeLang === "hi" ? "hi-IN" : "en-IN";

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSend(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [activeLang]);

  const handleVoiceToggle = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser. Please use Chrome on Mobile or Desktop.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = activeLang === "ta" ? "ta-IN" : activeLang === "hi" ? "hi-IN" : "en-IN";
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition restart:", err);
      }
    }
  };

  const handleSend = async (customText = null, extraData = {}) => {
    const textToSend = (customText !== null ? customText : input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const payload = {
        message: textToSend,
        history: newHistory.map((m) => ({ role: m.role, content: m.content })),
        crop,
        disease,
        severity,
        confidence,
        weather,
        lang: activeLang,
        acreage: extraData.acreage || acreage,
        tank_capacity: extraData.tank_capacity || tankCapacity
      };

      const res = await fetch("/api/doctor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.ok && data.reply) {
        const assistantMsg = {
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || "Doctor response unavailable");
      }
    } catch (err) {
      console.error("Doctor chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            activeLang === "ta"
              ? "மன்னிக்கவும், மருத்துவருடன் இணைப்பதில் தாமதம் ஏற்பட்டுள்ளது. சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்."
              : activeLang === "hi"
              ? "क्षमा करें, डॉक्टर से संपर्क नहीं हो पा रहा है। कृपया कुछ देर बाद पुनः प्रयास करें।"
              : "I apologize, but I could not reach the agronomy engine right now. Please try again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDosageSubmit = (e) => {
    e?.preventDefault();
    setShowCalculator(false);
    const query =
      activeLang === "ta"
        ? `என் ${crop} பயிரில் உள்ள ${disease} நோய்க்கு ${acreage} ஏக்கர் பரப்பளவில் ${tankCapacity} லிட்டர் டேங்கிற்கு துல்லிய மருந்து மற்றும் தண்ணீர் அளவை கணக்கிட்டு சொல்லுங்கள்.`
        : activeLang === "hi"
        ? `मेरी ${crop} फसल में ${disease} के लिए ${acreage} एकड़ खेत में ${tankCapacity} लीटर स्प्रे टंकी के हिसाब से दवा और पानी की सटीक मात्रा बताएं।`
        : `Please calculate the exact chemical dosage, water volume, and number of ${tankCapacity}L spray tanks for my ${acreage} acre(s) of ${crop} with ${disease}.`;

    handleSend(query, { acreage, tank_capacity: tankCapacity });
  };

  const handleSpeakMessage = (text, idx) => {
    if (playingMsgIndex === idx) {
      voiceReader.stopSpeaking();
      setPlayingMsgIndex(null);
    } else {
      voiceReader.stopSpeaking();
      setPlayingMsgIndex(idx);
      // Clean markdown tags like ** and # for clean voice narration
      const clean = text.replace(/[*#_`]/g, "").replace(/\n+/g, ". ");
      voiceReader.speakText(clean, activeLang);
    }
  };

  return (
    <div
      className="crop-doctor-card"
      style={{
        marginTop: "24px",
        background: "var(--card-bg, #101811)",
        border: "1.5px solid rgba(34, 197, 94, 0.3)",
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Top Banner Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.06))",
          borderBottom: "1px solid rgba(34, 197, 94, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "rgba(34, 197, 94, 0.2)",
              border: "1.5px solid #22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem"
            }}
          >
            👨‍⚕️
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--ink, #f4f1e2)" }}>
                {ui.title}
              </h3>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "#22c55e",
                  background: "rgba(34, 197, 94, 0.15)",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }}></span>
                {ui.online}
              </span>
            </div>
            <p style={{ margin: "3px 0 0 0", fontSize: "0.8rem", color: "var(--muted, #8b949e)" }}>
              {ui.subtitle}
            </p>
          </div>
        </div>

        {/* Quick Trigger: Dosage Calculator Modal Button */}
        <button
          type="button"
          onClick={() => setShowCalculator(!showCalculator)}
          style={{
            background: showCalculator ? "#22c55e" : "rgba(34, 197, 94, 0.12)",
            color: showCalculator ? "#0a0f0a" : "#22c55e",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            borderRadius: "99px",
            padding: "6px 14px",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease"
          }}
        >
          <span>🧪</span>
          <span>{ui.calcHeading}</span>
        </button>
      </div>

      {/* Embedded Dosage Calculator Panel (When active) */}
      {showCalculator && (
        <form
          onSubmit={handleCalculateDosageSubmit}
          style={{
            background: "rgba(0,0,0,0.35)",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(34, 197, 94, 0.2)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            alignItems: "flex-end"
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
              {ui.acreageLabel} ({acreage} Acres)
            </label>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={acreage}
              onChange={(e) => setAcreage(parseFloat(e.target.value) || 1)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #2d4627)",
                background: "var(--paper, #141f15)",
                color: "var(--ink, #f4f1e2)",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
              {ui.tankLabel}
            </label>
            <select
              value={tankCapacity}
              onChange={(e) => setTankCapacity(parseInt(e.target.value) || 16)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line, #2d4627)",
                background: "var(--paper, #141f15)",
                color: "var(--ink, #f4f1e2)",
                fontSize: "0.9rem"
              }}
            >
              <option value="16">{ui.knapsack16}</option>
              <option value="10">{ui.battery10}</option>
              <option value="200">{ui.tractor200}</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              padding: "9px 18px",
              background: "#22c55e",
              color: "#0a0f0a",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <span>⚡</span> {ui.calculateBtn}
          </button>
        </form>
      )}

      {/* Quick Action Chips Bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px 18px",
          overflowX: "auto",
          background: "rgba(0,0,0,0.15)",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        {[ui.quick1, ui.quick2, ui.quick3, ui.quick4].map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            disabled={loading}
            style={{
              whiteSpace: "nowrap",
              padding: "5px 12px",
              borderRadius: "99px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: "rgba(255,255,255,0.05)",
              color: "var(--ink, #f4f1e2)",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Stream Container */}
      <div
        style={{
          padding: "18px",
          height: "280px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          background: "rgba(0,0,0,0.12)"
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                maxWidth: "88%",
                alignSelf: isUser ? "flex-end" : "flex-start"
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  background: isUser
                    ? "linear-gradient(135deg, #15803d, #166534)"
                    : "rgba(255,255,255,0.06)",
                  border: isUser
                    ? "1px solid #22c55e"
                    : "1px solid rgba(34, 197, 94, 0.25)",
                  color: "#f4f1e2",
                  fontSize: "0.88rem",
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}
              >
                {!isUser && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                      paddingBottom: "4px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)"
                    }}
                  >
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      🌱 AgroLens Agronomist
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSpeakMessage(msg.content, idx)}
                      style={{
                        background: "none",
                        border: "none",
                        color: playingMsgIndex === idx ? "#22c55e" : "var(--muted)",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Read aloud"
                    >
                      {playingMsgIndex === idx ? "⏹️ " + ui.stopAudio : "🔊 " + ui.listenAudio}
                    </button>
                  </div>
                )}
                {msg.content}
              </div>
              <span style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: "4px", padding: "0 4px" }}>
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#22c55e", fontSize: "0.82rem", fontStyle: "italic" }}>
            <span>🌱</span>
            <span>{ui.calculating}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input & Voice Microphone Bar */}
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(0,0,0,0.25)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }}
      >
        {/* Voice Speech-to-Text Microphone Button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          title={ui.voiceInputNotice}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            border: isRecording ? "2px solid #ef4444" : "1.5px solid rgba(34, 197, 94, 0.4)",
            background: isRecording ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.12)",
            color: isRecording ? "#ef4444" : "#22c55e",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.2rem",
            flexShrink: 0,
            transition: "all 0.2s ease"
          }}
        >
          {isRecording ? "🔴" : "🎙️"}
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={isRecording ? ui.listening : ui.placeholder}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: "99px",
            border: "1px solid var(--line, #2d4627)",
            background: "var(--paper, #141f15)",
            color: "var(--ink, #f4f1e2)",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          style={{
            padding: "10px 18px",
            borderRadius: "99px",
            background: input.trim() && !loading ? "#22c55e" : "rgba(255,255,255,0.08)",
            color: input.trim() && !loading ? "#0a0f0a" : "var(--muted)",
            border: "none",
            fontWeight: 700,
            fontSize: "0.85rem",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s ease"
          }}
        >
          <span>{ui.send}</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
};

export default CropDoctorChat;
