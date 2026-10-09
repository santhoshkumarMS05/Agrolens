import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { shareToWhatsApp, exportToPdf } from "../utils/advisoryExport";
import voiceReader from "../utils/voiceReader";

export const HistoryPage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Tab State: 'profile' | 'history'
  const [activeTab, setActiveTab] = useState("profile");
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      loadHistory();
    }
  }, [user, authLoading]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history", { credentials: "include" });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      if (data.ok || Array.isArray(data.history)) {
        setHistoryItems(data.history || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const isStage = (item) => {
    if (!item) return false;
    if (item.severity === "Growth Stage") return true;
    const name = (item.predicted_disease || "").toLowerCase();
    const diag = (item.diagnosis || "").toLowerCase();
    return name.includes("phase") || diag.includes("identified phase") || diag.includes("priority action");
  };

  const isHealthy = (item) => {
    if (isStage(item)) return false;
    const name = typeof item === "string" ? item : (item.predicted_disease || "");
    return name.toLowerCase().includes("healthy");
  };

  const isDisease = (item) => {
    return !isStage(item) && !isHealthy(item);
  };

  const getEmoji = (name) => {
    const l = (name || "").toLowerCase();
    if (l.includes("rice")) return "🌾";
    if (l.includes("corn") || l.includes("maize")) return "🌽";
    if (l.includes("cotton")) return "☁️";
    if (l.includes("sugarcane")) return "🎋";
    if (l.includes("cassava")) return "🥔";
    if (l.includes("coconut")) return "🥥";
    if (l.includes("groundnut") || l.includes("peanut")) return "🥜";
    if (l.includes("sorghum")) return "🌾";
    if (l.includes("tomato")) return "🍅";
    if (l.includes("potato")) return "🥔";
    if (l.includes("healthy")) return "🌿";
    return "🌱";
  };

  const getSeverityDetails = (item) => {
    if (isStage(item)) return null;
    if (isHealthy(item)) return { label: "Healthy", colorClass: "green" };
    const conf = item.confidence || 0;
    const c = conf > 1 ? conf / 100 : conf;
    if (c >= 0.8) return { label: "High Severity", colorClass: "red" };
    if (c >= 0.6) return { label: "Moderate Severity", colorClass: "amber" };
    return { label: "Low Severity", colorClass: "amber" };
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const detectItemLanguage = (item) => {
    if (!item) return "en";
    const sample = `${item.predicted_disease || ""} ${item.diagnosis || ""} ${item.treatment || ""} ${item.fertilizer || ""}`;
    if (/[\u0B80-\u0BFF]/.test(sample)) return "ta";
    if (/[\u0900-\u097F]/.test(sample)) return "hi";
    return "en";
  };

  const MODAL_LANG_STRINGS = {
    en: {
      diagTitle: "Diagnosis Details",
      stageTitle: "Crop Growth Stage Details",
      confSuffix: "confidence",
      leafPhoto: "Leaf Photo",
      plantPhoto: "Field Canopy Photo",
      fileLbl: "File:",
      gradcamTitle: "Grad-CAM Attention Heatmap",
      gradcamDesc: "Red areas highlight leaf regions the model focused on for diagnosis.",
      symptoms: "🔍 Symptoms & Diagnosis",
      treatment: "💡 Treatment & Action Plan",
      fertilizer: "🌱 Fertilizer & Soil Nutrition",
      stagePhase: "🌱 Growth Phase & Observations",
      stageIrrigation: "💧 Water & Irrigation Schedule",
      stageFertilizer: "🌱 Stage Nutrition & Fertilizer",
      diagDate: "Diagnosed on: ",
      stageDate: "Evaluated on: ",
      stageTag: "🌱 Growth Stage",
      closeBtn: "Close",
      deleteBtn: "🗑️ Delete Record",
      sevHigh: "High Severity",
      sevMedium: "Medium Severity",
      sevLow: "Low Severity",
      healthy: "Healthy",
    },
    ta: {
      diagTitle: "கண்டறிதல் விவரங்கள்",
      stageTitle: "பயிர் வளர்ச்சி பருவ விவரங்கள்",
      confSuffix: "துல்லியம் (Confidence)",
      leafPhoto: "இலை புகைப்படம்",
      plantPhoto: "முழு பயிர் புகைப்படம்",
      fileLbl: "கோப்பு:",
      gradcamTitle: "Grad-CAM வெப்ப வரைபடம்",
      gradcamDesc: "சிவப்பு பகுதிகள் மாதிரி கவனம் செலுத்திய இடங்களைக் காட்டுகின்றன.",
      symptoms: "🔍 அறிகுறிகள் & நோய் கண்டறிதல்",
      treatment: "💡 சிகிச்சை & செயல் திட்டம்",
      fertilizer: "🌱 உர மேலாண்மை & மண் ஊட்டச்சத்து",
      stagePhase: "🌱 வளர்ச்சிப் பருவம் & களக் குறிப்புகள்",
      stageIrrigation: "💧 நீர் மேலாண்மை & பாசன அட்டவணை",
      stageFertilizer: "🌱 இப்பருவத்திற்கான உர மேலாண்மை",
      diagDate: "கண்டறியப்பட்ட தேதி: ",
      stageDate: "மதிப்பிடப்பட்ட தேதி: ",
      stageTag: "🌱 வளர்ச்சிப் பருவம்",
      closeBtn: "மூடு",
      deleteBtn: "🗑️ பதிவை நீக்கு",
      sevHigh: "அதிக பாதிப்பு (High)",
      sevMedium: "நடுத்தர பாதிப்பு (Medium)",
      sevLow: "குறைந்த பாதிப்பு (Low)",
      healthy: "ஆரோக்கியமானது (Healthy)",
    },
    hi: {
      diagTitle: "रोग निदान विवरण",
      stageTitle: "फसल वृद्धि अवस्था विवरण",
      confSuffix: "कॉन्फिडेंस",
      leafPhoto: "पत्ती फोटो",
      plantPhoto: "फसल फोटो",
      fileLbl: "फ़ाइल:",
      gradcamTitle: "Grad-CAM ध्यान हीटमैप",
      gradcamDesc: "लाल क्षेत्र पत्ती के उन हिस्सों को दर्शाते हैं जिन पर मॉडल ने ध्यान केंद्रित किया।",
      symptoms: "🔍 लक्षण और रोग निदान",
      treatment: "💡 उपचार और कार्य योजना",
      fertilizer: "🌱 उर्वरक एवं मृदा पोषण",
      stagePhase: "🌱 वृद्धि अवस्था एवं अवलोकन",
      stageIrrigation: "💧 सिंचाई एवं जल प्रबंधन समय सारिणी",
      stageFertilizer: "🌱 इस अवस्था हेतु खाद एवं उर्वरक",
      diagDate: "निदान दिनांक: ",
      stageDate: "मूल्यांकन दिनांक: ",
      stageTag: "🌱 वृद्धि अवस्था",
      closeBtn: "बंद करें",
      deleteBtn: "🗑️ रिकॉर्ड हटाएं",
      sevHigh: "उच्च गंभीरता (High)",
      sevMedium: "मध्यम गंभीरता (Medium)",
      sevLow: "कम गंभीरता (Low)",
      healthy: "स्वस्थ (Healthy)",
    },
  };

  const deleteItem = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete record for "${name}"?`)) return;
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((h) => h.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      } else {
        alert("Failed to delete record.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting record.");
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    const lang = detectItemLanguage(item);
    if (voiceReader.prefetch) {
      setTimeout(() => {
        voiceReader.prefetch(item.diagnosis || "", lang, "Symptoms");
        voiceReader.prefetch(item.treatment || "", lang, "Treatment");
        voiceReader.prefetch(item.fertilizer || "", lang, "Fertilizer");
      }, 200);
    }
  };

  const closeModal = () => {
    voiceReader.stopSpeaking();
    setSelectedItem(null);
  };

  const handleShareWhatsApp = (item) => {
    if (!item) return;
    const stage = isStage(item);
    const lang = detectItemLanguage(item);
    const sev = getSeverityDetails(item);
    shareToWhatsApp({
      isStage: stage,
      language: lang,
      crop: item.crop || "Crop",
      condition: item.predicted_disease || "Condition",
      severity: stage ? "" : (sev?.label || item.severity || "Evaluated"),
      diagnosis: item.diagnosis || "",
      treatment: stage ? "" : (item.treatment || ""),
      irrigation: stage ? (item.treatment || "") : "",
      fertilizer: item.fertilizer || "",
      imageSrc: item.image_path || "",
      gradcamSrc: item.gradcam_image || "",
      dateStr: formatDate(item.created_at),
      farmerName: user?.name || "AgroLens Farmer"
    });
  };

  const handleExportPdf = (item) => {
    if (!item) return;
    const stage = isStage(item);
    const lang = detectItemLanguage(item);
    const sev = getSeverityDetails(item);
    exportToPdf({
      isStage: stage,
      language: lang,
      crop: item.crop || "Crop",
      condition: item.predicted_disease || "Condition",
      severity: stage ? "" : (sev?.label || item.severity || "Evaluated"),
      diagnosis: item.diagnosis || "",
      treatment: stage ? "" : (item.treatment || ""),
      irrigation: stage ? (item.treatment || "") : "",
      fertilizer: item.fertilizer || "",
      imageSrc: item.image_path || "",
      gradcamSrc: item.gradcam_image || "",
      dateStr: formatDate(item.created_at),
      farmerName: user?.name || "AgroLens Farmer"
    });
  };

  // Computed counts
  const totalCount = historyItems.length;
  const stageCount = historyItems.filter(isStage).length;
  const healthyCount = historyItems.filter(isHealthy).length;
  const diseasedCount = historyItems.filter(isDisease).length;

  const filteredItems = historyItems.filter((item) => {
    if (currentFilter === "all") return true;
    if (currentFilter === "stage") return isStage(item);
    if (currentFilter === "diseased") return isDisease(item);
    if (currentFilter === "healthy") return isHealthy(item);
    return true;
  });

  const selectedItemStage = selectedItem ? isStage(selectedItem) : false;
  const selectedItemSev = selectedItem ? getSeverityDetails(selectedItem) : null;
  const selectedLang = selectedItem ? detectItemLanguage(selectedItem) : "en";
  const t = MODAL_LANG_STRINGS[selectedLang] || MODAL_LANG_STRINGS.en;
  const selectedConfVal = selectedItem
    ? selectedItem.confidence > 1
      ? selectedItem.confidence
      : selectedItem.confidence * 100
    : 0;

  return (
    <div>
      {/* Navigation Bar matching AgroLens system */}
      <nav className="nav">
        <div className="nav-in">
          <Link className="brand" to="/">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 21C7 17 4 13 4 8.5A6.5 6.5 0 0116.9 6c1.7 1.7 2.6 4.2 1.6 8-1 3.9-4 6.3-6.5 7z" fill="#2d4627" />
              <path d="M12 21V9" stroke="#f4f1e2" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            AgroLens
          </Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">🏠 Home</Link>
            <Link to="/dashboard" className="nav-link">🌱 Dashboard</Link>
            <Link to="/history" className="nav-link active">📚 History &amp; Profile</Link>
            {user?.role === "admin" && (
              <Link to="/admin" className="nav-link" id="navAdmin" style={{ display: "inline-flex" }}>
                🛡️ Admin Console
              </Link>
            )}
          </div>
          <div className="userbox">
            <ThemeToggle />
            <span className="user-pill" id="userPill">
              Farmer: <b id="userName">{user?.name || "…"}</b>
            </span>
            <button
              className="signout-btn"
              id="logoutBtn"
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="shell">
        {/* Header Banner */}
        <div className="page-hero">
          <div className="page-title">
            <span className="eyebrow">Farmer Account</span>
            <h1 style={{ marginTop: "10px" }}>
              Diagnosis &amp; Stage <em>History</em>
            </h1>
            <p>
              Review past crop scans, disease severities, growth stage evaluations, and treatment recommendations.
            </p>
          </div>
          <div className="hero-badge">
            <span className="dot"></span>
            Active Account
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="tab-wrap">
          <div className="tab-pills">
            <button
              className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
              id="tabProfileBtn"
              type="button"
              onClick={() => setActiveTab("profile")}
            >
              📝 Farmer Profile
            </button>
            <button
              className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
              id="tabHistoryBtn"
              type="button"
              onClick={() => setActiveTab("history")}
            >
              📚 Scan History (<span id="totalBadge">{totalCount}</span>)
            </button>
          </div>
        </div>

        {/* PROFILE SECTION */}
        {activeTab === "profile" && (
          <div id="profileSection" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Stats Row */}
            <div className="stats-grid">
              <div className="stat-card gold">
                <div style={{ fontSize: "1.8rem" }}>📊</div>
                <div className="stat-num" id="statTotal">{totalCount}</div>
                <div className="stat-label">Total Scans</div>
              </div>
              <div className="stat-card rust">
                <div style={{ fontSize: "1.8rem" }}>🦠</div>
                <div className="stat-num" id="statDiseased">{diseasedCount}</div>
                <div className="stat-label">Disease Cases</div>
              </div>
              <div className="stat-card green" style={{ borderColor: "rgba(22,163,74,.35)" }}>
                <div style={{ fontSize: "1.8rem" }}>🌱</div>
                <div className="stat-num" id="statStage">{stageCount}</div>
                <div className="stat-label">Growth Stages</div>
              </div>
              <div className="stat-card green">
                <div style={{ fontSize: "1.8rem" }}>🌿</div>
                <div className="stat-num" id="statHealthy">{healthyCount}</div>
                <div className="stat-label">Healthy Crops</div>
              </div>
            </div>

            {/* Account Details Panel */}
            <div className="panel">
              <h2 style={{ fontSize: "1.4rem", marginBottom: "18px" }}>Account Details</h2>
              <div className="detail-item">
                <span className="detail-icon">👤</span>
                <div className="detail-meta">
                  <div className="lbl">Registered Farmer Name</div>
                  <div className="val" id="profileName">{user?.name || "AgroLens Farmer"}</div>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-icon">📧</span>
                <div className="detail-meta">
                  <div className="lbl">Registered Email Address</div>
                  <div className="val" id="profileEmail">{user?.email || "—"}</div>
                </div>
              </div>
              <div style={{ marginTop: "24px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <Link className="btn primary" to="/dashboard">Run New Diagnosis →</Link>
                <Link className="btn" to="/">View Technology Overview</Link>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY SECTION */}
        {activeTab === "history" && (
          <div id="historySection" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="filter-pills">
                <button
                  className={`filter-btn ${currentFilter === "all" ? "active" : ""}`}
                  id="filtAll"
                  type="button"
                  onClick={() => setCurrentFilter("all")}
                >
                  All (<span id="countAll">{totalCount}</span>)
                </button>
                <button
                  className={`filter-btn rust ${currentFilter === "diseased" ? "active rust" : ""}`}
                  id="filtDiseased"
                  type="button"
                  onClick={() => setCurrentFilter("diseased")}
                >
                  🦠 Disease (<span id="countDiseased">{diseasedCount}</span>)
                </button>
                <button
                  className={`filter-btn green ${currentFilter === "stage" ? "active green" : ""}`}
                  id="filtStage"
                  type="button"
                  onClick={() => setCurrentFilter("stage")}
                >
                  🌱 Growth Stage (<span id="countStage">{stageCount}</span>)
                </button>
                <button
                  className={`filter-btn ${currentFilter === "healthy" ? "active" : ""}`}
                  id="filtHealthy"
                  type="button"
                  onClick={() => setCurrentFilter("healthy")}
                >
                  🌿 Healthy (<span id="countHealthy">{healthyCount}</span>)
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && !loading && (
              <div className="empty-state" id="emptyState" style={{ display: "block" }}>
                <div className="icon">📭</div>
                <h3>No crop scans found</h3>
                <p id="emptyMsg">
                  {currentFilter === "all"
                    ? "Start analyzing leaf photos to build your diagnosis history."
                    : `No ${
                        currentFilter === "stage"
                          ? "crop growth stage records"
                          : currentFilter === "diseased"
                          ? "crop disease diagnosis records"
                          : "healthy crop records"
                      } found in your history.`}
                </p>
                <Link className="btn primary" to="/dashboard">Analyze Leaf Now →</Link>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                <span className="spin" style={{ display: "inline-block", width: "24px", height: "24px", margin: "0 auto 12px" }}></span>
                <p>Loading your diagnosis records...</p>
              </div>
            )}

            {/* Grid of Cards */}
            <div className="history-grid" id="historyGrid">
              {filteredItems.map((item) => {
                const stage = isStage(item);
                const healthy = isHealthy(item);
                const sev = getSeverityDetails(item);
                const confVal = item.confidence > 1 ? item.confidence : item.confidence * 100;

                return (
                  <div
                    key={item.id}
                    className={`scan-card ${stage ? "stage" : healthy ? "healthy" : "diseased"}`}
                    onClick={() => openModal(item)}
                  >
                    <div className="card-media">
                      {item.image_path ? (
                        <img src={item.image_path} alt="Crop scan" />
                      ) : (
                        <div className="placeholder">{getEmoji(item.predicted_disease)}</div>
                      )}
                      <button
                        className="delete-chip"
                        title="Delete record"
                        type="button"
                        onClick={(e) => deleteItem(item.id, item.predicted_disease, e)}
                      >
                        🗑️
                      </button>
                      {stage ? (
                        <span className="stage-tag">🌱 Growth Stage</span>
                      ) : (
                        <span className={`severity-tag ${sev ? sev.colorClass : "green"}`}>
                          {sev ? sev.label : "Evaluated"}
                        </span>
                      )}
                    </div>
                    <div className="card-content">
                      <div>
                        <div className="card-title-line">
                          <span style={{ fontSize: "1.4rem" }}>{getEmoji(item.predicted_disease)}</span>
                          <div className="card-disease">{item.predicted_disease}</div>
                        </div>
                        <div className="card-date">
                          {stage ? "🌱 Growth Stage Record" : formatDate(item.created_at)}
                        </div>
                      </div>
                      <div className="card-bottom">
                        <span className="conf-pill">{confVal.toFixed(1)}% confidence</span>
                        <span
                          className="view-link"
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(item);
                          }}
                        >
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* DETAILED MODAL */}
      {selectedItem && (
        <div
          className="modal-overlay open"
          id="modalOverlay"
          style={{
            display: "flex",
            position: "fixed",
            inset: 0,
            opacity: 1,
            visibility: "visible",
            pointerEvents: "auto",
            zIndex: 10000,
          }}
          onClick={closeModal}
        >
          <div
            className="modal-box"
            style={{
              position: "relative",
              zIndex: 10001,
              pointerEvents: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>
                <span id="modalIcon">{getEmoji(selectedItem.predicted_disease)}</span>{" "}
                <span id="modalTitle">{selectedItemStage ? t.stageTitle : t.diagTitle}</span>
              </h3>
              <button
                className="modal-close"
                id="modalCloseX"
                type="button"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>
            <div className="modal-scroll">
              <div className="modal-grid">
                {/* Left Side: Leaf Photo & Grad-CAM */}
                <div>
                  <div
                    id="lblModalLeafPhoto"
                    style={{
                      fontSize: ".78rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "var(--green)",
                      marginBottom: "8px",
                    }}
                  >
                    {selectedItemStage ? t.plantPhoto : t.leafPhoto}
                  </div>
                  <div
                    style={{
                      borderRadius: "var(--r)",
                      overflow: "hidden",
                      background: "var(--ink)",
                      border: "1px solid var(--line)",
                      marginBottom: "12px",
                    }}
                  >
                    <img
                      id="modalImg"
                      src={selectedItem.image_path || ""}
                      alt="Analyzed leaf"
                      style={{ width: "100%", maxHeight: "260px", objectFit: "contain", display: "block" }}
                    />
                  </div>
                  <div style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: "18px" }}>
                    <b>
                      <span id="lblModalFile">{t.fileLbl}</span>
                    </b>{" "}
                    <span id="modalFileName">{selectedItem.image_name || "leaf_photo.jpg"}</span>
                  </div>

                  {/* Grad-CAM Section */}
                  {selectedItem.gradcam_image && !selectedItemStage && (
                    <div id="gradcamBox" style={{ display: "block" }}>
                      <div
                        id="lblModalGradcam"
                        style={{
                          fontSize: ".78rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".08em",
                          color: "var(--rust)",
                          marginBottom: "8px",
                        }}
                      >
                        {t.gradcamTitle}
                      </div>
                      <div
                        style={{
                          borderRadius: "var(--r)",
                          overflow: "hidden",
                          background: "var(--ink)",
                          border: "1px solid var(--line)",
                          marginBottom: "6px",
                        }}
                      >
                        <img
                          id="modalGradcamImg"
                          src={selectedItem.gradcam_image}
                          alt="Grad-CAM heatmap"
                          style={{ width: "100%", maxHeight: "220px", objectFit: "contain", display: "block" }}
                        />
                      </div>
                      <p id="lblModalGradcamDesc" style={{ fontSize: ".75rem", color: "var(--muted)" }}>
                        {t.gradcamDesc}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Side: Details & Actions */}
                <div>
                  <div
                    style={{
                      background: "var(--paper-2)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--r)",
                      padding: "18px",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <div
                        style={{
                          fontFamily: "'Fraunces', serif",
                          fontSize: "1.35rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                        id="modalDiseaseName"
                      >
                        {selectedItem.predicted_disease}
                      </div>
                      <button
                        type="button"
                        className="voice-btn"
                        title="Listen aloud"
                        onClick={(e) => voiceReader.speakText(selectedItem.predicted_disease, selectedLang, e.currentTarget, selectedItemStage ? t.stageTitle : t.diagTitle)}
                      >
                        <span>🔊</span>
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span className="conf-pill" id="modalConf">
                        {selectedConfVal.toFixed(1)}% {t.confSuffix}
                      </span>
                      {selectedItemStage ? (
                        <span className="stage-tag" style={{ position: "static", display: "inline-flex" }} id="modalStageTag">
                          {t.stageTag}
                        </span>
                      ) : (
                        <span
                          className={`severity-tag ${selectedItemSev ? selectedItemSev.colorClass : "green"}`}
                          style={{ position: "static", display: "inline-block" }}
                          id="modalSevTag"
                        >
                          {selectedItemSev ? selectedItemSev.label : "Healthy"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: "8px" }} id="modalDate">
                      {selectedItemStage ? t.stageDate : t.diagDate}
                      {formatDate(selectedItem.created_at)}
                    </div>
                  </div>

                  <div className="advice-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div className="title green" id="modalAdv1Title">
                        {selectedItemStage ? t.stagePhase : t.symptoms}
                      </div>
                      <button
                        type="button"
                        className="voice-btn"
                        title="Listen aloud"
                        onClick={(e) =>
                          voiceReader.speakText(
                            selectedItem.diagnosis ||
                              (selectedItemStage ? "Vegetative canopy growth observed." : "No specific symptoms recorded."),
                            selectedLang,
                            e.currentTarget,
                            selectedItemStage ? t.stagePhase : t.symptoms
                          )
                        }
                      >
                        <span>🔊</span>
                      </button>
                    </div>
                    <p id="modalDiagnosis">
                      {selectedItem.diagnosis ||
                        (selectedItemStage ? "Vegetative canopy growth observed." : "No specific symptoms recorded.")}
                    </p>
                  </div>

                  <div className="advice-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div className="title gold" id="modalAdv2Title">
                        {selectedItemStage ? t.stageIrrigation : t.treatment}
                      </div>
                      <button
                        type="button"
                        className="voice-btn"
                        title="Listen aloud"
                        onClick={(e) =>
                          voiceReader.speakText(
                            selectedItem.treatment ||
                              (selectedItemStage ? "Maintain recommended soil moisture." : "Keep monitoring crop health regularly."),
                            selectedLang,
                            e.currentTarget,
                            selectedItemStage ? t.stageIrrigation : t.treatment
                          )
                        }
                      >
                        <span>🔊</span>
                      </button>
                    </div>
                    <p id="modalTreatment">
                      {selectedItem.treatment ||
                        (selectedItemStage ? "Maintain recommended soil moisture." : "Keep monitoring crop health regularly.")}
                    </p>
                  </div>

                  <div className="advice-card">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div className="title green" id="modalAdv3Title">
                        {selectedItemStage ? t.stageFertilizer : t.fertilizer}
                      </div>
                      <button
                        type="button"
                        className="voice-btn"
                        title="Listen aloud"
                        onClick={(e) =>
                          voiceReader.speakText(
                            selectedItem.fertilizer || "Maintain balanced soil nutrition.",
                            selectedLang,
                            e.currentTarget,
                            selectedItemStage ? t.stageFertilizer : t.fertilizer
                          )
                        }
                      >
                        <span>🔊</span>
                      </button>
                    </div>
                    <p id="modalFertilizer">{selectedItem.fertilizer || "Maintain balanced soil nutrition."}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px" }}>
                    <button
                      className="btn whatsapp-btn"
                      id="modalShareWhatsAppBtn"
                      type="button"
                      style={{
                        padding: "10px 14px",
                        fontSize: ".85rem",
                        background: "#25D366",
                        borderColor: "#20bd5a",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        borderRadius: "10px",
                        transition: "all .2s",
                      }}
                      onClick={() => handleShareWhatsApp(selectedItem)}
                    >
                      <span>💬</span> <span>WhatsApp</span>
                    </button>
                    <button
                      className="btn pdf-btn"
                      id="modalExportPdfBtn"
                      type="button"
                      style={{
                        padding: "10px 14px",
                        fontSize: ".85rem",
                        background: "var(--paper-3)",
                        border: "1.5px solid var(--line)",
                        color: "var(--ink)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        borderRadius: "10px",
                        transition: "all .2s",
                      }}
                      onClick={() => handleExportPdf(selectedItem)}
                    >
                      <span>📄</span> <span>Export PDF</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <button
                      className="btn"
                      id="modalDeleteBtn"
                      type="button"
                      style={{
                        flex: 1,
                        background: "var(--rust)",
                        color: "var(--paper)",
                        borderColor: "var(--rust)",
                      }}
                      onClick={() => {
                        deleteItem(selectedItem.id, selectedItem.predicted_disease);
                        closeModal();
                      }}
                    >
                      {t.deleteBtn}
                    </button>
                    <button
                      className="btn"
                      id="modalCloseBtn"
                      type="button"
                      style={{ flex: 1 }}
                      onClick={closeModal}
                    >
                      {t.closeBtn}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
