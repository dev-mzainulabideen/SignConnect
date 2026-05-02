<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SignConnect README</title>
<style>
  :root {
    --primary: #6366F1;
    --accent: #10B981;
    --bg: #0B1120;
    --surface: #111827;
    --surface2: #1a2235;
    --text: #E5E7EB;
    --text-muted: #9CA3AF;
    --border: rgba(99,102,241,0.25);
    --glow: rgba(99,102,241,0.15);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    font-size: 15px;
  }

  /* HERO */
  .hero {
    position: relative;
    text-align: center;
    padding: 72px 40px 60px;
    overflow: hidden;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%);
    border-bottom: 1px solid var(--border);
  }

  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366F1' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    pointer-events: none;
  }

  .badge-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 28px;
    animation: fadeUp 0.6s ease both;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    border: 1px solid;
  }
  .badge-indigo { background: rgba(99,102,241,0.15); color: #a5b4fc; border-color: rgba(99,102,241,0.35); }
  .badge-green  { background: rgba(16,185,129,0.12); color: #6ee7b7; border-color: rgba(16,185,129,0.3); }
  .badge-purple { background: rgba(167,139,250,0.12); color: #c4b5fd; border-color: rgba(167,139,250,0.3); }
  .badge-blue   { background: rgba(59,130,246,0.12); color: #93c5fd; border-color: rgba(59,130,246,0.3); }
  .badge-amber  { background: rgba(245,158,11,0.12); color: #fcd34d; border-color: rgba(245,158,11,0.3); }

  .app-icon {
    width: 88px;
    height: 88px;
    margin: 0 auto 24px;
    border-radius: 24px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    box-shadow: 0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15);
    animation: iconPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.1s;
  }

  @keyframes iconPop {
    from { transform: scale(0.5); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  .hero-title {
    font-size: 52px;
    font-weight: 800;
    letter-spacing: -1.5px;
    background: linear-gradient(135deg, #E5E7EB 0%, #ffffff 40%, #c7d2fe 70%, #a5b4fc 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: fadeUp 0.6s ease both 0.2s;
    margin-bottom: 6px;
  }

  .hero-subtitle {
    font-size: 18px;
    color: var(--text-muted);
    font-weight: 400;
    animation: fadeUp 0.6s ease both 0.35s;
    margin-bottom: 32px;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
  }

  .hero-subtitle span {
    color: #a5b4fc;
    font-weight: 600;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* STAT STRIP */
  .stat-strip {
    display: flex;
    justify-content: center;
    gap: 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    animation: fadeUp 0.6s ease both 0.5s;
  }

  .stat-item {
    flex: 1;
    max-width: 180px;
    text-align: center;
    padding: 20px 16px;
    border-right: 1px solid var(--border);
  }
  .stat-item:last-child { border-right: none; }

  .stat-num {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    display: block;
    letter-spacing: -0.5px;
  }
  .stat-num .accent { color: #a5b4fc; }
  .stat-label {
    font-size: 11.5px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
    margin-top: 2px;
    display: block;
  }

  /* SECTIONS */
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 32px;
  }

  section { padding: 52px 0; border-bottom: 1px solid var(--border); }
  section:last-of-type { border-bottom: none; }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #6366F1;
    margin-bottom: 8px;
  }

  h2 {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }

  h3 {
    font-size: 17px;
    font-weight: 600;
    color: #e0e7ff;
    margin-bottom: 12px;
  }

  .section-desc {
    font-size: 15.5px;
    color: var(--text-muted);
    max-width: 640px;
    margin-bottom: 36px;
  }

  /* FEATURE GRID */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .feature-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 22px 20px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366F1, #8B5CF6);
    opacity: 0;
    transition: opacity 0.25s;
  }

  .feature-card:hover {
    border-color: rgba(99,102,241,0.5);
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(99,102,241,0.12);
  }

  .feature-card:hover::before { opacity: 1; }

  .feat-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 14px;
  }
  .fi-indigo { background: rgba(99,102,241,0.15); }
  .fi-green  { background: rgba(16,185,129,0.15); }
  .fi-purple { background: rgba(139,92,246,0.15); }
  .fi-blue   { background: rgba(59,130,246,0.15); }
  .fi-cyan   { background: rgba(6,182,212,0.15); }

  .feature-card h4 {
    font-size: 14px;
    font-weight: 600;
    color: #e0e7ff;
    margin-bottom: 6px;
  }

  .feature-card p {
    font-size: 13px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  /* TECH STACK */
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 12px;
  }

  .tech-chip {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    transition: border-color 0.2s, background 0.2s;
  }

  .tech-chip:hover { border-color: rgba(99,102,241,0.4); background: var(--surface2); }

  .chip-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dot-indigo { background: #6366F1; }
  .dot-green  { background: #10B981; }
  .dot-blue   { background: #3B82F6; }
  .dot-purple { background: #8B5CF6; }
  .dot-orange { background: #F59E0B; }
  .dot-red    { background: #EF4444; }
  .dot-cyan   { background: #06B6D4; }
  .dot-pink   { background: #EC4899; }

  /* FLOW DIAGRAM */
  .flow {
    display: flex;
    align-items: center;
    gap: 0;
    flex-wrap: wrap;
    margin: 24px 0;
  }

  .flow-node {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
  }

  .flow-node.active {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.1);
    color: #a5b4fc;
  }

  .flow-arrow {
    color: var(--text-muted);
    font-size: 18px;
    padding: 0 10px;
    flex-shrink: 0;
  }

  /* CODE BLOCK */
  .code-block {
    background: #0d1117;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    font-family: 'Consolas', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.75;
    overflow-x: auto;
    position: relative;
  }

  .code-block .cb-label {
    font-family: 'Segoe UI', system-ui, sans-serif;
    position: absolute;
    top: 12px; right: 16px;
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .code-block .kw { color: #ff7b72; }
  .code-block .fn { color: #d2a8ff; }
  .code-block .str { color: #a5d6ff; }
  .code-block .cm { color: #8b949e; }
  .code-block .num { color: #f2cc60; }
  .code-block .ty { color: #79c0ff; }
  .code-block .norm { color: #c9d1d9; }
  .code-block .acc { color: #56d364; }

  /* DIRECTORY TREE */
  .dir-tree {
    background: #0d1117;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    font-family: 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.9;
    color: #c9d1d9;
    overflow-x: auto;
  }

  .dir-tree .folder { color: #56d364; font-weight: 600; }
  .dir-tree .file   { color: #a5d6ff; }
  .dir-tree .comment { color: #8b949e; }
  .dir-tree .important { color: #f2cc60; }

  /* ML PIPELINE */
  .pipeline {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
  }

  .pipe-step {
    padding: 22px 18px;
    border-right: 1px solid var(--border);
    position: relative;
    background: var(--surface);
    transition: background 0.2s;
  }

  .pipe-step:last-child { border-right: none; }
  .pipe-step:hover { background: var(--surface2); }

  .pipe-num {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #6366F1;
    margin-bottom: 8px;
  }

  .pipe-title {
    font-size: 14px;
    font-weight: 600;
    color: #e0e7ff;
    margin-bottom: 8px;
  }

  .pipe-detail {
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }

  /* PROGRESS / ACCURACY */
  .metric-row {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
  }

  .metric-label {
    font-size: 13px;
    color: var(--text-muted);
    min-width: 160px;
    font-weight: 500;
  }

  .metric-bar-wrap {
    flex: 1;
    height: 6px;
    background: rgba(255,255,255,0.07);
    border-radius: 3px;
    overflow: hidden;
  }

  .metric-bar {
    height: 100%;
    border-radius: 3px;
    animation: growBar 1.2s cubic-bezier(0.34, 1.1, 0.64, 1) both;
  }

  @keyframes growBar {
    from { width: 0; }
  }

  .bar-green  { background: linear-gradient(90deg, #10B981, #6EE7B7); }
  .bar-indigo { background: linear-gradient(90deg, #6366F1, #a5b4fc); }
  .bar-blue   { background: linear-gradient(90deg, #3B82F6, #93c5fd); }

  .metric-val {
    font-size: 13px;
    font-weight: 600;
    color: #e0e7ff;
    min-width: 40px;
    text-align: right;
  }

  /* CONTRIBUTOR */
  .author-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 24px;
    max-width: 400px;
  }

  .author-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }

  .author-name { font-size: 18px; font-weight: 700; color: #fff; }
  .author-role { font-size: 13px; color: var(--text-muted); margin-top: 3px; }
  .author-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }

  .a-tag {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 20px;
    background: rgba(99,102,241,0.15);
    color: #a5b4fc;
    border: 1px solid rgba(99,102,241,0.25);
    font-weight: 600;
  }

  /* ROADMAP */
  .roadmap-list { list-style: none; }
  .roadmap-list li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    font-size: 14px;
    color: var(--text-muted);
  }
  .roadmap-list li:last-child { border-bottom: none; }

  .rm-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .rm-done { background: #10B981; }
  .rm-todo { background: var(--text-muted); opacity: 0.4; }
  .rm-progress { background: #F59E0B; }

  .rm-done-text { color: var(--text); }

  /* FOOTER */
  .footer {
    text-align: center;
    padding: 48px 40px;
    border-top: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 13.5px;
  }

  .footer .footer-title {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .footer-links {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 20px;
  }

  .footer-links a {
    color: #6366F1;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
  }

  .footer-links a:hover { color: #a5b4fc; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* GLOW ACCENT */
  .glow-text { color: #a5b4fc; font-weight: 600; }

  /* RESPONSIVE */
  @media (max-width: 700px) {
    .hero-title { font-size: 36px; }
    .pipeline { grid-template-columns: 1fr 1fr; }
    .stat-strip { flex-wrap: wrap; }
    .container { padding: 0 16px; }
  }
</style>
</head>
<body>

<!-- HERO -->
<div class="hero">
  <div class="badge-row">
    <span class="badge badge-indigo">⚡ React Native 0.81</span>
    <span class="badge badge-green">✓ TypeScript</span>
    <span class="badge badge-purple">🤖 TensorFlow Lite</span>
    <span class="badge badge-blue">🔐 Firebase Auth</span>
    <span class="badge badge-amber">📱 Android &amp; iOS</span>
  </div>

  <div class="app-icon">🤟</div>

  <h1 class="hero-title">SignConnect</h1>
  <p class="hero-subtitle">
    Bridging communication between <span>sign language users</span> and the hearing community — powered by on-device AI.
  </p>

  <div class="badge-row" style="animation-delay: 0.45s">
    <span class="badge badge-green">94.2% Model Accuracy</span>
    <span class="badge badge-indigo">5 Translation Modes</span>
    <span class="badge badge-purple">ASL + PSL Support</span>
    <span class="badge badge-blue">~15ms Inference</span>
  </div>
</div>

<!-- STAT STRIP -->
<div class="stat-strip">
  <div class="stat-item">
    <span class="stat-num">15<span class="accent">+</span></span>
    <span class="stat-label">Screens</span>
  </div>
  <div class="stat-item">
    <span class="stat-num">5</span>
    <span class="stat-label">Translation Modes</span>
  </div>
  <div class="stat-item">
    <span class="stat-num">26</span>
    <span class="stat-label">Letters (A–Z)</span>
  </div>
  <div class="stat-item">
    <span class="stat-num">40<span class="accent">+</span></span>
    <span class="stat-label">Dependencies</span>
  </div>
  <div class="stat-item">
    <span class="stat-num">94<span class="accent">%</span></span>
    <span class="stat-label">Accuracy</span>
  </div>
</div>

<!-- FEATURES -->
<section>
  <div class="container">
    <div class="section-label">Core Features</div>
    <h2>Five Translation Modes</h2>
    <p class="section-desc">Bidirectional communication across ASL and PSL with real-time AI inference running entirely on-device.</p>

    <div class="feature-grid">
      <div class="feature-card">
        <div class="feat-icon fi-indigo">👁️</div>
        <h4>Sign → Text</h4>
        <p>Camera-based real-time recognition converts hand gestures to text with confidence scoring.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon fi-green">🔊</div>
        <h4>Sign → Voice</h4>
        <p>Gesture recognition feeds into TTS for spoken audio output with waveform visualization.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon fi-purple">📝</div>
        <h4>Text → Sign</h4>
        <p>Input any text and get back a word-by-word sign language video demonstration.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon fi-blue">🎙️</div>
        <h4>Voice → Sign</h4>
        <p>Speak into the app for real-time speech transcription followed by sign video output.</p>
      </div>
      <div class="feature-card">
        <div class="feat-icon fi-cyan">🔄</div>
        <h4>Sign → Sign</h4>
        <p>Bidirectional ASL ↔ PSL translation — bridges American and Pakistani sign languages.</p>
      </div>
    </div>
  </div>
</section>

<!-- TECH STACK -->
<section>
  <div class="container">
    <div class="section-label">Technology</div>
    <h2>Tech Stack</h2>
    <p class="section-desc">Built on a modern, production-grade foundation with cross-platform support and on-device ML inference.</p>

    <div class="tech-grid">
      <div class="tech-chip"><span class="chip-dot dot-indigo"></span>React Native 0.81</div>
      <div class="tech-chip"><span class="chip-dot dot-blue"></span>React 19.1</div>
      <div class="tech-chip"><span class="chip-dot dot-blue"></span>TypeScript 5.8</div>
      <div class="tech-chip"><span class="chip-dot dot-purple"></span>TensorFlow Lite</div>
      <div class="tech-chip"><span class="chip-dot dot-purple"></span>ONNX Runtime</div>
      <div class="tech-chip"><span class="chip-dot dot-orange"></span>Firebase Auth</div>
      <div class="tech-chip"><span class="chip-dot dot-orange"></span>Firebase Firestore</div>
      <div class="tech-chip"><span class="chip-dot dot-green"></span>Google Sign-In</div>
      <div class="tech-chip"><span class="chip-dot dot-red"></span>Vision Camera</div>
      <div class="tech-chip"><span class="chip-dot dot-cyan"></span>React Navigation</div>
      <div class="tech-chip"><span class="chip-dot dot-indigo"></span>Reanimated 3</div>
      <div class="tech-chip"><span class="chip-dot dot-pink"></span>Lottie RN</div>
      <div class="tech-chip"><span class="chip-dot dot-green"></span>AsyncStorage</div>
      <div class="tech-chip"><span class="chip-dot dot-blue"></span>react-native-tts</div>
      <div class="tech-chip"><span class="chip-dot dot-orange"></span>react-native-svg</div>
      <div class="tech-chip"><span class="chip-dot dot-purple"></span>react-native-video</div>
    </div>
  </div>
</section>

<!-- AI / ML PIPELINE -->
<section>
  <div class="container">
    <div class="section-label">AI / ML</div>
    <h2>Inference Pipeline</h2>
    <p class="section-desc">A four-stage hybrid pipeline combining MediaPipe landmarks, skeleton rasterization, TFLite inference, and rule-based refinement.</p>

    <div class="pipeline">
      <div class="pipe-step">
        <div class="pipe-num">Step 01</div>
        <div class="pipe-title">Landmark Detection</div>
        <div class="pipe-detail">MediaPipe extracts 21 hand keypoints (x, y) normalized to 0–1 range.</div>
      </div>
      <div class="pipe-step">
        <div class="pipe-num">Step 02</div>
        <div class="pipe-title">Rasterization</div>
        <div class="pipe-detail">Skeleton converted to 400×400 grayscale image — green lines, white background.</div>
      </div>
      <div class="pipe-step">
        <div class="pipe-num">Step 03</div>
        <div class="pipe-title">TFLite Inference</div>
        <div class="pipe-detail">sign_model.tflite produces probability distribution over 26 letters in ~15ms.</div>
      </div>
      <div class="pipe-step">
        <div class="pipe-num">Step 04</div>
        <div class="pipe-title">Rule Refinement</div>
        <div class="pipe-detail">Hardcoded patterns for A–E boost accuracy — hybrid output returned.</div>
      </div>
    </div>

    <div style="margin-top: 36px;">
      <h3>Model Performance</h3>
      <div class="metric-row">
        <span class="metric-label">Overall Accuracy</span>
        <div class="metric-bar-wrap"><div class="metric-bar bar-green" style="width: 94.2%;"></div></div>
        <span class="metric-val">94.2%</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Inference Speed</span>
        <div class="metric-bar-wrap"><div class="metric-bar bar-indigo" style="width: 98%;"></div></div>
        <span class="metric-val">~15ms</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Letter Coverage</span>
        <div class="metric-bar-wrap"><div class="metric-bar bar-blue" style="width: 100%;"></div></div>
        <span class="metric-val">A–Z</span>
      </div>
    </div>
  </div>
</section>

<!-- PROJECT STRUCTURE -->
<section>
  <div class="container">
    <div class="section-label">Architecture</div>
    <h2>Project Structure</h2>
    <p class="section-desc">Clean modular separation across screens, services, AI logic, components, and platform-specific native code.</p>

    <div class="dir-tree">
<span class="folder">SignConnect/</span>
├── <span class="important">App.tsx</span>              <span class="comment"># Entry point &amp; screen router</span>
├── <span class="folder">src/</span>
│   ├── <span class="folder">screens/</span>           <span class="comment"># 15 screen components</span>
│   │   ├── <span class="file">SplashScreen.tsx</span>
│   │   ├── <span class="file">LoginScreen.tsx</span>
│   │   ├── <span class="file">MainAppScreen.tsx</span>   <span class="comment"># 3-tab dashboard</span>
│   │   ├── <span class="file">SignToTextScreen.tsx</span>
│   │   ├── <span class="file">TextToSignScreen.tsx</span>
│   │   └── <span class="file">...10 more screens</span>
│   ├── <span class="folder">lib/ai/</span>            <span class="comment"># Classification engine</span>
│   │   ├── <span class="important">signClassifier.ts</span>
│   │   ├── <span class="file">rules.ts</span>
│   │   └── <span class="folder">landmarkRules/</span>     <span class="comment"># A.ts B.ts C.ts...</span>
│   ├── <span class="folder">services/</span>          <span class="comment"># Business logic</span>
│   │   ├── <span class="file">HistoryService.ts</span>
│   │   ├── <span class="file">TFLiteModelIntegration.ts</span>
│   │   └── <span class="file">SpellCheckService.ts</span>
│   ├── <span class="folder">components/</span>        <span class="comment"># Reusable UI</span>
│   ├── <span class="folder">theme/</span>             <span class="comment"># Light/Dark theming</span>
│   └── <span class="folder">assets/models/</span>     <span class="comment"># sign_model.tflite (2.3MB)</span>
├── <span class="folder">android/</span>               <span class="comment"># Gradle + Firebase config</span>
├── <span class="folder">ios/</span>                   <span class="comment"># CocoaPods + Swift</span>
└── <span class="folder">ASL/</span>                   <span class="comment"># Python training scripts</span>
    </div>
  </div>
</section>

<!-- QUICK START -->
<section>
  <div class="container">
    <div class="section-label">Setup</div>
    <h2>Quick Start</h2>
    <p class="section-desc">Clone, install, and run in under 5 minutes. Requires Node.js 18+ and React Native CLI.</p>

    <div class="code-block">
      <span class="cb-label">bash</span>
<span class="cm"># 1. Clone the repository</span>
<span class="kw">git</span> <span class="fn">clone</span> <span class="str">https://github.com/zain/SignConnect.git</span>
<span class="kw">cd</span> <span class="norm">SignConnect</span>

<span class="cm"># 2. Install dependencies</span>
<span class="kw">npm</span> <span class="fn">install</span>

<span class="cm"># 3. iOS — install pods</span>
<span class="kw">cd</span> <span class="norm">ios &amp;&amp;</span> <span class="fn">pod install</span> <span class="kw">&amp;&amp; cd</span> <span class="norm">..</span>

<span class="cm"># 4. Run on Android</span>
<span class="kw">npm</span> <span class="fn">run</span> <span class="str">android</span>

<span class="cm"># 5. Run on iOS</span>
<span class="kw">npm</span> <span class="fn">run</span> <span class="str">ios</span>

<span class="cm"># 6. Run tests</span>
<span class="kw">npm</span> <span class="fn">test</span>
    </div>
  </div>
</section>

<!-- APP FLOW -->
<section>
  <div class="container">
    <div class="section-label">Navigation</div>
    <h2>App Flow</h2>
    <p class="section-desc">From splash screen to translation — authentication gates and tab-based navigation with animated overlay screens.</p>

    <h3 style="margin-bottom: 10px; font-size: 14px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Launch Sequence</h3>
    <div class="flow" style="margin-bottom: 24px;">
      <div class="flow-node active">SplashScreen</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node">Auth Check</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node active">GetStarted</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node">Login / Signup</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node active">MainApp</div>
    </div>

    <h3 style="margin-bottom: 10px; font-size: 14px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Translation Flow</h3>
    <div class="flow">
      <div class="flow-node">Select Mode</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node active">Camera / Input</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node">AI Processing</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node active">Result</div>
      <div class="flow-arrow">→</div>
      <div class="flow-node">Save to History</div>
    </div>
  </div>
</section>

<!-- DESIGN SYSTEM -->
<section>
  <div class="container">
    <div class="section-label">Design System</div>
    <h2>UI & Theming</h2>
    <p class="section-desc">Light and dark themes with a full design token system — consistent spacing, typography, and color palettes.</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h3>Color Tokens</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #6366F1;"></div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text);">Primary</div>
              <div style="font-size: 12px; color: var(--text-muted);">#6366F1 Indigo</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #10B981;"></div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text);">Accent</div>
              <div style="font-size: 12px; color: var(--text-muted);">#10B981 Emerald</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2);"></div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text);">Gradient</div>
              <div style="font-size: 12px; color: var(--text-muted);">#667eea → #764ba2</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #0B1220;"></div>
            <div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text);">Dark BG</div>
              <div style="font-size: 12px; color: var(--text-muted);">#0B1220</div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3>Typography Scale</h3>
        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div><span style="font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px;">H1 — 28px / 800</span></div>
          <div><span style="font-size: 18px; font-weight: 700; color: #e0e7ff;">H2 — 22px / 700</span></div>
          <div><span style="font-size: 15px; font-weight: 600; color: #c7d2fe;">H3 — 18px / 600</span></div>
          <div><span style="font-size: 14px; font-weight: 500; color: var(--text);">Body — 16px / 500</span></div>
          <div><span style="font-size: 13px; font-weight: 400; color: var(--text-muted);">Caption — 12px / 500</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ROADMAP -->
<section>
  <div class="container">
    <div class="section-label">Roadmap</div>
    <h2>What's Next</h2>
    <p class="section-desc">Planned enhancements across model accuracy, language support, and infrastructure.</p>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
      <div>
        <h3>In Progress</h3>
        <ul class="roadmap-list">
          <li><span class="rm-dot rm-done"></span><span class="rm-done-text">Email / Password Auth</span></li>
          <li><span class="rm-dot rm-done"></span><span class="rm-done-text">Google OAuth Sign-In</span></li>
          <li><span class="rm-dot rm-done"></span><span class="rm-done-text">TFLite Model (A–Z)</span></li>
          <li><span class="rm-dot rm-done"></span><span class="rm-done-text">Translation History</span></li>
          <li><span class="rm-dot rm-done"></span><span class="rm-done-text">Dark / Light Theme</span></li>
          <li><span class="rm-dot rm-progress"></span>Sentence-level recognition</li>
          <li><span class="rm-dot rm-progress"></span>Multi-hand detection</li>
        </ul>
      </div>
      <div>
        <h3>Planned</h3>
        <ul class="roadmap-list">
          <li><span class="rm-dot rm-todo"></span>BSL &amp; ISL language support</li>
          <li><span class="rm-dot rm-todo"></span>Cloud history sync</li>
          <li><span class="rm-dot rm-todo"></span>Offline ML models</li>
          <li><span class="rm-dot rm-todo"></span>Custom vocabulary training</li>
          <li><span class="rm-dot rm-todo"></span>Social sharing &amp; community</li>
          <li><span class="rm-dot rm-todo"></span>CI/CD pipeline</li>
          <li><span class="rm-dot rm-todo"></span>Crash reporting &amp; analytics</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- AUTHOR -->
<section>
  <div class="container">
    <div class="section-label">Author</div>
    <h2>Built by</h2>

    <div class="author-card">
      <div class="author-avatar">Z</div>
      <div>
        <div class="author-name">Zain</div>
        <div class="author-role">React Native · AI/ML · Firebase</div>
        <div class="author-stack">
          <span class="a-tag">React Native</span>
          <span class="a-tag">TypeScript</span>
          <span class="a-tag">TFLite</span>
          <span class="a-tag">Firebase</span>
          <span class="a-tag">Python</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-title">🤟 SignConnect v0.0.1</div>
  <p>React Native 0.81 &nbsp;·&nbsp; TypeScript &nbsp;·&nbsp; TensorFlow Lite &nbsp;·&nbsp; Firebase</p>
  <p style="margin-top: 6px; font-size: 12.5px; color: #4b5563;">Built with care to bridge the communication gap — one gesture at a time.</p>
  <div class="footer-links">
    <a href="#">Documentation</a>
    <a href="#">Changelog</a>
    <a href="#">Issues</a>
    <a href="#">License</a>
  </div>
</div>

</body>
</html>
