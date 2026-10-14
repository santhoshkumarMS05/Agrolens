import React, { useState, useEffect } from "react";

export const InstallButton = ({ style = {}, className = "" }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`pill ${className}`}
        title="Install AgroLens as a standalone app"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          background: "rgba(34, 197, 94, 0.12)",
          color: "#22c55e",
          border: "1px solid rgba(34, 197, 94, 0.35)",
          fontWeight: 600,
          fontSize: "0.82rem",
          padding: "6px 12px",
          borderRadius: "99px",
          transition: "all 0.2s ease",
          ...style,
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Install App</span>
      </button>

      {showInstructions && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setShowInstructions(false)}
        >
          <div
            style={{
              background: "#121c11",
              border: "1px solid #2d4627",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "420px",
              width: "100%",
              color: "#f4f1e2",
              boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>📲</span> Install AgroLens
              </h3>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8fa38d",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
            <p
              style={{
                fontSize: "0.88rem",
                lineHeight: 1.5,
                color: "#a5b3a3",
                marginBottom: "16px",
              }}
            >
              Install AgroLens directly on your device for instant offline access and field scans without an app store:
            </p>
            <ul
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.6,
                paddingLeft: "20px",
                margin: "0 0 20px 0",
                color: "#d8e2d7",
              }}
            >
              <li>
                <strong>Chrome / Edge (Desktop)</strong>: Look at the URL bar on the right for the install icon (monitor with down arrow), or click Menu (⋮) → <em>Install AgroLens</em>.
              </li>
              <li>
                <strong>Android (Chrome)</strong>: Tap Menu (⋮) in the top-right corner → tap <em>Install app</em> or <em>Add to Home screen</em>.
              </li>
              <li>
                <strong>iPhone / iPad (Safari)</strong>: Tap the Share button (square with arrow) at the bottom → tap <em>Add to Home Screen</em>.
              </li>
            </ul>
            <button
              type="button"
              className="btn primary"
              onClick={() => setShowInstructions(false)}
              style={{ width: "100%", padding: "10px", fontSize: "0.9rem" }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallButton;
