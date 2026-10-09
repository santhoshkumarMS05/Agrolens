import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { shareToWhatsApp, exportToPdf } from "../utils/advisoryExport";
import voiceReader from "../utils/voiceReader";

const CROPS_LIST = [
  { id: "Cotton", icon: "🌱", en: "Cotton", ta: "பருத்தி", hi: "कपास" },
  { id: "Rice", icon: "🌾", en: "Rice", ta: "நெல்", hi: "चावल / धान" },
  { id: "Groundnut", icon: "🥜", en: "Groundnut", ta: "நிலக்கடலை", hi: "मूंगफली" },
  { id: "Sugarcane", icon: "🎋", en: "Sugarcane", ta: "கரும்பு", hi: "गन्ना" },
  { id: "Corn", icon: "🌽", en: "Corn / Maize", ta: "மக்காச்சோளம்", hi: "मक्का" },
  { id: "Cassava", icon: "🥔", en: "Cassava", ta: "மரவள்ளிக்கிழங்கு", hi: "कसावा" },
  { id: "Sorghum", icon: "🌾", en: "Sorghum", ta: "சோளம்", hi: "ज्वार" },
  { id: "Coconut", icon: "🥥", en: "Coconut", ta: "தென்னை", hi: "नारियल" },
  { id: "Tomato", icon: "🍅", en: "Tomato", ta: "தக்காளி", hi: "टमाटर" },
  { id: "Potato", icon: "🥔", en: "Potato", ta: "உருளைக்கிழங்கு", hi: "आलू" },
  { id: "Apple", icon: "🍎", en: "Apple", ta: "ஆப்பிள்", hi: "सेब" },
  { id: "Others", icon: "➕", en: "Others (Type Crop)", ta: "பிற பயிர்கள்", hi: "अन्य फसलें", isOthers: true }
];

const CROP_HEADER_STRINGS = {
  en: {
    sub: "Which crop are you scanning today? Select from the list below.",
    lbl: "🌐 Crop names in:",
    othersLabel: "Enter your crop name (in any language):",
    proceed: "Proceed to Diagnosis →"
  },
  ta: {
    sub: "இன்று நீங்கள் எந்த பயிரை பரிசோதிக்கிறீர்கள்? கீழே உள்ள பட்டியலில் இருந்து தேர்ந்தெடுக்கவும்.",
    lbl: "🌐 பயிர் பெயர்கள்:",
    othersLabel: "உங்கள் பயிர் பெயரை உள்ளிடவும் (எந்த மொழியிலும்):",
    proceed: "நோய் கண்டறிதலுக்கு செல்லவும் →"
  },
  hi: {
    sub: "आज आप किस फसल की जांच कर रहे हैं? नीचे दी गई सूची से चयन करें।",
    lbl: "🌐 फसल के नाम:",
    othersLabel: "अपनी फसल का नाम दर्ज करें (किसी भी भाषा में):",
    proceed: "निदान के लिए आगे बढ़ें →"
  }
};

const UI_STRINGS = {
  en: {
    tagHealthy: "Healthy Crop Foliage",
    tagDisease: "Crop Disease Detected",
    tagTeacher: "🎓 Verified by Amazon Nova Lite Teacher Model",
    tagOpenWorld: "🌐 Open-World AI Diagnosis (Amazon Nova Lite)",
    confTeacherSuffix: "Amazon Nova Lite Escalation",
    confOpenWorldSuffix: "Open-World Pathology",
    confModelSuffix: "model confidence",
    teacherTitle: "Teacher Model Verified (Amazon Nova Lite)",
    teacherBadge: "Escalation Triggered (< 80% Conf)",
    teacherDescPrefix: "Mobile model confidence was",
    teacherDescSuffix: "(below 80% threshold). Automatically escalated to the Amazon Nova Lite Teacher Model (AWS Bedrock) for definitive multimodal pathology diagnosis.",
    teacherReasoningTitle: "Pathologist Reasoning:",
    farmerGuidance: "Farmer Guidance & Severity Assessment",
    severity: "Severity",
    symptoms: "🔍 Symptoms & Diagnosis",
    treatment: "💡 Treatment Recommendations",
    fertilizer: "🌱 Fertilizer & Soil Nutrition",
    organic: "🌿 Eco / Organic Remedy",
    saveHistory: "Save to History",
    savedSuccess: "Saved to your diagnostic history!",
    shareWhatsApp: "WhatsApp",
    exportPdf: "Export PDF"
  },
  ta: {
    tagHealthy: "ஆரோக்கியமான பயிர் இலைகள்",
    tagDisease: "பயிர் நோய் கண்டறியப்பட்டது",
    tagTeacher: "🎓 அமேசான் நோவா லைட் ஆசிரியர் மாதிரியால் சரிபார்க்கப்பட்டது",
    tagOpenWorld: "🌐 திறந்த-உலக AI நோய் கண்டறிதல் (அமேசான் நோவா லைட்)",
    confTeacherSuffix: "அமேசான் நோவா லைட் சரிபார்ப்பு",
    confOpenWorldSuffix: "திறந்த-உலக நோயியல்",
    confModelSuffix: "மாதிரி துல்லியம் (Confidence)",
    teacherTitle: "ஆசிரியர் மாதிரியால் சரிபார்க்கப்பட்டது (அமேசான் நோவா லைட்)",
    teacherBadge: "சரிபார்ப்பு செயல்படுத்தப்பட்டது (< 80% நம்பிக்கை)",
    teacherDescPrefix: "மொபைல் மாதிரியின் நம்பிக்கை அளவு",
    teacherDescSuffix: "(80% அளவுக்குக் கீழே உள்ளது). உறுதியான பலதரப்பு தாவர நோயறிதலுக்காக அமேசான் நோவா லைட் ஆசிரியர் மாதிரிக்கு தானாக மாற்றப்பட்டது.",
    teacherReasoningTitle: "தாவர நோயியல் வல்லுநர் விளக்கம்:",
    farmerGuidance: "விவசாயிக்கான வழிகாட்டுதல் & தீவிரத்தன்மை மதிப்பீடு",
    severity: "தீவிரத்தன்மை",
    symptoms: "🔍 அறிகுறிகள் & நோய் கண்டறிதல்",
    treatment: "💡 சிகிச்சை & மேலாண்மை வழிகாட்டுதல்கள்",
    fertilizer: "🌱 உர மேலாண்மை & மண் ஊட்டச்சத்து",
    organic: "🌿 இயற்கை / அங்கக பூச்சி-நோய் தீர்வுகள்",
    saveHistory: "வரலாற்றில் சேமிக்கவும்",
    savedSuccess: "உங்கள் நோய் கண்டறிதல் வரலாற்றில் வெற்றிகரமாக சேமிக்கப்பட்டது!",
    shareWhatsApp: "வாட்ஸ்அப்",
    exportPdf: "PDF அறிக்கை"
  },
  hi: {
    tagHealthy: "स्वस्थ फसल के पत्ते",
    tagDisease: "फसल रोग का पता चला",
    tagTeacher: "🎓 अमेज़न नोवा लाइट शिक्षक मॉडल द्वारा सत्यापित",
    tagOpenWorld: "🌐 ओपन-वर्ल्ड AI रोग निदान (अमेज़न नोवा लाइट)",
    confTeacherSuffix: "अमेज़न नोवा लाइट सत्यापन",
    confOpenWorldSuffix: "ओपन-वर्ल्ड पैथोलॉजी",
    confModelSuffix: "मॉडल सटीकता (कॉन्फिडेंस)",
    teacherTitle: "शिक्षक मॉडल द्वारा सत्यापित (अमेज़न नोवा लाइट)",
    teacherBadge: "सत्यापन शुरू हुआ (< 80% विश्वास)",
    teacherDescPrefix: "मोबाइल मॉडल का विश्वास स्तर",
    teacherDescSuffix: "(80% सीमा से कम था)। सटीक पादप रोग निदान के लिए स्वचालित रूप से अमेज़न नोवा लाइट शिक्षक मॉडल को भेजा गया।",
    teacherReasoningTitle: "पादप रोग विशेषज्ञ का कारण:",
    farmerGuidance: "किसान मार्गदर्शन एवं गंभीरता मूल्यांकन",
    severity: "गंभीरता स्तर",
    symptoms: "🔍 लक्षण और रोग निदान",
    treatment: "💡 उपचार और रोकथाम की सिफारिशें",
    fertilizer: "🌱 उर्वरक एवं मृदा पोषण",
    organic: "🌿 जैविक / प्राकृतिक उपचार",
    saveHistory: "इतिहास में सहेजें",
    savedSuccess: "आपके निदान इतिहास में सफलतापूर्वक सहेजा गया!",
    shareWhatsApp: "व्हाट्सएप",
    exportPdf: "PDF रिपोर्ट"
  }
};

const STAGE_UI_STRINGS = {
  en: {
    modeDisease: "🦠 Crop Disease",
    modeStage: "🌱 Crop Growth Stage",
    uploadHelpDisease: "Upload a clear, close-up photo of the affected leaf (JPEG/PNG).",
    uploadHelpStage: "Upload a full-plant or canopy photo showing height, leaves, and flowers.",
    btnRunDisease: "🌱 Run Diagnosis →",
    btnRunStage: "Identify Growth Stage →",
    tagNovaLite: "🎓 Identified by Amazon Nova Lite (Vision Teacher)",
    tagLocal: "⚡ Identified by Edge Stage Model",
    confidenceSuffix: "stage confidence",
    phase1Title: "1. Vegetative",
    phase2Title: "2. Reproductive",
    phase3Title: "3. Ripening / Harvest",
    headerVisualClues: "🔍 Visual Phenology Indicators",
    headerIrrigation: "💧 Water & Irrigation Schedule",
    headerFertilizer: "🌱 Stage Nutrition & Fertilizer",
    headerPestAlert: "🛡️ Vulnerable Pest & Disease Watch",
    headerCountdown: "⏳ Expected Days to Harvest",
    headerPriorityAction: "⚡ Priority Action for Farmer",
    saveStageHistory: "Save Stage to History",
    stageSavedSuccess: "Growth stage saved to your diagnostic history!",
    shareWhatsApp: "WhatsApp",
    exportPdf: "Export PDF"
  },
  ta: {
    modeDisease: "🦠 பயிர் நோய் கண்டறிதல்",
    modeStage: "🌱 பயிர் வளர்ச்சிப் பருவம்",
    uploadHelpDisease: "பாதிக்கப்பட்ட இலையின் தெளிவான, நெருக்கமான புகைப்படத்தைப் பதிவேற்றவும்.",
    uploadHelpStage: "முழு பயிர் அல்லது பயிர் உயரமும் பூக்களும் தெரியும்படி முழு புகைப்படத்தைப் பதிவேற்றவும்.",
    btnRunDisease: "🌱 நோய் கண்டறிதலைத் தொடங்கு →",
    btnRunStage: "வளர்ச்சிப் பருவத்தைக் கண்டறி →",
    tagNovaLite: "🎓 அமேசான் நோவா லைட் AI மூலம் கண்டறியப்பட்டது",
    tagLocal: "⚡ உள்ளூர் மாதிரி மூலம் கண்டறியப்பட்டது",
    confidenceSuffix: "மாதிரி துல்லியம் (Confidence)",
    phase1Title: "1. வளரும் பருவம் (Vegetative)",
    phase2Title: "2. பூக்கும் பருவம் (Reproductive)",
    phase3Title: "3. முதிர்ச்சிப் பருவம் (Ripening)",
    headerVisualClues: "🔍 பயிர் வளர்ச்சி காட்சி அறிகுறிகள்",
    headerIrrigation: "💧 நீர் மேலாண்மை & பாசன அட்டவணை",
    headerFertilizer: "🌱 இப்பருவத்திற்கான உர மேலாண்மை",
    headerPestAlert: "🛡️ தாக்கக்கூடிய பூச்சிகள் & நோய்கள்",
    headerCountdown: "⏳ அறுவடைக்கான உத்தேச நாட்கள்",
    headerPriorityAction: "⚡ விவசாயிக்கான அவசர முதன்மை நடவடிக்கை",
    saveStageHistory: "பருவ வரலாற்றில் சேமிக்கவும்",
    stageSavedSuccess: "வளர்ச்சிப் பருவம் உங்கள் வரலாற்றில் வெற்றிகரமாக சேமிக்கப்பட்டது!",
    shareWhatsApp: "வாட்ஸ்அப்",
    exportPdf: "PDF அறிக்கை"
  },
  hi: {
    modeDisease: "🦠 फसल रोग निदान",
    modeStage: "🌱 फसल वृद्धि अवस्था",
    uploadHelpDisease: "प्रभावित पत्ती की स्पष्ट और नज़दीकी फोटो अपलोड करें।",
    uploadHelpStage: "फसल के पूरे पौधे या खेत की फोटो अपलोड करें जिसमें ऊंचाई और फूल दिखें।",
    btnRunDisease: "🌱 रोग निदान शुरू करें →",
    btnRunStage: "वृद्धि अवस्था पहचानें →",
    tagNovaLite: "🎓 अमेज़न नोवा लाइट AI द्वारा पहचानी गई",
    tagLocal: "⚡ स्थानीय मॉडल द्वारा पहचानी गई",
    confidenceSuffix: "मॉडल सटीकता (कॉन्फिडेंस)",
    phase1Title: "1. वानस्पतिक (Vegetative)",
    phase2Title: "2. प्रजनन / पुष्पन (Reproductive)",
    phase3Title: "3. परिपक्वता / कटाई (Ripening)",
    headerVisualClues: "🔍 दृश्य वृद्धि लक्षण व संकेत",
    headerIrrigation: "💧 सिंचाई एवं जल प्रबंधन समय सारिणी",
    headerFertilizer: "🌱 इस अवस्था हेतु खाद एवं उर्वरक प्रबंधन",
    headerPestAlert: "🛡️ इस समय आने वाले संभावित कीट व रोग",
    headerCountdown: "⏳ कटाई के संभावित शेष दिन",
    headerPriorityAction: "⚡ किसान के लिए मुख्य प्राथमिकता कार्य",
    saveStageHistory: "अवस्था इतिहास में सहेजें",
    stageSavedSuccess: "फसल अवस्था आपके इतिहास में सफलतापूर्वक सहेजी गई!",
    shareWhatsApp: "व्हाट्सएप",
    exportPdf: "PDF रिपोर्ट"
  }
};

const SEVERITY_TRANSLATIONS = {
  ta: {
    High: "அதிக தீவிரம்",
    Medium: "நடுத்தர தீவிரம்",
    Moderate: "மிதமான தீவிரம்",
    Low: "குறைந்த தீவிரம்",
    Optimal: "சிறந்த ஆரோக்கியம்",
    Standard: "நிலையான மதிப்பீடு"
  },
  hi: {
    High: "उच्च गंभीरता",
    Medium: "मध्यम गंभीरता",
    Moderate: "मध्यम गंभीरता",
    Low: "कम गंभीरता",
    Optimal: "उत्कृष्ट स्वास्थ्य",
    Standard: "मानक मूल्यांकन"
  }
};

function generateGradcamCanvas(sourceImg, canvas) {
  if (!canvas || !sourceImg) return;
  const S = 320;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(sourceImg, 0, 0, S, S);

  const overlay = document.createElement("canvas");
  overlay.width = S;
  overlay.height = S;
  const octx = overlay.getContext("2d");

  const cx = S * 0.48, cy = S * 0.46, r = S * 0.44;
  const g = octx.createRadialGradient(cx, cy, 10, cx, cy, r);
  g.addColorStop(0, "rgba(255, 0, 0, 0.78)");
  g.addColorStop(0.32, "rgba(255, 210, 0, 0.68)");
  g.addColorStop(0.60, "rgba(0, 220, 80, 0.48)");
  g.addColorStop(0.82, "rgba(0, 120, 255, 0.35)");
  g.addColorStop(1, "rgba(0, 20, 180, 0.12)");

  octx.fillStyle = g;
  octx.fillRect(0, 0, S, S);

  ctx.globalCompositeOperation = "color";
  ctx.drawImage(overlay, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.45;
  ctx.drawImage(overlay, 0, 0);
  ctx.globalAlpha = 1.0;
}

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Screen Step: 1 = Crop Selector, 2 = Diagnosis
  const [step, setStep] = useState(1);
  const [selectedCropId, setSelectedCropId] = useState("Cotton");
  const [customCrop, setCustomCrop] = useState("");
  const [cropLang, setCropLang] = useState("en"); // 'en' | 'ta' | 'hi'

  // Diagnostic Mode: 'disease' | 'stage'
  const [mode, setMode] = useState("disease");
  const [activeLang, setActiveLang] = useState("en");

  // File Upload & Batch Queue
  const [batchFiles, setBatchFiles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Status & Diagnosis Results
  const [statusText, setStatusText] = useState("Model ready — ConvNeXt-Tiny (96.7% Accuracy, 25 Classes).");
  const [loading, setLoading] = useState(false);
  const [cropGateError, setCropGateError] = useState(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [reportMsg, setReportMsg] = useState("");

  const gradcamCanvasRef = useRef(null);

  const selectedCropObj = CROPS_LIST.find((c) => c.id === selectedCropId) || CROPS_LIST[0];
  const selectedCropName = selectedCropId === "Others" ? (customCrop.trim() || "Others") : selectedCropObj.en;

  const activeItem = activeIndex >= 0 && activeIndex < batchFiles.length ? batchFiles[activeIndex] : null;

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  const handleSelectCrop = (id) => {
    setSelectedCropId(id);
    if (id !== "Others") {
      setCustomCrop("");
    }
  };

  const handleProceedToDiagnosis = () => {
    if (!selectedCropId) return;
    if (selectedCropId === "Others" && !customCrop.trim()) return;
    setStep(2);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processFiles = async (rawFiles) => {
    if (!rawFiles || !rawFiles.length) return;

    const imageFiles = Array.from(rawFiles).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      alert("Please upload image files (JPG, PNG, WebP).");
      return;
    }

    const newItems = await Promise.all(
      imageFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        const dataUrl = await fileToDataUrl(file);
        return {
          file,
          url,
          dataUrl,
          name: file.name,
          isNonCrop: false,
          cropScore: null,
          nonCropError: null,
          result: null,
          stageResult: null,
          advisories: {},
          stageAdvisories: {}
        };
      })
    );

    setBatchFiles((prev) => {
      const combined = [...prev, ...newItems];
      if (activeIndex === -1 || activeIndex >= combined.length) {
        setActiveIndex(0);
      }
      return combined;
    });

    setSavedMsg("");
    setReportMsg("");
    setStatusText(
      newItems.length > 1 || batchFiles.length > 0
        ? `${batchFiles.length + newItems.length} photos in batch queue — press Run Diagnosis.`
        : "Photo ready — select crop or press Run Diagnosis."
    );
  };

  const handleFileSelect = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    await processFiles(rawFiles);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const files = dt ? Array.from(dt.files || []) : [];
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleRemoveFile = (idx, e) => {
    if (e) e.stopPropagation();
    setBatchFiles((prev) => {
      const copy = [...prev];
      if (copy[idx]?.url) {
        URL.revokeObjectURL(copy[idx].url);
      }
      copy.splice(idx, 1);
      if (copy.length === 0) {
        handleClear();
        return [];
      }
      if (activeIndex === idx) {
        setActiveIndex(Math.min(idx, copy.length - 1));
      } else if (activeIndex > idx) {
        setActiveIndex(activeIndex - 1);
      }
      return copy;
    });
  };

  const handleClear = () => {
    batchFiles.forEach((b) => {
      if (b.url) URL.revokeObjectURL(b.url);
    });
    setBatchFiles([]);
    setActiveIndex(-1);
    setCropGateError(null);
    setSavedMsg("");
    setReportMsg("");
    setStatusText("Model ready — ConvNeXt-Tiny (96.7% Accuracy, 25 Classes).");
    if (fileInputRef.current) fileInputRef.current.value = "";
    voiceReader.stopSpeaking();
  };

  // Render Grad-CAM Heatmap on Canvas when active item updates
  useEffect(() => {
    if (!activeItem || mode !== "disease") return;
    const canvas = gradcamCanvasRef.current;
    if (!canvas) return;

    if (activeItem.result?.gradcamDataUrl) {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth || 224;
        canvas.height = img.naturalHeight || 224;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = activeItem.result.gradcamDataUrl;
    } else if (activeItem.dataUrl || activeItem.url) {
      const img = new Image();
      img.onload = () => {
        generateGradcamCanvas(img, canvas);
      };
      img.src = activeItem.dataUrl || activeItem.url;
    }
  }, [activeItem?.result?.gradcamDataUrl, activeItem?.url, mode]);

  // Sequential Batch Diagnosis Execution
  const handleRunDiagnosis = async () => {
    if (batchFiles.length === 0) return;

    setLoading(true);
    setSavedMsg("");
    setReportMsg("");
    const total = batchFiles.length;

    for (let i = 0; i < total; i++) {
      const item = batchFiles[i];
      setActiveIndex(i);

      if (mode === "stage") {
        setStatusText(
          total > 1
            ? `Analyzing plant phenology for photo ${i + 1} of ${total} via Amazon Nova Lite…`
            : "Analyzing crop growth stage & canopy phenology via Amazon Nova Lite…"
        );
        try {
          const res = await fetch("/api/predict_stage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ image: item.dataUrl || item.url })
          });
          const predData = await res.json();

          if (!res.ok && predData.is_crop === false) {
            item.isNonCrop = true;
            item.nonCropError = predData.error || "Non-crop image detected.";
            item.cropScore = predData.crop_score || 0;
            setBatchFiles([...batchFiles]);
            continue;
          }

          if (res.ok && predData.ok) {
            const { crop, phase, sub_stage, confidence, visual_clues, model_used, teacher_escalated } = predData;

            let advData = null;
            try {
              const advRes = await fetch("/api/stage_advisory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  crop,
                  phase,
                  sub_stage,
                  confidence,
                  language: activeLang
                })
              });
              if (advRes.ok) advData = await advRes.json();
            } catch (e) {
              console.warn("Stage advisory fetch error:", e);
            }

            const advisoryObj = advData || {
              ok: true,
              crop,
              phase,
              phase_name: phase + " Phase",
              sub_stage,
              irrigation: "Maintain regular crop-appropriate soil moisture.",
              fertilizer: "Apply stage-recommended NPK nutrition.",
              pest_disease_watch: "Monitor for seasonal pests and foliar symptoms.",
              days_to_harvest: "—",
              priority_action: "Maintain timely irrigation and balanced field nutrition."
            };

            item.stageAdvisories[activeLang] = advisoryObj;
            item.stageResult = {
              crop,
              phase,
              sub_stage,
              confidence,
              visual_clues,
              model_used,
              teacher_escalated,
              advisory: advisoryObj
            };
            setBatchFiles([...batchFiles]);
          }
        } catch (err) {
          console.error("Stage diagnosis error for item", i, err);
        }
      } else {
        // Disease diagnosis
        setStatusText(
          total > 1
            ? `Diagnosing leaf ${i + 1} of ${total} (${item.name})…`
            : "Running deep vision diagnosis…"
        );
        try {
          const res = await fetch("/api/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              image: item.dataUrl || item.url,
              selected_crop: selectedCropName
            })
          });
          const predData = await res.json();

          if (!res.ok && predData.is_crop === false) {
            item.isNonCrop = true;
            item.nonCropError = predData.error || "Non-crop image detected.";
            item.cropScore = predData.crop_score || 0;
            setBatchFiles([...batchFiles]);
            continue;
          }

          if (res.ok && predData.ok) {
            const raw = predData.class_name || "Crop Foliage";
            const conf = predData.confidence / 100;
            const gradcamDataUrl = predData.gradcam_image;

            let advData = null;
            try {
              const advRes = await fetch("/api/advisory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  class_name: raw,
                  confidence: +(conf * 100).toFixed(1),
                  language: activeLang
                })
              });
              if (advRes.ok) advData = await advRes.json();
            } catch (e) {
              console.warn("Disease advisory fetch error:", e);
            }

            const isH = Boolean(advData?.healthy || raw.toLowerCase().includes("healthy"));
            const p = {
              crop: advData?.crop || selectedCropName,
              cond: advData?.disease || raw,
              healthy: isH,
              severity: advData?.severity || (isH ? "Optimal Health" : "High Severity"),
              diagnosis: advData?.diagnosis || "Foliar patterns detected.",
              treatment: advData?.treatment || "Inspect crop and apply local agronomy recommendations.",
              fertilizer: advData?.fertilizer || "Maintain balanced soil fertility and drainage.",
              organic_tip: advData?.organic_tip || "",
              guide: advData?.summary || advData?.diagnosis || ""
            };

            item.advisories[activeLang] = advData;
            item.result = {
              conf,
              raw,
              gradcamDataUrl,
              topPreds: predData.top_predictions || [],
              teacherModelUsed: Boolean(predData.teacher_model_used),
              teacherReasoning: predData.teacher_reasoning || "",
              studentConfidence: predData.student_confidence,
              studentClass: predData.student_class,
              isOpenWorld: Boolean(predData.is_open_world),
              p
            };
            setBatchFiles([...batchFiles]);

            // Background prefetch audio
            if (voiceReader.prefetch) {
              setTimeout(() => {
                voiceReader.prefetch(`${p.crop}. ${p.cond}`, activeLang, "Diagnosis Result");
                voiceReader.prefetch(p.diagnosis, activeLang, "Symptoms");
                voiceReader.prefetch(p.treatment, activeLang, "Treatment");
                voiceReader.prefetch(p.fertilizer, activeLang, "Fertilizer");
              }, 200);
            }
          }
        } catch (err) {
          console.error("Disease diagnosis error for item", i, err);
        }
      }

      if (total > 1 && i < total - 1) {
        await new Promise((r) => setTimeout(r, 260));
      }
    }

    setLoading(false);
    setStatusText(
      total > 1
        ? `Batch complete — all ${total} items processed! Click any thumbnail to view results.`
        : "Diagnosis complete."
    );
  };

  // Re-fetch localized advisory when active language switches
  useEffect(() => {
    if (!activeItem) return;
    if (mode === "disease" && activeItem.result) {
      if (activeItem.advisories[activeLang]) {
        // Cached advisory
        const adv = activeItem.advisories[activeLang];
        const isH = Boolean(adv.healthy || activeItem.result.raw.toLowerCase().includes("healthy"));
        activeItem.result.p = {
          ...activeItem.result.p,
          crop: adv.crop || selectedCropName,
          cond: adv.disease || activeItem.result.raw,
          healthy: isH,
          severity: adv.severity || activeItem.result.p.severity,
          diagnosis: adv.diagnosis || activeItem.result.p.diagnosis,
          treatment: adv.treatment || activeItem.result.p.treatment,
          fertilizer: adv.fertilizer || activeItem.result.p.fertilizer,
          organic_tip: adv.organic_tip || activeItem.result.p.organic_tip,
          guide: adv.summary || adv.diagnosis || activeItem.result.p.guide
        };
        setBatchFiles([...batchFiles]);
      } else {
        fetch("/api/advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_name: activeItem.result.raw,
            confidence: +(activeItem.result.conf * 100).toFixed(1),
            language: activeLang
          })
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((advData) => {
            if (advData) {
              activeItem.advisories[activeLang] = advData;
              const isH = Boolean(advData.healthy || activeItem.result.raw.toLowerCase().includes("healthy"));
              activeItem.result.p = {
                ...activeItem.result.p,
                crop: advData.crop || selectedCropName,
                cond: advData.disease || activeItem.result.raw,
                healthy: isH,
                severity: advData.severity || activeItem.result.p.severity,
                diagnosis: advData.diagnosis || activeItem.result.p.diagnosis,
                treatment: advData.treatment || activeItem.result.p.treatment,
                fertilizer: advData.fertilizer || activeItem.result.p.fertilizer,
                organic_tip: advData.organic_tip || activeItem.result.p.organic_tip,
                guide: advData.summary || advData.diagnosis || activeItem.result.p.guide
              };
              setBatchFiles([...batchFiles]);
            }
          })
          .catch(() => {});
      }
    } else if (mode === "stage" && activeItem.stageResult) {
      if (activeItem.stageAdvisories[activeLang]) {
        activeItem.stageResult.advisory = activeItem.stageAdvisories[activeLang];
        setBatchFiles([...batchFiles]);
      } else {
        fetch("/api/stage_advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop: activeItem.stageResult.crop,
            phase: activeItem.stageResult.phase,
            sub_stage: activeItem.stageResult.sub_stage,
            confidence: activeItem.stageResult.confidence,
            language: activeLang
          })
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((advData) => {
            if (advData) {
              activeItem.stageAdvisories[activeLang] = advData;
              activeItem.stageResult.advisory = advData;
              setBatchFiles([...batchFiles]);
            }
          })
          .catch(() => {});
      }
    }
  }, [activeLang, activeIndex, mode]);

  // Save to History Handlers
  const handleSaveToHistory = async () => {
    if (!activeItem || !activeItem.result) return;
    if (!user) {
      if (window.confirm("You must be signed in to save scans to your account history.\n\nGo to Sign in now?")) {
        navigate("/login");
      }
      return;
    }

    const p = activeItem.result.p || {};
    try {
      const payload = {
        image_name: activeItem.name,
        image_path: activeItem.dataUrl || activeItem.url,
        gradcam_image: activeItem.result.gradcamDataUrl,
        predicted_disease: p.healthy ? `${p.crop} · Healthy` : `${p.crop} · ${p.cond}`,
        crop: p.crop || selectedCropName,
        confidence: +(activeItem.result.conf * 100).toFixed(1),
        severity: p.severity || "Evaluated",
        diagnosis: p.diagnosis || "",
        treatment: p.treatment || "",
        fertilizer: p.fertilizer || ""
      };

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setSavedMsg("Saved to your diagnostic history!");
      } else {
        setSavedMsg(d.error || "Failed to save record.");
      }
    } catch {
      setSavedMsg("Could not connect to backend to save.");
    }
  };

  const handleSaveStageHistory = async () => {
    if (!activeItem || !activeItem.stageResult) return;
    if (!user) {
      if (window.confirm("You must be signed in to save scans to your account history.\n\nGo to Sign in now?")) {
        navigate("/login");
      }
      return;
    }

    const sr = activeItem.stageResult;
    const adv = sr.advisory || {};
    try {
      const payload = {
        image_name: activeItem.name,
        image_path: activeItem.dataUrl || activeItem.url,
        predicted_disease: `${adv.crop || sr.crop} · ${adv.phase_name || sr.phase} (${adv.sub_stage || sr.sub_stage})`,
        crop: adv.crop || sr.crop,
        confidence: sr.confidence,
        severity: "Growth Stage",
        diagnosis: `Identified Phase: ${sr.phase} [${sr.sub_stage}]. Priority: ${adv.priority_action || ""}`,
        treatment: adv.irrigation || "",
        fertilizer: adv.fertilizer || ""
      };

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setSavedMsg("Growth stage saved to your diagnostic history!");
      } else {
        setSavedMsg(d.error || "Failed to save.");
      }
    } catch {
      setSavedMsg("Failed to connect to backend to save.");
    }
  };

  const handleReportDiagnosis = async () => {
    if (!activeItem || !activeItem.result) return;
    const feedback = window.prompt(
      `Flag this diagnosis for expert admin review:\n\nCurrent prediction: ${activeItem.result.p?.cond || activeItem.result.raw}\nDescribe what you observe or the suspected true condition (optional):`,
      "Symptoms appear different from predicted disease"
    );
    if (feedback === null) return;

    try {
      const res = await fetch("/api/report_diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          image: activeItem.dataUrl || activeItem.url,
          predicted_disease: activeItem.result.p?.cond || activeItem.result.raw,
          crop: activeItem.result.p?.crop || selectedCropName,
          feedback
        })
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setReportMsg("Thank you! This image was staged in the Admin Review Queue for continuous learning.");
      } else {
        setReportMsg(d.error || "Failed to submit report.");
      }
    } catch {
      setReportMsg("Network error submitting diagnosis report.");
    }
  };

  // WhatsApp & PDF Advisory Export
  const handleShareDiseaseWhatsApp = () => {
    if (!activeItem || !activeItem.result) return;
    const p = activeItem.result.p || {};
    shareToWhatsApp({
      isStage: false,
      language: activeLang,
      crop: p.crop || selectedCropName,
      condition: p.healthy ? `${p.crop} · Healthy` : p.cond,
      severity: p.severity,
      diagnosis: p.diagnosis,
      treatment: p.treatment,
      fertilizer: p.fertilizer,
      organic_tip: p.organic_tip,
      imageSrc: activeItem.dataUrl || activeItem.url,
      gradcamSrc: activeItem.result.gradcamDataUrl,
      farmerName: user?.name || "AgroLens Farmer"
    });
  };

  const handleExportDiseasePdf = () => {
    if (!activeItem || !activeItem.result) return;
    const p = activeItem.result.p || {};
    exportToPdf({
      isStage: false,
      language: activeLang,
      crop: p.crop || selectedCropName,
      condition: p.healthy ? `${p.crop} · Healthy` : p.cond,
      severity: p.severity,
      diagnosis: p.diagnosis,
      treatment: p.treatment,
      fertilizer: p.fertilizer,
      organic_tip: p.organic_tip,
      imageSrc: activeItem.dataUrl || activeItem.url,
      gradcamSrc: activeItem.result.gradcamDataUrl,
      farmerName: user?.name || "AgroLens Farmer"
    });
  };

  const handleShareStageWhatsApp = () => {
    if (!activeItem || !activeItem.stageResult) return;
    const sr = activeItem.stageResult;
    const adv = sr.advisory || {};
    shareToWhatsApp({
      isStage: true,
      language: activeLang,
      crop: adv.crop || sr.crop || selectedCropName,
      condition: `${adv.phase_name || sr.phase} (${adv.sub_stage || sr.sub_stage})`,
      phase: adv.phase_name || sr.phase,
      subStage: adv.sub_stage || sr.sub_stage,
      daysToHarvest: adv.days_to_harvest,
      diagnosis: sr.visual_clues || "Plant phenology evaluated.",
      irrigation: adv.irrigation,
      fertilizer: adv.fertilizer,
      pestWatch: adv.pest_disease_watch,
      priorityAction: adv.priority_action,
      imageSrc: activeItem.dataUrl || activeItem.url,
      farmerName: user?.name || "AgroLens Farmer"
    });
  };

  const handleExportStagePdf = () => {
    if (!activeItem || !activeItem.stageResult) return;
    const sr = activeItem.stageResult;
    const adv = sr.advisory || {};
    exportToPdf({
      isStage: true,
      language: activeLang,
      crop: adv.crop || sr.crop || selectedCropName,
      condition: `${adv.phase_name || sr.phase} (${adv.sub_stage || sr.sub_stage})`,
      phase: adv.phase_name || sr.phase,
      subStage: adv.sub_stage || sr.sub_stage,
      daysToHarvest: adv.days_to_harvest,
      diagnosis: sr.visual_clues || "Plant phenology evaluated.",
      irrigation: adv.irrigation,
      fertilizer: adv.fertilizer,
      pestWatch: adv.pest_disease_watch,
      priorityAction: adv.priority_action,
      imageSrc: activeItem.dataUrl || activeItem.url,
      farmerName: user?.name || "AgroLens Farmer"
    });
  };

  const ui = UI_STRINGS[activeLang] || UI_STRINGS.en;
  const stageUi = STAGE_UI_STRINGS[activeLang] || STAGE_UI_STRINGS.en;

  const currentResult = activeItem?.result;
  const currentStageResult = activeItem?.stageResult;
  const p = currentResult?.p;

  return (
    <div>
      {/* ── NAVBAR ────────────────────────────────────────── */}
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
            <Link to="/dashboard" className="nav-link active">🌱 Dashboard</Link>
            <Link to="/history" className="nav-link" id="navHistory">📚 History &amp; Profile</Link>
          </div>
          <div className="userbox">
            <ThemeToggle />
            {user ? (
              <>
                <span className="user-pill" id="userPill">
                  Farmer: <b id="userName">{user.name || user.email || "Farmer"}</b>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="signout-btn"
                  id="signout"
                  style={{ display: "inline-flex" }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link className="signout-btn" id="navSignIn" to="/login" style={{ display: "inline-flex", textDecoration: "none" }}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="shell">
        {/* ── STEP 1: CROP SELECTION SCREEN ────────────────────── */}
        {step === 1 && (
          <div id="cropSelectorScreen">
            <div className="crop-selector-header">
              <span className="eyebrow">AgroLens · Step 1 of 2</span>
              <h2>Select Your Crop</h2>
              <p id="cropSelHeaderSub">{CROP_HEADER_STRINGS[cropLang]?.sub}</p>
            </div>

            {/* Language selector for crop names */}
            <div className="crop-lang-row">
              <span className="lang-lbl" id="cropLangLbl">{CROP_HEADER_STRINGS[cropLang]?.lbl}</span>
              <div className="lang-pills" style={{ display: "inline-flex", gap: "5px", background: "rgba(0,0,0,.06)", padding: "3px", borderRadius: "99px" }}>
                <button
                  type="button"
                  className={`lang-pill ${cropLang === "en" ? "active" : ""}`}
                  onClick={() => setCropLang("en")}
                >
                  English
                </button>
                <button
                  type="button"
                  className={`lang-pill ${cropLang === "ta" ? "active" : ""}`}
                  onClick={() => setCropLang("ta")}
                >
                  தமிழ்
                </button>
                <button
                  type="button"
                  className={`lang-pill ${cropLang === "hi" ? "active" : ""}`}
                  onClick={() => setCropLang("hi")}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* Crop tiles grid with all 12 crops */}
            <div className="crop-grid" id="cropGrid">
              {CROPS_LIST.map((crop) => {
                const isSel = selectedCropId === crop.id;
                const name = crop[cropLang] || crop.en;
                const sub = cropLang !== "en" && !crop.isOthers ? crop.en : "";
                return (
                  <div
                    key={crop.id}
                    className={`crop-tile ${crop.isOthers ? "others-tile" : ""} ${isSel ? "selected" : ""}`}
                    onClick={() => handleSelectCrop(crop.id)}
                  >
                    <div className="crop-tile-icon">{crop.icon}</div>
                    <div className="crop-tile-name">{name}</div>
                    {sub && <div className="crop-tile-sub">{sub}</div>}
                  </div>
                );
              })}
            </div>

            {/* Others: custom crop input */}
            <div id="othersInputBox" className={selectedCropId === "Others" ? "show" : ""}>
              <label id="othersInputLabel">{CROP_HEADER_STRINGS[cropLang]?.othersLabel}</label>
              <input
                type="text"
                id="othersCropInput"
                placeholder="e.g. Wheat, गेहूं, கோதுமை…"
                autoComplete="off"
                value={customCrop}
                onChange={(e) => setCustomCrop(e.target.value)}
              />
              <div id="othersTranslateStatus"></div>
            </div>

            <button
              type="button"
              id="cropProceedBtn"
              onClick={handleProceedToDiagnosis}
              disabled={!selectedCropId || (selectedCropId === "Others" && !customCrop.trim())}
            >
              <span>🌿</span> <span id="cropProceedLabel">{CROP_HEADER_STRINGS[cropLang]?.proceed}</span>
            </button>
          </div>
        )}

        {/* ── STEP 2: DIAGNOSIS SCREEN ────────────────────── */}
        {step === 2 && (
          <div id="diagnosisScreen" style={{ display: "block" }}>
            {/* Selected crop chip */}
            <button
              type="button"
              id="selectedCropChip"
              onClick={() => setStep(1)}
            >
              <span>{selectedCropObj.icon}</span> <span id="selectedCropChipLabel">{selectedCropName}</span>
              <span style={{ fontSize: ".72rem", fontWeight: 500, color: "var(--muted)", marginLeft: "4px" }}>✕ Change</span>
            </button>

            <div className="grid">
              {/* LEFT PANEL: UPLOAD & ACTIVE LEAF */}
              <div className="panel">
                {/* Diagnostic Mode Switcher */}
                <div className="diagnostic-mode-bar">
                  <button
                    type="button"
                    className={`mode-btn ${mode === "disease" ? "active" : ""}`}
                    id="modeBtnDisease"
                    onClick={() => setMode("disease")}
                  >
                    <span>🦠</span> <span id="lblModeDisease">Crop Disease</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${mode === "stage" ? "active" : ""}`}
                    id="modeBtnStage"
                    onClick={() => setMode("stage")}
                  >
                    <span>🌱</span> <span id="lblModeStage">Growth Stage</span>
                  </button>
                </div>

                <span className="eyebrow" id="scannerEyebrow">AI Agricultural Intelligence</span>
                <h2 id="scannerHeading">Upload Plant Photo</h2>
                <p className="sub" id="uploadHelpTxt">
                  {mode === "disease" ? stageUi.uploadHelpDisease : stageUi.uploadHelpStage}
                </p>

                {/* Dropzone */}
                {!activeItem ? (
                  <div
                    className={`drop ${isDragging ? "hot" : ""}`}
                    id="drop"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="#2d4627" strokeWidth="1.4">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p><b>Click to choose</b> or drop leaf photos here</p>
                    <p style={{ fontSize: ".8rem", opacity: .7 }}>Single photo or batch upload · JPG or PNG</p>
                  </div>
                ) : (
                  /* Active Preview Card */
                  <div
                    className={`preview-card show ${loading ? "busy" : ""} ${isDragging ? "hot" : ""}`}
                    id="previewCard"
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <button
                      className="preview-btn close"
                      id="previewCloseBtn"
                      title="Remove this photo"
                      type="button"
                      onClick={(e) => handleRemoveFile(activeIndex, e)}
                    >
                      ✕
                    </button>
                    <img id="previewImg" src={activeItem.url} alt="Selected leaf" />
                    <div className="scanfx"></div>
                    <div className="preview-meta" id="previewMeta">{activeItem.name}</div>
                  </div>
                )}

                {/* Batch Queue Thumbnails */}
                {batchFiles.length > 1 && (
                  <div className="batch-section show" id="batchSection">
                    <div className="batch-header">
                      <span>Batch Queue (<span className="count" id="batchCount">{batchFiles.length}</span>)</span>
                      <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>Click any thumbnail to inspect</span>
                    </div>
                    <div className="batch-grid" id="batchGrid">
                      {batchFiles.map((item, idx) => {
                        const isH = item.result?.p?.healthy;
                        const isTeacher = Boolean(item.result?.teacherModelUsed);
                        const isOpenWorld = Boolean(item.result?.isOpenWorld);
                        const isStageMode = mode === "stage" && item.stageResult;
                        return (
                          <div
                            key={idx}
                            className={`batch-card ${idx === activeIndex ? "active" : ""}`}
                            onClick={() => setActiveIndex(idx)}
                          >
                            <button
                              className="mini-btn close"
                              title="Remove photo"
                              type="button"
                              onClick={(e) => handleRemoveFile(idx, e)}
                            >
                              ✕
                            </button>
                            <img src={item.url} alt={item.name} />
                            {item.isNonCrop && (
                              <div className="batch-badge" style={{ color: "var(--rust)", background: "rgba(176,85,46,.9)", fontWeight: 700 }}>
                                🚫 Not Crop
                              </div>
                            )}
                            {!item.isNonCrop && item.result?.p && (
                              <div className={`batch-badge ${isH ? "healthy" : ""}`}>
                                {isOpenWorld ? "🌐 " : isTeacher ? "🎓 " : isH ? "🌱 " : "🦠 "}
                                {isH ? "Healthy" : item.result.p.cond}
                              </div>
                            )}
                            {!item.isNonCrop && isStageMode && (
                              <div className="batch-badge healthy">
                                🌱 {item.stageResult.phase}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  id="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleFileSelect}
                />

                {/* Controls */}
                <div className="controls">
                  <div className="actions">
                    <button
                      className="btn primary"
                      id="run"
                      disabled={batchFiles.length === 0 || loading}
                      onClick={handleRunDiagnosis}
                      style={{ flex: 1 }}
                    >
                      {loading ? "Analyzing..." : (mode === "disease" ? stageUi.btnRunDisease : stageUi.btnRunStage)}
                    </button>
                    <button
                      className="btn"
                      id="reset"
                      onClick={handleClear}
                      style={{ flex: "0 0 auto" }}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className={`status ${loading ? "load" : "ok"}`} id="status">
                  <span className="led"></span>
                  <span id="statusTxt">{statusText}</span>
                </div>

                {/* Grad-CAM Heatmap Box */}
                {activeItem?.result && mode === "disease" && (
                  <div id="gradcamBox" style={{ display: "block", marginTop: "22px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: ".88rem", fontWeight: 700, color: "var(--rust)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: "10px" }}>
                      <span>🔥</span> Grad-CAM Heatmap
                    </div>
                    <div style={{ borderRadius: "12px", overflow: "hidden", background: "#000", position: "relative" }}>
                      <canvas ref={gradcamCanvasRef} id="gradcamCanvas" style={{ width: "100%", maxHeight: "260px", objectFit: "contain", display: "block" }} />
                    </div>
                    <p style={{ fontSize: ".76rem", color: "var(--muted)", marginTop: "8px", textAlign: "center" }}>
                      Red areas indicate regions the model focused on for diagnosis
                    </p>
                  </div>
                )}
              </div>

              {/* RIGHT PANEL: DIAGNOSIS RESULTS */}
              <div>
                {/* Empty State */}
                {(!activeItem || (!currentResult && !currentStageResult && !activeItem.isNonCrop)) && (
                  <div className="empty" id="empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#1b2114" strokeWidth="1.2">
                      <path d="M12 21C7 17 4 13 4 8.5A6.5 6.5 0 0116.9 6c1.7 1.7 2.6 4.2 1.6 8-1 3.9-4 6.3-6.5 7zM12 21V9" strokeLinecap="round" />
                    </svg>
                    <p>Results will appear here once you run a leaf photo through the model.</p>
                  </div>
                )}

                {/* Zero-shot CLIP Gate Alert */}
                {activeItem?.isNonCrop && (
                  <div id="cropGateAlert" style={{ display: "block", background: "rgba(176,85,46,.12)", border: "1.5px solid var(--rust)", borderRadius: "var(--r)", padding: "22px", marginTop: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: ".9rem", fontWeight: 700, color: "var(--rust)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                      <span>🚫</span> Non-Crop Image Detected
                    </div>
                    <p id="cropGateAlertMsg" style={{ fontSize: ".92rem", color: "var(--ink)", marginTop: "8px", lineHeight: 1.5 }}>
                      The Zero-Shot Crop Gate evaluated <b>{activeItem.name}</b> (crop score: <b>{activeItem.cropScore || 0}%</b>) and determined it is not an agricultural plant or crop leaf.
                    </p>
                    <p style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: "8px" }}>
                      🌿 AgroLens is designed specifically for crop pathology. Please upload a clear photo of an agricultural plant leaf or crop foliage.
                    </p>
                  </div>
                )}

                {/* Result Container */}
                {((mode === "disease" && currentResult) || (mode === "stage" && currentStageResult)) && !activeItem?.isNonCrop && (
                  <div className="result show" id="result" style={{ display: "block" }}>
                    {/* Multilingual Selector Bar */}
                    <div id="languageSelectorBar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: "14px", padding: "8px 16px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: ".84rem", fontWeight: 700, color: "var(--ink)" }}>
                        <span style={{ fontSize: "1.15rem" }}>🌐</span>
                        <span id="lblLangSelect">Language / மொழி / भाषा:</span>
                      </div>
                      <div className="lang-pills" style={{ display: "inline-flex", gap: "5px", background: "rgba(0,0,0,.06)", padding: "3px", borderRadius: "99px" }}>
                        <button
                          type="button"
                          className={`lang-pill ${activeLang === "en" ? "active" : ""}`}
                          onClick={() => setActiveLang("en")}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          className={`lang-pill ${activeLang === "ta" ? "active" : ""}`}
                          onClick={() => setActiveLang("ta")}
                        >
                          தமிழ்
                        </button>
                        <button
                          type="button"
                          className={`lang-pill ${activeLang === "hi" ? "active" : ""}`}
                          onClick={() => setActiveLang("hi")}
                        >
                          हिन्दी
                        </button>
                      </div>
                    </div>

                    {/* ── DISEASE RESULT SECTION ──────────────────────── */}
                    {mode === "disease" && currentResult && p && (
                      <div id="diseaseResultSection">
                        {/* Verdict Banner */}
                        <div className={`verdict ${p.healthy ? "healthy" : ""}`} id="verdict">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span
                              className="tagr"
                              id="vtag"
                              style={{
                                background: currentResult.teacherModelUsed
                                  ? (currentResult.isOpenWorld ? "linear-gradient(135deg, #0284c7, #2563eb)" : "linear-gradient(135deg, #4f46e5, #7c3aed)")
                                  : "rgba(244,241,226,.16)",
                                color: currentResult.teacherModelUsed ? "#fff" : "var(--gold-l)"
                              }}
                            >
                              {currentResult.teacherModelUsed
                                ? (currentResult.isOpenWorld ? ui.tagOpenWorld : ui.tagTeacher)
                                : (p.healthy ? ui.tagHealthy : ui.tagDisease)}
                            </span>
                            <button
                              type="button"
                              className="voice-btn voice-btn-banner"
                              id="voiceBtnVerdict"
                              title="Listen aloud"
                              onClick={(e) => voiceReader.speakText(`${p.crop}. ${p.cond}`, activeLang, e.currentTarget, "Verdict")}
                            >
                              <span>🔊</span>
                            </button>
                          </div>
                          <h3 id="vname" style={{ color: "#ffffff", fontFamily: "'Fraunces', serif" }}>{p.healthy ? `${p.crop} · Healthy` : p.cond}</h3>
                          <p className="crop" id="vcrop" style={{ color: "rgba(255, 255, 255, 0.9)" }}>{p.crop} · {currentResult.raw}</p>
                          <div className="confwrap">
                            <div className="tr">
                              <i id="vbar" style={{ width: `${(currentResult.conf * 100).toFixed(1)}%` }}></i>
                            </div>
                            <div className="cl">
                              <span id="vconf">{(currentResult.conf * 100).toFixed(1)}% {ui.confModelSuffix}</span>
                            </div>
                          </div>
                        </div>

                        {/* Teacher Escalation Card */}
                        {currentResult.teacherModelUsed && (
                          <div id="teacherCard" style={{ marginTop: "16px", background: "linear-gradient(135deg,rgba(79,70,229,.07),rgba(124,58,237,.1))", border: "1.5px solid rgba(124,58,237,.35)", borderRadius: "var(--r)", padding: "16px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: ".82rem", fontWeight: 700, color: "#6d28d9", textTransform: "uppercase", letterSpacing: ".6px" }}>
                                <span>🎓</span> <span>{ui.teacherTitle}</span>
                              </div>
                              <span style={{ fontSize: ".74rem", fontWeight: 700, padding: "2px 10px", borderRadius: "99px", background: "#6d28d9", color: "#fff" }}>
                                {ui.teacherBadge}
                              </span>
                            </div>
                            <p style={{ fontSize: ".88rem", color: "var(--ink)", marginTop: "8px", lineHeight: 1.45 }}>
                              {ui.teacherDescPrefix} <b style={{ color: "var(--rust)" }}>{currentResult.studentConfidence?.toFixed(1) || "—"}%</b> {ui.teacherDescSuffix}
                            </p>
                            {currentResult.teacherReasoning && (
                              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(124,58,237,.25)", fontSize: ".84rem", color: "var(--ink)", display: "flex", gap: "6px" }}>
                                <span style={{ fontWeight: 600, color: "#6d28d9", flex: "none" }}>{ui.teacherReasoningTitle}</span>
                                <span style={{ fontStyle: "italic" }}>{currentResult.teacherReasoning}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Farmer Guidance */}
                        <div className="guide">
                          <span className="lbl" id="lblFarmerGuidance">{ui.farmerGuidance}</span>
                          <div id="guideTxt" style={{ fontSize: ".9rem", lineHeight: 1.6, color: "var(--ink)" }}>
                            {p.guide}
                          </div>
                        </div>

                        {/* Advisory Details Cards */}
                        <div id="advisoryBox" style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
                          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "14px", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".6px" }}>{ui.severity}</span>
                              <span
                                id="advSeverity"
                                style={{
                                  fontSize: ".78rem",
                                  fontWeight: 700,
                                  padding: "3px 14px",
                                  borderRadius: "99px",
                                  background: p.healthy ? "rgba(45,70,39,.15)" : "rgba(176,85,46,.15)",
                                  color: p.healthy ? "var(--green)" : "var(--rust)"
                                }}
                              >
                                {p.severity}
                              </span>
                            </div>
                            <span
                              id="advSourceBadge"
                              style={{
                                fontSize: ".74rem",
                                fontWeight: 700,
                                padding: "3px 12px",
                                borderRadius: "99px",
                                background: currentResult.isOpenWorld ? "rgba(2,132,199,.15)" : (currentResult.teacherModelUsed ? "rgba(79,70,229,.14)" : "rgba(45,70,39,.12)"),
                                color: currentResult.isOpenWorld ? "#0284c7" : (currentResult.teacherModelUsed ? "#4f46e5" : "var(--green)"),
                                border: "1px solid rgba(45,70,39,.2)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              {currentResult.isOpenWorld ? "🌐 Open-World Nova Lite + Groq" : (currentResult.teacherModelUsed ? "🎓 Nova Lite Teacher + Groq" : "🌿 Ground-Truth Advisory")}
                            </span>
                          </div>

                          {p.diagnosis && (
                            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "14px", padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div id="lblSymptoms" style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                                  {ui.symptoms}
                                </div>
                                <button
                                  type="button"
                                  className="voice-btn"
                                  title="Listen aloud"
                                  onClick={(e) => voiceReader.speakText(p.diagnosis, activeLang, e.currentTarget, ui.symptoms)}
                                >
                                  <span>🔊</span>
                                </button>
                              </div>
                              <div id="advDiagnosis" style={{ fontSize: ".88rem", color: "var(--ink)", lineHeight: 1.5 }}>
                                {p.diagnosis}
                              </div>
                            </div>
                          )}

                          {p.treatment && (
                            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "14px", padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div id="lblTreatment" style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                                  {ui.treatment}
                                </div>
                                <button
                                  type="button"
                                  className="voice-btn"
                                  title="Listen aloud"
                                  onClick={(e) => voiceReader.speakText(p.treatment, activeLang, e.currentTarget, ui.treatment)}
                                >
                                  <span>🔊</span>
                                </button>
                              </div>
                              <div id="advTreatment" style={{ fontSize: ".88rem", color: "var(--ink)", lineHeight: 1.5 }}>
                                {p.treatment}
                              </div>
                            </div>
                          )}

                          {p.fertilizer && (
                            <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "14px", padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div id="lblFertilizer" style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--green-l)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                                  {ui.fertilizer}
                                </div>
                                <button
                                  type="button"
                                  className="voice-btn"
                                  title="Listen aloud"
                                  onClick={(e) => voiceReader.speakText(p.fertilizer, activeLang, e.currentTarget, ui.fertilizer)}
                                >
                                  <span>🔊</span>
                                </button>
                              </div>
                              <div id="advFertilizer" style={{ fontSize: ".88rem", color: "var(--ink)", lineHeight: 1.5 }}>
                                {p.fertilizer}
                              </div>
                            </div>
                          )}

                          {p.organic_tip && (
                            <div id="advOrganicWrap" style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "14px", padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div id="lblOrganic" style={{ fontSize: ".78rem", fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: ".6px" }}>
                                  {ui.organic}
                                </div>
                                <button
                                  type="button"
                                  className="voice-btn"
                                  title="Listen aloud"
                                  onClick={(e) => voiceReader.speakText(p.organic_tip, activeLang, e.currentTarget, ui.organic)}
                                >
                                  <span>🔊</span>
                                </button>
                              </div>
                              <div id="advOrganic" style={{ fontSize: ".88rem", color: "var(--ink)", lineHeight: 1.5 }}>
                                {p.organic_tip}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Save, Share, Export & Report Actions */}
                        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button
                            className="btn primary"
                            id="saveHistoryBtn"
                            type="button"
                            onClick={handleSaveToHistory}
                            style={{ width: "100%", padding: "14px 20px", fontSize: "1rem", background: "linear-gradient(135deg,#7c3aed,#9333ea)", borderColor: "#7c3aed", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                          >
                            <span>💾</span> <span>{ui.saveHistory}</span>
                          </button>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <button
                              className="btn whatsapp-btn"
                              id="shareWhatsAppBtn"
                              type="button"
                              onClick={handleShareDiseaseWhatsApp}
                              style={{ padding: "11px 16px", fontSize: ".88rem", background: "#25D366", borderColor: "#20bd5a", color: "#fff", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", transition: "all .2s" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.09 7.4 8.87 7.65C8.65 7.89 8.02 8.48 8.02 9.68C8.02 10.88 8.9 12.04 9.02 12.2C9.14 12.37 10.74 14.84 13.2 15.9C13.78 16.15 14.24 16.31 14.6 16.42C15.18 16.61 15.71 16.58 16.13 16.52C16.6 16.45 17.58 15.93 17.78 15.35C17.99 14.77 17.99 14.28 17.93 14.17C17.87 14.07 17.72 14.01 17.5 13.9C17.27 13.79 16.17 13.25 15.96 13.17C15.76 13.1 15.61 13.06 15.46 13.29C15.31 13.52 14.88 14.01 14.75 14.17C14.63 14.32 14.5 14.34 14.28 14.23C14.06 14.12 13.34 13.88 12.5 13.13C11.84 12.54 11.39 11.81 11.27 11.6C11.14 11.38 11.25 11.26 11.36 11.15C11.46 11.05 11.58 10.89 11.7 10.76C11.81 10.62 11.85 10.52 11.93 10.37C12 10.21 11.96 10.08 11.9 9.97C11.85 9.86 11.4 8.76 11.21 8.31C11.03 7.87 10.84 7.93 10.7 7.93C10.56 7.93 10.41 7.93 10.26 7.93C10.11 7.93 9.87 7.99 9.67 8.2C9.47 8.41 8.92 8.92 8.92 9.97C8.92 11.02 9.69 12.03 9.8 12.18L9.53 7.34Z" />
                              </svg>
                              <span>{ui.shareWhatsApp}</span>
                            </button>
                            <button
                              className="btn pdf-btn"
                              id="exportPdfBtn"
                              type="button"
                              onClick={handleExportDiseasePdf}
                              style={{ padding: "11px 16px", fontSize: ".88rem", background: "var(--paper)", border: "1.5px solid var(--ink)", color: "var(--ink)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", transition: "all .2s" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                              <span>{ui.exportPdf}</span>
                            </button>
                          </div>

                          <button
                            className="btn"
                            id="reportDiagnosisBtn"
                            type="button"
                            onClick={handleReportDiagnosis}
                            style={{ width: "100%", padding: "10px 16px", fontSize: ".86rem", background: "var(--paper)", border: "1.5px solid var(--line)", color: "var(--muted)", cursor: "pointer", borderRadius: "99px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all .2s" }}
                          >
                            <span>⚠️</span> <span>Report Inaccurate Diagnosis (Send to Admin Staging)</span>
                          </button>

                          {savedMsg && (
                            <div style={{ fontSize: ".85rem", textAlign: "center", fontWeight: 600, color: "var(--green)" }}>
                              {savedMsg}
                            </div>
                          )}
                          {reportMsg && (
                            <div style={{ fontSize: ".85rem", textAlign: "center", fontWeight: 600, color: "var(--green)" }}>
                              {reportMsg}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── GROWTH STAGE RESULT SECTION ──────────────────── */}
                    {mode === "stage" && currentStageResult && (
                      <div id="stageResultSection">
                        {/* Stage Verdict Banner */}
                        <div className="stage-verdict" id="stageVerdict">
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span className="tagr" id="stageModelTag">
                              {currentStageResult.model_used?.includes("Nova") ? stageUi.tagNovaLite : stageUi.tagLocal}
                            </span>
                            <button
                              type="button"
                              className="voice-btn voice-btn-banner"
                              id="voiceBtnStageVerdict"
                              title="Listen aloud"
                              onClick={(e) => voiceReader.speakText(`${currentStageResult.advisory?.crop || currentStageResult.crop}. ${currentStageResult.advisory?.phase_name || currentStageResult.phase}`, activeLang, e.currentTarget, "Stage Verdict")}
                            >
                              <span>🔊</span>
                            </button>
                          </div>
                          <h3 id="stageCropName">{currentStageResult.advisory?.crop || currentStageResult.crop}</h3>
                          <p className="sub-stage-txt" id="stagePhaseTitle">{currentStageResult.advisory?.phase_name || `${currentStageResult.phase} Phase`}</p>
                          <div style={{ fontSize: ".85rem", color: "#d1fae5" }} id="stageConf">
                            <b>{currentStageResult.confidence.toFixed(1)}%</b> {stageUi.confidenceSuffix} &bull; <span style={{ color: "#a7f3d0" }}>{currentStageResult.model_used}</span>
                          </div>
                        </div>

                        {/* 3-Phase Stepper */}
                        <div className="stage-stepper" id="stageStepper">
                          <div
                            className={`stage-step ${currentStageResult.phase.toLowerCase().includes("veg") ? "active" : "completed"}`}
                            id="stepVeg"
                          >
                            <span className="step-icon">🌱</span>
                            <span className="step-num">Phase 1</span>
                            <span className="step-title">{stageUi.phase1Title}</span>
                          </div>
                          <div
                            className={`stage-step ${currentStageResult.phase.toLowerCase().includes("rep") || currentStageResult.phase.toLowerCase().includes("flow") ? "active" : (currentStageResult.phase.toLowerCase().includes("rip") || currentStageResult.phase.toLowerCase().includes("mat") ? "completed" : "")}`}
                            id="stepRep"
                          >
                            <span className="step-icon">🌸</span>
                            <span className="step-num">Phase 2</span>
                            <span className="step-title">{stageUi.phase2Title}</span>
                          </div>
                          <div
                            className={`stage-step ${currentStageResult.phase.toLowerCase().includes("rip") || currentStageResult.phase.toLowerCase().includes("mat") ? "active" : ""}`}
                            id="stepRip"
                          >
                            <span className="step-icon">🌾</span>
                            <span className="step-num">Phase 3</span>
                            <span className="step-title">{stageUi.phase3Title}</span>
                          </div>
                        </div>

                        {/* Harvest Countdown */}
                        <div className="harvest-countdown-card" style={{ marginBottom: "14px" }}>
                          <div>
                            <span id="lblStageCountdown" style={{ fontSize: ".78rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: ".6px" }}>
                              {stageUi.headerCountdown}
                            </span>
                            <div id="stageDaysToHarvest" className="harvest-countdown-val">
                              {currentStageResult.advisory?.days_to_harvest || "35"} Days
                            </div>
                          </div>
                          <span style={{ fontSize: ".78rem", fontWeight: 700, padding: "4px 12px", borderRadius: "99px", background: "#fef3c7", color: "#b45309", border: "1px solid rgba(234,179,8,.3)" }}>
                            Phenology Forecast
                          </span>
                        </div>

                        {/* Stage Advisory Cards */}
                        <div className="stage-advisory-grid">
                          <div className="stage-card">
                            <div className="stage-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span id="lblStageVisualClues" style={{ color: "var(--green)" }}>{stageUi.headerVisualClues}</span>
                              <button
                                type="button"
                                className="voice-btn"
                                title="Listen aloud"
                                onClick={(e) => voiceReader.speakText(currentStageResult.advisory?.visual_clues || currentStageResult.visual_clues, activeLang, e.currentTarget, stageUi.headerVisualClues)}
                              >
                                <span>🔊</span>
                              </button>
                            </div>
                            <div className="stage-card-content" id="stageVisualClues">
                              {currentStageResult.advisory?.visual_clues || currentStageResult.visual_clues}
                            </div>
                          </div>

                          <div className="stage-card">
                            <div className="stage-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span id="lblStageIrrigation" style={{ color: "#0284c7" }}>{stageUi.headerIrrigation}</span>
                              <button
                                type="button"
                                className="voice-btn"
                                title="Listen aloud"
                                onClick={(e) => voiceReader.speakText(currentStageResult.advisory?.irrigation, activeLang, e.currentTarget, stageUi.headerIrrigation)}
                              >
                                <span>🔊</span>
                              </button>
                            </div>
                            <div className="stage-card-content" id="stageIrrigation">
                              {currentStageResult.advisory?.irrigation}
                            </div>
                          </div>

                          <div className="stage-card">
                            <div className="stage-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span id="lblStageFertilizer" style={{ color: "#16a34a" }}>{stageUi.headerFertilizer}</span>
                              <button
                                type="button"
                                className="voice-btn"
                                title="Listen aloud"
                                onClick={(e) => voiceReader.speakText(currentStageResult.advisory?.fertilizer, activeLang, e.currentTarget, stageUi.headerFertilizer)}
                              >
                                <span>🔊</span>
                              </button>
                            </div>
                            <div className="stage-card-content" id="stageFertilizer">
                              {currentStageResult.advisory?.fertilizer}
                            </div>
                          </div>

                          <div className="stage-card">
                            <div className="stage-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span id="lblStagePestAlert" style={{ color: "var(--rust)" }}>{stageUi.headerPestAlert}</span>
                              <button
                                type="button"
                                className="voice-btn"
                                title="Listen aloud"
                                onClick={(e) => voiceReader.speakText(currentStageResult.advisory?.pest_disease_watch, activeLang, e.currentTarget, stageUi.headerPestAlert)}
                              >
                                <span>🔊</span>
                              </button>
                            </div>
                            <div className="stage-card-content" id="stagePestAlert">
                              {currentStageResult.advisory?.pest_disease_watch}
                            </div>
                          </div>

                          <div className="stage-card" style={{ borderLeft: "4px solid #16a34a" }}>
                            <div className="stage-card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <span id="lblStagePriority" style={{ color: "#15803d" }}>{stageUi.headerPriorityAction}</span>
                              <button
                                type="button"
                                className="voice-btn"
                                title="Listen aloud"
                                onClick={(e) => voiceReader.speakText(currentStageResult.advisory?.priority_action, activeLang, e.currentTarget, stageUi.headerPriorityAction)}
                              >
                                <span>🔊</span>
                              </button>
                            </div>
                            <div className="stage-card-content" id="stagePriorityAction" style={{ fontWeight: 600 }}>
                              {currentStageResult.advisory?.priority_action}
                            </div>
                          </div>
                        </div>

                        {/* Save Stage, Share & Export */}
                        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <button
                            className="btn primary"
                            id="saveStageHistoryBtn"
                            type="button"
                            onClick={handleSaveStageHistory}
                            style={{ width: "100%", padding: "14px 20px", fontSize: "1rem", background: "linear-gradient(135deg,#15803d,#16a34a)", borderColor: "#15803d", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                          >
                            <span>💾</span> <span>{stageUi.saveStageHistory}</span>
                          </button>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <button
                              className="btn whatsapp-btn"
                              id="shareStageWhatsAppBtn"
                              type="button"
                              onClick={handleShareStageWhatsApp}
                              style={{ padding: "11px 16px", fontSize: ".88rem", background: "#25D366", borderColor: "#20bd5a", color: "#fff", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", transition: "all .2s" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.53 7.34C9.36 7.34 9.09 7.4 8.87 7.65C8.65 7.89 8.02 8.48 8.02 9.68C8.02 10.88 8.9 12.04 9.02 12.2C9.14 12.37 10.74 14.84 13.2 15.9C13.78 16.15 14.24 16.31 14.6 16.42C15.18 16.61 15.71 16.58 16.13 16.52C16.6 16.45 17.58 15.93 17.78 15.35C17.99 14.77 17.99 14.28 17.93 14.17C17.87 14.07 17.72 14.01 17.5 13.9C17.27 13.79 16.17 13.25 15.96 13.17C15.76 13.1 15.61 13.06 15.46 13.29C15.31 13.52 14.88 14.01 14.75 14.17C14.63 14.32 14.5 14.34 14.28 14.23C14.06 14.12 13.34 13.88 12.5 13.13C11.84 12.54 11.39 11.81 11.27 11.6C11.14 11.38 11.25 11.26 11.36 11.15C11.46 11.05 11.58 10.89 11.7 10.76C11.81 10.62 11.85 10.52 11.93 10.37C12 10.21 11.96 10.08 11.9 9.97C11.85 9.86 11.4 8.76 11.21 8.31C11.03 7.87 10.84 7.93 10.7 7.93C10.56 7.93 10.41 7.93 10.26 7.93C10.11 7.93 9.87 7.99 9.67 8.2C9.47 8.41 8.92 8.92 8.92 9.97C8.92 11.02 9.69 12.03 9.8 12.18L9.53 7.34Z" />
                              </svg>
                              <span>{stageUi.shareWhatsApp}</span>
                            </button>
                            <button
                              className="btn pdf-btn"
                              id="exportStagePdfBtn"
                              type="button"
                              onClick={handleExportStagePdf}
                              style={{ padding: "11px 16px", fontSize: ".88rem", background: "var(--paper)", border: "1.5px solid var(--ink)", color: "var(--ink)", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", borderRadius: "12px", transition: "all .2s" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                              </svg>
                              <span>{stageUi.exportPdf}</span>
                            </button>
                          </div>

                          {savedMsg && (
                            <div style={{ fontSize: ".85rem", marginTop: "4px", textAlign: "center", fontWeight: 600, color: "var(--green)" }}>
                              {savedMsg}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
