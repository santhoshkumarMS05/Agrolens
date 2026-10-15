/**
 * AgroLens — Ultra-Fast Neural Voice Reader (Edge TTS + Google TTS + WebSpeech Fallback)
 * Broadcast-quality native speech for English, தமிழ் (Tamil), and हिन्दी (Hindi).
 */

let activeBtn = null;
let currentAudio = null;
let playSessionId = 0;
let currentCallback = null;
const AUDIO_CACHE = new Map(); // url -> HTMLAudioElement

export function stopSpeaking() {
  playSessionId++;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = "";
    } catch (e) {}
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (activeBtn) {
    activeBtn.classList.remove("speaking", "loading");
    activeBtn.innerHTML = `<span>🔊</span>`;
    activeBtn.title = "Listen aloud";
    activeBtn = null;
  }
  if (currentCallback) {
    const cb = currentCallback;
    currentCallback = null;
    try {
      cb();
    } catch (e) {}
  }
}

export function cleanString(str) {
  if (!str) return "";
  let s = str
    .replace(/<[^>]*>/g, " ")
    .replace(/^[\d+.\-•*#]\s*/gm, "")
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/—/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Prevent ALL-CAPS words (from CSS text-transform: uppercase) from being spelled letter-by-letter
  s = s.replace(/\b[A-Z]{3,}\b/g, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });

  return s;
}

export function detectLanguage(text, langPreference) {
  if (langPreference === "ta" || /[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (langPreference === "hi" || /[\u0900-\u097F]/.test(text)) return "hi";
  return langPreference === "ta" ? "ta" : langPreference === "hi" ? "hi" : "en";
}

export function getAudioUrl(text, langCode) {
  return `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(langCode)}`;
}

export function prefetchAudio(text, langPreference, titleText) {
  const cleanTitle = cleanString(titleText);
  const cleanBody = cleanString(text);
  const fullText = cleanTitle && cleanBody ? `${cleanTitle}: ${cleanBody}` : (cleanTitle || cleanBody);
  if (!fullText) return;

  const langCode = detectLanguage(fullText, langPreference);
  const url = getAudioUrl(fullText, langCode);

  if (!AUDIO_CACHE.has(url)) {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    AUDIO_CACHE.set(url, audio);
    if (AUDIO_CACHE.size > 50) {
      const firstKey = AUDIO_CACHE.keys().next().value;
      AUDIO_CACHE.delete(firstKey);
    }
  }
}

function fallbackWebSpeech(text, langCode) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    stopSpeaking();
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode === "ta" ? "ta-IN" : langCode === "hi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.95;

  const voices = window.speechSynthesis.getVoices();
  const prefix = langCode === "ta" ? "ta" : langCode === "hi" ? "hi" : "en";
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (voice) utterance.voice = voice;

  utterance.onend = () => {
    stopSpeaking();
  };
  utterance.onerror = () => {
    stopSpeaking();
  };
  window.speechSynthesis.speak(utterance);
}

export function speakText(rawText, langPreference, buttonElement, titleText, onEndedCallback) {
  if (activeBtn === buttonElement && buttonElement) {
    stopSpeaking();
    return;
  }

  stopSpeaking();
  currentCallback = onEndedCallback || null;

  const cleanTitle = cleanString(titleText);
  const cleanBody = cleanString(rawText);
  const fullText = cleanTitle && cleanBody ? `${cleanTitle}: ${cleanBody}` : (cleanTitle || cleanBody);
  if (!fullText) return;

  const langCode = detectLanguage(fullText, langPreference);
  const fullUrl = getAudioUrl(fullText, langCode);

  if (buttonElement) {
    activeBtn = buttonElement;
    buttonElement.classList.add("speaking", "loading");
    buttonElement.innerHTML = `<span>⏳</span>`;
    buttonElement.title = "Starting voice guidance...";
  }

  const sessionId = ++playSessionId;

  const onStartPlaying = () => {
    if (sessionId === playSessionId && buttonElement) {
      buttonElement.classList.remove("loading");
      buttonElement.innerHTML = `<span>⏹️</span>`;
      buttonElement.title = "Click to stop listening";
    }
  };

  // Play as a single, uninterrupted audio stream (prevents mobile chunk blocking and mid-sentence restart)
  let audio;
  if (AUDIO_CACHE.has(fullUrl)) {
    audio = AUDIO_CACHE.get(fullUrl);
    audio.currentTime = 0;
  } else {
    audio = new Audio(fullUrl);
    audio.preload = "auto";
    AUDIO_CACHE.set(fullUrl, audio);
    if (AUDIO_CACHE.size > 50) {
      const firstKey = AUDIO_CACHE.keys().next().value;
      AUDIO_CACHE.delete(firstKey);
    }
  }

  currentAudio = audio;
  audio.onplaying = onStartPlaying;

  audio.onended = () => {
    if (sessionId === playSessionId) {
      stopSpeaking();
    }
  };

  audio.onerror = (err) => {
    console.warn("[VoiceReader] Edge TTS notice, falling back to WebSpeech:", err);
    if (sessionId === playSessionId) {
      fallbackWebSpeech(fullText, langCode);
    }
  };

  // Trigger play immediately inside user-initiated click event for mobile compliance
  audio.play().then(onStartPlaying).catch((err) => {
    console.warn("[VoiceReader] Direct play notice, attempting WebSpeech:", err);
    if (sessionId === playSessionId) {
      fallbackWebSpeech(fullText, langCode);
    }
  });
}

export default {
  speakText,
  stopSpeaking,
  stop: stopSpeaking,
  cleanString,
  prefetch: prefetchAudio
};
