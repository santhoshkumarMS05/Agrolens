/* ==========================================================================
   AgroLens — Crop Growth Stage Detection & Phenology Client Module
   ========================================================================== */

let currentDiagnosticMode = "disease"; // "disease" or "stage"
let currentStageData = null;

// Stage Multilingual Static Dictionaries
const STAGE_UI_STRINGS = {
  en: {
    modeDisease: "🦠 Crop Disease",
    modeStage: "🌱 Crop Growth Stage",
    uploadHelpDisease: "Upload a clear, close-up photo of the affected leaf (JPEG/PNG).",
    uploadHelpStage: "Upload a full-plant or canopy photo showing height, leaves, and flowers.",
    btnRunDisease: "Run Disease Diagnosis",
    btnRunStage: "Identify Growth Stage",
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
    btnRunDisease: "நோய் கண்டறிதலைத் தொடங்கு",
    btnRunStage: "வளர்ச்சிப் பருவத்தைக் கண்டறி",
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
    btnRunDisease: "रोग निदान शुरू करें",
    btnRunStage: "वृद्धि अवस्था पहचानें",
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

/* ---- Initialize Diagnostic Mode Switching ---- */
function initStageModule() {
  const diseaseBtn = document.getElementById("modeBtnDisease");
  const stageBtn = document.getElementById("modeBtnStage");
  const uploadHelp = document.getElementById("uploadHelpTxt");
  const runBtn = document.getElementById("run");

  if (!diseaseBtn || !stageBtn) return;

  function updateModeUI(mode) {
    currentDiagnosticMode = mode;
    const lang = (typeof currentAppLanguage !== "undefined" ? currentAppLanguage : "en");
    const ui = STAGE_UI_STRINGS[lang] || STAGE_UI_STRINGS.en;

    diseaseBtn.classList.toggle("active", mode === "disease");
    stageBtn.classList.toggle("active", mode === "stage");

    if (uploadHelp) {
      uploadHelp.textContent = mode === "stage" ? ui.uploadHelpStage : ui.uploadHelpDisease;
    }

    if (runBtn && !runBtn.classList.contains("busy")) {
      const runTxtEl = runBtn.querySelector(".btn-txt") || runBtn;
      runTxtEl.textContent = mode === "stage" ? ui.btnRunStage : ui.btnRunDisease;
    }

    const diseaseSection = document.getElementById("diseaseResultSection");
    const stageSection = document.getElementById("stageResultSection");

    if (diseaseSection && stageSection) {
      if (mode === "stage") {
        diseaseSection.style.display = "none";
        // If current active file already has stage results, show it
        if (typeof activeIndex !== "undefined" && activeIndex >= 0 && batchFiles[activeIndex] && batchFiles[activeIndex].stageResult) {
          stageSection.style.display = "block";
          displayStageResult(batchFiles[activeIndex].stageResult, batchFiles[activeIndex]);
        } else {
          stageSection.style.display = "none";
        }
      } else {
        stageSection.style.display = "none";
        if (typeof activeIndex !== "undefined" && activeIndex >= 0 && batchFiles[activeIndex] && batchFiles[activeIndex].result) {
          diseaseSection.style.display = "block";
          if (typeof displayResult === "function") {
            displayResult(batchFiles[activeIndex].result, batchFiles[activeIndex]);
          }
        } else {
          diseaseSection.style.display = "none";
        }
      }
    }
  }

  diseaseBtn.addEventListener("click", () => updateModeUI("disease"));
  stageBtn.addEventListener("click", () => updateModeUI("stage"));
}

/* ---- Run Stage Diagnosis for an Image Item ---- */
async function runStageDiagnosis(item, i, total) {
  const lang = (typeof currentAppLanguage !== "undefined" ? currentAppLanguage : "en");

  if (typeof setStatus === "function") {
    setStatus("load", total > 1
      ? `Analyzing plant phenology for photo ${i + 1} of ${total} via Amazon Nova Lite…`
      : "Analyzing crop growth stage & canopy phenology via Amazon Nova Lite…"
    );
  }

  // 1. Predict stage from backend (Zero-shot Crop Gate -> Local Model check -> Amazon Nova Lite)
  const predRes = await fetch("/api/predict_stage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: item.dataUrl || item.url })
  });

  const predData = await predRes.json();

  if (!predRes.ok && predData.is_crop === false) {
    item.isNonCrop = true;
    item.nonCropError = predData.error || "Non-crop image detected.";
    item.cropScore = predData.crop_score || 0;
    if (typeof displayCropGateError === "function") displayCropGateError(item);
    return;
  }

  if (!predRes.ok || !predData.ok) {
    throw new Error(predData.error || "Failed to identify crop growth stage.");
  }

  const { crop, phase, sub_stage, confidence, visual_clues, model_used, teacher_escalated } = predData;

  // 2. Fetch tailored stage advisory from /api/stage_advisory (Groq LLM + JSON ground-truth)
  let advisory = null;
  try {
    const advRes = await fetch("/api/stage_advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        crop,
        phase,
        sub_stage,
        confidence,
        language: lang
      })
    });
    if (advRes.ok) {
      advisory = await advRes.json();
    }
  } catch (err) {
    console.warn("Could not fetch /api/stage_advisory:", err);
  }

  if (!advisory || !advisory.ok) {
    advisory = {
      ok: true,
      source: "ground_truth_json",
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
  }

  if (!item.stageAdvisories) item.stageAdvisories = {};
  item.stageAdvisories[lang] = advisory;

  item.stageResult = {
    crop,
    phase,
    sub_stage,
    confidence,
    visual_clues,
    model_used,
    teacher_escalated,
    advisory
  };

  item.stageDiagnosisData = {
    image_name: item.name,
    image_path: item.dataUrl || item.url,
    crop: advisory.crop || crop,
    phase: advisory.phase_name || phase,
    sub_stage: advisory.sub_stage || sub_stage,
    confidence: confidence,
    irrigation: advisory.irrigation,
    fertilizer: advisory.fertilizer,
    pest_watch: advisory.pest_disease_watch,
    days_to_harvest: advisory.days_to_harvest,
    priority_action: advisory.priority_action
  };

  displayStageResult(item.stageResult, item);
}

/* ---- Render Stage Result in Dashboard ---- */
function displayStageResult(stageResult, item) {
  const emptyEl = document.getElementById("empty");
  const cropGateAlert = document.getElementById("cropGateAlert");
  const resultContainer = document.getElementById("result");
  const diseaseSection = document.getElementById("diseaseResultSection");
  const stageSection = document.getElementById("stageResultSection");

  if (emptyEl) emptyEl.style.display = "none";
  if (cropGateAlert) cropGateAlert.style.display = "none";
  if (resultContainer) resultContainer.classList.add("show");
  if (diseaseSection) diseaseSection.style.display = "none";
  if (stageSection) stageSection.style.display = "block";

  const lang = (typeof currentAppLanguage !== "undefined" ? currentAppLanguage : "en");
  const ui = STAGE_UI_STRINGS[lang] || STAGE_UI_STRINGS.en;

  const { crop, phase, sub_stage, confidence, visual_clues, model_used, advisory } = stageResult;

  // Top Verdict Banner
  const stageCropNameEl = document.getElementById("stageCropName");
  const stagePhaseTitleEl = document.getElementById("stagePhaseTitle");
  const stageSubStageEl = document.getElementById("stageSubStage");
  const stageModelTagEl = document.getElementById("stageModelTag");
  const stageConfEl = document.getElementById("stageConf");

  if (stageCropNameEl) stageCropNameEl.textContent = advisory.crop || crop;
  if (stagePhaseTitleEl) stagePhaseTitleEl.textContent = advisory.phase_name || (phase + " Phase");
  if (stageSubStageEl) stageSubStageEl.textContent = advisory.sub_stage || sub_stage;

  if (stageModelTagEl) {
    stageModelTagEl.innerHTML = model_used.includes("Nova") ? ui.tagNovaLite : ui.tagLocal;
  }
  if (stageConfEl) {
    stageConfEl.innerHTML = `<b>${confidence.toFixed(1)}%</b> ${ui.confidenceSuffix} &bull; <span style="color:#a7f3d0">${model_used}</span>`;
  }

  // 3-Step Progress Stepper
  const stepVeg = document.getElementById("stepVeg");
  const stepRep = document.getElementById("stepRep");
  const stepRip = document.getElementById("stepRip");

  if (stepVeg && stepRep && stepRip) {
    [stepVeg, stepRep, stepRip].forEach(s => s.className = "stage-step");

    const normPhase = phase.toLowerCase();
    if (normPhase.includes("veg")) {
      stepVeg.classList.add("active");
    } else if (normPhase.includes("rep") || normPhase.includes("flow")) {
      stepVeg.classList.add("completed");
      stepRep.classList.add("active");
    } else if (normPhase.includes("rip") || normPhase.includes("mat") || normPhase.includes("harv")) {
      stepVeg.classList.add("completed");
      stepRep.classList.add("completed");
      stepRip.classList.add("active");
    }

    // Localized step titles
    const vegTitle = stepVeg.querySelector(".step-title");
    const repTitle = stepRep.querySelector(".step-title");
    const ripTitle = stepRip.querySelector(".step-title");
    if (vegTitle) vegTitle.textContent = ui.phase1Title;
    if (repTitle) repTitle.textContent = ui.phase2Title;
    if (ripTitle) ripTitle.textContent = ui.phase3Title;
  }

  // Advisory Details
  const stageVisualCluesEl = document.getElementById("stageVisualClues");
  const stageIrrigationEl = document.getElementById("stageIrrigation");
  const stageFertilizerEl = document.getElementById("stageFertilizer");
  const stagePestAlertEl = document.getElementById("stagePestAlert");
  const stageDaysToHarvestEl = document.getElementById("stageDaysToHarvest");
  const stagePriorityActionEl = document.getElementById("stagePriorityAction");

  // Section Headers
  const lblVisualClues = document.getElementById("lblStageVisualClues");
  const lblIrrigation = document.getElementById("lblStageIrrigation");
  const lblFertilizer = document.getElementById("lblStageFertilizer");
  const lblPestAlert = document.getElementById("lblStagePestAlert");
  const lblCountdown = document.getElementById("lblStageCountdown");
  const lblPriority = document.getElementById("lblStagePriority");

  if (lblVisualClues) lblVisualClues.textContent = ui.headerVisualClues;
  if (lblIrrigation) lblIrrigation.textContent = ui.headerIrrigation;
  if (lblFertilizer) lblFertilizer.textContent = ui.headerFertilizer;
  if (lblPestAlert) lblPestAlert.textContent = ui.headerPestAlert;
  if (lblCountdown) lblCountdown.textContent = ui.headerCountdown;
  if (lblPriority) lblPriority.textContent = ui.headerPriorityAction;

  if (stageVisualCluesEl) stageVisualCluesEl.textContent = visual_clues;
  if (stageIrrigationEl) stageIrrigationEl.textContent = advisory.irrigation;
  if (stageFertilizerEl) stageFertilizerEl.textContent = advisory.fertilizer;
  if (stagePestAlertEl) stagePestAlertEl.textContent = advisory.pest_disease_watch;
  if (stageDaysToHarvestEl) stageDaysToHarvestEl.textContent = advisory.days_to_harvest;
  if (stagePriorityActionEl) stagePriorityActionEl.textContent = advisory.priority_action;

  currentStageData = item.stageDiagnosisData;

  const lblShareWa = document.getElementById("lblShareStageWhatsApp");
  if (lblShareWa) lblShareWa.textContent = ui.shareWhatsApp || "WhatsApp";
  const lblExpPdf = document.getElementById("lblExportStagePdf");
  if (lblExpPdf) lblExpPdf.textContent = ui.exportPdf || "Export PDF";

  const saveStageBtn = document.getElementById("saveStageHistoryBtn");
  if (saveStageBtn) {
    saveStageBtn.disabled = false;
    saveStageBtn.innerHTML = `<span>💾</span> <span>${ui.saveStageHistory}</span>`;
    saveStageBtn.style.background = "linear-gradient(135deg, #15803d, #16a34a)";
  }
}

/* ---- Stage Language Switch Handler ---- */
async function updateStageLanguage(targetLang) {
  if (currentDiagnosticMode !== "stage") return;
  const ui = STAGE_UI_STRINGS[targetLang] || STAGE_UI_STRINGS.en;

  const uploadHelp = document.getElementById("uploadHelpTxt");
  if (uploadHelp) uploadHelp.textContent = ui.uploadHelpStage;

  const runBtn = document.getElementById("run");
  if (runBtn && !runBtn.classList.contains("busy")) {
    const runTxtEl = runBtn.querySelector(".btn-txt") || runBtn;
    runTxtEl.textContent = ui.btnRunStage;
  }

  if (typeof activeIndex === "undefined" || activeIndex < 0 || !batchFiles[activeIndex] || !batchFiles[activeIndex].stageResult) {
    return;
  }

  const item = batchFiles[activeIndex];
  const { crop, phase, sub_stage, confidence } = item.stageResult;

  if (item.stageAdvisories && item.stageAdvisories[targetLang]) {
    item.stageResult.advisory = item.stageAdvisories[targetLang];
    displayStageResult(item.stageResult, item);
  } else {
    // Show temporary loading indicator in stage cards
    const loadingMsg = targetLang === "ta" ? "பருவ மொழிபெயர்ப்பு பெறப்படுகிறது..." : (targetLang === "hi" ? "अवस्था अनुवाद प्राप्त किया जा रहा है..." : "Fetching stage advisory...");
    const irrigationEl = document.getElementById("stageIrrigation");
    const fertEl = document.getElementById("stageFertilizer");
    if (irrigationEl) irrigationEl.innerHTML = `<span style="color:var(--muted);font-style:italic;">⏳ ${loadingMsg}</span>`;
    if (fertEl) fertEl.innerHTML = `<span style="color:var(--muted);font-style:italic;">⏳ ${loadingMsg}</span>`;

    try {
      const advRes = await fetch("/api/stage_advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop,
          phase,
          sub_stage,
          confidence,
          language: targetLang
        })
      });
      if (advRes.ok) {
        const advData = await advRes.json();
        if (!item.stageAdvisories) item.stageAdvisories = {};
        item.stageAdvisories[targetLang] = advData;
        item.stageResult.advisory = advData;
        displayStageResult(item.stageResult, item);
      }
    } catch (e) {
      console.error("Error switching stage language:", e);
    }
  }
}

// Hook into DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  initStageModule();

  // Save Stage History Handler
  const saveBtn = document.getElementById("saveStageHistoryBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      if (!currentStageData) return;
      if (typeof currentUser === "undefined" || !currentUser) {
        if (confirm("You must be signed in to save scans to your account history.\n\nGo to Sign in now?")) {
          location.href = "login.html?next=dashboard.html";
        }
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>⏳</span> <span>Saving to history…</span>`;

      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            image_name: currentStageData.image_name,
            image_path: currentStageData.image_path,
            predicted_disease: `${currentStageData.crop} · ${currentStageData.phase} (${currentStageData.sub_stage})`,
            crop: currentStageData.crop,
            confidence: currentStageData.confidence,
            severity: "Growth Stage",
            diagnosis: `Identified Phase: ${currentStageData.phase} [${currentStageData.sub_stage}]. Priority: ${currentStageData.priority_action}`,
            treatment: currentStageData.irrigation,
            fertilizer: currentStageData.fertilizer
          })
        });
        const d = await res.json();
        const msg = document.getElementById("saveStageMsg");
        if (res.ok && d.ok) {
          saveBtn.innerHTML = `<span>✅</span> <span>Saved!</span>`;
          saveBtn.style.background = "#16a34a";
          if (msg) {
            msg.style.display = "block";
            msg.style.color = "var(--green)";
            msg.innerHTML = `Saved to your account! <a href="history.html" style="color:var(--gold);font-weight:700;text-decoration:underline;">View in History &amp; Profile →</a>`;
          }
        } else {
          saveBtn.disabled = false;
          saveBtn.innerHTML = `<span>💾</span> <span>Save to History</span>`;
          if (msg) {
            msg.style.display = "block";
            msg.style.color = "var(--rust)";
            msg.textContent = d.error || "Failed to save.";
          }
        }
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>💾</span> <span>Save to History</span>`;
      }
    });
  }

  // Stage Export Handlers
  function getStageExportPayload() {
    if (!currentStageData) return null;
    const lang = (typeof currentAppLanguage !== "undefined" ? currentAppLanguage : "en");
    const activeItem = (typeof activeIndex !== "undefined" && activeIndex >= 0 && typeof batchFiles !== "undefined" && batchFiles[activeIndex]) ? batchFiles[activeIndex] : null;
    return {
      isStage: true,
      language: lang,
      crop: currentStageData.crop || (typeof selectedCropName !== "undefined" ? selectedCropName : "Crop"),
      condition: `${currentStageData.phase} (${currentStageData.sub_stage})`,
      phase: currentStageData.phase,
      subStage: currentStageData.sub_stage,
      daysToHarvest: currentStageData.days_to_harvest,
      diagnosis: (activeItem && activeItem.stageResult && activeItem.stageResult.visual_clues) || "Plant phenology evaluated.",
      irrigation: currentStageData.irrigation,
      fertilizer: currentStageData.fertilizer,
      pestWatch: currentStageData.pest_watch,
      priorityAction: currentStageData.priority_action,
      imageSrc: currentStageData.image_path || (activeItem && (activeItem.dataUrl || activeItem.url)) || "",
      farmerName: (typeof currentUser !== "undefined" && currentUser && currentUser.username) || "AgroLens Farmer"
    };
  }

  const shareStageBtn = document.getElementById("shareStageWhatsAppBtn");
  if (shareStageBtn) {
    shareStageBtn.addEventListener("click", () => {
      const payload = getStageExportPayload();
      if (!payload) {
        alert("No active growth stage data to share. Run stage diagnosis first.");
        return;
      }
      if (window.AdvisoryExport) {
        window.AdvisoryExport.shareToWhatsApp(payload);
      }
    });
  }

  const exportStagePdfBtn = document.getElementById("exportStagePdfBtn");
  if (exportStagePdfBtn) {
    exportStagePdfBtn.addEventListener("click", () => {
      const payload = getStageExportPayload();
      if (!payload) {
        alert("No active growth stage data to export. Run stage diagnosis first.");
        return;
      }
      if (window.AdvisoryExport) {
        window.AdvisoryExport.exportToPdf(payload);
      }
    });
  }
});
