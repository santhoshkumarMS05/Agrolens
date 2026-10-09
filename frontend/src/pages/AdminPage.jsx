import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export const AdminPage = () => {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // Top Section: 'staging' | 'farmers'
  const [activeSection, setActiveSection] = useState("staging");

  // Staging Hub Subtabs: 'queue' | 'diseases' | 'stages' | 'console'
  const [stagingTab, setStagingTab] = useState("queue");
  const [queueSourceFilter, setQueueSourceFilter] = useState("all");

  // Staging Queue State
  const [queueItems, setQueueItems] = useState([]);
  const [queueCounts, setQueueCounts] = useState({ pending: 0, approved: 0, rejected: 0, trained: 0 });
  const [selectedQueueIds, setSelectedQueueIds] = useState(new Set());

  // Classes Hub State
  const [classesData, setClassesData] = useState([]);
  const [masteredData, setMasteredData] = useState([]);
  const [stageClassesData, setStageClassesData] = useState([]);
  const [classSearch, setClassSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all"); // 'all' | 'new_classes' | 'has_samples' | 'mastered'

  // Training Console State
  const [trainingStatus, setTrainingStatus] = useState({
    is_training: false,
    completed: false,
    current_epoch: 0,
    total_epochs: 0,
    train_loss: 0,
    val_accuracy: 0,
    target_class: "",
    step_description: "Select any class from the Retraining Hub to trigger background fine-tuning.",
  });
  const [trainingHistory, setTrainingHistory] = useState([]);

  // Farmers Registry State
  const [farmers, setFarmers] = useState([]);
  const [farmersPage, setFarmersPage] = useState(1);
  const [farmersTotalPages, setFarmersTotalPages] = useState(1);
  const [farmersTotalCount, setFarmersTotalCount] = useState(0);
  const [farmerSearch, setFarmerSearch] = useState("");
  const [farmersLoading, setFarmersLoading] = useState(false);

  // Farmer Scans State
  const [farmerView, setFarmerView] = useState("list"); // 'list' | 'scans'
  const [activeFarmer, setActiveFarmer] = useState(null);
  const [farmerScans, setFarmerScans] = useState([]);
  const [scansPage, setScansPage] = useState(1);
  const [scansTotalCount, setScansTotalCount] = useState(0);
  const [scansTotalPages, setScansTotalPages] = useState(1);
  const [scansLoading, setScansLoading] = useState(false);

  // Modals
  const [inspectItem, setInspectItem] = useState(null);
  const [inspectTargetClass, setInspectTargetClass] = useState("");
  const [approvedViewer, setApprovedViewer] = useState(null); // { folder, displayName, count, className, images: [], loading: false }
  const [lightbox, setLightbox] = useState(null); // { url, caption, sub }
  const [inspectScan, setInspectScan] = useState(null);

  // Auth Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/admin-login");
      } else if (!isAdmin && user.role !== "admin") {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading]);

  // Initial Load
  useEffect(() => {
    if (user?.role === "admin" || isAdmin) {
      loadQueue();
      loadClassesHub();
      loadTrainingStatus();
    }
  }, [user, isAdmin]);

  // Periodic polling for training console when active
  useEffect(() => {
    let timer;
    if (activeSection === "staging" && stagingTab === "console") {
      timer = setInterval(() => {
        loadTrainingStatus();
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [activeSection, stagingTab]);

  // ──────────────────────────────────────────
  // Queue Logic
  // ──────────────────────────────────────────
  const loadQueue = async () => {
    try {
      const res = await fetch("/api/admin/queue?status=pending", { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setQueueItems(data.items || []);
        if (data.counts) {
          setQueueCounts(data.counts);
        }
        setSelectedQueueIds(new Set());
      }
    } catch (err) {
      console.error("Queue load error:", err);
    }
  };

  const handleSelectAllQueue = () => {
    if (selectedQueueIds.size === queueItems.length) {
      setSelectedQueueIds(new Set());
    } else {
      setSelectedQueueIds(new Set(queueItems.map((i) => i.id)));
    }
  };

  const handleToggleQueueSelect = (id) => {
    const updated = new Set(selectedQueueIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedQueueIds(updated);
  };

  const approveSingle = async (id, targetClass) => {
    try {
      const res = await fetch(`/api/admin/queue/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_class: targetClass }),
        credentials: "include",
      });
      const d = await res.json();
      if (d.ok) {
        loadQueue();
        loadClassesHub();
        if (inspectItem?.id === id) setInspectItem(null);
      } else {
        alert("Error: " + (d.error || "Could not approve"));
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  };

  const rejectSingle = async (id) => {
    try {
      const res = await fetch(`/api/admin/queue/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin rejected" }),
        credentials: "include",
      });
      const d = await res.json();
      if (d.ok) {
        loadQueue();
        if (inspectItem?.id === id) setInspectItem(null);
      } else {
        alert("Error: " + (d.error || "Could not reject"));
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  };

  const batchApprove = async () => {
    if (!window.confirm(`Approve and file ${selectedQueueIds.size} images to canonical class folders?`)) return;
    try {
      const res = await fetch("/api/admin/queue/batch_action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", ids: Array.from(selectedQueueIds) }),
        credentials: "include",
      });
      const d = await res.json();
      if (d.ok) {
        loadQueue();
        loadClassesHub();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const batchReject = async () => {
    if (!window.confirm(`Reject and archive ${selectedQueueIds.size} images?`)) return;
    try {
      const res = await fetch("/api/admin/queue/batch_action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", ids: Array.from(selectedQueueIds) }),
        credentials: "include",
      });
      const d = await res.json();
      if (d.ok) loadQueue();
    } catch (e) {
      alert(e.message);
    }
  };

  // ──────────────────────────────────────────
  // Classes Hub Logic
  // ──────────────────────────────────────────
  const loadClassesHub = async () => {
    try {
      const res = await fetch("/api/admin/classes", { credentials: "include" });
      const data = await res.json();
      if (data.ok) {
        setClassesData(data.classes || []);
        setMasteredData(data.mastered_classes || []);
        setStageClassesData(data.stage_classes || []);
      }
    } catch (e) {
      console.error("Classes load error:", e);
    }
  };

  const triggerClassRetraining = async (className, displayName) => {
    const epochs = window.prompt(
      `Start feature-freezing PyTorch retraining for:\n"${displayName || className}"?\n\nEnter number of fine-tuning epochs (default 5):`,
      "5"
    );
    if (!epochs) return;

    try {
      const res = await fetch("/api/admin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_class: className, epochs: parseInt(epochs) || 5 }),
        credentials: "include",
      });
      const d = await res.json();
      if (d.ok) {
        setStagingTab("console");
        loadTrainingStatus();
      } else {
        alert("Retraining note: " + (d.error || "Could not start retraining"));
      }
    } catch (e) {
      alert("Network error: " + e.message);
    }
  };

  const openApprovedViewer = async (folder, displayName, count, className) => {
    setApprovedViewer({
      folder,
      displayName,
      count,
      className: className || displayName,
      images: [],
      loading: true,
    });

    try {
      const res = await fetch(`/api/admin/classes/${encodeURIComponent(folder)}/samples`, { credentials: "include" });
      const d = await res.json();
      setApprovedViewer((prev) => ({
        ...prev,
        images: d.images || [],
        loading: false,
      }));
    } catch {
      setApprovedViewer((prev) => ({ ...prev, images: [], loading: false }));
    }
  };

  // ──────────────────────────────────────────
  // Training Console Logic
  // ──────────────────────────────────────────
  const loadTrainingStatus = async () => {
    try {
      const res = await fetch("/api/admin/train_status", { credentials: "include" });
      const d = await res.json();
      if (d.ok && d.status) {
        setTrainingStatus(d.status);
      }
      if (d.history) {
        setTrainingHistory(d.history);
      }
    } catch (e) {
      console.error("Training poll error:", e);
    }
  };

  // ──────────────────────────────────────────
  // Farmer Registry Logic
  // ──────────────────────────────────────────
  const loadFarmers = async (page = 1, search = farmerSearch) => {
    setFarmersLoading(true);
    try {
      const url = `/api/admin/farmers?page=${page}&limit=15&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFarmers(data.farmers || []);
        setFarmersPage(data.page || 1);
        setFarmersTotalPages(data.total_pages || 1);
        setFarmersTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error("Farmers load error:", err);
    } finally {
      setFarmersLoading(false);
    }
  };

  const handleOpenFarmerScans = (farmer) => {
    setActiveFarmer(farmer);
    setFarmerView("scans");
    loadFarmerScans(farmer.id, 1);
  };

  const loadFarmerScans = async (farmerId, page = 1) => {
    setScansLoading(true);
    try {
      const res = await fetch(`/api/admin/farmers/${farmerId}/scans?page=${page}&limit=15`, { credentials: "include" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFarmerScans(data.scans || []);
        setScansPage(data.page || 1);
        setScansTotalPages(data.total_pages || 1);
        setScansTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error("Scans load error:", err);
    } finally {
      setScansLoading(false);
    }
  };

  // Switch top section
  const handleSectionSwitch = (sec) => {
    setActiveSection(sec);
    if (sec === "farmers") {
      loadFarmers(1);
    }
  };

  // Filtered Queue
  const filteredQueue = queueItems.filter((item) => {
    if (queueSourceFilter === "all") return true;
    return item.source === queueSourceFilter;
  });

  // Filtered Classes
  const currentSubtab = stagingTab === "stages" ? "stage" : "disease";
  let classesSourceList = currentSubtab === "stage" ? stageClassesData : classesData;
  if (currentSubtab === "disease" && classFilter === "mastered") {
    classesSourceList = masteredData;
  }

  const q = classSearch.trim().toLowerCase();
  const filteredClasses = classesSourceList.filter((c) => {
    if (q) {
      const matchName =
        c.display_name?.toLowerCase().includes(q) ||
        c.class_name?.toLowerCase().includes(q) ||
        c.crop?.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    if (classFilter === "new_classes") return c.is_new_class;
    if (classFilter === "has_samples") return c.approved_count > 0;
    return true;
  });

  // Active counts
  const totalClassesActive = classesSourceList.length;
  const newClassesCount = classesSourceList.filter((c) => c.is_new_class).length;
  const hasSamplesCount = classesSourceList.filter((c) => c.approved_count > 0).length;
  const masteredCount = currentSubtab === "stage" ? 0 : masteredData.length;

  return (
    <div>
      {/* Navigation matching AgroLens OPS Console */}
      <nav className="nav">
        <div className="nav-in">
          <Link className="brand" to="/admin">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 21C7 17 4 13 4 8.5A6.5 6.5 0 0116.9 6c1.7 1.7 2.6 4.2 1.6 8-1 3.9-4 6.3-6.5 7z" fill="#2d4627" />
              <path d="M12 21V9" stroke="#f4f1e2" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            AgroLens{" "}
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--gold)",
                background: "rgba(251,191,36,.14)",
                border: "1px solid var(--gold)",
                padding: "2px 8px",
                borderRadius: "99px",
                marginLeft: "6px",
                letterSpacing: ".06em",
              }}
            >
              OPS CONSOLE
            </span>
          </Link>

          <div className="nav-links">
            <button
              type="button"
              className={`nav-link ${activeSection === "staging" ? "active" : ""}`}
              id="navTabStaging"
              onClick={() => handleSectionSwitch("staging")}
            >
              🛡️ Staging &amp; Retraining
            </button>
            <button
              type="button"
              className={`nav-link ${activeSection === "farmers" ? "active" : ""}`}
              id="navTabFarmers"
              onClick={() => handleSectionSwitch("farmers")}
            >
              👥 Farmer Registry &amp; Scans
            </button>
          </div>

          <div className="userbox">
            <ThemeToggle />
            <span className="user-pill" id="userPill">
              Admin: <b id="userName">{user?.name || user?.email || "…"}</b>
            </span>
            <button
              className="signout-btn"
              id="signoutBtn"
              type="button"
              onClick={async () => {
                await logout();
                navigate("/admin-login");
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="shell">
        {/* ══════════════════════════════════════════════════════════
             SECTION 1: CONTINUOUS LEARNING & STAGING HUB
             ══════════════════════════════════════════════════════════ */}
        {activeSection === "staging" && (
          <div id="adminStagingSection" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header Banner */}
            <div className="admin-hero">
              <div className="hero-title">
                <h1>Continuous Learning <em>· Admin Staging Hub</em></h1>
                <p>Human-in-the-Loop Quality Control, Dataset Expansion &amp; Feature-Frozen Model Retraining</p>
              </div>
              <div className="hero-badges">
                <div className="badge-pill model-badge">
                  <span className="dot"></span>
                  <span>ConvNeXt-Tiny (96.7% Overall Accuracy)</span>
                </div>
                <div className="badge-pill">
                  <span>🔒 Feature Freezing Active</span>
                </div>
                <div className="badge-pill">
                  <span>📁 Local Training Pool</span>
                </div>
              </div>
            </div>

            {/* Counter Metric Cards */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-num" id="statPendingCount">{queueCounts.pending || queueItems.length}</div>
                  <div className="stat-lbl">Pending Review (≥85%)</div>
                </div>
                <div className="stat-icon pending">📥</div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-num" id="statApprovedCount">{queueCounts.approved || 0}</div>
                  <div className="stat-lbl">Approved in Pool</div>
                </div>
                <div className="stat-icon approved">✅</div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-num" id="statRejectedCount">{queueCounts.rejected || 0}</div>
                  <div className="stat-lbl">Rejected Samples</div>
                </div>
                <div className="stat-icon rejected">🚫</div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <div className="stat-num" id="statTrainedRuns">{queueCounts.trained || 0}</div>
                  <div className="stat-lbl">Model Retraining Runs</div>
                </div>
                <div className="stat-icon health">🚀</div>
              </div>
            </div>

            {/* Section Tab Switcher (Direct 1-Click Navigation) */}
            <div className="section-nav">
              <button
                type="button"
                className={`tab-trigger ${stagingTab === "queue" ? "active accent-green" : ""}`}
                id="tabTriggerQueue"
                onClick={() => setStagingTab("queue")}
              >
                <span>📥</span> <span>Pending Review Queue</span>
              </button>
              <button
                type="button"
                className={`tab-trigger ${stagingTab === "diseases" ? "active accent-green" : ""}`}
                id="tabTriggerDisease"
                onClick={() => {
                  setStagingTab("diseases");
                  loadClassesHub();
                }}
              >
                <span>🦠</span> <span>Crop Diseases ({classesData.length})</span>
              </button>
              <button
                type="button"
                className={`tab-trigger ${stagingTab === "stages" ? "active accent-green" : ""}`}
                id="tabTriggerStage"
                onClick={() => {
                  setStagingTab("stages");
                  loadClassesHub();
                }}
              >
                <span>🌱</span> <span>Growth Stages ({stageClassesData.length})</span>
              </button>
              <button
                type="button"
                className={`tab-trigger ${stagingTab === "console" ? "active accent-green" : ""}`}
                id="tabTriggerConsole"
                onClick={() => {
                  setStagingTab("console");
                  loadTrainingStatus();
                }}
              >
                <span>⚡</span> <span>Training Console</span>
              </button>
            </div>

            {/* PANEL 1: PENDING APPROVAL QUEUE */}
            {stagingTab === "queue" && (
              <div id="panelQueue" className="tab-panel">
                <div className="staging-bar" style={{ marginBottom: "20px" }}>
                  <div className="filter-group">
                    <span style={{ fontSize: ".82rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
                      Source:
                    </span>
                    {[
                      { key: "all", label: "All (≥85%)" },
                      { key: "nova_lite", label: "Amazon Nova Lite" },
                      { key: "stage_nova_lite", label: "🌱 Stage Nova Lite" },
                      { key: "farmer_report", label: "Farmer Flagged" },
                      { key: "model_high_confidence", label: "Model QA (≥85%)" },
                    ].map((src) => (
                      <button
                        key={src.key}
                        className={`filter-chip ${queueSourceFilter === src.key ? "active" : ""}`}
                        onClick={() => setQueueSourceFilter(src.key)}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>
                  <div className="batch-actions">
                    <button type="button" className="btn-sm" id="btnSelectAll" onClick={handleSelectAllQueue}>
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-approve"
                      id="btnBatchApprove"
                      disabled={selectedQueueIds.size === 0}
                      onClick={batchApprove}
                    >
                      Approve Selected ({selectedQueueIds.size})
                    </button>
                    <button
                      type="button"
                      className="btn-sm btn-reject"
                      id="btnBatchReject"
                      disabled={selectedQueueIds.size === 0}
                      onClick={batchReject}
                    >
                      Reject Selected ({selectedQueueIds.size})
                    </button>
                  </div>
                </div>

                {/* Gallery Grid */}
                {filteredQueue.length === 0 ? (
                  <div className="empty-queue">
                    <div className="empty-icon">🌱</div>
                    <h3>No Pending Candidates (≥85% Confidence)</h3>
                    <p>
                      Candidate photos automatically stage here when Amazon Nova Lite detects disease symptoms with
                      ≥85% confidence or when farmers flag diagnoses.
                    </p>
                  </div>
                ) : (
                  <div className="gallery-grid" id="queueGallery">
                    {filteredQueue.map((item) => {
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

                      const isChecked = selectedQueueIds.has(item.id);

                      return (
                        <div key={item.id} className="queue-card">
                          <div
                            className="queue-thumb"
                            onClick={(e) => {
                              if (e.target.tagName !== "INPUT") {
                                setInspectItem(item);
                                setInspectTargetClass(item.proposed_class);
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              className="queue-card-checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleQueueSelect(item.id);
                              }}
                            />
                            <span className={`queue-source-tag ${srcClass}`}>⚡ {srcLabel}</span>
                            <img src={item.image_url} alt={item.proposed_class} loading="lazy" />
                          </div>
                          <div className="queue-body">
                            <div className="queue-class-title">{item.proposed_class}</div>
                            <div className="queue-meta-row">
                              <span>
                                Crop: <b>{item.crop || "Crop"}</b>
                              </span>
                              <span className="queue-conf-badge">
                                {item.confidence ? `${item.confidence.toFixed(1)}%` : "Flagged"}
                              </span>
                            </div>
                            {item.notes && (
                              <p style={{ fontSize: ".78rem", color: "var(--muted)", lineHeight: 1.35, marginTop: "2px" }}>
                                {item.notes.substring(0, 95)}
                                {item.notes.length > 95 ? "…" : ""}
                              </p>
                            )}
                            <div className="queue-actions">
                              <button
                                type="button"
                                className="queue-btn inspect"
                                onClick={() => {
                                  setInspectItem(item);
                                  setInspectTargetClass(item.proposed_class);
                                }}
                              >
                                🔍 Inspect
                              </button>
                              <button
                                type="button"
                                className="queue-btn reject"
                                onClick={() => rejectSingle(item.id)}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="queue-btn approve"
                                onClick={() => approveSingle(item.id, item.proposed_class)}
                              >
                                Approve
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PANEL 2: RETRAINING & CLASS HEALTH HUB */}
            {(stagingTab === "diseases" || stagingTab === "stages") && (
              <div id="panelClasses" className="tab-panel">
                <div className="hub-toolbar">
                  <div className="search-input-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      id="classSearchInput"
                      placeholder="Search crop or disease (e.g. Rice, Cotton, Rust)..."
                      value={classSearch}
                      onChange={(e) => setClassSearch(e.target.value)}
                    />
                  </div>
                  <div className="filter-group" id="classFilterChips">
                    <button
                      className={`filter-chip ${classFilter === "all" ? "active" : ""}`}
                      onClick={() => setClassFilter("all")}
                    >
                      🎯 Retraining Targets ({totalClassesActive})
                    </button>
                    <button
                      className={`filter-chip ${classFilter === "new_classes" ? "active" : ""}`}
                      onClick={() => setClassFilter("new_classes")}
                    >
                      ✨ New Classes ({newClassesCount})
                    </button>
                    <button
                      className={`filter-chip ${classFilter === "has_samples" ? "active" : ""}`}
                      onClick={() => setClassFilter("has_samples")}
                    >
                      📁 Has Approved Samples ({hasSamplesCount})
                    </button>
                    {stagingTab === "diseases" && (
                      <button
                        className={`filter-chip ${classFilter === "mastered" ? "active" : ""}`}
                        onClick={() => setClassFilter("mastered")}
                      >
                        🛡️ Mastered (≥97%) [Archived] ({masteredCount})
                      </button>
                    )}
                  </div>
                </div>

                <div className="classes-grid" id="classesGrid">
                  {filteredClasses.length === 0 ? (
                    <div className="empty-queue">
                      <div className="empty-icon">🔍</div>
                      <h3>
                        No Matching {stagingTab === "stages" ? "Growth Stages" : "Classes"} Found
                      </h3>
                      <p>
                        No agricultural {stagingTab === "stages" ? "growth stages" : "classes"} match your current
                        filter or search criteria.
                      </p>
                    </div>
                  ) : (
                    filteredClasses.map((c) => {
                      const isStage = Boolean(c.is_stage);
                      const isMaintenance = !isStage && (c.maintenance_mode || c.current_accuracy >= 97.0);
                      const progressPct = c.progress_pct || 0;
                      const isFull = c.approved_count >= c.threshold;

                      return (
                        <div key={c.class_name} className="class-health-card">
                          <div className="class-head">
                            <div className="class-title-row">
                              <div className="class-title">{c.display_name}</div>
                              {isStage ? (
                                <span
                                  className="badge-status new-class"
                                  style={{
                                    background: "rgba(22,163,74,.12)",
                                    color: "#15803d",
                                    borderColor: "rgba(22,163,74,.3)",
                                  }}
                                >
                                  🌱 Growth Stage · Base Pending
                                </span>
                              ) : c.is_new_class ? (
                                <span className="badge-status new-class">✨ New Class · Untrained</span>
                              ) : isMaintenance ? (
                                <span className="badge-status maintenance">🛡️ Mastered (≥97%)</span>
                              ) : (
                                <span className="badge-status active-staging">🎯 Active Retraining</span>
                              )}
                            </div>
                            <span className="class-folder-tag">📁 approved/{c.folder}/</span>
                          </div>

                          <div className="progress-wrap">
                            <div className="progress-meta">
                              <span className="count">
                                Approved in Staging: <b>{c.approved_count} / {c.threshold}</b>
                              </span>
                              <span className="pct-badge">{progressPct}%</span>
                            </div>
                            <div className="progress-track">
                              <div
                                className={`progress-bar ${isFull ? "full" : ""}`}
                                style={{ width: `${Math.max(c.approved_count > 0 ? 4 : 0, progressPct)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="class-metrics">
                            <div className="metric-item">
                              <span className="m-lbl">{isStage ? "Model Type" : "Model Accuracy"}</span>
                              <span className={`m-val ${isMaintenance ? "acc-high" : "acc-staging"}`}>
                                {isStage
                                  ? "Stage Base (Pending)"
                                  : c.is_new_class
                                  ? "0.0% (New)"
                                  : c.current_accuracy
                                  ? `${c.current_accuracy.toFixed(1)}%`
                                  : "Untrained"}
                              </span>
                            </div>
                            <div className="metric-item">
                              <span className="m-lbl">Staging Status</span>
                              <span className="m-val" style={{ fontSize: ".85rem", color: "var(--ink)" }}>
                                {isStage
                                  ? c.approved_count >= 100
                                    ? "Quota Reached (Awaiting Model)"
                                    : "Collecting (≥85%)"
                                  : c.approved_count > 0
                                  ? "Ready to Retrain"
                                  : isMaintenance
                                  ? "Harvest Paused"
                                  : "Collecting (≥85%)"}
                              </span>
                            </div>
                            <div className="metric-item">
                              <span className="m-lbl">Pending Review</span>
                              <span className="m-val" style={{ color: "var(--green)" }}>
                                {c.pending_count || 0}
                              </span>
                            </div>
                          </div>

                          <div className="class-card-actions">
                            {isStage ? (
                              <button
                                type="button"
                                className="retrain-btn secondary"
                                disabled
                                title={`Custom stage model architecture not initialized yet. Collecting samples in progress (${c.approved_count}/${c.threshold || 100}).`}
                              >
                                <span>🔒</span>{" "}
                                <span>
                                  Awaiting Stage Model Base ({c.approved_count}/{c.threshold || 100})
                                </span>
                              </button>
                            ) : c.approved_count >= (c.threshold || 100) ? (
                              <button
                                type="button"
                                className="retrain-btn primary"
                                onClick={() => triggerClassRetraining(c.class_name, c.display_name)}
                              >
                                <span>🚀</span> <span>Start Retraining Head ({c.approved_count} samples)</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="retrain-btn secondary"
                                disabled
                                title="Threshold not reached. 100 approved samples required before fine-tuning."
                              >
                                <span>⏳</span>{" "}
                                <span>
                                  Collecting Samples ({c.approved_count}/{c.threshold || 100})
                                </span>
                              </button>
                            )}

                            <button
                              type="button"
                              className={`view-approved-btn ${c.approved_count > 0 ? "" : "disabled"}`}
                              disabled={c.approved_count === 0}
                              onClick={() => openApprovedViewer(c.folder, c.display_name, c.approved_count, c.class_name)}
                            >
                              <span>👁️</span> <span>View Approved Images ({c.approved_count})</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* PANEL 3: LIVE RETRAINING CONSOLE */}
            {stagingTab === "console" && (
              <div id="panelConsole" className="tab-panel">
                <div className="console-card">
                  <div className="console-header">
                    <div>
                      <h2>Feature-Freezing Retraining Console</h2>
                      <p style={{ color: "var(--muted)", fontSize: ".9rem", marginTop: "4px" }}>
                        Fine-tunes the ConvNeXt-Tiny classifier head on new verified data while completely freezing
                        convolutional stages 0–4.
                      </p>
                    </div>
                    <div
                      id="liveStatusBadge"
                      className="badge-pill"
                      style={{
                        background: "var(--paper)",
                        borderColor: "var(--line)",
                      }}
                    >
                      <span
                        className="dot"
                        style={{
                          background: trainingStatus.is_training
                            ? "#eab308"
                            : trainingStatus.completed
                            ? "#16a34a"
                            : "#888",
                        }}
                      ></span>
                      <span id="liveStatusText">
                        {trainingStatus.is_training
                          ? "Status: Retraining Active"
                          : trainingStatus.completed
                          ? "Status: Retraining Completed"
                          : "Status: Engine Idle"}
                      </span>
                    </div>
                  </div>

                  {/* Live Step Box */}
                  <div className="live-step-box" id="liveStepBox">
                    {trainingStatus.is_training && <div className="pulse-spinner"></div>}
                    <div className="step-text">
                      <h4 id="stepTitle">
                        {trainingStatus.is_training
                          ? `Retraining: ${trainingStatus.target_class}`
                          : trainingStatus.completed
                          ? "Training Run Successfully Finished"
                          : "No Training Session in Progress"}
                      </h4>
                      <p id="stepSubtitle">
                        {trainingStatus.step_description ||
                          "Select any class from the Retraining Hub to trigger background fine-tuning."}
                      </p>
                    </div>
                  </div>

                  {/* Live Metric Gauges */}
                  <div className="training-gauges">
                    <div className="gauge-box">
                      <div className="g-val" id="gaugeEpoch">
                        {trainingStatus.current_epoch} / {trainingStatus.total_epochs}
                      </div>
                      <div className="g-lbl">Current Epoch</div>
                    </div>
                    <div className="gauge-box">
                      <div className="g-val" id="gaugeLoss">
                        {trainingStatus.train_loss ? trainingStatus.train_loss.toFixed(4) : "0.0000"}
                      </div>
                      <div className="g-lbl">Training Loss</div>
                    </div>
                    <div className="gauge-box">
                      <div className="g-val" id="gaugeAcc">
                        {trainingStatus.val_accuracy ? `${trainingStatus.val_accuracy.toFixed(1)}%` : "0.0%"}
                      </div>
                      <div className="g-lbl">Validation Accuracy</div>
                    </div>
                    <div className="gauge-box">
                      <div className="g-val" id="gaugeTargetClass">
                        {trainingStatus.target_class || "—"}
                      </div>
                      <div className="g-lbl">Target Class</div>
                    </div>
                  </div>

                  {/* Hot-swap Notice Banner */}
                  {trainingStatus.completed && (
                    <div
                      id="hotSwapBanner"
                      style={{
                        background: "rgba(45,70,39,.1)",
                        border: "1.5px solid var(--green)",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        color: "var(--ink)",
                      }}
                    >
                      <h4 style={{ fontWeight: 700, color: "var(--green)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🎉</span> <span>Retraining Succeeded &amp; Live Hot-Swap Active</span>
                      </h4>
                      <p style={{ fontSize: ".88rem", color: "var(--ink)", marginTop: "6px" }}>
                        The PyTorch inference engine in <code>backend/app.py</code> was reloaded with the updated
                        weights, and client-side ONNX was exported to <code>web/leaflet_model.onnx</code>. Zero service
                        restart required.
                      </p>
                    </div>
                  )}

                  {/* Audit History Table */}
                  <div style={{ marginTop: "10px" }}>
                    <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: "1.15rem", marginBottom: "12px", color: "var(--ink)" }}>
                      Recent Continuous Learning Training History
                    </h4>
                    <div className="history-table-wrap">
                      <table className="styled-table">
                        <thead>
                          <tr>
                            <th>Target Class</th>
                            <th>Samples</th>
                            <th>Final Loss</th>
                            <th>Val Accuracy</th>
                            <th>Trained At</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody id="historyTableBody">
                          {trainingHistory.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: "center", color: "var(--muted)", padding: "24px" }}>
                                No previous retraining runs recorded yet.
                              </td>
                            </tr>
                          ) : (
                            trainingHistory.map((run, idx) => (
                              <tr key={idx}>
                                <td><b>{run.target_class}</b></td>
                                <td>{run.samples}</td>
                                <td>{run.final_loss ? run.final_loss.toFixed(4) : "—"}</td>
                                <td>{run.val_accuracy ? `${run.val_accuracy.toFixed(1)}%` : "—"}</td>
                                <td>{run.trained_at || "Recent"}</td>
                                <td>
                                  <span style={{ color: "var(--green)", fontWeight: 700 }}>✅ Hot-Swapped</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
             SECTION 2: FARMER REGISTRY & DIAGNOSIS SCANS (15 / page)
             ══════════════════════════════════════════════════════════ */}
        {activeSection === "farmers" && (
          <div id="adminFarmersSection" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {farmerView === "list" ? (
              /* SUB-VIEW 1: FARMERS DIRECTORY (15 per page) */
              <div id="farmersListView" className="farmers-panel">
                <div className="farmer-header-bar">
                  <div>
                    <span className="eyebrow">User Directory</span>
                    <h2 style={{ fontSize: "1.65rem", marginTop: "6px" }}>Registered Farmers &amp; Growers</h2>
                    <p style={{ fontSize: ".9rem", color: "var(--muted)", marginTop: "4px" }}>
                      Browse registered farmer accounts and click any farmer to inspect their full diagnosis scan history.
                    </p>
                  </div>
                  <div className="farmer-search-box">
                    <span>🔍</span>
                    <input
                      type="text"
                      id="farmerSearchInput"
                      placeholder="Search farmer by name or email..."
                      value={farmerSearch}
                      onChange={(e) => {
                        setFarmerSearch(e.target.value);
                        loadFarmers(1, e.target.value);
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                  <span
                    id="farmersCountLabel"
                    style={{
                      fontSize: ".85rem",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                    }}
                  >
                    {farmersLoading
                      ? "Loading farmers..."
                      : `${farmersTotalCount} Registered Farmer${farmersTotalCount === 1 ? "" : "s"}`}
                  </span>
                </div>

                {/* Farmers Grid (15 cards per page) */}
                <div id="farmersGrid" className="farmer-grid">
                  {farmers.length === 0 && !farmersLoading ? (
                    <div
                      style={{
                        gridColumn: "1/-1",
                        textAlign: "center",
                        padding: "48px 20px",
                        background: "var(--paper-2)",
                        borderRadius: "var(--r)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>👨‍🌾</div>
                      <h3 style={{ fontSize: "1.15rem", color: "var(--ink)" }}>No Farmers Found</h3>
                      <p style={{ fontSize: ".86rem", color: "var(--muted)", marginTop: "4px" }}>
                        No farmer accounts match your search query.
                      </p>
                    </div>
                  ) : (
                    farmers.map((f) => {
                      const initials = (f.name || f.email || "F")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div key={f.id} className="farmer-card" onClick={() => handleOpenFarmerScans(f)}>
                          <div className="farmer-card-top">
                            <div className="farmer-avatar">{initials}</div>
                            <div className="farmer-info" style={{ overflow: "hidden" }}>
                              <h4>{f.name || "Farmer"}</h4>
                              <p
                                style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                                title={f.email}
                              >
                                ✉️ {f.email}
                              </p>
                            </div>
                          </div>
                          <div className="farmer-card-bottom">
                            <span>Joined: {f.joined_at}</span>
                            <span className="scans-count-pill">
                              🌱 {f.total_scans} Scan{f.total_scans === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls for Farmers */}
                <div className="pagination-wrap" id="farmersPagination">
                  <span id="farmersPageIndicator">
                    Page {farmersPage} of {farmersTotalPages} ({farmersTotalCount} total)
                  </span>
                  <div className="pagination-btns">
                    <button
                      type="button"
                      className="page-btn"
                      id="farmersPrevBtn"
                      disabled={farmersPage <= 1}
                      onClick={() => loadFarmers(farmersPage - 1)}
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      className="page-btn"
                      id="farmersNextBtn"
                      disabled={farmersPage >= farmersTotalPages}
                      onClick={() => loadFarmers(farmersPage + 1)}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SUB-VIEW 2: SELECTED FARMER'S SCANS (15 Grid Boxes per page) */
              <div id="farmerScansView" className="farmers-panel" style={{ display: "flex" }}>
                <div className="farmer-header-bar">
                  <div>
                    <div style={{ marginBottom: "12px" }}>
                      <button
                        type="button"
                        className="back-farmers-btn"
                        id="backToFarmersBtn"
                        onClick={() => setFarmerView("list")}
                      >
                        <span>←</span> <span>Back to Farmers Registry</span>
                      </button>
                    </div>
                    <span className="eyebrow" id="activeFarmerEyebrow">Farmer Field Scans</span>
                    <h2 style={{ fontSize: "1.65rem", marginTop: "4px" }} id="activeFarmerTitle">
                      Field Scans for {activeFarmer?.name}
                    </h2>
                    <p style={{ fontSize: ".9rem", color: "var(--muted)", marginTop: "4px" }} id="activeFarmerSub">
                      Account: {activeFarmer?.email} • Reviewing all past foliage scans and disease detections
                    </p>
                  </div>
                  <div id="activeFarmerBadgeBox">
                    <span className="scans-count-pill" style={{ fontSize: ".85rem", padding: "6px 14px" }}>
                      🌱 {activeFarmer?.total_scans || scansTotalCount || 0} Total Field Scans
                    </span>
                  </div>
                </div>

                {/* 15 Scan Grid Boxes Layout */}
                <div id="scansGrid15" className="scans-grid-15">
                  {scansLoading ? (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "48px", color: "var(--muted)" }}>
                      <div className="pulse-spinner" style={{ margin: "0 auto 12px" }}></div>
                      Loading 15 scan boxes...
                    </div>
                  ) : farmerScans.length === 0 ? (
                    <div
                      style={{
                        gridColumn: "1/-1",
                        textAlign: "center",
                        padding: "48px 20px",
                        background: "var(--paper-2)",
                        borderRadius: "var(--r)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🌱</div>
                      <h3 style={{ fontSize: "1.2rem", color: "var(--ink)" }}>No Scans Recorded Yet</h3>
                      <p style={{ fontSize: ".88rem", color: "var(--muted)", marginTop: "4px" }}>
                        This farmer has not submitted any crop photos for diagnosis yet.
                      </p>
                    </div>
                  ) : (
                    farmerScans.map((scan) => {
                      const imgSrc = scan.image_path || "assets/placeholder-leaf.png";
                      const isHealthy = (scan.predicted_disease || "").toLowerCase().includes("healthy");

                      return (
                        <div
                          key={scan.id}
                          className="scan-box-card"
                          onClick={() => setInspectScan(scan)}
                        >
                          <img
                            className="scan-box-thumb"
                            src={imgSrc}
                            alt={scan.predicted_disease}
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24'><rect width='100%' height='100%' fill='%231b2114'/><text x='50%' y='50%' fill='%234ade80' text-anchor='middle' dy='.3em' font-size='12'>🌱 Scan</text></svg>";
                            }}
                          />
                          <div className="scan-box-body">
                            <div className="scan-box-title" title={scan.predicted_disease}>
                              {scan.predicted_disease}
                            </div>
                            <div className="scan-box-badges">
                              <span className="scans-count-pill" style={{ fontSize: ".7rem", padding: "2px 7px" }}>
                                {scan.confidence}%
                              </span>
                              <span
                                className="scans-count-pill"
                                style={{
                                  fontSize: ".7rem",
                                  padding: "2px 7px",
                                  color: isHealthy ? "var(--green)" : "var(--rust)",
                                  borderColor: isHealthy ? "rgba(74,222,128,.3)" : "rgba(251,113,133,.3)",
                                  background: isHealthy ? "rgba(74,222,128,.1)" : "rgba(251,113,133,.1)",
                                }}
                              >
                                {scan.severity || (isHealthy ? "Healthy" : "Diseased")}
                              </span>
                            </div>
                            <div className="scan-box-meta">
                              <span>📅 {scan.created_at}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls for Scans */}
                <div className="pagination-wrap" id="scansPagination">
                  <span id="scansPageIndicator">
                    {scansTotalCount > 0
                      ? `Showing ${(scansPage - 1) * 15 + 1}–${Math.min(scansPage * 15, scansTotalCount)} of ${scansTotalCount} scans (Page ${scansPage}/${scansTotalPages})`
                      : "0 scans recorded"}
                  </span>
                  <div className="pagination-btns">
                    <button
                      type="button"
                      className="page-btn"
                      id="scansPrevBtn"
                      disabled={scansPage <= 1}
                      onClick={() => loadFarmerScans(activeFarmer.id, scansPage - 1)}
                    >
                      ← Previous 15
                    </button>
                    <button
                      type="button"
                      className="page-btn"
                      id="scansNextBtn"
                      disabled={scansPage >= scansTotalPages}
                      onClick={() => loadFarmerScans(activeFarmer.id, scansPage + 1)}
                    >
                      Next 15 →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSPECTION & RELABEL MODAL */}
      {inspectItem && (
        <div className="modal-overlay open" id="inspectModal" onClick={() => setInspectItem(null)}>
          <div className="inspect-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Inspect Staged Candidate (≥85% Confidence)</h3>
              <button type="button" className="modal-close" id="modalCloseBtn" onClick={() => setInspectItem(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-img-wrap">
                <img id="modalImg" src={inspectItem.image_url} alt="Candidate crop foliage" />
              </div>
              <div className="modal-details">
                <div className="form-group">
                  <label className="form-label">Proposed Class &amp; Model Confidence</label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "var(--paper)",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--line)",
                    }}
                  >
                    <b id="modalProposedClass" style={{ color: "var(--ink)" }}>{inspectItem.proposed_class}</b>
                    <span id="modalConfidence" className="queue-conf-badge">
                      {inspectItem.confidence ? `${inspectItem.confidence.toFixed(1)}%` : "Flagged"}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Diagnostic Source &amp; Pathologist Reasoning</label>
                  <div
                    id="modalReasoning"
                    style={{
                      fontSize: ".86rem",
                      color: "var(--muted)",
                      background: "var(--paper)",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--line)",
                      lineHeight: 1.45,
                    }}
                  >
                    {inspectItem.notes || "High confidence visual pathology assessment (≥85%)."}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Class (Accept Proposed or Relabel)</label>
                  <select
                    id="modalTargetClassSelect"
                    className="form-control"
                    value={inspectTargetClass}
                    onChange={(e) => setInspectTargetClass(e.target.value)}
                  >
                    {classesData.map((c) => (
                      <option key={c.class_name} value={c.class_name}>
                        {c.display_name} ({c.class_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Local File Storage Target</label>
                  <div className="modal-path-preview" id="modalPathPreview">
                    backend/training_pool/approved/
                    {inspectTargetClass
                      ? inspectTargetClass.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/[-\s]+/g, "_")
                      : "class"}
                    /{inspectItem.image_name || "*.jpg"}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn-sm btn-reject"
                id="modalRejectBtn"
                onClick={() => rejectSingle(inspectItem.id)}
              >
                Reject &amp; Archive
              </button>
              <button
                type="button"
                className="btn-sm btn-approve"
                id="modalApproveBtn"
                onClick={() => approveSingle(inspectItem.id, inspectTargetClass)}
              >
                Accept &amp; Move to Training Pool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVED SAMPLES GALLERY VIEWER MODAL */}
      {approvedViewer && (
        <div className="modal-overlay open" id="approvedViewerModal" onClick={() => setApprovedViewer(null)}>
          <div className="approved-viewer-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 id="viewerModalTitle" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.32rem", color: "var(--ink)" }}>
                  Approved Images · {approvedViewer.displayName}
                </h3>
                <p
                  id="viewerModalSub"
                  style={{ fontSize: ".82rem", color: "var(--green)", marginTop: "4px", fontFamily: "ui-monospace, monospace" }}
                >
                  📁 backend/training_pool/approved/{approvedViewer.folder}/ • {approvedViewer.count} approved sample
                  {approvedViewer.count === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                id="viewerModalCloseBtn"
                onClick={() => setApprovedViewer(null)}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
              {approvedViewer.loading ? (
                <div id="viewerLoadingSpinner" style={{ textAlign: "center", padding: "40px" }}>
                  <div className="pulse-spinner" style={{ margin: "0 auto 12px" }}></div>
                  <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>Loading approved training samples...</p>
                </div>
              ) : approvedViewer.images.length === 0 ? (
                <div id="viewerEmptyState" className="empty-queue" style={{ display: "block" }}>
                  <div className="empty-icon">📁</div>
                  <h3>No Approved Images In This Folder</h3>
                  <p>No verified images have been moved into this class directory yet.</p>
                </div>
              ) : (
                <div id="viewerGalleryGrid" className="approved-gallery-grid">
                  {approvedViewer.images.map((img, i) => {
                    const isNova = (img.source || "").toLowerCase().includes("nova");
                    const isFarmer = (img.source || "").toLowerCase().includes("farmer");
                    const badgeClass = isNova ? "nova" : isFarmer ? "farmer" : "";
                    const badgeText = isNova
                      ? `Nova Lite · ${img.confidence}%`
                      : isFarmer
                      ? "Farmer QA"
                      : "Admin Approved";

                    return (
                      <div key={i} className="approved-thumb-card">
                        <div
                          className="approved-thumb-img-wrap"
                          title="Click to view full resolution"
                          onClick={() =>
                            setLightbox({
                              url: img.url,
                              caption: `${approvedViewer.displayName} — ${img.filename}`,
                              sub: `${img.source || "Approved Sample"} • Conf: ${img.confidence}% • Size: ${img.size_kb} KB`,
                            })
                          }
                        >
                          <img src={img.url} alt={img.filename} loading="lazy" />
                          <span className={`approved-thumb-badge ${badgeClass}`}>{badgeText}</span>
                        </div>
                        <div className="approved-thumb-meta">
                          <div className="approved-thumb-fname" title={img.filename}>
                            {img.filename}
                          </div>
                          <div className="approved-thumb-sub">
                            <span>{img.size_kb} KB</span>
                            <span>{img.reviewed_at ? img.reviewed_at.split(" ")[0] : "Approved"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-foot">
              <span id="viewerImageCountLabel" style={{ fontSize: ".85rem", color: "var(--muted)", marginRight: "auto" }}>
                {approvedViewer.count} images staged for training
              </span>
              <button
                type="button"
                className="btn-sm"
                id="viewerCloseBtnFooter"
                onClick={() => setApprovedViewer(null)}
              >
                Close
              </button>
              {approvedViewer.count >= 100 ? (
                <button
                  type="button"
                  className="btn-sm btn-approve"
                  id="viewerRetrainShortcutBtn"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => {
                    const cls = approvedViewer.className;
                    const disp = approvedViewer.displayName;
                    setApprovedViewer(null);
                    triggerClassRetraining(cls, disp);
                  }}
                >
                  <span>🚀</span> <span>Start Retraining Head ({approvedViewer.count} samples)</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-sm"
                  id="viewerRetrainShortcutBtn"
                  disabled
                  style={{ opacity: 0.5, cursor: "not-allowed" }}
                >
                  <span>⏳</span> <span>Quota: {approvedViewer.count}/100 Samples Required</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN HIGH-RES LIGHTBOX MODAL */}
      {lightbox && (
        <div className="lightbox-modal open" id="lightboxModal" onClick={() => setLightbox(null)}>
          <button
            type="button"
            className="modal-close"
            id="lightboxCloseBtn"
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              fontSize: "2.2rem",
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setLightbox(null)}
          >
            &times;
          </button>
          <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
            <img id="lightboxImg" src={lightbox.url} alt="High resolution preview" />
          </div>
          <div className="lightbox-meta" onClick={(e) => e.stopPropagation()}>
            <div id="lightboxCaption" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              {lightbox.caption}
            </div>
            <div
              id="lightboxSub"
              style={{ fontSize: ".82rem", color: "#a8b3a0", marginTop: "4px", fontFamily: "ui-monospace, monospace" }}
            >
              {lightbox.sub}
            </div>
          </div>
        </div>
      )}

      {/* FARMER SCAN DETAIL INSPECTION MODAL */}
      {inspectScan && (
        <div className="modal-overlay open" id="scanDetailModal" style={{ display: "flex" }} onClick={() => setInspectScan(null)}>
          <div className="modal-box" style={{ maxWidth: "840px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 id="detailDiseaseTitle" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.35rem", color: "var(--ink)" }}>
                  {inspectScan.predicted_disease}
                </h3>
                <p id="detailScanMeta" style={{ fontSize: ".82rem", color: "var(--muted)", marginTop: "2px" }}>
                  {activeFarmer?.name} ({activeFarmer?.email}) • Scanned on {inspectScan.created_at} • Crop: {inspectScan.crop}
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                id="scanDetailCloseBtn"
                onClick={() => setInspectScan(null)}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
                <div>
                  <span
                    style={{
                      fontSize: ".78rem",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Original Field Photo
                  </span>
                  <img
                    id="detailOriginalImg"
                    src={inspectScan.image_path || ""}
                    alt="Foliage Scan"
                    style={{
                      width: "100%",
                      height: "230px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      border: "1px solid var(--line)",
                      background: "var(--paper-3)",
                    }}
                  />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: ".78rem",
                      fontWeight: 700,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Attention Heatmap (Grad-CAM)
                  </span>
                  <div
                    id="detailGradcamWrapper"
                    style={{
                      width: "100%",
                      height: "230px",
                      borderRadius: "12px",
                      border: "1px solid var(--line)",
                      background: "var(--paper-3)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {inspectScan.gradcam_image ? (
                      <img
                        id="detailGradcamImg"
                        src={inspectScan.gradcam_image}
                        alt="Grad-CAM"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span id="detailNoGradcam" style={{ color: "var(--muted)", fontSize: ".85rem", padding: "20px", textAlign: "center" }}>
                        No Heatmap (Phenology Scan)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="scans-count-pill" id="detailConfidenceBadge">
                  {inspectScan.confidence}% Confidence
                </span>
                <span
                  className="scans-count-pill"
                  id="detailSeverityBadge"
                  style={{
                    color: "var(--gold)",
                    borderColor: "var(--gold)",
                    background: "rgba(251,191,36,.12)",
                  }}
                >
                  Severity: {inspectScan.severity || "Normal"}
                </span>
              </div>
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
                <h4
                  style={{
                    fontSize: ".88rem",
                    fontWeight: 700,
                    color: "var(--green)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    marginBottom: "6px",
                  }}
                >
                  Clinical Diagnosis
                </h4>
                <p id="detailDiagnosisTxt" style={{ fontSize: ".92rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  {inspectScan.diagnosis || "Standard diagnosis record saved during user scan."}
                </p>
              </div>
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
                <h4
                  style={{
                    fontSize: ".88rem",
                    fontWeight: 700,
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    marginBottom: "6px",
                  }}
                >
                  Treatment &amp; Agronomy Action
                </h4>
                <p id="detailTreatmentTxt" style={{ fontSize: ".92rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  {inspectScan.treatment || "Standard agronomy treatment regimen provided to user."}
                </p>
              </div>
              <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: "12px", padding: "16px" }}>
                <h4
                  style={{
                    fontSize: ".88rem",
                    fontWeight: 700,
                    color: "var(--green-l)",
                    textTransform: "uppercase",
                    letterSpacing: ".06em",
                    marginBottom: "6px",
                  }}
                >
                  Nutrient &amp; Fertilizer Schedule
                </h4>
                <p id="detailFertilizerTxt" style={{ fontSize: ".92rem", color: "var(--ink)", lineHeight: 1.5 }}>
                  {inspectScan.fertilizer || "Standard nutrient / irrigation schedule provided to user."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
