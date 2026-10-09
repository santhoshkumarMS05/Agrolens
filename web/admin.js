// State management
let queueItems = [];
let classesData = [];
let masteredData = [];
let currentFilterSource = "all";
let currentClassFilter = "all";
let classSearchQuery = "";
let selectedItemIds = new Set();
let activeModalItem = null;
let activeViewerClass = "";

// Auth check on load
async function checkAuth() {
  try {
    const res = await fetch("/api/admin/check");
    if (!res.ok) {
      window.location.replace("admin-login.html");
      return;
    }
    const data = await res.json();
    if (!data.is_admin) {
      window.location.replace("index.html");
      return;
    }
    document.getElementById("userName").textContent = data.user.name || data.user.email;
  } catch (e) {
    window.location.replace("admin-login.html");
  }
}

// Tab navigation (Direct 1-Click Switcher)
document.querySelectorAll(".section-nav .tab-trigger").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".section-nav .tab-trigger").forEach(b => {
      b.classList.remove("active", "accent-green");
    });
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");

    btn.classList.add("active", "accent-green");
    const targetId = btn.dataset.target;
    const panel = document.getElementById(targetId);
    if (panel) panel.style.display = "block";

    if (btn.dataset.subtab) {
      currentClassSubtab = btn.dataset.subtab;
      updateHubCounts();
      renderClassesGrid();
    }

    if (targetId === "panelClasses") loadClassesHub();
    if (targetId === "panelConsole") pollTrainingStatus();
  });
});

// Load Queue
async function loadQueue() {
  try {
    const res = await fetch("/api/admin/queue?status=pending");
    const data = await res.json();
    if (!data.ok) return;

    queueItems = data.items || [];
    selectedItemIds.clear();
    updateBatchButtons();

    // Update stats
    document.getElementById("statPendingCount").textContent = data.counts.pending || 0;
    document.getElementById("statApprovedCount").textContent = data.counts.approved || 0;
    document.getElementById("statRejectedCount").textContent = data.counts.rejected || 0;
    document.getElementById("statTrainedRuns").textContent = data.counts.trained || 0;

    renderGallery();
  } catch (e) {
    console.error("Queue load error:", e);
  }
}

// Render Gallery
function renderGallery() {
  const container = document.getElementById("queueGallery");
  container.innerHTML = "";

  const filtered = queueItems.filter(item => {
    if (currentFilterSource === "all") return true;
    return item.source === currentFilterSource;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-queue">
        <div class="empty-icon">🌱</div>
        <h3>No Pending Candidates (≥85% Confidence)</h3>
        <p>Candidate photos automatically stage here when Amazon Nova Lite detects disease symptoms with ≥85% confidence or when farmers flag diagnoses.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "queue-card";

    let srcLabel = "Nova Lite (≥85%)";
    let srcClass = "nova";
    if (item.source === "farmer_report") {
      srcLabel = "Farmer Flagged";
      srcClass = "farmer";
    } else if (item.source === "model_high_confidence") {
      srcLabel = "Model QA (≥85%)";
      srcClass = "model";
    } else if (item.source === "stage_nova_lite") {
      srcLabel = "🌱 Stage Nova Lite";
      srcClass = "health";
    }

    const isChecked = selectedItemIds.has(item.id);

    card.innerHTML = `
      <div class="queue-thumb">
        <input type="checkbox" class="queue-card-checkbox" data-id="${item.id}" ${isChecked ? "checked" : ""}>
        <span class="queue-source-tag ${srcClass}">⚡ ${srcLabel}</span>
        <img src="${item.image_url}" alt="${item.proposed_class}" loading="lazy">
      </div>
      <div class="queue-body">
        <div class="queue-class-title">${item.proposed_class}</div>
        <div class="queue-meta-row">
          <span>Crop: <b>${item.crop || "Crop"}</b></span>
          <span class="queue-conf-badge">${item.confidence ? item.confidence.toFixed(1) + "%" : "Flagged"}</span>
        </div>
        ${item.notes ? `<p style="font-size:.78rem;color:var(--muted);line-height:1.35;margin-top:2px;">${item.notes.substring(0, 95)}${item.notes.length > 95 ? "…" : ""}</p>` : ""}
        <div class="queue-actions">
          <button type="button" class="queue-btn inspect" data-id="${item.id}">🔍 Inspect</button>
          <button type="button" class="queue-btn reject" data-id="${item.id}">Reject</button>
          <button type="button" class="queue-btn approve" data-id="${item.id}">Approve</button>
        </div>
      </div>
    `;

    // Checkbox click
    const cb = card.querySelector(".queue-card-checkbox");
    cb.addEventListener("change", (e) => {
      e.stopPropagation();
      if (cb.checked) selectedItemIds.add(item.id);
      else selectedItemIds.delete(item.id);
      updateBatchButtons();
    });

    // Image click -> Inspect
    card.querySelector(".queue-thumb").addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT") openInspectModal(item);
    });

    card.querySelector(".queue-btn.inspect").addEventListener("click", () => openInspectModal(item));
    card.querySelector(".queue-btn.approve").addEventListener("click", () => approveSingle(item.id, item.proposed_class));
    card.querySelector(".queue-btn.reject").addEventListener("click", () => rejectSingle(item.id));

    container.appendChild(card);
  });
}

// Filter chips
document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentFilterSource = chip.dataset.source;
    renderGallery();
  });
});

// Batch select buttons
document.getElementById("btnSelectAll").addEventListener("click", () => {
  if (selectedItemIds.size === queueItems.length) {
    selectedItemIds.clear();
  } else {
    queueItems.forEach(i => selectedItemIds.add(i.id));
  }
  updateBatchButtons();
  renderGallery();
});

function updateBatchButtons() {
  const count = selectedItemIds.size;
  const btnApprove = document.getElementById("btnBatchApprove");
  const btnReject = document.getElementById("btnBatchReject");
  document.getElementById("batchApproveCount").textContent = count;
  document.getElementById("batchRejectCount").textContent = count;
  btnApprove.disabled = count === 0;
  btnReject.disabled = count === 0;
}

// Single Approve
async function approveSingle(id, targetClass) {
  try {
    const res = await fetch(`/api/admin/queue/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_class: targetClass })
    });
    const d = await res.json();
    if (d.ok) {
      loadQueue();
      if (document.getElementById("panelClasses").style.display !== "none") loadClassesHub();
    } else {
      alert("Error: " + (d.error || "Could not approve"));
    }
  } catch (e) {
    alert("Network error: " + e.message);
  }
}

// Single Reject
async function rejectSingle(id) {
  try {
    const res = await fetch(`/api/admin/queue/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Admin rejected" })
    });
    const d = await res.json();
    if (d.ok) {
      loadQueue();
    } else {
      alert("Error: " + (d.error || "Could not reject"));
    }
  } catch (e) {
    alert("Network error: " + e.message);
  }
}

// Batch Actions
document.getElementById("btnBatchApprove").addEventListener("click", async () => {
  if (!confirm(`Approve and file ${selectedItemIds.size} images to their canonical class folders?`)) return;
  try {
    const res = await fetch("/api/admin/queue/batch_action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", ids: Array.from(selectedItemIds) })
    });
    const d = await res.json();
    if (d.ok) loadQueue();
  } catch (e) { alert(e.message); }
});

document.getElementById("btnBatchReject").addEventListener("click", async () => {
  if (!confirm(`Reject and archive ${selectedItemIds.size} images?`)) return;
  try {
    const res = await fetch("/api/admin/queue/batch_action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", ids: Array.from(selectedItemIds) })
    });
    const d = await res.json();
    if (d.ok) loadQueue();
  } catch (e) { alert(e.message); }
});

// Modal inspect
function openInspectModal(item) {
  activeModalItem = item;
  document.getElementById("modalImg").src = item.image_url;
  document.getElementById("modalProposedClass").textContent = item.proposed_class;
  document.getElementById("modalConfidence").textContent = item.confidence ? item.confidence.toFixed(1) + "%" : "Flagged";
  document.getElementById("modalReasoning").textContent = item.notes || "High confidence visual pathology assessment (≥85%).";

  // Populate select
  const select = document.getElementById("modalTargetClassSelect");
  select.innerHTML = "";
  classesData.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.class_name;
    opt.textContent = `${c.display_name} (${c.class_name})`;
    if (c.class_name.toLowerCase() === item.proposed_class.toLowerCase() ||
        c.display_name.toLowerCase() === item.proposed_class.toLowerCase()) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });

  updateModalPathPreview();
  document.getElementById("inspectModal").classList.add("open");
}

function updateModalPathPreview() {
  const select = document.getElementById("modalTargetClassSelect");
  const chosen = select.value || (activeModalItem ? activeModalItem.proposed_class : "class");
  const folder = chosen.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[-\s]+/g, "_");
  document.getElementById("modalPathPreview").textContent = `backend/training_pool/approved/${folder}/${activeModalItem ? activeModalItem.image_name : "*.jpg"}`;
}

document.getElementById("modalTargetClassSelect").addEventListener("change", updateModalPathPreview);
document.getElementById("modalCloseBtn").addEventListener("click", () => {
  document.getElementById("inspectModal").classList.remove("open");
});

document.getElementById("modalApproveBtn").addEventListener("click", async () => {
  if (!activeModalItem) return;
  const select = document.getElementById("modalTargetClassSelect");
  await approveSingle(activeModalItem.id, select.value);
  document.getElementById("inspectModal").classList.remove("open");
});

document.getElementById("modalRejectBtn").addEventListener("click", async () => {
  if (!activeModalItem) return;
  await rejectSingle(activeModalItem.id);
  document.getElementById("inspectModal").classList.remove("open");
});

let stageClassesData = [];
let currentClassSubtab = "disease"; // "disease" | "stage"

// Classes Hub
async function loadClassesHub() {
  try {
    const res = await fetch("/api/admin/classes");
    const data = await res.json();
    if (!data.ok) return;

    classesData = data.classes || [];
    masteredData = data.mastered_classes || [];
    stageClassesData = data.stage_classes || [];
    updateHubCounts();
    renderClassesGrid();
  } catch (e) {
    console.error("Classes load error:", e);
  }
}

function updateHubCounts() {
  const countDiseaseEl = document.getElementById("topCountDisease");
  const countStageEl = document.getElementById("topCountStage");
  if (countDiseaseEl) countDiseaseEl.textContent = classesData.length;
  if (countStageEl) countStageEl.textContent = stageClassesData.length;

  const activeSet = (currentClassSubtab === "stage") ? stageClassesData : classesData;
  const totalActive = activeSet.length;
  const newClasses = activeSet.filter(c => c.is_new_class).length;
  const hasSamples = activeSet.filter(c => c.approved_count > 0).length;
  const mastered = (currentClassSubtab === "stage") ? 0 : masteredData.length;

  const elAll = document.getElementById("countAllClasses");
  const elNew = document.getElementById("countNewClasses");
  const elSamples = document.getElementById("countHasSamples");
  const elMastered = document.getElementById("countMastered");

  if (elAll) elAll.textContent = totalActive;
  if (elNew) elNew.textContent = newClasses;
  if (elSamples) elSamples.textContent = hasSamples;
  if (elMastered) elMastered.textContent = mastered;
}

function renderClassesGrid() {
  const grid = document.getElementById("classesGrid");
  grid.innerHTML = "";

  const q = classSearchQuery.trim().toLowerCase();

  // Determine active dataset based on selected subtab and filter
  let sourceList = (currentClassSubtab === "stage") ? stageClassesData : classesData;
  if (currentClassSubtab === "disease" && currentClassFilter === "mastered") {
    sourceList = masteredData;
  }

  const filtered = sourceList.filter(c => {
    // Search query match
    if (q) {
      const matchName = c.display_name.toLowerCase().includes(q) ||
                        c.class_name.toLowerCase().includes(q) ||
                        c.crop.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    // Category filter match
    if (currentClassFilter === "new_classes") return c.is_new_class;
    if (currentClassFilter === "has_samples") return c.approved_count > 0;
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-queue">
        <div class="empty-icon">🔍</div>
        <h3>No Matching ${currentClassSubtab === 'stage' ? 'Growth Stages' : 'Classes'} Found</h3>
        <p>No agricultural ${currentClassSubtab === 'stage' ? 'growth stages' : 'classes'} match your current filter or search criteria.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(c => {
    const card = document.createElement("div");
    card.className = "class-health-card";

    const isStage = Boolean(c.is_stage);
    const isMaintenance = !isStage && (c.maintenance_mode || c.current_accuracy >= 97.0);
    const progressPct = c.progress_pct || 0;
    const isFull = c.approved_count >= c.threshold;

    card.innerHTML = `
      <div class="class-head">
        <div class="class-title-row">
          <div class="class-title">${c.display_name}</div>
          ${isStage ? `
            <span class="badge-status new-class" style="background:rgba(22,163,74,.12);color:#15803d;border-color:rgba(22,163,74,.3);">
              🌱 Growth Stage · Base Pending
            </span>
          ` : (c.is_new_class ? `
            <span class="badge-status new-class">
              ✨ New Class · Untrained
            </span>
          ` : (isMaintenance ? `
            <span class="badge-status maintenance">
              🛡️ Mastered (≥97%)
            </span>
          ` : `
            <span class="badge-status active-staging">
              🎯 Active Retraining
            </span>
          `))}
        </div>
        <span class="class-folder-tag">📁 approved/${c.folder}/</span>
      </div>

      <div class="progress-wrap">
        <div class="progress-meta">
          <span class="count">Approved in Staging: <b>${c.approved_count} / ${c.threshold}</b></span>
          <span class="pct-badge">${progressPct}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-bar ${isFull ? "full" : ""}" style="width: ${Math.max(c.approved_count > 0 ? 4 : 0, progressPct)}%"></div>
        </div>
      </div>

      <div class="class-metrics">
        <div class="metric-item">
          <span class="m-lbl">${isStage ? 'Model Type' : 'Model Accuracy'}</span>
          <span class="m-val ${isMaintenance ? 'acc-high' : 'acc-staging'}">
            ${isStage ? 'Stage Base (Pending)' : (c.is_new_class ? '0.0% (New)' : (c.current_accuracy ? c.current_accuracy.toFixed(1) + "%" : "Untrained"))}
          </span>
        </div>
        <div class="metric-item">
          <span class="m-lbl">Staging Status</span>
          <span class="m-val" style="font-size:.85rem;color:var(--ink);">
            ${isStage ? (c.approved_count >= 100 ? 'Quota Reached (Awaiting Model)' : 'Collecting (≥85%)') : (c.approved_count > 0 ? 'Ready to Retrain' : (isMaintenance ? 'Harvest Paused' : 'Collecting (≥85%)'))}
          </span>
        </div>
        <div class="metric-item">
          <span class="m-lbl">Pending Review</span>
          <span class="m-val" style="color:var(--green);">${c.pending_count || 0}</span>
        </div>
      </div>

      <div class="class-card-actions">
        ${isStage ? `
          <button type="button" class="retrain-btn secondary" disabled title="Custom stage model architecture not initialized yet. Collecting samples in progress (${c.approved_count}/${c.threshold || 100}).">
            <span>🔒</span> <span>Awaiting Stage Model Base (${c.approved_count}/${c.threshold || 100})</span>
          </button>
        ` : (c.approved_count >= (c.threshold || 100) ? `
          <button type="button" class="retrain-btn primary" data-class="${c.class_name}">
            <span>🚀</span> <span>Start Retraining Head (${c.approved_count} samples)</span>
          </button>
        ` : `
          <button type="button" class="retrain-btn secondary" disabled title="Threshold not reached. 100 approved samples required before fine-tuning to prevent overfitting.">
            <span>⏳</span> <span>Collecting Samples (${c.approved_count}/${c.threshold || 100})</span>
          </button>
        `)}
        <button type="button" class="view-approved-btn ${c.approved_count > 0 ? '' : 'disabled'}" data-folder="${c.folder}" data-class="${c.display_name}" data-count="${c.approved_count}" ${c.approved_count === 0 ? 'disabled' : ''}>
          <span>👁️</span> <span>View Approved Images (${c.approved_count})</span>
        </button>
      </div>
    `;

    const retrainBtn = card.querySelector(".retrain-btn.primary");
    if (retrainBtn) {
      retrainBtn.addEventListener("click", () => {
        triggerClassRetraining(c.class_name, c.display_name);
      });
    }

    const viewBtn = card.querySelector(".view-approved-btn:not(:disabled)");
    if (viewBtn) {
      viewBtn.addEventListener("click", () => {
        openApprovedViewer(c.folder, c.display_name, c.approved_count, c.class_name);
      });
    }

    grid.appendChild(card);
  });
}

// Hub search & filters
document.getElementById("classSearchInput").addEventListener("input", (e) => {
  classSearchQuery = e.target.value;
  renderClassesGrid();
});

document.querySelectorAll("#classFilterChips .filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#classFilterChips .filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    currentClassFilter = chip.dataset.filter;
    renderClassesGrid();
  });
});

// Approved Samples Viewer Logic
async function openApprovedViewer(folder, displayName, count, className) {
  activeViewerClass = className || displayName;
  const modal = document.getElementById("approvedViewerModal");
  const title = document.getElementById("viewerModalTitle");
  const sub = document.getElementById("viewerModalSub");
  const spinner = document.getElementById("viewerLoadingSpinner");
  const empty = document.getElementById("viewerEmptyState");
  const grid = document.getElementById("viewerGalleryGrid");
  const countLbl = document.getElementById("viewerImageCountLabel");
  const retrainBtn = document.getElementById("viewerRetrainShortcutBtn");

  title.textContent = `Approved Images · ${displayName}`;
  sub.textContent = `📁 backend/training_pool/approved/${folder}/ • ${count} approved sample${count === 1 ? '' : 's'}`;
  countLbl.textContent = `${count} image${count === 1 ? '' : 's'} staged for training`;
  
  grid.innerHTML = "";
  empty.style.display = "none";
  spinner.style.display = "block";
  modal.classList.add("open");

  if (count >= 100) {
    retrainBtn.disabled = false;
    retrainBtn.className = "btn-sm btn-approve";
    retrainBtn.style.opacity = "1";
    retrainBtn.style.cursor = "pointer";
    retrainBtn.title = "";
    retrainBtn.innerHTML = `<span>🚀</span> <span>Start Retraining Head (${count} samples)</span>`;
    retrainBtn.onclick = () => {
      modal.classList.remove("open");
      triggerClassRetraining(className, displayName);
    };
  } else {
    retrainBtn.disabled = true;
    retrainBtn.className = "btn-sm";
    retrainBtn.style.opacity = "0.5";
    retrainBtn.style.cursor = "not-allowed";
    retrainBtn.title = "100 approved samples required to retrain.";
    retrainBtn.innerHTML = `<span>⏳</span> <span>Quota: ${count}/100 Samples Required</span>`;
    retrainBtn.onclick = null;
  }

  try {
    const res = await fetch(`/api/admin/classes/${encodeURIComponent(folder)}/samples`);
    const d = await res.json();
    spinner.style.display = "none";

    if (!d.ok || !d.images || d.images.length === 0) {
      empty.style.display = "block";
      return;
    }

    d.images.forEach(img => {
      const item = document.createElement("div");
      item.className = "approved-thumb-card";
      
      const isNova = (img.source || "").toLowerCase().includes("nova");
      const isFarmer = (img.source || "").toLowerCase().includes("farmer");
      const badgeClass = isNova ? "nova" : (isFarmer ? "farmer" : "");
      const badgeText = isNova ? `Nova Lite · ${img.confidence}%` : (isFarmer ? "Farmer QA" : "Admin Approved");

      item.innerHTML = `
        <div class="approved-thumb-img-wrap" title="Click to view full resolution">
          <img src="${img.url}" alt="${img.filename}" loading="lazy">
          <span class="approved-thumb-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="approved-thumb-meta">
          <div class="approved-thumb-fname" title="${img.filename}">${img.filename}</div>
          <div class="approved-thumb-sub">
            <span>${img.size_kb} KB</span>
            <span>${img.reviewed_at ? img.reviewed_at.split(' ')[0] : 'Approved'}</span>
          </div>
        </div>
      `;

      item.querySelector(".approved-thumb-img-wrap").addEventListener("click", () => {
        openLightbox(img.url, `${displayName} — ${img.filename}`, `${img.source || 'Approved Sample'} • Conf: ${img.confidence}% • Size: ${img.size_kb} KB`);
      });

      grid.appendChild(item);
    });
  } catch (e) {
    spinner.style.display = "none";
    grid.innerHTML = `<p style="color:var(--rust);padding:20px;">Failed to load images: ${e.message}</p>`;
  }
}

// Viewer modal close buttons
document.getElementById("viewerModalCloseBtn").addEventListener("click", () => {
  document.getElementById("approvedViewerModal").classList.remove("open");
});
document.getElementById("viewerCloseBtnFooter").addEventListener("click", () => {
  document.getElementById("approvedViewerModal").classList.remove("open");
});

// Lightbox Logic
function openLightbox(url, caption, sub) {
  const lb = document.getElementById("lightboxModal");
  document.getElementById("lightboxImg").src = url;
  document.getElementById("lightboxCaption").textContent = caption;
  document.getElementById("lightboxSub").textContent = sub;
  lb.classList.add("open");
}

document.getElementById("lightboxCloseBtn").addEventListener("click", () => {
  document.getElementById("lightboxModal").classList.remove("open");
});
document.getElementById("lightboxModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("lightboxModal")) {
    document.getElementById("lightboxModal").classList.remove("open");
  }
});

// ESC key listener
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("lightboxModal").classList.remove("open");
    document.getElementById("approvedViewerModal").classList.remove("open");
    document.getElementById("inspectModal").classList.remove("open");
  }
});

// Trigger Retraining
async function triggerClassRetraining(className, displayName) {
  const epochs = prompt(`Start feature-freezing PyTorch retraining for:\n"${displayName || className}"?\n\nEnter number of fine-tuning epochs (default 5):`, "5");
  if (!epochs) return;

  try {
    const res = await fetch("/api/admin/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_class: className, epochs: parseInt(epochs) || 5 })
    });
    const d = await res.json();
    if (d.ok) {
      document.getElementById("tabTriggerConsole").click();
    } else {
      alert("Retraining note: " + (d.error || "Could not start retraining"));
    }
  } catch (e) {
    alert("Network error: " + e.message);
  }
}

// Poll live training status
async function pollTrainingStatus() {
  try {
    const res = await fetch("/api/admin/train_status");
    const d = await res.json();
    if (!d.ok) return;

    const s = d.status;
    const badge = document.getElementById("liveStatusBadge");
    const badgeText = document.getElementById("liveStatusText");
    const spinner = document.getElementById("stepSpinner");
    const hotSwap = document.getElementById("hotSwapBanner");

    document.getElementById("gaugeEpoch").textContent = `${s.current_epoch} / ${s.total_epochs}`;
    document.getElementById("gaugeLoss").textContent = s.train_loss.toFixed(4);
    document.getElementById("gaugeAcc").textContent = s.val_accuracy.toFixed(1) + "%";
    document.getElementById("gaugeTargetClass").textContent = s.target_class || "—";

    if (s.is_training) {
      badgeText.textContent = "Status: Retraining Active";
      badge.querySelector(".dot").style.background = "#eab308";
      spinner.style.display = "block";
      document.getElementById("stepTitle").textContent = `Retraining: ${s.target_class}`;
      document.getElementById("stepSubtitle").textContent = s.step_description || "Optimizing classifier head...";
      hotSwap.style.display = "none";
    } else if (s.completed) {
      badgeText.textContent = "Status: Retraining Completed";
      badge.querySelector(".dot").style.background = "#16a34a";
      spinner.style.display = "none";
      document.getElementById("stepTitle").textContent = "Training Run Successfully Finished";
      document.getElementById("stepSubtitle").textContent = s.step_description;
      hotSwap.style.display = "block";
    } else {
      badgeText.textContent = "Status: Engine Idle";
      badge.querySelector(".dot").style.background = "#888";
      spinner.style.display = "none";
      hotSwap.style.display = "none";
    }
  } catch (e) {
    console.error("Training poll error:", e);
  }
}

// Sign out
document.getElementById("signoutBtn").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.replace("admin-login.html");
});

// ══════════════════════════════════════════════════════════════
// TOP NAV SECTION SWITCHER (Staging vs Farmers Registry)
// ══════════════════════════════════════════════════════════════
const topNavStaging = document.getElementById("navTabStaging");
const topNavFarmers = document.getElementById("navTabFarmers");
const adminStagingSection = document.getElementById("adminStagingSection");
const adminFarmersSection = document.getElementById("adminFarmersSection");

function switchAdminSection(section) {
  if (section === "staging") {
    topNavStaging.classList.add("active");
    topNavFarmers.classList.remove("active");
    adminStagingSection.style.display = "flex";
    adminFarmersSection.style.display = "none";
  } else {
    topNavStaging.classList.remove("active");
    topNavFarmers.classList.add("active");
    adminStagingSection.style.display = "none";
    adminFarmersSection.style.display = "flex";
    loadFarmers(1);
  }
}

topNavStaging.addEventListener("click", () => switchAdminSection("staging"));
topNavFarmers.addEventListener("click", () => switchAdminSection("farmers"));

// ══════════════════════════════════════════════════════════════
// FARMER REGISTRY (15 per page) & SEARCH
// ══════════════════════════════════════════════════════════════
let farmersCurrentPage = 1;
let farmersTotalPages = 1;
let farmersSearchTerm = "";
let searchDebounceTimer = null;

async function loadFarmers(page = 1) {
  farmersCurrentPage = page;
  const grid = document.getElementById("farmersGrid");
  const countLbl = document.getElementById("farmersCountLabel");
  const prevBtn = document.getElementById("farmersPrevBtn");
  const nextBtn = document.getElementById("farmersNextBtn");
  const pageInd = document.getElementById("farmersPageIndicator");

  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--muted);"><div class="pulse-spinner" style="margin:0 auto 12px;"></div>Loading registered farmers...</div>';

  try {
    const url = `/api/admin/farmers?page=${page}&limit=15&search=${encodeURIComponent(farmersSearchTerm)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--rust);">Failed to load farmers list.</div>';
      return;
    }

    farmersTotalPages = data.total_pages || 1;
    countLbl.textContent = `${data.total} Registered Farmer${data.total === 1 ? '' : 's'}`;
    pageInd.textContent = `Page ${data.page} of ${farmersTotalPages} (${data.total} total)`;

    prevBtn.disabled = data.page <= 1;
    nextBtn.disabled = data.page >= farmersTotalPages;

    if (!data.farmers || data.farmers.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:var(--paper-2);border-radius:var(--r);border:1px solid var(--line);"><div style="font-size:2.2rem;margin-bottom:8px;">👨‍🌾</div><h3 style="font-size:1.15rem;color:var(--ink);">No Farmers Found</h3><p style="font-size:.86rem;color:var(--muted);margin-top:4px;">No farmer accounts match your search query.</p></div>';
      return;
    }

    grid.innerHTML = "";
    data.farmers.forEach(f => {
      const card = document.createElement("div");
      card.className = "farmer-card";
      const initials = (f.name || f.email || "F").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

      card.innerHTML = `
        <div class="farmer-card-top">
          <div class="farmer-avatar">${initials}</div>
          <div class="farmer-info" style="overflow:hidden;">
            <h4>${f.name || 'Farmer'}</h4>
            <p style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${f.email}">✉️ ${f.email}</p>
          </div>
        </div>
        <div class="farmer-card-bottom">
          <span>Joined: ${f.joined_at}</span>
          <span class="scans-count-pill">🌱 ${f.total_scans} Scan${f.total_scans === 1 ? '' : 's'}</span>
        </div>
      `;
      card.addEventListener("click", () => openFarmerScans(f.id, f.name, f.email, f.total_scans));
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--rust);">Server communication error.</div>';
  }
}

document.getElementById("farmersPrevBtn").addEventListener("click", () => {
  if (farmersCurrentPage > 1) loadFarmers(farmersCurrentPage - 1);
});
document.getElementById("farmersNextBtn").addEventListener("click", () => {
  if (farmersCurrentPage < farmersTotalPages) loadFarmers(farmersCurrentPage + 1);
});

const searchInput = document.getElementById("farmerSearchInput");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchDebounceTimer);
    farmersSearchTerm = e.target.value.trim();
    searchDebounceTimer = setTimeout(() => {
      loadFarmers(1);
    }, 280);
  });
}

// ══════════════════════════════════════════════════════════════
// FARMER SCANS BROWSER (15 Grid Boxes per page)
// ══════════════════════════════════════════════════════════════
let currentFarmerId = null;
let currentFarmerName = "";
let currentFarmerEmail = "";
let scansCurrentPage = 1;
let scansTotalPages = 1;
let currentFarmerScansCache = [];

function openFarmerScans(farmerId, name, email, scanCount) {
  currentFarmerId = farmerId;
  currentFarmerName = name;
  currentFarmerEmail = email;
  scansCurrentPage = 1;

  document.getElementById("farmersListView").style.display = "none";
  document.getElementById("farmerScansView").style.display = "flex";

  document.getElementById("activeFarmerTitle").textContent = `Field Scans for ${name}`;
  document.getElementById("activeFarmerSub").textContent = `Account: ${email} • Reviewing all past foliage scans and disease detections`;
  document.getElementById("activeFarmerBadgeBox").innerHTML = `
    <span class="scans-count-pill" style="font-size:.85rem;padding:6px 14px;">
      🌱 ${scanCount || 0} Total Field Scans
    </span>
  `;

  loadFarmerScans(farmerId, 1);
}

document.getElementById("backToFarmersBtn").addEventListener("click", () => {
  document.getElementById("farmerScansView").style.display = "none";
  document.getElementById("farmersListView").style.display = "flex";
});

async function loadFarmerScans(farmerId, page = 1) {
  scansCurrentPage = page;
  const grid = document.getElementById("scansGrid15");
  const prevBtn = document.getElementById("scansPrevBtn");
  const nextBtn = document.getElementById("scansNextBtn");
  const pageInd = document.getElementById("scansPageIndicator");

  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--muted);"><div class="pulse-spinner" style="margin:0 auto 12px;"></div>Loading 15 scan boxes...</div>';

  try {
    const res = await fetch(`/api/admin/farmers/${farmerId}/scans?page=${page}&limit=15`);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--rust);">Failed to load farmer scans.</div>';
      return;
    }

    scansTotalPages = data.total_pages || 1;
    currentFarmerScansCache = data.scans || [];

    const startIdx = (data.page - 1) * 15 + 1;
    const endIdx = Math.min(data.page * 15, data.total);
    pageInd.textContent = data.total > 0 ? `Showing ${startIdx}–${endIdx} of ${data.total} scans (Page ${data.page}/${scansTotalPages})` : '0 scans recorded';

    prevBtn.disabled = data.page <= 1;
    nextBtn.disabled = data.page >= scansTotalPages;

    if (!data.scans || data.scans.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px 20px;background:var(--paper-2);border-radius:var(--r);border:1px solid var(--line);">
          <div style="font-size:2.5rem;margin-bottom:8px;">🌱</div>
          <h3 style="font-size:1.2rem;color:var(--ink);">No Scans Recorded Yet</h3>
          <p style="font-size:.88rem;color:var(--muted);margin-top:4px;">This farmer has not submitted any crop photos for diagnosis yet.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = "";
    data.scans.forEach((scan, index) => {
      const box = document.createElement("div");
      box.className = "scan-box-card";

      const imgSrc = scan.image_path || "assets/placeholder-leaf.png";
      const isHealthy = (scan.predicted_disease || "").toLowerCase().includes("healthy");

      box.innerHTML = `
        <img class="scan-box-thumb" src="${imgSrc}" alt="${scan.predicted_disease}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\' viewBox=\\'0 0 24 24\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231b2114\\'/><text x=\\'50%\\' y=\\'50%\\' fill=\\'%234ade80\\' text-anchor=\\'middle\\' dy=\\'.3em\\' font-size=\\'12\\'>🌱 Scan</text></svg>'">
        <div class="scan-box-body">
          <div class="scan-box-title" title="${scan.predicted_disease}">${scan.predicted_disease}</div>
          <div class="scan-box-badges">
            <span class="scans-count-pill" style="font-size:.7rem;padding:2px 7px;">${scan.confidence}%</span>
            <span class="scans-count-pill" style="font-size:.7rem;padding:2px 7px;color:${isHealthy ? 'var(--green)' : 'var(--rust)'};border-color:${isHealthy ? 'rgba(74,222,128,.3)' : 'rgba(251,113,133,.3)'};background:${isHealthy ? 'rgba(74,222,128,.1)' : 'rgba(251,113,133,.1)'};">
              ${scan.severity || (isHealthy ? 'Healthy' : 'Diseased')}
            </span>
          </div>
          <div class="scan-box-meta">
            <span>📅 ${scan.created_at}</span>
          </div>
        </div>
      `;
      box.addEventListener("click", () => showScanDetail(index));
      grid.appendChild(box);
    });
  } catch (err) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:36px;color:var(--rust);">Server communication error.</div>';
  }
}

document.getElementById("scansPrevBtn").addEventListener("click", () => {
  if (scansCurrentPage > 1 && currentFarmerId) loadFarmerScans(currentFarmerId, scansCurrentPage - 1);
});
document.getElementById("scansNextBtn").addEventListener("click", () => {
  if (scansCurrentPage < scansTotalPages && currentFarmerId) loadFarmerScans(currentFarmerId, scansCurrentPage + 1);
});

// ══════════════════════════════════════════════════════════════
// SCAN DETAIL MODAL (Image, Grad-CAM & AI Agronomy)
// ══════════════════════════════════════════════════════════════
const scanDetailModal = document.getElementById("scanDetailModal");
const scanDetailCloseBtn = document.getElementById("scanDetailCloseBtn");

function showScanDetail(index) {
  const scan = currentFarmerScansCache[index];
  if (!scan) return;

  document.getElementById("detailDiseaseTitle").textContent = scan.predicted_disease;
  document.getElementById("detailScanMeta").textContent = `${currentFarmerName} (${currentFarmerEmail}) • Scanned on ${scan.created_at} • Crop: ${scan.crop}`;

  const origImg = document.getElementById("detailOriginalImg");
  origImg.src = scan.image_path || "";

  const gradcamImg = document.getElementById("detailGradcamImg");
  const noGradcam = document.getElementById("detailNoGradcam");
  if (scan.gradcam_image) {
    gradcamImg.src = scan.gradcam_image;
    gradcamImg.style.display = "block";
    noGradcam.style.display = "none";
  } else {
    gradcamImg.style.display = "none";
    noGradcam.style.display = "block";
  }

  document.getElementById("detailConfidenceBadge").textContent = `${scan.confidence}% Confidence`;
  document.getElementById("detailSeverityBadge").textContent = `Severity: ${scan.severity || 'Normal'}`;
  document.getElementById("detailDiagnosisTxt").textContent = scan.diagnosis || "Standard diagnosis record saved during user scan.";
  document.getElementById("detailTreatmentTxt").textContent = scan.treatment || "Standard agronomy treatment regimen provided to user.";
  document.getElementById("detailFertilizerTxt").textContent = scan.fertilizer || "Standard nutrient / irrigation schedule provided to user.";

  scanDetailModal.style.display = "flex";
}

if (scanDetailCloseBtn) {
  scanDetailCloseBtn.addEventListener("click", () => {
    scanDetailModal.style.display = "none";
  });
}
scanDetailModal.addEventListener("click", (e) => {
  if (e.target === scanDetailModal) scanDetailModal.style.display = "none";
});

// Periodic polling
setInterval(() => {
  const consoleVisible = document.getElementById("panelConsole").style.display !== "none";
  if (consoleVisible) pollTrainingStatus();
}, 2000);

// Initialize
checkAuth();
loadQueue();
loadClassesHub();

