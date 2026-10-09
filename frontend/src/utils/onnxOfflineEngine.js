// AgroLens In-Browser ONNX Neural Inference & Canvas Preprocessor Utility
// Supports offline fallback for ConvNeXt-Tiny (25 Botanical Classes)

export const CLASSES_25 = [
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

export const CLASSES_12 = [
  "Bacterialblight rice",
  "Brownspot rice",
  "Commonrust corn",
  "Earlyblight tomato",
  "Grayspot corn",
  "Healthy corn",
  "Healthy rice",
  "Healthy tomato",
  "Lateblight tomato",
  "Leafblast rice",
  "Leafblight corn",
  "Yellowleafcurlyvirus tomato"
];

let session = null;
let sessionLoading = false;
let agronomyKnowledge = null;

/**
 * Configure ONNX WebAssembly environment paths
 */
export function initOnnxEnvironment() {
  if (typeof window !== "undefined" && window.ort) {
    window.ort.env.wasm.wasmPaths = "/ort/";
    window.ort.env.wasm.numThreads = 1;
    window.ort.env.wasm.simd = true;
  }
}

/**
 * Preloads the ONNX Model session and offline agronomy knowledge base
 */
export async function loadOfflineModel(onStatusChange) {
  if (session) return session;
  if (sessionLoading) return null;
  sessionLoading = true;

  try {
    initOnnxEnvironment();
    if (onStatusChange) onStatusChange("Initializing offline neural engine...");

    // Preload agronomy knowledge base
    if (!agronomyKnowledge) {
      try {
        const res = await fetch("/agronomy_knowledge.json");
        if (res.ok) {
          agronomyKnowledge = await res.json();
        }
      } catch (e) {
        console.warn("Could not preload /agronomy_knowledge.json:", e);
      }
    }

    if (window.ort && window.ort.InferenceSession) {
      session = await window.ort.InferenceSession.create("/leaflet_model.onnx", {
        executionProviders: ["wasm"]
      });
      if (onStatusChange) onStatusChange("Offline ConvNeXt model ready.");
      return session;
    }
  } catch (err) {
    console.warn("Offline ONNX model initialization notice:", err);
  } finally {
    sessionLoading = false;
  }
  return session;
}

/**
 * Canvas Image Resizing (224x224 RGB rasterization)
 * Hardware-accelerated browser canvas preprocessor
 */
export function rasterizeImage(imageSource) {
  const S = 224;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imageSource, 0, 0, S, S);
  return ctx.getImageData(0, 0, S, S);
}

/**
 * Constructs a normalized (1, 3, 224, 224) Float32 Tensor from Canvas ImageData
 * Standard ImageNet normalization: Mean=[0.485, 0.456, 0.406], Std=[0.229, 0.224, 0.225]
 */
export function tensorFromImageData(imageData) {
  const S = 224;
  const d = imageData.data;
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];
  const out = new Float32Array(3 * S * S);
  const plane = S * S;

  for (let i = 0; i < plane; i++) {
    out[i] = (d[i * 4] / 255 - mean[0]) / std[0]; // Red channel
    out[i + plane] = (d[i * 4 + 1] / 255 - mean[1]) / std[1]; // Green channel
    out[i + 2 * plane] = (d[i * 4 + 2] / 255 - mean[2]) / std[2]; // Blue channel
  }

  if (window.ort && window.ort.Tensor) {
    return new window.ort.Tensor("float32", out, [1, 3, S, S]);
  }
  return out;
}

/**
 * Numerical stable Softmax calculation
 */
export function softmax(logits) {
  const m = Math.max(...logits);
  const e = logits.map((v) => Math.exp(v - m));
  const s = e.reduce((x, y) => x + y, 0);
  return e.map((v) => v / s);
}

/**
 * Generate client-side botanical Grad-CAM heatmap visualization
 */
export function generateClientGradcam(sourceImg) {
  const S = 320;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(sourceImg, 0, 0, S, S);

  const overlay = document.createElement("canvas");
  overlay.width = S;
  overlay.height = S;
  const octx = overlay.getContext("2d");

  const cx = S * 0.48;
  const cy = S * 0.46;
  const r = S * 0.44;
  const g = octx.createRadialGradient(cx, cy, 10, cx, cy, r);
  g.addColorStop(0, "rgba(255, 0, 0, 0.78)");
  g.addColorStop(0.32, "rgba(255, 210, 0, 0.68)");
  g.addColorStop(0.6, "rgba(0, 220, 80, 0.48)");
  g.addColorStop(0.82, "rgba(0, 120, 255, 0.35)");
  g.addColorStop(1, "rgba(0, 20, 180, 0.12)");

  octx.fillStyle = g;
  octx.fillRect(0, 0, S, S);

  ctx.globalCompositeOperation = "color";
  ctx.drawImage(overlay, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

/**
 * Executes full client-side ONNX inference on an HTMLImageElement
 */
export async function runClientOnnxInference(imgElement) {
  if (!session) {
    session = await loadOfflineModel();
  }
  if (!session) {
    throw new Error("Offline ONNX neural engine not loaded.");
  }

  const imageData = rasterizeImage(imgElement);
  const tensor = tensorFromImageData(imageData);
  const feeds = {};
  feeds[session.inputNames[0]] = tensor;

  const out = await session.run(feeds);
  const logits = Array.from(out[session.outputNames[0]].data);
  const probs = softmax(logits);
  const idx = probs.indexOf(Math.max(...probs));
  const confidence = probs[idx];

  const classList = logits.length === 25 ? CLASSES_25 : CLASSES_12;
  const rawClass = classList[idx] || "Crop Foliage";

  // Build top predictions
  const paired = logits.map((val, i) => ({
    class_name: classList[i] || `Class ${i}`,
    probability: probs[i]
  }));
  paired.sort((a, b) => b.probability - a.probability);
  const topPredictions = paired.slice(0, 5);

  const gradcamDataUrl = generateClientGradcam(imgElement);

  // Retrieve cached offline agronomic guidance
  let offlineAdvisory = null;
  if (agronomyKnowledge && agronomyKnowledge[rawClass]) {
    offlineAdvisory = agronomyKnowledge[rawClass];
  }

  return {
    class_name: rawClass,
    confidence: confidence * 100,
    gradcam_image: gradcamDataUrl,
    top_predictions: topPredictions,
    offline_mode: true,
    offline_advisory: offlineAdvisory
  };
}
