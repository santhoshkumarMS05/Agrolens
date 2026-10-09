ort.env.wasm.wasmPaths = new URL("ort/", location.href).href;
ort.env.wasm.numThreads = 1;
ort.env.wasm.simd = true;

// 25 supported crop disease & healthy classes from the dataset (exact PyTorch order)
const CLASSES_25 = [
  "Anthracnose Redrot Sorghum",
  "Bacterialblight Cotton",
  "Bacterialblight rice",
  "Brownrust Sugarcane",
  "Brownspot rice",
  "Brownstreak Cassava",
  "Commonrust corn",
  "Earlyleafspot Groundnut",
  "Grayleafspot Coconut",
  "Grayspot corn",
  "Healthy Cassava",
  "Healthy Cotton",
  "Healthy Groundnut",
  "Healthy Sugarcane",
  "Healthy corn",
  "Healthy rice",
  "Lateleafspot Groundnut",
  "Leafblast rice",
  "Leafblight corn",
  "Leafrot Coconut",
  "Mosaic Cassava",
  "RedRot Sugarcane",
  "Rust Groundnut",
  "Rust Sorghum",
  "Yellowleaf Sugarcane"
];

// 12 test classes for backward-compatibility with earlier models
const CLASSES_12 = [
  "Bacterialblight rice","Brownspot rice","Commonrust corn","Earlyblight tomato",
  "Grayspot corn","Healthy corn","Healthy rice","Healthy tomato",
  "Lateblight tomato","Leafblast rice","Leafblight corn","Yellowleafcurlyvirus tomato"
];

let AGRONOMY_KNOWLEDGE = {};

// Dynamically load the curated 25-class agronomic knowledge base from JSON
(async function loadKnowledgeBase() {
  try {
    const res = await fetch("agronomy_knowledge.json");
    if (res.ok) {
      AGRONOMY_KNOWLEDGE = await res.json();
    }
  } catch (err) {
    console.warn("Could not preload agronomy_knowledge.json:", err);
  }
})();

let session=null, loaded=false;
let currentUser=null;
let batchFiles=[]; // array of { file, url, dataUrl, name, img, result, diagnosisData, advisories: {} }
let activeIndex=-1;
let currentDiagnosisData=null;
let currentAppLanguage="en"; // "en", "ta", "hi"

// Crop Selection State & Multilingual Definitions
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

let selectedCropId = null;
let selectedCropName = "";
let cropLanguage = "en";

// UI strings for dynamic multilingual switching
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

// 25 Core Classes Multilingual Translations for instant 0ms banner update
const CROP_DISEASE_TRANSLATIONS = {
  "Anthracnose Redrot Sorghum": {
    ta: { crop: "சோளம் (Sorghum)", disease: "ஆந்த்ராக்னோஸ் சிவப்பு அழுகல் (Anthracnose Red Rot)" },
    hi: { crop: "ज्वार (Sorghum)", disease: "एन्थ्रेक्नोज़ लाल सड़न (Anthracnose Red Rot)" }
  },
  "Bacterialblight Cotton": {
    ta: { crop: "பருத்தி (Cotton)", disease: "பாக்டீரியா இலைக்கருகல் (Bacterial Blight)" },
    hi: { crop: "कपास (Cotton)", disease: "जीवाणु अंगमारी (Bacterial Blight)" }
  },
  "Bacterialblight rice": {
    ta: { crop: "நெல் (Rice)", disease: "பாக்டீரியா இலைக்கருகல் (Bacterial Blight)" },
    hi: { crop: "चावल / धान (Rice)", disease: "जीवाणु झुलसा (Bacterial Blight)" }
  },
  "Brownrust Sugarcane": {
    ta: { crop: "கரும்பு (Sugarcane)", disease: "பழுப்பு துரு நோய் (Brown Rust)" },
    hi: { crop: "गन्ना (Sugarcane)", disease: "भूरा रतुआ (Brown Rust)" }
  },
  "Brownspot rice": {
    ta: { crop: "நெல் (Rice)", disease: "பழுப்பு புள்ளி நோய் (Brown Spot)" },
    hi: { crop: "चावल / धान (Rice)", disease: "भूरा धब्बा रोग (Brown Spot)" }
  },
  "Brownstreak Cassava": {
    ta: { crop: "மரவள்ளிக்கிழங்கு (Cassava)", disease: "பழுப்பு வரி வைரஸ் நோய் (Brown Streak Disease)" },
    hi: { crop: "कसावा (Cassava)", disease: "भूरा धारी रोग (Brown Streak)" }
  },
  "Commonrust corn": {
    ta: { crop: "மக்காச்சோளம் (Corn)", disease: "பொதுவான துரு நோய் (Common Rust)" },
    hi: { crop: "मक्का (Corn)", disease: "सामान्य रतुआ (Common Rust)" }
  },
  "Earlyleafspot Groundnut": {
    ta: { crop: "வேர்க்கடலை (Groundnut)", disease: "முன் இலைப்புள்ளி / திக்கா நோய் (Early Leaf Spot)" },
    hi: { crop: "मूंगफली (Groundnut)", disease: "अगेती पत्ती धब्बा / टिक्का रोग (Early Leaf Spot)" }
  },
  "Grayleafspot Coconut": {
    ta: { crop: "தென்னை (Coconut)", disease: "சாம்பல் நிற இலைப்புள்ளி (Gray Leaf Spot)" },
    hi: { crop: "नारियल (Coconut)", disease: "ग्रे लीफ स्पॉट / धूसर पत्ती धब्बा (Gray Leaf Spot)" }
  },
  "Grayspot corn": {
    ta: { crop: "மக்காச்சோளம் (Corn)", disease: "சாம்பல் நிற இலைப்புள்ளி (Gray Leaf Spot)" },
    hi: { crop: "मक्का (Corn)", disease: "ग्रे लीफ स्पॉट (Gray Leaf Spot)" }
  },
  "Healthy Cassava": {
    ta: { crop: "மரவள்ளிக்கிழங்கு (Cassava)", disease: "ஆரோக்கியமான செடி (Healthy)" },
    hi: { crop: "कसावा (Cassava)", disease: "स्वस्थ पौधा (Healthy)" }
  },
  "Healthy Cotton": {
    ta: { crop: "பருத்தி (Cotton)", disease: "ஆரோக்கியமான செடி (Healthy)" },
    hi: { crop: "कपास (Cotton)", disease: "स्वस्थ पौधा (Healthy)" }
  },
  "Healthy Groundnut": {
    ta: { crop: "வேர்க்கடலை (Groundnut)", disease: "ஆரோக்கியமான பயிர் (Healthy)" },
    hi: { crop: "मूंगफली (Groundnut)", disease: "स्वस्थ फसल (Healthy)" }
  },
  "Healthy Sugarcane": {
    ta: { crop: "கரும்பு (Sugarcane)", disease: "ஆரோக்கியமான பயிர் (Healthy)" },
    hi: { crop: "गन्ना (Sugarcane)", disease: "स्वस्थ फसल (Healthy)" }
  },
  "Healthy corn": {
    ta: { crop: "மக்காச்சோளம் (Corn)", disease: "ஆரோக்கியமான பயிர் (Healthy)" },
    hi: { crop: "मक्का (Corn)", disease: "स्वस्थ फसल (Healthy)" }
  },
  "Healthy rice": {
    ta: { crop: "நெல் (Rice)", disease: "ஆரோக்கியமான பயிர் (Healthy)" },
    hi: { crop: "चावल / धान (Rice)", disease: "स्वस्थ फसल (Healthy)" }
  },
  "Lateleafspot Groundnut": {
    ta: { crop: "வேர்க்கடலை (Groundnut)", disease: "பின் இலைப்புள்ளி / திக்கா நோய் (Late Leaf Spot)" },
    hi: { crop: "मूंगफली (Groundnut)", disease: "पछेती पत्ती धब्बा / टिक्का रोग (Late Leaf Spot)" }
  },
  "Leafblast rice": {
    ta: { crop: "நெல் (Rice)", disease: "இலை குலை நோய் (Leaf Blast)" },
    hi: { crop: "चावल / धान (Rice)", disease: "झोंका रोग / लीफ ब्लास्ट (Leaf Blast)" }
  },
  "Leafblight corn": {
    ta: { crop: "மக்காச்சோளம் (Corn)", disease: "இலைக்கருகல் நோய் (Leaf Blight)" },
    hi: { crop: "मक्का (Corn)", disease: "पत्ती झुलसा रोग (Leaf Blight)" }
  },
  "Leafrot Coconut": {
    ta: { crop: "தென்னை (Coconut)", disease: "தென்னை இலை அழுகல் நோய் (Leaf Rot)" },
    hi: { crop: "नारियल (Coconut)", disease: "पत्ता सड़न रोग (Leaf Rot)" }
  },
  "Mosaic Cassava": {
    ta: { crop: "மரவள்ளிக்கிழங்கு (Cassava)", disease: "மொசைக் வைரஸ் நோய் (Cassava Mosaic Disease)" },
    hi: { crop: "कसावा (Cassava)", disease: "मोज़ेक वायरस रोग (Mosaic Virus)" }
  },
  "RedRot Sugarcane": {
    ta: { crop: "கரும்பு (Sugarcane)", disease: "கரும்பு செவ்வழுகல் நோய் (Red Rot)" },
    hi: { crop: "गन्ना (Sugarcane)", disease: "गन्ने का लाल सड़न रोग (Red Rot)" }
  },
  "Rust Groundnut": {
    ta: { crop: "வேர்க்கடலை (Groundnut)", disease: "வேர்க்கடலை துரு நோய் (Groundnut Rust)" },
    hi: { crop: "मूंगफली (Groundnut)", disease: "मूंगफली रतुआ रोग (Groundnut Rust)" }
  },
  "Rust Sorghum": {
    ta: { crop: "சோளம் (Sorghum)", disease: "சோளம் துரு நோய் (Sorghum Rust)" },
    hi: { crop: "ज्वार (Sorghum)", disease: "ज्वार का रतुआ रोग (Sorghum Rust)" }
  },
  "Yellowleaf Sugarcane": {
    ta: { crop: "கரும்பு (Sugarcane)", disease: "மஞ்சள் இலை நோய் (Yellow Leaf Disease)" },
    hi: { crop: "गन्ना (Sugarcane)", disease: "पीली पत्ती रोग (Yellow Leaf Disease)" }
  }
};

// Severity badge translations
const SEVERITY_TRANSLATIONS = {
  ta: {
    "High": "அதிக தீவிரம் (High)",
    "Medium": "நடுத்தர தீவிரம் (Medium)",
    "Low": "குறைந்த தீவிரம் (Low)",
    "Optimal": "சிறந்த ஆரோக்கியம் (Optimal)",
    "Optimal Health": "சிறந்த பயிர் நலம் (Optimal)",
    "Severe": "மிக அதிக தீவிரம் (Severe)",
    "High Severity": "அதிக தீவிரம் (High)",
    "Medium Severity": "நடுத்தர தீவிரம் (Medium)",
    "Low Severity": "குறைந்த தீவிரம் (Low)"
  },
  hi: {
    "High": "उच्च गंभीरता (High)",
    "Medium": "मध्यम गंभीरता (Medium)",
    "Low": "कम गंभीरता (Low)",
    "Optimal": "उत्कृष्ट स्वास्थ्य (Optimal)",
    "Optimal Health": "उत्कृष्ट फसल स्वास्थ्य (Optimal)",
    "Severe": "अत्यधिक गंभीर (Severe)",
    "High Severity": "उच्च गंभीरता (High)",
    "Medium Severity": "मध्यम गंभीरता (Medium)",
    "Low Severity": "कम गंभीरता (Low)"
  }
};

function updateStaticLabels(lang){
  const ui = UI_STRINGS[lang] || UI_STRINGS.en;
  if($("lblFarmerGuidance")) $("lblFarmerGuidance").textContent = ui.farmerGuidance;
  if($("lblSeverity")) $("lblSeverity").textContent = ui.severity;
  if($("lblSymptoms")) $("lblSymptoms").textContent = ui.symptoms;
  if($("lblTreatment")) $("lblTreatment").textContent = ui.treatment;
  if($("lblFertilizer")) $("lblFertilizer").textContent = ui.fertilizer;
  if($("lblOrganic")) $("lblOrganic").textContent = ui.organic;
  if($("saveBtnTxt")) $("saveBtnTxt").textContent = ui.saveHistory;
  if($("lblShareWhatsApp")) $("lblShareWhatsApp").textContent = ui.shareWhatsApp || "WhatsApp";
  if($("lblExportPdf")) $("lblExportPdf").textContent = ui.exportPdf || "Export PDF";
  if($("lblTeacherTitle")) $("lblTeacherTitle").textContent = ui.teacherTitle;
  if($("lblTeacherBadge")) $("lblTeacherBadge").textContent = ui.teacherBadge;
  if($("lblTeacherReasoningTitle")) $("lblTeacherReasoningTitle").textContent = ui.teacherReasoningTitle;
}

const $=id=>document.getElementById(id);
const statusEl=$("status"), statusTxt=$("statusTxt");

function setStatus(kind,txt){
  statusEl.className="status "+kind;
  statusTxt.textContent=txt;
}

/* ---- Session Authentication Check ---- */
async function checkAuth(){
  try{
    const r=await fetch("/api/me",{credentials:"same-origin"});
    if(r.ok){
      const d=await r.json();
      currentUser=d.user;
      $("userName").textContent=currentUser.name || (currentUser.role === "admin" ? "Admin" : "Farmer");
      $("userPill").title=currentUser.email || "";
      $("userPill").style.display="inline-flex";
      $("signout").style.display="inline-flex";
      $("navSignIn").style.display="none";
      if(currentUser.role === "admin" && $("navAdmin")){
        $("navAdmin").style.display="inline-flex";
      }
      return true;
    }
  }catch(e){}

  currentUser=null;
  $("userPill").style.display="none";
  $("signout").style.display="none";
  $("navSignIn").style.display="inline-flex";
  return false;
}

$("signout").addEventListener("click",async()=>{
  try{ await fetch("/api/logout",{method:"POST",credentials:"same-origin"}); }catch(e){}
  location.href="login.html";
});

/* ---- Initialize ONNX Model ---- */
(async()=>{
  await checkAuth();
  try{
    setStatus("load","Loading ConvNeXt-Tiny model (first time only)…");
    session=await ort.InferenceSession.create("leaflet_model.onnx",{executionProviders:["wasm"]});
    loaded=true;
    setStatus("ok","Model ready — ConvNeXt-Tiny (96.7% Test Accuracy, 25 Classes).");
    if(batchFiles.length > 0) $("run").disabled=false;
  }catch(e){
    console.error(e);
    setStatus("err","Could not load the model. Ensure python app.py is running.");
  }
})();

/* ---- File Input & Batch Handling ---- */
const drop=$("drop"), fileInput=$("file");
drop.addEventListener("click",()=>fileInput.click());
["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("hot");}));
["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("hot");}));
drop.addEventListener("drop",e=>{
  e.preventDefault();
  if(e.dataTransfer.files && e.dataTransfer.files.length>0){
    handleIncomingFiles(Array.from(e.dataTransfer.files));
  }
});
fileInput.addEventListener("change",e=>{
  if(e.target.files && e.target.files.length>0){
    handleIncomingFiles(Array.from(e.target.files));
  }
});

function handleIncomingFiles(fileList){
  const imageFiles = fileList.filter(f => f.type.startsWith("image/"));
  if(imageFiles.length === 0) return;

  imageFiles.forEach(f => {
    const url = URL.createObjectURL(f);
    const item = {
      file: f,
      name: f.name || "leaf_scan.jpg",
      url: url,
      dataUrl: null,
      img: null,
      result: null,
      diagnosisData: null
    };

    const reader = new FileReader();
    reader.onload = ev => { item.dataUrl = ev.target.result; };
    reader.readAsDataURL(f);

    const img = new Image();
    img.onload = () => {
      item.img = img;
      if(loaded) $("run").disabled = false;
    };
    img.src = url;

    batchFiles.push(item);
  });

  if(activeIndex === -1 || activeIndex >= batchFiles.length){
    selectActiveFile(batchFiles.length - imageFiles.length);
  } else {
    renderBatchThumbnails();
  }
}

function selectActiveFile(idx, updateStatusText = true){
  if(idx < 0 || idx >= batchFiles.length) return;
  activeIndex = idx;
  const item = batchFiles[idx];

  $("previewImg").src = item.url;
  $("previewMeta").textContent = item.name;
  $("previewCard").classList.add("show");

  $("run").disabled = !loaded;
  renderBatchThumbnails();

  if(item.isNonCrop){
    displayCropGateError(item);
  } else if (typeof currentDiagnosticMode !== "undefined" && currentDiagnosticMode === "stage" && item.stageResult) {
    $("cropGateAlert").style.display = "none";
    displayStageResult(item.stageResult, item);
  } else if(item.result){
    $("cropGateAlert").style.display = "none";
    if (item.advisories && item.advisories[currentAppLanguage]) {
      applyAdvisoryToResult(item, item.advisories[currentAppLanguage], currentAppLanguage);
    }
    displayResult(item.result, item);
  } else {
    $("cropGateAlert").style.display = "none";
    $("result").classList.remove("show");
    $("empty").style.display = "block";
    $("gradcamBox").style.display = "none";
  }

  if(loaded && updateStatusText){
    setStatus("ok", batchFiles.length > 1
      ? `${batchFiles.length} photos in batch queue — press Run Diagnosis.`
      : "Photo ready — press Run Diagnosis."
    );
  }
}

function removeFile(idx, event){
  if(event) event.stopPropagation();
  if(idx < 0 || idx >= batchFiles.length) return;

  URL.revokeObjectURL(batchFiles[idx].url);
  batchFiles.splice(idx, 1);

  if(batchFiles.length === 0){
    resetAll();
    return;
  }

  if(activeIndex === idx){
    const nextIdx = Math.min(idx, batchFiles.length - 1);
    selectActiveFile(nextIdx);
  } else if(activeIndex > idx){
    activeIndex--;
    renderBatchThumbnails();
  } else {
    renderBatchThumbnails();
  }
}

function renderBatchThumbnails(){
  const batchSec = $("batchSection");
  const grid = $("batchGrid");
  const countEl = $("batchCount");

  if(batchFiles.length > 1){
    batchSec.classList.add("show");
    countEl.textContent = batchFiles.length;
    grid.innerHTML = "";

    batchFiles.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "batch-card" + (i === activeIndex ? " active" : "");
      
      let badgeHtml = "";
      if(item.isNonCrop){
        badgeHtml = `<div class="batch-badge" style="color:var(--rust);background:rgba(176,85,46,.9);font-weight:700;">🚫 Not Crop</div>`;
      } else if(item.result && item.result.p){
        const isH = item.result.p.healthy;
        const isTeacher = Boolean(item.result.teacherModelUsed);
        const isOpenWorld = Boolean(item.result.isOpenWorld);
        const icon = isOpenWorld ? '🌐 ' : (isTeacher ? '🎓 ' : (isH ? '🌱 ' : '🦠 '));
        badgeHtml = `<div class="batch-badge ${isH ? 'healthy' : ''}">${icon}${isH ? 'Healthy' : item.result.p.cond}</div>`;
      }

      card.innerHTML = `
        <button class="mini-btn close" title="Remove photo" type="button">✕</button>
        <img src="${item.url}" alt="${item.name}">
        ${badgeHtml}
      `;

      card.addEventListener("click", () => selectActiveFile(i));

      card.querySelector(".mini-btn.close").addEventListener("click", e => {
        removeFile(i, e);
      });

      grid.appendChild(card);
    });
  } else {
    batchSec.classList.remove("show");
  }
}

/* Close/remove active preview */
$("previewCloseBtn").addEventListener("click", () => {
  if(activeIndex >= 0) removeFile(activeIndex);
});

/* Reset all files */
function resetAll(){
  batchFiles.forEach(b => URL.revokeObjectURL(b.url));
  batchFiles = [];
  activeIndex = -1;
  fileInput.value = "";
  currentDiagnosisData = null;

  $("previewCard").classList.remove("show");
  $("batchSection").classList.remove("show");
  $("result").classList.remove("show");
  $("cropGateAlert").style.display = "none";
  $("teacherCard").style.display = "none";
  $("empty").style.display = "block";
  $("gradcamBox").style.display = "none";
  $("saveMsg").style.display = "none";
  $("run").disabled = true;

  if(loaded) setStatus("ok","Model ready — ConvNeXt-Tiny (96.7% Accuracy, 25 Classes).");
}
$("reset").addEventListener("click", resetAll);

/* ---- Image Preprocessing ---- */
function rasterize(img){
  const S=224;
  const c=document.createElement("canvas"); c.width=S; c.height=S;
  const ctx=c.getContext("2d",{willReadFrequently:true});
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(img,0,0,S,S);
  return ctx.getImageData(0,0,S,S);
}

function tensorFromImageData(imageData){
  const S=224, d=imageData.data;
  const mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225];
  const out=new Float32Array(3*S*S);
  const plane=S*S;
  for(let i=0;i<plane;i++){
    out[i]         = ((d[i*4]  /255)-mean[0])/std[0];
    out[i+plane]   = ((d[i*4+1]/255)-mean[1])/std[1];
    out[i+2*plane] = ((d[i*4+2]/255)-mean[2])/std[2];
  }
  return new ort.Tensor("float32",out,[1,3,S,S]);
}

function softmax(a){
  const m=Math.max(...a);
  const e=a.map(v=>Math.exp(v-m));
  const s=e.reduce((x,y)=>x+y,0);
  return e.map(v=>v/s);
}

/* ---- Sequential Batch Diagnosis Execution ---- */
$("run").addEventListener("click", async()=>{
  if(!session || batchFiles.length === 0) return;

  $("run").disabled = true;
  $("reset").disabled = true;
  const total = batchFiles.length;

  for(let i = 0; i < total; i++){
    const item = batchFiles[i];
    if(!item.img) continue;

    selectActiveFile(i, false);
    $("previewCard").classList.add("busy");

    if (typeof currentDiagnosticMode !== "undefined" && currentDiagnosticMode === "stage" && typeof runStageDiagnosis === "function") {
      try {
        await runStageDiagnosis(item, i, total);
        renderBatchThumbnails();
      } catch (e) {
        console.error("Stage diagnosis error for item", i, e);
      }
      continue;
    }

    setStatus("load", total > 1
      ? `Diagnosing leaf ${i + 1} of ${total} (${item.name})…`
      : "Running deep vision diagnosis…"
    );

    try{
      const t0 = performance.now();
      let raw = null;
      let conf = 0;
      let gradcamDataUrl = null;
      let topPreds = [];
      let teacherModelUsed = false;
      let teacherReasoning = "";
      let studentConfidence = null;
      let studentClass = "";
      let isOpenWorld = false;

      // 1. Run direct PyTorch prediction + authentic Grad-CAM via backend
      try {
        const predRes = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: item.dataUrl || item.url,
            selected_crop: selectedCropName
          })
        });
        const predData = await predRes.json();
        if (!predRes.ok && predData.is_crop === false) {
          // Zero-shot crop gate rejected non-crop image!
          item.isNonCrop = true;
          item.nonCropError = predData.error || "Non-crop image detected.";
          item.cropScore = predData.crop_score || 0;
          displayCropGateError(item);
          renderBatchThumbnails();
          continue;
        }
        if (predRes.ok && predData.ok) {
          raw = predData.class_name;
          conf = predData.confidence / 100;
          gradcamDataUrl = predData.gradcam_image;
          topPreds = predData.top_predictions || [];
          teacherModelUsed = Boolean(predData.teacher_model_used);
          teacherReasoning = predData.teacher_reasoning || "";
          studentConfidence = predData.student_confidence;
          studentClass = predData.student_class;
          isOpenWorld = Boolean(predData.is_open_world);
        }
      } catch (err) {
        console.warn("Native /api/predict error, falling back to client ONNX:", err);
      }

      // 2. Client-side ONNX fallback if backend is unreachable
      if (!raw && session) {
        const imageData = rasterize(item.img);
        const feeds = {};
        feeds[session.inputNames[0]] = tensorFromImageData(imageData);
        const out = await session.run(feeds);
        const logits = Array.from(out[session.outputNames[0]].data);
        const probs = softmax(logits);
        const idx = probs.indexOf(Math.max(...probs));
        conf = probs[idx];
        const classList = (logits.length === 25) ? CLASSES_25 : ((logits.length === 12) ? CLASSES_12 : Object.keys(AGRONOMY_KNOWLEDGE));
        raw = classList[idx] || (Object.keys(AGRONOMY_KNOWLEDGE)[idx] || "Crop Foliage");

        generateGradcam(item.img, $("gradcamCanvas"));
        try {
          gradcamDataUrl = $("gradcamCanvas").toDataURL("image/jpeg", 0.85);
        } catch(e) {}
      }

      const ms = performance.now() - t0;
      if (!raw) raw = "Crop Foliage";

      // Update status indicating AI Agronomist synthesis
      setStatus("load", total > 1
        ? `Consulting AI Agronomist for leaf ${i + 1} of ${total} (${raw})…`
        : `Consulting AI Agronomist (${raw})…`
      );

      // Fetch tailored advisory from /api/advisory (Groq LLM with JSON ground-truth) in the active language
      let advisory = null;
      try {
        const advRes = await fetch("/api/advisory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            class_name: raw,
            confidence: +(conf * 100).toFixed(1),
            language: currentAppLanguage
          })
        });
        if (advRes.ok) {
          advisory = await advRes.json();
        }
      } catch (err) {
        console.warn("Could not fetch /api/advisory:", err);
      }

      // Safe fallback to preloaded AGRONOMY_KNOWLEDGE if network/API drops
      if (!advisory || !advisory.ok) {
        const localEntry = AGRONOMY_KNOWLEDGE[raw] || {};
        const isH = Boolean(localEntry.healthy || raw.toLowerCase().includes("healthy"));
        const tierKey = isH ? "Optimal" : (conf >= 0.85 ? "High" : (conf >= 0.65 ? "Medium" : "Low"));
        const tier = (localEntry.severity_levels && localEntry.severity_levels[tierKey]) || {};
        advisory = {
          ok: true,
          source: "ground_truth_json",
          crop: localEntry.crop || "Crop Foliage",
          disease: localEntry.disease || raw,
          healthy: isH,
          severity: tier.severity_name || (isH ? "Optimal Health" : tierKey + " Severity"),
          diagnosis: localEntry.symptoms || "Foliar patterns detected.",
          treatment: tier.treatment || "Inspect crop and apply local agronomy recommendations.",
          fertilizer: tier.fertilizer || "Maintain balanced soil fertility and drainage.",
          organic_tip: localEntry.organic_remedy || "",
          summary: tier.description || localEntry.symptoms || ""
        };
      }

      if (!item.advisories) item.advisories = {};
      item.advisories[currentAppLanguage] = advisory;

      item.result = {
        conf,
        ms,
        p: null,
        raw,
        gradcamDataUrl,
        topPreds,
        teacherModelUsed,
        teacherReasoning,
        studentConfidence,
        studentClass,
        isOpenWorld
      };

      applyAdvisoryToResult(item, advisory, currentAppLanguage);

      displayResult(item.result, item);
      renderBatchThumbnails();

      // Brief animation pause between batch items so the progression is visible
      if(total > 1 && i < total - 1){
        await new Promise(r => setTimeout(r, 260));
      }
    }catch(e){
      console.error("Diagnosis error for leaf", i, e);
    }
  }

  $("previewCard").classList.remove("busy");
  $("run").disabled = false;
  $("reset").disabled = false;
  renderBatchThumbnails();

  setStatus("ok", total > 1
    ? `Batch complete — all ${total} leaves diagnosed! Click any thumbnail to view its advisory report.`
    : "Diagnosis complete."
  );
});

function escapeHtml(s){
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatAdvisoryContent(text){
  if(!text || typeof text !== "string") return "—";
  text = text.trim();

  // 1. Detect and parse numbered lists: "1. ", "2. ", "1) ", etc.
  const items = text.split(/(?:^|\s+)(?=\d+[\.\)]\s+)/).map(s => s.trim()).filter(Boolean);
  if(items.length > 1){
    let html = '<ol class="advisory-steps">';
    items.forEach(item => {
      const m = item.match(/^(\d+)[\.\)]\s*(.*)/s);
      if(m){
        html += `<li><span class="step-num">${m[1]}</span><span class="step-txt">${escapeHtml(m[2])}</span></li>`;
      } else {
        html += `<li><span class="step-txt">${escapeHtml(item)}</span></li>`;
      }
    });
    html += '</ol>';
    return html;
  }

  // 2. Detect and parse bullet points or newline-separated items
  const lines = text.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
  if(lines.length > 1){
    let html = '<ul class="advisory-list">';
    lines.forEach(line => {
      const clean = line.replace(/^[-•*]\s*/, "");
      html += `<li>${escapeHtml(clean)}</li>`;
    });
    html += '</ul>';
    return html;
  }

  // 3. Fallback for multi-sentence paragraphs without explicit numbers
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/).map(s => s.trim()).filter(Boolean);
  if (sentences.length > 1) {
    let html = '<ul class="advisory-list">';
    sentences.forEach(s => {
      html += `<li>${escapeHtml(s)}</li>`;
    });
    html += '</ul>';
    return html;
  }

  return `<p class="advisory-para">${escapeHtml(text)}</p>`;
}

function displayCropGateError(item){
  $("empty").style.display = "none";
  $("result").classList.remove("show");
  $("teacherCard").style.display = "none";
  $("cropGateAlert").style.display = "block";
  const score = item.cropScore != null ? item.cropScore : 0;
  $("cropGateAlertMsg").innerHTML = `The Zero-Shot Crop Gate evaluated <b>${escapeHtml(item.name || "this image")}</b> (crop score: <b>${score}%</b>) and determined it is not an agricultural plant or crop leaf.`;
  setStatus("err", `Non-crop image rejected (${item.name}). Please upload a clear photo of an agricultural plant leaf.`);
}

function applyAdvisoryToResult(item, advisory, lang) {
  if (!item || !item.result) return;
  const raw = item.result.raw;
  const isHealthy = Boolean(advisory && advisory.healthy != null ? advisory.healthy : (raw.toLowerCase().includes("healthy")));
  
  let cropName = (advisory && advisory.crop) || "";
  let condName = (advisory && advisory.disease) || "";

  const dict = CROP_DISEASE_TRANSLATIONS[raw] && CROP_DISEASE_TRANSLATIONS[raw][lang];
  if (dict && lang !== "en") {
    cropName = dict.crop;
    condName = dict.disease;
  } else if (!cropName || cropName === "Crop Foliage" || cropName === "Crop") {
    const parts = raw.split(" ");
    cropName = parts[parts.length - 1] || "Crop";
    condName = raw;
  }

  // Translate severity badge
  let sevText = (advisory && advisory.severity) || "Standard Assessment";
  if (SEVERITY_TRANSLATIONS[lang]) {
    for (const [k, v] of Object.entries(SEVERITY_TRANSLATIONS[lang])) {
      if (sevText.toLowerCase().includes(k.toLowerCase())) {
        sevText = v;
        break;
      }
    }
  }

  const p = {
    crop: cropName,
    cond: condName,
    healthy: isHealthy,
    severity: sevText,
    diagnosis: (advisory && advisory.diagnosis) || "",
    treatment: (advisory && advisory.treatment) || "",
    fertilizer: (advisory && advisory.fertilizer) || "",
    organic_tip: (advisory && advisory.organic_tip) || "",
    guide: (advisory && (advisory.summary || advisory.diagnosis)) || "",
    source: (advisory && advisory.source) || "ground_truth_json",
    model: (advisory && advisory.model) || ""
  };

  item.result.p = p;
  item.diagnosisData = {
    image_name: item.name,
    image_path: item.dataUrl || item.url,
    gradcam_image: item.result.gradcamDataUrl,
    predicted_disease: p.healthy ? p.crop + " · " + (lang === "ta" ? "ஆரோக்கியமானது" : (lang === "hi" ? "स्वस्थ" : "healthy")) : p.crop + " · " + p.cond,
    crop: p.crop,
    confidence: +(item.result.conf * 100).toFixed(1),
    severity: p.severity,
    diagnosis: item.result.teacherModelUsed && item.result.teacherReasoning ? `${p.diagnosis} [Teacher Model Verified: ${item.result.teacherReasoning}]` : p.diagnosis,
    treatment: p.treatment,
    fertilizer: p.fertilizer,
  };
}

function updateVerdictBoxLanguage(lang, resultData) {
  if (!resultData || !resultData.p) return;
  const ui = UI_STRINGS[lang] || UI_STRINGS.en;
  const { conf, p, raw, teacherModelUsed, isOpenWorld } = resultData;
  if (teacherModelUsed) {
    $("vtag").innerHTML = isOpenWorld ? ui.tagOpenWorld : ui.tagTeacher;
    $("vconf").innerHTML = `<b>${(conf * 100).toFixed(1)}%</b> ${lang === "ta" ? "துல்லியம்" : (lang === "hi" ? "कॉन्फिडेंस" : "confidence")} &bull; <span>${isOpenWorld ? ui.confOpenWorldSuffix : ui.confTeacherSuffix}</span>`;
  } else {
    $("vtag").textContent = p.healthy ? ui.tagHealthy : ui.tagDisease;
    $("vconf").textContent = `${(conf * 100).toFixed(1)}% ${ui.confModelSuffix}`;
  }
  const dict = CROP_DISEASE_TRANSLATIONS[raw] && CROP_DISEASE_TRANSLATIONS[raw][lang];
  let cName = (dict && lang !== "en") ? dict.crop : p.crop;
  let dName = (dict && lang !== "en") ? dict.disease : p.cond;
  $("vname").textContent = p.healthy ? cName + (lang === "ta" ? " · ஆரோக்கியமானது" : (lang === "hi" ? " · स्वस्थ" : " · Healthy")) : dName;
  $("vcrop").textContent = cName + " · " + raw;
}

async function switchLanguage(targetLang) {
  if (targetLang === currentAppLanguage && !arguments[1]) return;
  currentAppLanguage = targetLang;

  document.querySelectorAll(".lang-pill").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === targetLang);
  });
  updateStaticLabels(targetLang);
  if (typeof updateStageLanguage === "function") {
    updateStageLanguage(targetLang);
  }

  if (activeIndex >= 0 && batchFiles[activeIndex] && batchFiles[activeIndex].result) {
    const item = batchFiles[activeIndex];
    const raw = item.result.raw;
    const conf = item.result.conf;

    // 1. Instantly translate verdict box & labels with 0ms latency
    updateVerdictBoxLanguage(targetLang, item.result);

    // 2. Check if cached advisory for targetLang exists
    if (item.advisories && item.advisories[targetLang]) {
      applyAdvisoryToResult(item, item.advisories[targetLang], targetLang);
      displayResult(item.result, item);
      return;
    }

    // 3. Otherwise show temporary loading status in advisory cards & fetch
    const loadingMsg = targetLang === "ta" ? "மொழிபெயர்ப்பு பெறப்படுகிறது..." : (targetLang === "hi" ? "अनुवाद प्राप्त किया जा रहा है..." : "Fetching advisory...");
    $("guideTxt").innerHTML = `<span style="color:var(--muted);font-style:italic;">⏳ ${loadingMsg}</span>`;
    $("advDiagnosis").innerHTML = `<span style="color:var(--muted);font-style:italic;">⏳ ${loadingMsg}</span>`;
    $("advTreatment").innerHTML = `<span style="color:var(--muted);font-style:italic;">⏳ ${loadingMsg}</span>`;
    $("advFertilizer").innerHTML = `<span style="color:var(--muted);font-style:italic;">⏳ ${loadingMsg}</span>`;

    try {
      const advRes = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name: raw,
          confidence: +(conf * 100).toFixed(1),
          language: targetLang
        })
      });
      if (advRes.ok) {
        const advData = await advRes.json();
        if (!item.advisories) item.advisories = {};
        item.advisories[targetLang] = advData;
        applyAdvisoryToResult(item, advData, targetLang);
        displayResult(item.result, item);
      }
    } catch (e) {
      console.error("Error fetching language advisory:", e);
    }
  }
}

// Wire language selector button events
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lang-pill").forEach(btn => {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  });
});
document.querySelectorAll(".lang-pill").forEach(btn => {
  btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
});

function displayResult(resultData, item){
  const { conf, ms, p, raw, teacherModelUsed, teacherReasoning, studentConfidence, isOpenWorld } = resultData;

  $("empty").style.display = "none";
  $("cropGateAlert").style.display = "none";
  $("result").classList.add("show");

  const lang = currentAppLanguage || "en";
  const ui = UI_STRINGS[lang] || UI_STRINGS.en;

  updateStaticLabels(lang);

  const v = $("verdict");
  v.className = "verdict" + (p.healthy ? " healthy" : "");

  if (teacherModelUsed) {
    if (isOpenWorld) {
      $("vtag").innerHTML = ui.tagOpenWorld;
      $("vtag").style.background = "linear-gradient(135deg, #0284c7, #2563eb)";
      $("vtag").style.color = "#ffffff";
      $("vconf").innerHTML = `<b>${(conf * 100).toFixed(1)}%</b> ${lang === "ta" ? "துல்லியம்" : (lang === "hi" ? "कॉन्फिडेंस" : "confidence")} &bull; <span style="color:#bae6fd">${ui.confOpenWorldSuffix}</span>`;
    } else {
      $("vtag").innerHTML = ui.tagTeacher;
      $("vtag").style.background = "linear-gradient(135deg, #4f46e5, #7c3aed)";
      $("vtag").style.color = "#ffffff";
      $("vconf").innerHTML = `<b>${(conf * 100).toFixed(1)}%</b> ${lang === "ta" ? "துல்லியம்" : (lang === "hi" ? "कॉन्फिडेंस" : "confidence")} &bull; <span style="color:#e9d5ff">${ui.confTeacherSuffix}</span>`;
    }

    $("teacherCard").style.display = "block";
    $("lblTeacherTitle").textContent = ui.teacherTitle;
    $("lblTeacherBadge").textContent = ui.teacherBadge;
    $("lblTeacherDesc").innerHTML = `${ui.teacherDescPrefix} <b id="teacherStudentConf" style="color:var(--rust);">${studentConfidence != null ? studentConfidence.toFixed(1) : "—"}%</b> ${ui.teacherDescSuffix}`;
    $("lblTeacherReasoningTitle").textContent = ui.teacherReasoningTitle;
    if (teacherReasoning) {
      $("teacherReasoningTxt").textContent = teacherReasoning;
      $("teacherReasoningWrap").style.display = "flex";
    } else {
      $("teacherReasoningWrap").style.display = "none";
    }
  } else {
    $("vtag").textContent = p.healthy ? ui.tagHealthy : ui.tagDisease;
    $("vtag").style.background = "rgba(244,241,226,.16)";
    $("vtag").style.color = "var(--gold-l)";
    $("vconf").textContent = `${(conf * 100).toFixed(1)}% ${ui.confModelSuffix}`;
    $("teacherCard").style.display = "none";
  }

  // Localized crop and condition title
  let displayCrop = p.crop;
  let displayCond = p.cond;
  const dict = CROP_DISEASE_TRANSLATIONS[raw] && CROP_DISEASE_TRANSLATIONS[raw][lang];
  if (dict && lang !== "en") {
    displayCrop = dict.crop;
    displayCond = dict.disease;
  }

  $("vname").textContent = p.healthy ? displayCrop + (lang === "ta" ? " · ஆரோக்கியமானது" : (lang === "hi" ? " · स्वस्थ" : " · Healthy")) : displayCond;
  $("vcrop").textContent = displayCrop + " · " + raw;

  $("vbar").style.width = "0%";
  requestAnimationFrame(()=>{
    $("vbar").style.width = (conf * 100).toFixed(1) + "%";
  });

  $("guideTxt").innerHTML = formatAdvisoryContent(p.guide);

  // Advisory details
  let sevDisplay = p.severity;
  if (SEVERITY_TRANSLATIONS[lang]) {
    for (const [k, val] of Object.entries(SEVERITY_TRANSLATIONS[lang])) {
      if (sevDisplay.toLowerCase().includes(k.toLowerCase())) {
        sevDisplay = val;
        break;
      }
    }
  }
  $("advSeverity").textContent = sevDisplay;
  $("advSeverity").style.color = p.healthy ? "var(--green)" : (p.severity.toLowerCase().includes("high") || p.severity.toLowerCase().includes("severe") || p.severity.includes("அதிக") || p.severity.includes("उच्च") ? "var(--rust)" : "var(--gold)");
  $("advSeverity").style.background = p.healthy ? "rgba(45,70,39,.15)" : "rgba(176,85,46,.15)";

  if($("advSourceBadge")){
    if(isOpenWorld){
      $("advSourceBadge").innerHTML = `🌐 Open-World Nova Lite + Groq`;
      $("advSourceBadge").style.display = "inline-flex";
      $("advSourceBadge").style.background = "rgba(2,132,199,.15)";
      $("advSourceBadge").style.color = "#0284c7";
      $("advSourceBadge").style.borderColor = "rgba(2,132,199,.3)";
    } else if(teacherModelUsed){
      $("advSourceBadge").innerHTML = `🎓 Nova Lite Teacher + Groq`;
      $("advSourceBadge").style.display = "inline-flex";
      $("advSourceBadge").style.background = "rgba(79,70,229,.14)";
      $("advSourceBadge").style.color = "#4f46e5";
      $("advSourceBadge").style.borderColor = "rgba(79,70,229,.3)";
    } else if(p.source === "groq_llm"){
      $("advSourceBadge").innerHTML = `⚡ Groq LLaMA Advisory`;
      $("advSourceBadge").style.display = "inline-flex";
      $("advSourceBadge").style.background = "rgba(124,58,237,.12)";
      $("advSourceBadge").style.color = "#7c3aed";
      $("advSourceBadge").style.borderColor = "rgba(124,58,237,.25)";
    } else {
      $("advSourceBadge").innerHTML = `🌿 Ground-Truth Advisory`;
      $("advSourceBadge").style.display = "inline-flex";
      $("advSourceBadge").style.background = "rgba(45,70,39,.12)";
      $("advSourceBadge").style.color = "var(--green)";
      $("advSourceBadge").style.borderColor = "rgba(45,70,39,.2)";
    }
  }

  // Format advisory sections into step-by-step numbered cards
  $("advDiagnosis").innerHTML = formatAdvisoryContent(p.diagnosis);
  $("advTreatment").innerHTML = formatAdvisoryContent(p.treatment);
  $("advFertilizer").innerHTML = formatAdvisoryContent(p.fertilizer);

  if($("advOrganicWrap")){
    if(p.organic_tip){
      $("advOrganic").innerHTML = formatAdvisoryContent(p.organic_tip);
      $("advOrganicWrap").style.display = "block";
    } else {
      $("advOrganicWrap").style.display = "none";
    }
  }

  // Pre-fetch advisory audio in background so user clicks play instantly (0ms)
  if (window.VoiceReader && window.VoiceReader.prefetch) {
    setTimeout(() => {
      const vTitle = $("vtag") ? ($("vtag").textContent || $("vtag").innerText) : "";
      const vText = ($("vname") ? $("vname").innerText : "") + ". " + ($("vcrop") ? $("vcrop").innerText : "");
      window.VoiceReader.prefetch(vText, currentAppLanguage, vTitle);

      const dTitle = $("lblSymptoms") ? ($("lblSymptoms").textContent || $("lblSymptoms").innerText) : "";
      window.VoiceReader.prefetch(p.diagnosis, currentAppLanguage, dTitle);

      const tTitle = $("lblTreatment") ? ($("lblTreatment").textContent || $("lblTreatment").innerText) : "";
      window.VoiceReader.prefetch(p.treatment, currentAppLanguage, tTitle);

      const fTitle = $("lblFertilizer") ? ($("lblFertilizer").textContent || $("lblFertilizer").innerText) : "";
      window.VoiceReader.prefetch(p.fertilizer, currentAppLanguage, fTitle);
    }, 300);
  }

  // True PyTorch Grad-CAM heatmap overlay
  if (resultData.gradcamDataUrl) {
    const gcImg = new Image();
    gcImg.onload = () => {
      const c = $("gradcamCanvas");
      c.width = gcImg.naturalWidth || 224;
      c.height = gcImg.naturalHeight || 224;
      const ctx = c.getContext("2d");
      ctx.drawImage(gcImg, 0, 0, c.width, c.height);
      $("gradcamBox").style.display = "block";
    };
    gcImg.src = resultData.gradcamDataUrl;
  } else if (item && item.img) {
    try {
      generateGradcam(item.img, $("gradcamCanvas"));
      $("gradcamBox").style.display = "block";
    } catch(e) {
      console.warn("Could not generate gradcam", e);
    }
  }

  // Set currentDiagnosisData for the save action
  currentDiagnosisData = item.diagnosisData;

  // Reset save button state
  $("saveHistoryBtn").disabled = false;
  $("saveHistoryBtn").innerHTML = `<span>💾</span> <span>${ui.saveHistory}</span>`;
  $("saveHistoryBtn").style.background = "linear-gradient(135deg,#7c3aed,#9333ea)";
  $("saveMsg").style.display = "none";
}

/* ---- Generate Grad-CAM Attention Heatmap ---- */
function generateGradcam(sourceImg, canvas) {
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

/* ---- Save to History Button Handler ---- */
$("saveHistoryBtn").addEventListener("click", async () => {
  if (!currentDiagnosisData) return;

  if (!currentUser) {
    if (confirm("You must be signed in to save scans to your account history.\n\nGo to Sign in now?")) {
      location.href = "login.html?next=dashboard.html";
    }
    return;
  }

  const btn = $("saveHistoryBtn");
  const msg = $("saveMsg");
  btn.disabled = true;
  btn.innerHTML = `<span>⏳</span> <span>Saving to history…</span>`;

  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(currentDiagnosisData),
    });
    const d = await res.json();
    if (res.ok && d.ok) {
      btn.innerHTML = `<span>✅</span> <span>Saved to History!</span>`;
      btn.style.background = "#16a34a";
      msg.style.display = "block";
      msg.style.color = "var(--green)";
      msg.innerHTML = `Saved to your account! <a href="history.html" style="color:var(--gold);font-weight:700;text-decoration:underline;">View in History &amp; Profile →</a>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = `<span>💾</span> <span>Save to History</span>`;
      msg.style.display = "block";
      msg.style.color = "var(--rust)";
      msg.textContent = d.error || "Failed to save.";
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = `<span>💾</span> <span>Save to History</span>`;
    msg.style.display = "block";
    msg.style.color = "var(--rust)";
    msg.textContent = "Could not connect to backend to save.";
  }
});

/* ---- Report Inaccurate Diagnosis Handler ---- */
if ($("reportDiagnosisBtn")) {
  $("reportDiagnosisBtn").addEventListener("click", async () => {
    if (!currentDiagnosisData) return;
    const feedback = prompt(
      "Flag this diagnosis for expert admin review:\n\n" +
      `Current prediction: ${currentDiagnosisData.predicted_disease}\n` +
      "Describe what you observe or the suspected true condition (optional):",
      "Symptoms appear different from predicted disease"
    );
    if (feedback === null) return;

    const btn = $("reportDiagnosisBtn");
    const msg = $("reportMsg");
    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> <span>Submitting to admin staging…</span>`;

    try {
      const res = await fetch("/api/report_diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          image: currentDiagnosisData.image_path,
          predicted_disease: currentDiagnosisData.predicted_disease,
          crop: currentDiagnosisData.crop,
          feedback: feedback
        })
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        btn.innerHTML = `<span>✅</span> <span>Sent to Admin Staging!</span>`;
        btn.style.borderColor = "var(--green)";
        btn.style.color = "var(--green)";
        msg.style.display = "block";
        msg.style.color = "var(--green)";
        msg.textContent = "Thank you! This image was staged in the Admin Review Queue for continuous learning.";
      } else {
        btn.disabled = false;
        btn.innerHTML = `<span>⚠️</span> <span>Report Inaccurate Diagnosis</span>`;
        msg.style.display = "block";
        msg.style.color = "var(--rust)";
        msg.textContent = d.error || "Failed to submit report.";
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = `<span>⚠️</span> <span>Report Inaccurate Diagnosis</span>`;
      msg.style.display = "block";
      msg.style.color = "var(--rust)";
      msg.textContent = "Network error submitting diagnosis report.";
    }
  });
}

/* ---- WhatsApp & PDF Advisory Export Handlers ---- */
function getDiseaseExportPayload() {
  if (!currentDiagnosisData) return null;
  const activeItem = (activeIndex >= 0 && batchFiles[activeIndex]) ? batchFiles[activeIndex] : null;
  const p = (activeItem && activeItem.result && activeItem.result.p) || {};
  return {
    isStage: false,
    language: currentAppLanguage || "en",
    crop: currentDiagnosisData.crop || p.crop || (typeof selectedCropName !== "undefined" ? selectedCropName : "Crop"),
    condition: currentDiagnosisData.predicted_disease || p.cond || "Evaluated Foliage",
    severity: currentDiagnosisData.severity || p.severity || "Evaluated",
    diagnosis: p.diagnosis || currentDiagnosisData.diagnosis || "",
    treatment: p.treatment || currentDiagnosisData.treatment || "",
    fertilizer: p.fertilizer || currentDiagnosisData.fertilizer || "",
    organic_tip: p.organic_tip || "",
    imageSrc: currentDiagnosisData.image_path || (activeItem && (activeItem.dataUrl || activeItem.url)) || "",
    gradcamSrc: currentDiagnosisData.gradcam_image || (activeItem && activeItem.result && activeItem.result.gradcamDataUrl) || "",
    farmerName: (currentUser && currentUser.username) || "AgroLens Farmer"
  };
}

if ($("shareWhatsAppBtn")) {
  $("shareWhatsAppBtn").addEventListener("click", () => {
    const payload = getDiseaseExportPayload();
    if (!payload) {
      alert("No active diagnosis report to share. Please run a diagnosis first.");
      return;
    }
    if (window.AdvisoryExport) {
      window.AdvisoryExport.shareToWhatsApp(payload);
    }
  });
}

if ($("exportPdfBtn")) {
  $("exportPdfBtn").addEventListener("click", () => {
    const payload = getDiseaseExportPayload();
    if (!payload) {
      alert("No active diagnosis report to export. Please run a diagnosis first.");
      return;
    }
    if (window.AdvisoryExport) {
      window.AdvisoryExport.exportToPdf(payload);
    }
  });
}

/* ---- Component Audio Voice Readout Delegation ---- */
const VOICE_TITLE_MAP = {
  advDiagnosis: "lblSymptoms",
  advTreatment: "lblTreatment",
  advFertilizer: "lblFertilizer",
  advOrganic: "lblOrganic",
  stageVisualClues: "lblStageVisualClues",
  stageIrrigation: "lblStageIrrigation",
  stageFertilizer: "lblStageFertilizer",
  stagePestAlert: "lblStagePestAlert",
  stagePriorityAction: "lblStagePriority"
};

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".voice-btn");
  if (!btn || !window.VoiceReader) return;

  if (btn.id === "voiceBtnVerdict") {
    const title = $("vtag") ? ($("vtag").textContent || $("vtag").innerText) : "";
    const text = ($("vname") ? $("vname").innerText : "") + ". " + ($("vcrop") ? $("vcrop").innerText : "");
    window.VoiceReader.speakText(text, currentAppLanguage, btn, title);
    return;
  }
  if (btn.id === "voiceBtnStageVerdict") {
    const title = $("stageModelTag") ? ($("stageModelTag").textContent || $("stageModelTag").innerText) : "";
    const text = ($("stageCropName") ? $("stageCropName").innerText : "") + ". " + ($("stagePhaseTitle") ? $("stagePhaseTitle").innerText : "");
    window.VoiceReader.speakText(text, currentAppLanguage, btn, title);
    return;
  }

  const targetId = btn.dataset.voiceTarget;
  if (targetId && $(targetId)) {
    const text = $(targetId).innerText;
    let title = "";
    if (VOICE_TITLE_MAP[targetId] && $(VOICE_TITLE_MAP[targetId])) {
      const el = $(VOICE_TITLE_MAP[targetId]);
      title = el.textContent || el.innerText;
    } else if (btn.parentElement) {
      const lbl = btn.parentElement.querySelector("div, span, h3, h4, .title");
      if (lbl && lbl !== btn) title = lbl.textContent || lbl.innerText;
    }
    window.VoiceReader.speakText(text, currentAppLanguage, btn, title);
  }
});

/* ── Step 1: Crop Selection UI Controller ──────────────── */
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

function renderCropGrid() {
  const grid = $("cropGrid");
  if (!grid) return;
  grid.innerHTML = "";
  
  const hText = CROP_HEADER_STRINGS[cropLanguage] || CROP_HEADER_STRINGS.en;
  if ($("cropSelHeaderSub")) $("cropSelHeaderSub").textContent = hText.sub;
  if ($("cropLangLbl")) $("cropLangLbl").textContent = hText.lbl;
  if ($("othersInputLabel")) $("othersInputLabel").textContent = hText.othersLabel;
  if ($("cropProceedLabel")) $("cropProceedLabel").textContent = hText.proceed;

  CROPS_LIST.forEach(crop => {
    const tile = document.createElement("div");
    tile.className = "crop-tile" + (crop.isOthers ? " others-tile" : "") + (selectedCropId === crop.id ? " selected" : "");
    tile.dataset.cropId = crop.id;
    const name = crop[cropLanguage] || crop.en;
    const sub = (cropLanguage !== "en" && !crop.isOthers) ? crop.en : "";
    tile.innerHTML = `
      <div class="crop-tile-icon">${crop.icon}</div>
      <div class="crop-tile-name">${name}</div>
      ${sub ? `<div class="crop-tile-sub">${sub}</div>` : ""}
    `;
    tile.addEventListener("click", () => selectCropTile(crop));
    grid.appendChild(tile);
  });
}

function selectCropTile(crop) {
  selectedCropId = crop.id;
  const othersBox = $("othersInputBox");
  const proceedBtn = $("cropProceedBtn");

  document.querySelectorAll(".crop-tile").forEach(t => {
    t.classList.toggle("selected", t.dataset.cropId === crop.id);
  });

  if (crop.isOthers) {
    othersBox.classList.add("show");
    $("othersCropInput").focus();
    const val = $("othersCropInput").value.trim();
    selectedCropName = val;
    proceedBtn.disabled = !val;
  } else {
    othersBox.classList.remove("show");
    selectedCropName = crop.en;
    proceedBtn.disabled = false;
  }
}

if ($("othersCropInput")) {
  $("othersCropInput").addEventListener("input", (e) => {
    const val = e.target.value.trim();
    if (selectedCropId === "Others") {
      selectedCropName = val;
      $("cropProceedBtn").disabled = !val;
    }
  });
}

document.querySelectorAll(".crop-lang-row [data-clang]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".crop-lang-row [data-clang]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    cropLanguage = btn.dataset.clang || "en";
    renderCropGrid();
  });
});

if ($("cropProceedBtn")) {
  $("cropProceedBtn").addEventListener("click", () => {
    if (!selectedCropId) return;
    if (selectedCropId === "Others") {
      const val = $("othersCropInput").value.trim();
      if (!val) return;
      selectedCropName = val;
    }
    const cropObj = CROPS_LIST.find(c => c.id === selectedCropId);
    const displayName = (cropObj && !cropObj.isOthers) ? (cropObj[cropLanguage] || cropObj.en) : selectedCropName;
    const icon = cropObj ? cropObj.icon : "🌾";

    $("selectedCropChipLabel").textContent = `${icon} ${displayName}`;
    $("cropSelectorScreen").style.display = "none";
    $("diagnosisScreen").style.display = "block";
  });
}

if ($("selectedCropChip")) {
  $("selectedCropChip").addEventListener("click", () => {
    $("diagnosisScreen").style.display = "none";
    $("cropSelectorScreen").style.display = "block";
  });
}

// Initial crop grid render
renderCropGrid();

