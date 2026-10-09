import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const cropData = {
  rice: {
    title: "Rice (Paddy) Protection",
    note: "Detects Bacterial Blight (water-soaked lesions turning yellow-white), Fungal Leaf Blast (diamond/spindle-shaped lesions with gray centers), and Brown Spot (oval brown spots with yellow halos). Covers healthy paddy foliage."
  },
  sugarcane: {
    title: "Sugarcane Disease Surveillance",
    note: "Diagnoses Red Rot (internal reddening with white cross patches & foliar withering), Brown Rust (elongated reddish-brown pustules on both leaf surfaces), and Yellow Leaf Disease (midrib chlorosis). Covers healthy cane."
  },
  corn: {
    title: "Corn / Maize Health Monitoring",
    note: "Identifies Common Rust (cinnamon-brown powdery pustules), Gray Leaf Spot (rectangular tan-gray lesions bounded by leaf veins), and Leaf Blight (long elliptical grayish-green or tan lesions). Covers healthy corn."
  },
  cotton: {
    title: "Cotton Crop Health Analysis",
    note: "Identifies Bacterial Blight / Angular Leaf Spot (water-soaked angular spots on leaves, black arm lesions on stems, and boll rot). Covers healthy cotton foliage."
  },
  groundnut: {
    title: "Groundnut (Peanut) Diagnosis",
    note: "Distinguishes Early Leaf Spot (brown circular spots with prominent yellow halos), Late Leaf Spot (dark brown-black spots with faint halos), and Foliar Rust (orange-brown pustules). Covers healthy groundnut."
  },
  cassava: {
    title: "Cassava Tuber Security",
    note: "Screens for African Cassava Mosaic Virus (severe leaf curling, distortion, and yellow-green chlorotic mosaic) and Brown Streak Disease (feathery chlorosis along secondary veins and brown root necrosis). Covers healthy cassava."
  },
  sorghum: {
    title: "Sorghum (Jowar) Defense",
    note: "Flags Anthracnose & Stalk Red Rot (circular/elliptic spots with reddish margins and fruiting acervuli) and Foliar Rust (flecking developing into purplish-brown pustules)."
  },
  coconut: {
    title: "Coconut Palm Health",
    note: "Monitors Gray Leaf Spot (oval spots turning grayish-white with dark brown borders) and Leaf Rot / Bud Rot (rotting of youngest spear leaves, necrotic blackening, and collar rot)."
  }
};

export const LandingPage = () => {
  const { user } = useAuth();
  const [selectedCrop, setSelectedCrop] = useState("rice");
  const [openCards, setOpenCards] = useState({});
  const [openScells, setOpenScells] = useState({});

  useEffect(() => {
    // Reveal on scroll
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });

    document.querySelectorAll(".rv, .step").forEach((el) => io.observe(el));

    // Rail fill tied to scroll
    const railUpdate = () => {
      const track = document.getElementById("track");
      const fill = document.getElementById("railFill");
      if (!track || !fill) return;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      let p = (vh * 0.72 - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      fill.style.height = `${p * 100}%`;
    };

    railUpdate();
    window.addEventListener("scroll", railUpdate, { passive: true });
    window.addEventListener("resize", railUpdate);

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", railUpdate);
      window.removeEventListener("resize", railUpdate);
    };
  }, []);

  const toggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleScell = (id) => {
    setOpenScells((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div>
      <style>{`
/* ---------- hero ---------- */
.hero{max-width:1180px;margin:0 auto;padding:72px 32px 90px;display:grid;grid-template-columns:1.1fr .9fr;gap:60px;align-items:center}
.hero h1{font-size:clamp(2.6rem,5.4vw,4.3rem)}
.hero h1 em{font-style:italic;color:var(--green)}
.hero .lede{margin-top:26px;max-width:50ch;color:var(--muted);font-size:1.08rem}
.hero .ctas{margin-top:34px;display:flex;gap:14px;flex-wrap:wrap}
.hero .facts{margin-top:44px;display:flex;gap:36px;flex-wrap:wrap;padding-top:26px;border-top:1px solid var(--line-soft)}
.fact .n{font-family:"Fraunces",serif;font-size:1.7rem;font-weight:600;line-height:1}
.fact .l{font-size:.8rem;color:var(--muted);margin-top:5px}

/* phone */
.phone-stage{position:relative;display:flex;justify-content:center;align-items:center;min-height:520px}
.blob{position:absolute;width:76%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 34% 30%,var(--green-l),var(--green) 58%,var(--green-d));filter:blur(.5px)}
.phone{position:relative;width:260px;aspect-ratio:9/18.6;border-radius:34px;background:var(--ink);padding:9px;box-shadow:0 30px 70px -22px rgba(27,33,20,.55)}
.screen{width:100%;height:100%;border-radius:26px;overflow:hidden;position:relative;background:var(--green-d);display:flex;flex-direction:column}
.screen .cam{flex:1;position:relative;background:linear-gradient(160deg,#3d5c33,#26401f)}
.screen .cam svg{position:absolute;inset:0;width:100%;height:100%}
.sweep{position:absolute;left:0;right:0;height:64px;background:linear-gradient(180deg,transparent,rgba(221,185,92,.32),transparent);animation:sweep 3.4s var(--ease) infinite}
@keyframes sweep{0%{top:-12%}55%{top:88%}100%{top:-12%}}
.retic{position:absolute;width:44px;height:44px;border:2px solid var(--gold-l);border-radius:50%;top:37%;left:50%;transform:translate(-50%,-50%);animation:pulse 2.6s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.9}50%{transform:translate(-50%,-50%) scale(1.22);opacity:.45}}
.readout{background:var(--paper);padding:16px 18px 20px;border-radius:22px 22px 26px 26px}
.readout .tagp{display:inline-block;font-size:.66rem;font-weight:600;background:var(--paper-3);padding:3px 10px;border-radius:99px;color:var(--green)}
.readout h4{font-family:"Fraunces",serif;font-size:1.06rem;margin-top:8px}
.readout .bar{height:5px;border-radius:99px;background:var(--paper-3);margin-top:10px;overflow:hidden}
.readout .bar i{display:block;height:100%;width:0;border-radius:99px;background:linear-gradient(90deg,var(--gold),var(--green-l));animation:grow 3.4s var(--ease) infinite}
@keyframes grow{0%{width:0}45%{width:95%}90%{width:95%}100%{width:0}}
.readout .sm{font-size:.7rem;color:var(--muted);margin-top:7px}
@media(max-width:900px){.hero{grid-template-columns:1fr;padding-bottom:60px}.phone-stage{order:-1;min-height:440px}}

/* section shell */
.sec{padding:96px 0;border-top:1px solid var(--line-soft)}
.sec-head{max-width:680px}
.sec-head h2{font-size:clamp(1.9rem,3.6vw,2.7rem);margin-top:18px}
.sec-head p{margin-top:16px;color:var(--muted);font-size:1.04rem}

/* problem / solution */
.split{margin-top:52px;display:grid;grid-template-columns:1fr 1fr;border-radius:var(--r);overflow:hidden;border:1px solid var(--line)}
.split>div{padding:38px 34px}
.split .a{background:var(--paper-2)}
.split .b{background:var(--green);color:var(--paper)}
.split h3{font-size:1.35rem;margin-top:14px}
.split .lbl{font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--green)}
.split .b .lbl{color:var(--gold-l)}
.split p{margin-top:14px;font-size:.97rem}
.split .a p{color:var(--muted)}
.split .b p{color:rgba(244,241,226,.88)}
.split ul{margin:18px 0 0;padding:0;list-style:none;display:grid;gap:9px}
.split .b li{font-size:.94rem;padding-left:20px;position:relative;color:rgba(244,241,226,.94)}
.split .b li::before{content:"";position:absolute;left:0;top:.62em;width:7px;height:7px;border-radius:50%;background:var(--gold)}
@media(max-width:820px){.split{grid-template-columns:1fr}}

/* nav spacing */
.nav-links{display:flex;gap:36px;font-size:.95rem;align-items:center}
.nav-links a{text-decoration:none;color:var(--muted);position:relative;padding:6px 2px;transition:color .25s var(--ease)}
.nav-links a:hover{color:var(--ink)}

/* pipeline */
.track{margin-top:56px;position:relative;padding-left:0}
.rail{position:absolute;left:23px;top:10px;bottom:10px;width:2px;background:var(--line)}
.rail-fill{position:absolute;left:23px;top:10px;width:2px;height:0;background:linear-gradient(180deg,var(--green-l),var(--gold) 55%,var(--rust));transition:height .1s linear}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:18px;position:relative}
.step{display:grid;grid-template-columns:48px 1fr;align-items:start}
.dot{display:flex;justify-content:center;padding-top:22px;position:relative;z-index:2}
.dot i{width:12px;height:12px;border-radius:50%;background:var(--paper);border:2px solid var(--line);transition:all .5s var(--ease)}
.step.in .dot i{background:var(--green);border-color:var(--green);box-shadow:0 0 0 5px rgba(45,70,39,.13)}
.card{
  background:var(--paper-2);border:1px solid var(--line);border-radius:var(--r);
  padding:20px 24px;cursor:pointer;position:relative;overflow:hidden;
  opacity:0;transform:translateY(16px);
  transition:opacity .65s var(--ease),transform .65s var(--ease),border-color .3s var(--ease),background .45s var(--ease),color .45s var(--ease);
}
.step.in .card{opacity:1;transform:none}
.card::before{
  content:"";position:absolute;inset:0;opacity:0;
  background:linear-gradient(115deg,var(--green) 0%,var(--green-d) 52%,#3a5b30 100%);
  transition:opacity .5s var(--ease);
}
.card.open{color:var(--paper);border-color:var(--green-d)}
.card.open::before{opacity:1}
.card>*{position:relative;z-index:1}
.card:hover{border-color:var(--green-l)}
.card .top{display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.card h3{font-size:1.1rem;font-weight:600}
.card .kick{font-size:.87rem;color:var(--muted);margin-top:3px;transition:color .45s var(--ease)}
.card.open .kick{color:var(--gold-l)}
.card .sign{flex:none;width:18px;height:18px;position:relative;opacity:.55}
.card .sign::before,.card .sign::after{content:"";position:absolute;background:currentColor;border-radius:2px}
.card .sign::before{width:12px;height:2px;top:8px;left:3px}
.card .sign::after{width:2px;height:12px;top:3px;left:8px;transition:transform .35s var(--ease)}
.card.open .sign::after{transform:rotate(90deg)}
.card.open .sign{opacity:.9}
.drawer{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s var(--ease)}
.card.open .drawer{grid-template-rows:1fr}
.drawer>div{overflow:hidden}
.drawer p{margin-top:15px;padding-top:15px;border-top:1px dashed rgba(244,241,226,.28);font-size:.95rem;color:rgba(244,241,226,.88);line-height:1.55}
.branch{grid-column:2;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.branch .blab{font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px}
.branch .low .blab{color:var(--rust)}
.branch .high .blab{color:var(--green-l)}
.card.open .blab{color:var(--gold-l)!important}
@media(max-width:700px){.branch{grid-template-columns:1fr}}

/* crop directory cards */
.mgrid{margin-top:48px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.mcard{
  background:var(--paper-2);border:1px solid var(--line);border-radius:var(--r);padding:24px 22px;cursor:pointer;position:relative;
  transition:transform .4s var(--ease),border-color .3s var(--ease),background .45s var(--ease),color .45s var(--ease),box-shadow .4s var(--ease);
}
.mcard:hover{transform:translateY(-4px)}
.mcard.sel{background:linear-gradient(150deg,var(--green),var(--green-d));color:var(--paper);border-color:var(--green-d);box-shadow:0 18px 38px -20px rgba(31,51,32,.8)}
.mcard .mark{position:absolute;top:20px;right:20px;width:19px;height:19px;border-radius:50%;border:1.5px solid var(--line);transition:all .35s var(--ease)}
.mcard.sel .mark{background:var(--gold);border-color:var(--gold)}
.mcard.sel .mark::after{content:"";position:absolute;left:5px;top:5px;width:8px;height:5px;border-left:1.8px solid var(--ink);border-bottom:1.8px solid var(--ink);transform:rotate(-45deg)}
.mcard h3{font-size:1.15rem;padding-right:28px}
.mcard p{margin-top:10px;font-size:.88rem;color:var(--muted);transition:color .45s var(--ease);line-height:1.45}
.mcard.sel p{color:rgba(244,241,226,.88)}
.chips{margin-top:16px;display:flex;gap:7px;flex-wrap:wrap}
.chip{font-size:.72rem;padding:4px 11px;border-radius:99px;background:var(--paper-3);color:var(--muted);transition:all .45s var(--ease);font-weight:500}
.mcard.sel .chip{background:rgba(244,241,226,.16);color:var(--gold-l)}
.badge-win{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.mcard.sel .badge-win{color:var(--gold)}
.mnote{margin-top:22px;padding:18px 22px;border-left:3px solid var(--gold);background:var(--paper-2);border-radius:0 var(--r) var(--r) 0;font-size:.95rem;color:var(--ink);line-height:1.55}
@media(max-width:980px){.mgrid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.mgrid{grid-template-columns:1fr}}

/* stack grid */
.stack{margin-top:48px;display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.scell{background:var(--paper-2);padding:28px 24px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);cursor:pointer;position:relative;transition:background .4s var(--ease),color .4s var(--ease)}
.scell:hover{background:var(--paper-3)}
.scell.open{background:linear-gradient(140deg,var(--green),var(--green-d));color:var(--paper)}
.scell .lbl{font-size:.72rem;letter-spacing:.13em;text-transform:uppercase;font-weight:600;color:var(--green-l);display:flex;justify-content:space-between;align-items:center}
.scell.open .lbl{color:var(--gold-l)}
.scell h4{font-family:"Fraunces",serif;font-size:1.2rem;margin-top:12px}
.scell .dr{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s var(--ease)}
.scell.open .dr{grid-template-rows:1fr}
.scell .dr>div{overflow:hidden}
.scell .dr p{margin-top:14px;font-size:.92rem;color:rgba(244,241,226,.88);line-height:1.55}
@media(max-width:860px){.stack{grid-template-columns:1fr 1fr}}
@media(max-width:540px){.stack{grid-template-columns:1fr}}

footer{background:var(--footer-bg);color:rgba(244,241,226,.66);padding:52px 0 44px;font-size:.87rem}
.f-in{max-width:1180px;margin:0 auto;padding:0 32px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}
.f-in b{color:var(--paper);font-weight:600}
.f-links a{color:rgba(244,241,226,.8);text-decoration:none;margin-left:18px;transition:color .2s}
.f-links a:hover{color:var(--gold)}

/* Index Dark Mode Overrides */
[data-theme="dark"] .split .b { background: #142f18; color: var(--ink); }
[data-theme="dark"] .split .b p { color: rgba(234,241,231,.85); }
[data-theme="dark"] .split .b li { color: rgba(234,241,231,.92); }
[data-theme="dark"] .scell.open { background: linear-gradient(140deg, #183b1d, #102613); color: var(--ink); }
[data-theme="dark"] .mcard.sel { background: linear-gradient(135deg, #183b1d, #102613); color: var(--ink); }
[data-theme="dark"] .phone { background: #080c09; box-shadow: 0 30px 70px -22px rgba(0,0,0,.85); }
[data-theme="dark"] .readout { background: var(--paper-2); }
[data-theme="dark"] .readout .tagp { background: var(--paper-3); color: var(--green); }
[data-theme="dark"] .mnote { background: var(--paper-2); color: var(--ink); }
[data-theme="dark"] .step.in .dot i { background: var(--green); border-color: var(--green); box-shadow: 0 0 0 5px rgba(74,222,128,.18); }

/* Landing Page Mobile Refinements */
@media(max-width:768px){
  .hero{padding:40px 20px 60px;gap:36px}
  .hero h1{font-size:2.4rem}
  .hero .lede{font-size:0.96rem;margin-top:16px}
  .hero .facts{gap:20px;margin-top:30px;padding-top:20px}
  .fact .n{font-size:1.4rem}
  .hero .ctas{flex-direction:column}
  .hero .ctas .btn{width:100%;justify-content:center}
  .sec{padding:60px 0}
  .split>div{padding:26px 20px}
  .split h3{font-size:1.2rem}
  .card{padding:16px 18px}
  .scell{padding:20px 18px}
  .mcard{padding:18px 16px}
}
@media(max-width:480px){
  .hero{padding:30px 16px 50px}
  .hero h1{font-size:2.05rem}
  .phone-stage{min-height:360px}
  .phone{width:220px}
  .sec-head h2{font-size:1.75rem}
}
      `}</style>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-in">
          <Link className="brand" to="/">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 21C7 17 4 13 4 8.5A6.5 6.5 0 0116.9 6c1.7 1.7 2.6 4.2 1.6 8-1 3.9-4 6.3-6.5 7z" fill="#2d4627"/>
              <path d="M12 21V9" stroke="#f4f1e2" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            AgroLens
          </Link>
          <div className="nav-links">
            <a href="#overview">Overview</a>
            <a href="#workflow">How It Works</a>
            <a href="#crops">Supported Crops</a>
            <a href="#capabilities">Features</a>
          </div>
          <div id="navAuthSlot" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            {user ? (
              <Link className="btn primary" to="/dashboard" style={{ padding: "8px 20px", fontSize: ".88rem" }}>
                🌱 Open Scanner
              </Link>
            ) : (
              <Link className="pill" to="/login">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero" id="overview">
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(45,70,39,.1)", border: "1px solid rgba(45,70,39,.2)", borderRadius: "99px", padding: "5px 14px", marginBottom: "14px" }}>
            <span style={{ fontSize: "1rem" }}>🌐</span>
            <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--green)", letterSpacing: ".4px" }}>
              English &bull; தமிழ் (Tamil) &bull; हिन्दी (Hindi)
            </span>
          </div>
          <span className="eyebrow" style={{ display: "block" }}>AI Agricultural Health &amp; Phenology Intelligence</span>
          <h1 style={{ marginTop: "14px" }}>One photo.<br/><em>Disease diagnosis</em> &amp;<br/>growth stage tracking.</h1>
          <p className="lede">
            AgroLens delivers dual-engine agronomic intelligence for farmers. Instantly diagnose 25 critical foliar diseases with Grad-CAM heatmaps, or track plant growth across vegetative, reproductive, and ripening phases with tailored irrigation schedules, fertilizer timing, and harvest forecasts. Powered by edge neural networks and Amazon Nova Lite multimodal vision.
          </p>
          <div className="ctas">
            <Link className="btn primary" to="/dashboard">Open AI Dashboard →</Link>
            <a className="btn" href="#crops">Explore Supported Crops</a>
          </div>
          <div className="facts">
            <div className="fact"><div className="n">8+</div><div className="l">Crops Supported</div></div>
            <div className="fact"><div className="n">25</div><div className="l">Disease Classes</div></div>
            <div className="fact"><div className="n">Dual</div><div className="l">Disease &amp; Phenology</div></div>
            <div className="fact"><div className="n">3</div><div className="l">Languages (EN/TA/HI)</div></div>
          </div>
        </div>

        <div className="phone-stage">
          <div className="blob"></div>
          <div className="phone">
            <div className="screen">
              <div className="cam">
                <svg viewBox="0 0 120 200" preserveAspectRatio="xMidYMid slice">
                  <path d="M60 172c-22-20-32-44-32-66a32 32 0 0164-4c4 16 2 34-8 48-8 11-16 18-24 22z" fill="#4a6b3c" opacity=".85"/>
                  <path d="M60 168V70" stroke="#233a1c" strokeWidth="1.2" opacity=".6"/>
                  <path d="M60 96L42 84M60 116L40 108M60 136L44 132M60 96l18-12M60 116l20-8M60 136l16-4" stroke="#233a1c" strokeWidth=".9" opacity=".45"/>
                  <circle cx="47" cy="112" r="5.5" fill="#9c5a2c" opacity=".85"/>
                  <circle cx="72" cy="132" r="3.6" fill="#9c5a2c" opacity=".7"/>
                  <circle cx="55" cy="146" r="3" fill="#9c5a2c" opacity=".6"/>
                </svg>
                <div className="sweep"></div>
                <div className="retic"></div>
              </div>
              <div className="readout">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span className="tagp">Rice · நெல் · धान</span>
                  <span style={{ fontSize: ".65rem", fontWeight: 700, color: "var(--gold)" }}>Reproductive</span>
                </div>
                <h4>Flowering &amp; Heading Stage</h4>
                <div className="bar"><i></i></div>
                <p className="sm">Dual AI Verified &bull; 35 days to harvest</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Problem & Solution */}
      <section className="sec" id="problem-solution">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Field Challenge &amp; Solution</span>
            <h2>Precision protection &amp; growth tracking in one platform.</h2>
            <p>Farmers face two critical questions every season: <em>What disease is harming my crop right now?</em> and <em>What growth stage is my crop in, and what water and fertilizer does it need today?</em> AgroLens answers both in seconds.</p>
          </div>
          <div className="split">
            <div className="a">
              <span className="lbl">Traditional Farm Challenges</span>
              <h3>Guesswork, mistimed fertilizer &amp; delayed diagnosis</h3>
              <p>Distinguishing early fungal leaf spots from bacterial blights or nutrient deficiencies is nearly impossible by eye. Applying nitrogen at the wrong growth stage or mistiming irrigation during flowering causes severe sterility, lodging, and yield loss.</p>
            </div>
            <div className="b">
              <span className="lbl">The AgroLens Advantage</span>
              <h3>Dual-Engine Intelligence: Disease + Phenology</h3>
              <p>A streamlined mobile diagnostic workflow designed for real farmers, agronomists, and field officers.</p>
              <ul>
                <li><b>Crop Pre-Selection &amp; Open-World:</b> Select from 8 core crops or type any custom crop with dynamic English, Tamil, and Hindi translations.</li>
                <li><b>Dual Diagnostic Modes:</b> Toggle between close-up leaf disease diagnosis and whole-plant growth stage phenology tracking.</li>
                <li><b>Hybrid Vision Intelligence:</b> Edge neural network paired with Amazon Nova Lite multimodal visual teacher for open-world verification.</li>
                <li><b>Trilingual Advisory:</b> Instant actionable curative remedies, stage-based irrigation, and fertilizer timing in English, தமிழ், or हिन्दी.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow / Pipeline */}
      <section className="sec" id="workflow">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Diagnostic Pipeline</span>
            <h2>From field leaf photo to treatment plan.</h2>
            <p>Our automated diagnosis engine processes leaf imagery directly on-device or via server in milliseconds. Select any step to view how it works.</p>
          </div>
          <div className="track" id="track">
            <div className="rail"></div>
            <div className="rail-fill" id="railFill"></div>
            <ol className="steps">
              <li className="step">
                <div className="dot"><i></i></div>
                <div className={`card ${openCards[1] ? "open" : ""}`} onClick={() => toggleCard(1)}>
                  <div className="top"><h3>1. Crop Selection &amp; Diagnostic Mode</h3><span className="sign"></span></div>
                  <p className="kick">Targeted agronomic context &amp; multilingual crop selection</p>
                  <div className="drawer"><div><p>The farmer selects their crop from 8 core agricultural commodities or enters a custom crop in English, Tamil, or Hindi, then chooses between Foliar Disease Diagnosis or Whole-Plant Growth Stage Phenology.</p></div></div>
                </div>
              </li>
              <li className="step">
                <div className="dot"><i></i></div>
                <div className={`card ${openCards[2] ? "open" : ""}`} onClick={() => toggleCard(2)}>
                  <div className="top"><h3>2. Photo Capture &amp; Batch Preprocessing</h3><span className="sign"></span></div>
                  <p className="kick">Single photo capture or multi-image batch queue</p>
                  <div className="drawer"><div><p>Capture close-up leaf lesions or plant canopy shots via mobile camera or gallery upload. Images are standardized, preprocessed, and queued directly inside the browser for rapid analysis.</p></div></div>
                </div>
              </li>
              <li className="step">
                <div className="dot"><i></i></div>
                <div className={`card ${openCards[3] ? "open" : ""}`} onClick={() => toggleCard(3)}>
                  <div className="top"><h3>3. Dual Vision Neural Evaluation</h3><span className="sign"></span></div>
                  <p className="kick">Edge classification &amp; crop consistency verification</p>
                  <div className="drawer"><div><p>The neural network scans micro-features across 25 agricultural classes. The system actively cross-checks the prediction against the selected crop to prevent false diagnoses.</p></div></div>
                </div>
              </li>
              <li className="step">
                <div className="dot"><i></i></div>
                <div className="branch">
                  <div className={`card low ${openCards["4a"] ? "open" : ""}`} onClick={() => toggleCard("4a")}>
                    <span className="blab">Open-World or Ambiguous</span>
                    <div className="top"><h3>Amazon Nova Lite Multimodal Teacher</h3><span className="sign"></span></div>
                    <div className="drawer"><div><p>If a crop mismatch occurs or an unmodeled condition is detected, the scan automatically escalates to Amazon Nova Lite vision for open-world diagnostic reasoning and phenology verification.</p></div></div>
                  </div>
                  <div className={`card high ${openCards["4b"] ? "open" : ""}`} onClick={() => toggleCard("4b")}>
                    <span className="blab">Verified In-Distribution</span>
                    <div className="top"><h3>Grad-CAM Attention Heatmap</h3><span className="sign"></span></div>
                    <div className="drawer"><div><p>Grad-CAM calculates gradient activations on the final convolutional layers, highlighting infected tissue in red and amber so farmers can visually confirm the diagnostic focus.</p></div></div>
                  </div>
                </div>
              </li>
              <li className="step">
                <div className="dot"><i></i></div>
                <div className={`card ${openCards[5] ? "open" : ""}`} onClick={() => toggleCard(5)}>
                  <div className="top"><h3>4. Trilingual Prescriptive Advisory</h3><span className="sign"></span></div>
                  <p className="kick">Curative measures, irrigation timing &amp; fertilizer schedules</p>
                  <div className="drawer"><div><p>Generates tailored agronomic advice in English, தமிழ், or हिन्दी: targeted biological/chemical remedies, spraying precautions, stage-based NPK nutrition, and days-to-harvest countdowns.</p></div></div>
                </div>
              </li>
              <li className="step">
                <div className="dot"><i></i></div>
                <div className={`card ${openCards[6] ? "open" : ""}`} onClick={() => toggleCard(6)}>
                  <div className="top"><h3>5. Field History &amp; Continuous Learning Loop</h3><span className="sign"></span></div>
                  <p className="kick">Farmer records &amp; admin staging queue</p>
                  <div className="drawer"><div><p>Diagnostic scans are archived to the farmer's private history. High-confidence model predictions are staged for agronomic review in the admin console, enabling ongoing model refinement.</p></div></div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Supported Crops */}
      <section className="sec" id="crops">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Supported Crop Directory</span>
            <h2>25 Diagnosable Conditions across 8 Crops.</h2>
            <p>Select any crop card below to view its specific diagnosable diseases, fungal pathogens, and healthy foliage indicators.</p>
          </div>
          
          <div className="mgrid">
            <div className={`mcard ${selectedCrop === "rice" ? "sel" : ""}`} onClick={() => setSelectedCrop("rice")}>
              <span className="mark"></span>
              <span className="badge-win">Staple Cereal</span>
              <h3>🌾 Rice (Paddy)</h3>
              <p>Bacterial blight, brown spot, leaf blast, and healthy paddy leaves.</p>
              <div className="chips">
                <span className="chip">Bacterial blight</span>
                <span className="chip">Brown spot</span>
                <span className="chip">Leaf blast</span>
                <span className="chip">Healthy</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "sugarcane" ? "sel" : ""}`} onClick={() => setSelectedCrop("sugarcane")}>
              <span className="mark"></span>
              <span className="badge-win">Commercial Crop</span>
              <h3>🎋 Sugarcane</h3>
              <p>Red rot, brown rust, yellow leaf virus, and healthy cane leaves.</p>
              <div className="chips">
                <span className="chip">Red rot</span>
                <span className="chip">Brown rust</span>
                <span className="chip">Yellow leaf</span>
                <span className="chip">Healthy</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "corn" ? "sel" : ""}`} onClick={() => setSelectedCrop("corn")}>
              <span className="mark"></span>
              <span className="badge-win">Cereal Crop</span>
              <h3>🌽 Corn (Maize)</h3>
              <p>Common rust, leaf blight, gray spot, and healthy corn foliage.</p>
              <div className="chips">
                <span className="chip">Common rust</span>
                <span className="chip">Leaf blight</span>
                <span className="chip">Gray spot</span>
                <span className="chip">Healthy</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "cotton" ? "sel" : ""}`} onClick={() => setSelectedCrop("cotton")}>
              <span className="mark"></span>
              <span className="badge-win">Fiber Cash Crop</span>
              <h3>☁️ Cotton</h3>
              <p>Bacterial blight (angular leaf spot) and healthy cotton leaves.</p>
              <div className="chips">
                <span className="chip">Bacterial blight</span>
                <span className="chip">Healthy</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "groundnut" ? "sel" : ""}`} onClick={() => setSelectedCrop("groundnut")}>
              <span className="mark"></span>
              <span className="badge-win">Oilseed Legume</span>
              <h3>🥜 Groundnut</h3>
              <p>Early leaf spot, late leaf spot, foliar rust, and healthy groundnut.</p>
              <div className="chips">
                <span className="chip">Early leaf spot</span>
                <span className="chip">Late leaf spot</span>
                <span className="chip">Rust</span>
                <span className="chip">Healthy</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "cassava" ? "sel" : ""}`} onClick={() => setSelectedCrop("cassava")}>
              <span className="mark"></span>
              <span className="badge-win">Tuber Crop</span>
              <h3>🌿 Cassava</h3>
              <p>Brown streak disease, mosaic virus, and healthy cassava leaves.</p>
              <div className="chips">
                <span className="chip">Brown streak</span>
                <span className="chip">Mosaic virus</span>
                <span className="chip">Healthy</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "sorghum" ? "sel" : ""}`} onClick={() => setSelectedCrop("sorghum")}>
              <span className="mark"></span>
              <span className="badge-win">Millet Cereal</span>
              <h3>🌾 Sorghum (Jowar)</h3>
              <p>Anthracnose red rot and foliar rust across drought-hardy crops.</p>
              <div className="chips">
                <span className="chip">Anthracnose red rot</span>
                <span className="chip">Rust</span>
              </div>
            </div>

            <div className={`mcard ${selectedCrop === "coconut" ? "sel" : ""}`} onClick={() => setSelectedCrop("coconut")}>
              <span className="mark"></span>
              <span className="badge-win">Plantation Palm</span>
              <h3>🥥 Coconut</h3>
              <p>Gray leaf spot necrosis and leaf rot (bud rot) frond infections.</p>
              <div className="chips">
                <span className="chip">Gray leaf spot</span>
                <span className="chip">Leaf rot</span>
              </div>
            </div>
          </div>

          <div className="mnote" id="cropInfoNote">
            <strong>{cropData[selectedCrop].title}:</strong> {cropData[selectedCrop].note}
          </div>
        </div>
      </section>

      {/* Capabilities / Stack */}
      <section className="sec" id="capabilities">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Application Features</span>
            <h2>Built for the field, engineered for farmers.</h2>
            <p>Select any feature below to explore how AgroLens simplifies crop management.</p>
          </div>
          <div className="stack">
            <div className={`scell ${openScells[1] ? "open" : ""}`} onClick={() => toggleScell(1)}>
              <div className="lbl">Crop Pre-Selection</div>
              <h4>Targeted &amp; Open-World</h4>
              <div className="dr"><div><p>Choose from 8 core agricultural commodities or input any custom crop in your local language to provide strict agronomic context and prevent false diagnoses.</p></div></div>
            </div>
            <div className={`scell ${openScells[2] ? "open" : ""}`} onClick={() => toggleScell(2)}>
              <div className="lbl">Dual Diagnostic Modes</div>
              <h4>Disease &amp; Growth Stage</h4>
              <div className="dr"><div><p>Seamlessly toggle between close-up leaf disease diagnosis and whole-plant growth stage detection with customized photo guidance for each mode.</p></div></div>
            </div>
            <div className={`scell ${openScells[3] ? "open" : ""}`} onClick={() => toggleScell(3)}>
              <div className="lbl">Multimodal Visual Teacher</div>
              <h4>Amazon Nova Lite</h4>
              <div className="dr"><div><p>State-of-the-art vision reasoning cross-checks predictions, handles open-world edge cases, and provides accurate phenological stage classification.</p></div></div>
            </div>
            <div className={`scell ${openScells[4] ? "open" : ""}`} onClick={() => toggleScell(4)}>
              <div className="lbl">Regional Languages</div>
              <h4>English • தமிழ் • हिन्दी</h4>
              <div className="dr"><div><p>Instant dynamic translation of verdicts, symptoms, treatment steps, water schedules, and fertilizer advisories into regional Indic languages via Groq LLM.</p></div></div>
            </div>
            <div className={`scell ${openScells[5] ? "open" : ""}`} onClick={() => toggleScell(5)}>
              <div className="lbl">Visual Explainability</div>
              <h4>Grad-CAM Heatmaps</h4>
              <div className="dr"><div><p>Provides transparent visual proof by highlighting leaf lesion hot-spots in red and amber, giving farmers confidence in every prediction.</p></div></div>
            </div>
            <div className={`scell ${openScells[6] ? "open" : ""}`} onClick={() => toggleScell(6)}>
              <div className="lbl">Active Learning Staging</div>
              <h4>Admin Staging &amp; Retraining</h4>
              <div className="dr"><div><p>High-confidence diagnoses are automatically staged in an admin queue for agronomist review, fostering ongoing dataset expansion and model fine-tuning.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="f-in">
          <div>
            <b>AgroLens</b> — Intelligent Crop Disease &amp; Stage Detection Application
            <div style={{ fontSize: "0.8rem", color: "rgba(244,241,226,0.6)", marginTop: "6px" }}>
              Protecting Rice, Sugarcane, Cotton, Corn, Groundnut, Cassava, Sorghum &amp; Coconut
            </div>
          </div>
          <div className="f-links">
            <Link to="/dashboard">Open Scanner</Link>
            <Link to="/history">History &amp; Profile</Link>
            <Link to="/login">Farmer Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
