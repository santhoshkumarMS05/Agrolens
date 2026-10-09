/**
 * AgroLens — Ultra-Fast Neural Voice Reader (Edge TTS + Zero-Wait Prefetching)
 * Broadcast-quality (9.5/10) human realism for English, தமிழ் (Tamil), and हिन्दी (Hindi).
 */

let activeBtn = null;
let currentAudio = null;
let playSessionId = 0;
const AUDIO_CACHE = new Map(); // url -> HTMLAudioElement

export function stopSpeaking() {
  playSessionId++;
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch (e) {}
    currentAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
  if (activeBtn) {
    activeBtn.classList.remove("speaking", "loading");
    activeBtn.innerHTML = `<span>🔊</span>`;
    activeBtn.title = "Listen aloud";
    activeBtn = null;
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
  return "en";
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

function splitFastStart(title, body) {
  const cleanT = cleanString(title);
  const cleanB = cleanString(body);

  if (!cleanB) return cleanT ? [cleanT] : [];
  if (!cleanT) {
    const match = cleanB.match(/^(.+?[.!?\n|।\u0964])\s*(.*)$/);
    if (match && match[1] && match[2] && match[1].length < 180) {
      return [match[1].trim(), match[2].trim()];
    }
    return [cleanB];
  }

  const match = cleanB.match(/^(.+?[.!?\n|।\u0964])\s*(.*)$/);
  if (match && match[1] && match[2] && (cleanT.length + match[1].length) < 200) {
    return [`${cleanT}: ${match[1].trim()}`, match[2].trim()];
  }

  return [`${cleanT}: ${cleanB}`];
}

function fallbackWebSpeech(text, langCode) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode === "ta" ? "ta-IN" : langCode === "hi" ? "hi-IN" : "en-IN";
  utterance.rate = 0.95;

  const voices = window.speechSynthesis.getVoices();
  const prefix = langCode === "ta" ? "ta" : langCode === "hi" ? "hi" : "en";
  const voice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
  if (voice) utterance.voice = voice;

  utterance.onend = () => { stopSpeaking(); };
  utterance.onerror = () => { stopSpeaking(); };
  window.speechSynthesis.speak(utterance);
}

export function speakText(rawText, langPreference, buttonElement, titleText) {
  if (activeBtn === buttonElement && buttonElement) {
    stopSpeaking();
    return;
  }

  stopSpeaking();

  const cleanTitle = cleanString(titleText);
  const cleanBody = cleanString(rawText);
  const fullText = cleanTitle && cleanBody ? `${cleanTitle}: ${cleanBody}` : (cleanTitle || cleanBody);
  if (!fullText) return;

  const langCode = detectLanguage(fullText, langPreference);
  const fullUrl = getAudioUrl(fullText, langCode);

  if (buttonElement) {
    activeBtn = buttonElement;
    buttonElement.classList.add("speaking");
    buttonElement.innerHTML = `<span>⏹️</span>`;
    buttonElement.title = "Click to stop listening";
  }

  const sessionId = ++playSessionId;

  // 1. If full audio was already prefetched or cached, play immediately
  if (AUDIO_CACHE.has(fullUrl)) {
    const cached = AUDIO_CACHE.get(fullUrl);
    currentAudio = cached;
    cached.currentTime = 0;
    cached.onended = () => {
      if (sessionId === playSessionId) stopSpeaking();
    };
    cached.onerror = () => {
      if (sessionId === playSessionId) fallbackWebSpeech(fullText, langCode);
    };
    cached.play().catch(() => {
      if (sessionId === playSessionId) fallbackWebSpeech(fullText, langCode);
    });
    return;
  }

  // 2. Fast-Start Split
  const segments = splitFastStart(titleText, rawText);
  if (segments.length === 1) {
    const audio = new Audio(getAudioUrl(segments[0], langCode));
    currentAudio = audio;
    AUDIO_CACHE.set(fullUrl, audio);
    audio.onended = () => {
      if (sessionId === playSessionId) stopSpeaking();
    };
    audio.onerror = () => {
      if (sessionId === playSessionId) fallbackWebSpeech(fullText, langCode);
    };
    audio.play().catch(() => {
      if (sessionId === playSessionId) fallbackWebSpeech(fullText, langCode);
    });
    return;
  }

  // Multiple segments
  const chunk1Url = getAudioUrl(segments[0], langCode);
  const chunk2Url = getAudioUrl(segments[1], langCode);

  const audio1 = new Audio(chunk1Url);
  const audio2 = new Audio(chunk2Url);
  audio2.preload = "auto";

  currentAudio = audio1;

  audio1.onended = () => {
    if (sessionId !== playSessionId) return;
    currentAudio = audio2;
    audio2.onended = () => {
      if (sessionId === playSessionId) stopSpeaking();
    };
    audio2.onerror = () => {
      if (sessionId === playSessionId) stopSpeaking();
    };
    audio2.play().catch(() => {
      if (sessionId === playSessionId) stopSpeaking();
    });
  };

  audio1.onerror = () => {
    if (sessionId === playSessionId) fallbackWebSpeech(fullText, langCode);
  };

  audio1.play().catch(() => {
    if (sessionId === playSessionId) fallbackWebSpeech(fullText, langCode);
  });
}

export default {
  speakText,
  stopSpeaking,
  cleanString,
  prefetch: prefetchAudio
};
