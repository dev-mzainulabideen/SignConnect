<div align="center">

<!-- ══════════════════════════════════════════════════════════════ -->
<!--          ANIMATED HEADER — works everywhere                   -->
<!-- ══════════════════════════════════════════════════════════════ -->

<img src="./header.svg" width="100%" alt="SignConnect — Bridging Sign Language & the World Through AI"/>

<br/>

<!-- ═══ TECH BADGES ═══ -->
<p align="center">
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-0.81.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB&labelColor=0d1117"/></a>&nbsp;
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0d1117"/></a>&nbsp;
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Auth_%26_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black&labelColor=0d1117"/></a>&nbsp;
  <a href="https://www.tensorflow.org/lite"><img src="https://img.shields.io/badge/TensorFlow_Lite-On--Device-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white&labelColor=0d1117"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-6366F1?style=for-the-badge&logo=android&logoColor=white&labelColor=0d1117"/>
  <img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge&labelColor=0d1117"/>
</p>

<br/>

<!-- ═══ STAT PILLS ═══ -->
<p align="center">
  <img src="https://img.shields.io/badge/🎯_ML_Accuracy-94.2%25-brightgreen?style=flat-square"/>
  &nbsp;
  <img src="https://img.shields.io/badge/⚡_Inference-~15ms-3b82f6?style=flat-square"/>
  &nbsp;
  <img src="https://img.shields.io/badge/🗜️_Model_Size-2.3_MB-f59e0b?style=flat-square"/>
  &nbsp;
  <img src="https://img.shields.io/badge/🌐_Languages-ASL_%7C_PSL-8b5cf6?style=flat-square"/>
  &nbsp;
  <img src="https://img.shields.io/badge/🤝_PRs-Welcome-10b981?style=flat-square"/>
</p>

<br/>

<!-- ═══ HERO DESCRIPTION ═══ -->

> ### 🤟 *Real-time. On-device. Bidirectional.*
> **SignConnect** is a production-grade React Native application that enables instant, two-way translation between **ASL / PSL** sign language and **text / voice** — powered entirely by on-device AI with no cloud dependency.

<br/>

<!-- ═══ NAVIGATION ═══ -->
<p align="center">
  <a href="#-overview"><kbd>📌 Overview</kbd></a>
  &nbsp;
  <a href="#-features"><kbd>✨ Features</kbd></a>
  &nbsp;
  <a href="#-architecture"><kbd>🏗️ Architecture</kbd></a>
  &nbsp;
  <a href="#-ml-pipeline"><kbd>🧠 ML Pipeline</kbd></a>
  &nbsp;
  <a href="#-getting-started"><kbd>🚀 Quick Start</kbd></a>
  &nbsp;
  <a href="#-roadmap"><kbd>🗺️ Roadmap</kbd></a>
</p>

</div>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░   SECTION: OVERVIEW   ░░░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

## 📌 Overview

<table>
<tr>
<td>

Over **70 million** deaf and hard-of-hearing people rely on sign language as their primary mode of communication — yet tools to bridge that gap with the hearing world remain deeply limited.

**SignConnect** changes that by combining:

- 🧠 **On-Device AI** — TFLite inference at ~15ms, zero network required
- 📷 **Computer Vision** — Real-time 21-point hand landmark detection
- 🔄 **Bidirectional** — ASL ↔ PSL, Sign ↔ Text, Sign ↔ Voice
- 🔐 **Secure Auth** — Firebase Email/Password + Google OAuth 2.0
- 💾 **Local History** — 200-entry translation log with favorites & stats
- 🎨 **Polished UX** — 60fps animations, Light/Dark theme, custom navigation

</td>
<td width="35%" align="center">

```
┌──────────────────────────┐
│     SignConnect v0.1     │
│  ━━━━━━━━━━━━━━━━━━━━━━  │
│  🤟  Sign  →  Text       │
│  🔊  Sign  →  Voice      │
│  ✍️  Text  →  Sign       │
│  🎤  Voice →  Sign       │
│  🔄  ASL   ↔  PSL        │
│  ━━━━━━━━━━━━━━━━━━━━━━  │
│  ⚡ 15ms · 94.2% · 2.3MB │
└──────────────────────────┘
```

</td>
</tr>
</table>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░   SECTION: FEATURES   ░░░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## ✨ Features

<div align="center">

```
╭──────────────────────┬──────────────────────────────────────────────────╮
│  🤟  Sign → Text     │  Camera → Landmarks → TFLite → Text Output       │
│  🔊  Sign → Voice    │  Camera → Landmarks → TFLite → TTS Engine        │
│  ✍️  Text → Sign     │  Text Input → Video Library Lookup → Playback    │
│  🎤  Voice → Sign    │  Microphone → Speech-to-Text → Video Playback    │
│  🔄  ASL ↔ PSL       │  Source Dialect → Translate → Target Video       │
╰──────────────────────┴──────────────────────────────────────────────────╯
```

</div>

<br/>

<table>
<tr>
<td width="50%" valign="top">

### 🤟 Sign → Text
> *Camera to readable text in real time*

- Live gesture capture via `react-native-vision-camera`
- 21-point MediaPipe-style hand landmark extraction
- Skeleton rasterized to 400×400 grayscale input
- TFLite inference across 26 ASL/PSL letter classes
- Confidence score shown live on-screen
- Entry auto-saved to translation history

</td>
<td width="50%" valign="top">

### 🔊 Sign → Voice
> *Gestures converted directly to speech*

- Built on Sign → Text pipeline output
- Recognized text fed to `react-native-tts`
- User can edit text before speaking
- Playback speed control (0.5× → 2.0×)
- Real-time waveform visualization overlay

</td>
</tr>
<tr>
<td width="50%" valign="top">

### ✍️ Text → Sign
> *Word-by-word sign language video output*

- Text tokenized and matched word-by-word
- 22 ASL + 7 PSL curated video clips bundled
- Sequential video playback with transitions
- Falls back to finger-spelling for unknown words

</td>
<td width="50%" valign="top">

### 🎤 Voice → Sign
> *Speech recognized and shown as sign*

- Native microphone recording with permission flow
- Speech-to-text transcription in real time
- Transcribed words mapped to sign video library
- Visual transcript shown alongside video output

</td>
</tr>
<tr>
<td colspan="2" valign="top">

### 🔄 ASL ↔ PSL Cross-Dialect Translation
> *A first-of-its-kind bidirectional bridge*

Source dialect recognized via on-device model → semantically mapped → rendered in target dialect video. Processes entirely on-device with no API calls.

</td>
</tr>
</table>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░   SECTION: ARCHITECTURE   ░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         S I G N C O N N E C T                           │
│                                                                         │
│  ┌──────────────────┐  ┌─────────────────────────┐  ┌────────────────┐  │
│  │  🔐  AUTH LAYER  │  │   📱  FEATURE SCREENS    │  │  🧠  AI CORE   │  │
│  │                  │  │                         │  │                │  │
│  │  Firebase Auth   │  │  ┌─ SignToText           │  │  ① Landmark    │  │
│  │  Email/Password  │  │  ├─ SignToVoice          │  │    Detection   │  │
│  │  Google OAuth    │  │  ├─ TextToSign  ─────────┼──►       ↓       │  │
│  │                  │  │  ├─ VoiceToSign          │  │  ② Feature     │  │
│  │  • Update Name   │  │  └─ SignToSign           │  │    Extraction  │  │
│  │  • Update Email  │  │                         │  │       ↓        │  │
│  │  • Change Pass   │  │  ┌─ MainAppScreen        │  │  ③ TFLite      │  │
│  │  • Update Photo  │  │  ├─ HistoryScreen        │  │    Inference   │  │
│  └──────────────────┘  │  └─ HandLandmarks        │  │       ↓        │  │
│                        └─────────────────────────┘  │  ④ Rule        │  │
│  ┌──────────────────────────────────────────────┐    │    Refinement  │  │
│  │              💾  DATA LAYER                  │    │       ↓        │  │
│  │  AsyncStorage · Firestore · HistoryService   │    │  ✅ Letter +   │  │
│  │  theme · prefs · 200-entry translation log   │    │    Confidence  │  │
│  └──────────────────────────────────────────────┘    └────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

<br/>

### 🛠️ Full Tech Stack

<div align="center">

| Layer | Technology | Version |
|:---|:---|:---:|
| 📱 **Framework** | React Native | `0.81.0` |
| ⚛️ **UI Library** | React | `19.1.0` |
| 🔷 **Language** | TypeScript — strict mode | `5.8.3` |
| 🧭 **Navigation** | React Navigation (Stack + Bottom Tabs) | `^7.x` |
| 🔐 **Auth** | Firebase Auth + Google Sign-In | latest |
| 🗄️ **Database** | Cloud Firestore + AsyncStorage | latest |
| 🤖 **ML Runtime** | TensorFlow Lite + ONNX Runtime | latest |
| 📷 **Camera** | react-native-vision-camera | latest |
| 🎞️ **Animations** | react-native-reanimated (native driver) | `^3.x` |
| 🔊 **TTS** | react-native-tts | latest |
| 🎨 **Icons** | react-native-vector-icons | latest |
| 🌟 **FX** | Lottie + @react-native-community/blur | latest |

</div>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░   SECTION: ML PIPELINE   ░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🧠 ML Pipeline

> A **4-stage hybrid inference pipeline** — combining neural model output with deterministic rules for maximum accuracy and sub-20ms latency.

```
  ┌──────────────────────────────────────────────────────────┐
  │                   📷  CAMERA FRAME                       │
  │                 (60fps live capture)                     │
  └─────────────────────────┬────────────────────────────────┘
                            │
                            ▼
  ╔══════════════════════════════════════════════════════════╗
  ║  STAGE 1 ·· HAND LANDMARK DETECTION                     ║
  ║                                                         ║
  ║  · MediaPipe-style tracking on every frame              ║
  ║  · Extracts 21 keypoints  (x, y coordinates)            ║
  ║  · Normalizes all coords  →  [0.0 – 1.0] range          ║
  ╚═════════════════════════╤═══════════════════════════════╝
                            │
                            ▼
  ╔══════════════════════════════════════════════════════════╗
  ║  STAGE 2 ·· FEATURE EXTRACTION                          ║
  ║                                                         ║
  ║  · Skeleton drawn as green lines on white background    ║
  ║  · Rasterized to  400 × 400  grayscale bitmap           ║
  ║  · Exact match to training-time data distribution       ║
  ╚═════════════════════════╤═══════════════════════════════╝
                            │
                            ▼
  ╔══════════════════════════════════════════════════════════╗
  ║  STAGE 3 ·· TFLITE INFERENCE                            ║
  ║                                                         ║
  ║  · sign_model.tflite  —  2.3 MB on-device model         ║
  ║  · 26-class probability output  (A – Z)                 ║
  ║  · ~15ms per inference on mid-range hardware            ║
  ╚═════════════════════════╤═══════════════════════════════╝
                            │
                            ▼
  ╔══════════════════════════════════════════════════════════╗
  ║  STAGE 4 ·· RULE REFINEMENT                             ║
  ║                                                         ║
  ║  · Hardcoded disambiguation  (A, B, C, D, E)            ║
  ║  · mapLandmarksToLetter()  post-processing pass         ║
  ║  · Confidence gating  +  temporal smoothing             ║
  ╚═════════════════════════╤═══════════════════════════════╝
                            │
                            ▼
  ┌──────────────────────────────────────────────────────────┐
  │        ✅  Classified Letter  +  Confidence Score        │
  └──────────────────────────────────────────────────────────┘
```

<div align="center">

| Metric | Value |
|:---|:---:|
| 🗜️ **Model Size** | `2.3 MB` |
| ⚡ **Inference Speed** | `~15 ms / frame` |
| 🎯 **Accuracy** | `~94.2%` |
| 🔡 **Output Classes** | `26  (A – Z)` |
| 📐 **Input Shape** | `400 × 400 grayscale` |
| 🏃 **Execution** | `On-device — zero network` |

</div>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░   SECTION: PROJECT STRUCTURE  ░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 📁 Project Structure

<details>
<summary><b>🗂️ &nbsp; Click to expand the full directory tree</b></summary>

<br/>

```
SignConnect/
│
├── 📄  App.tsx                          ← Root entry point & screen router
├── 📦  package.json
├── 🔧  tsconfig.json                    ← Strict TypeScript config
│
├── 📂  src/
│   │
│   ├── 📂  screens/                     ← 12 screen components
│   │   ├── SplashScreen.tsx             ← 8s animated launch
│   │   ├── GetStartedScreen.tsx         ← Onboarding / welcome
│   │   ├── LoginScreen.tsx              ← Email + Google auth
│   │   ├── SignupScreen.tsx             ← New user registration
│   │   ├── MainAppScreen.tsx            ← 3-tab dashboard hub
│   │   ├── SignToTextScreen.tsx         ← 🤟 → 📝
│   │   ├── SignToVoiceScreen.tsx        ← 🤟 → 🔊
│   │   ├── TextToSignScreen.tsx         ← 📝 → 🤟
│   │   ├── VoiceToSignScreen.tsx        ← 🎤 → 🤟
│   │   ├── SignToSignScreen.tsx         ← ASL ↔ PSL
│   │   ├── HistoryScreen.tsx            ← Translation log
│   │   └── HandLandmarks.tsx            ← Debug landmark visualizer
│   │
│   ├── 📂  components/
│   │   ├── AppBottomNav.tsx             ← Custom animated tab bar
│   │   ├── HandLandmarkRenderer.tsx
│   │   ├── ASL/                         ← A–Z + 0–10 static images
│   │   ├── ASL-Words/                   ← 22 ASL vocabulary videos
│   │   └── PSL-Words/                   ← 7 PSL vocabulary videos
│   │
│   ├── 📂  lib/ai/                      ← ML classification engine
│   │   ├── signClassifier.ts            ← Main inference orchestrator
│   │   ├── rules.ts                     ← Post-processing ruleset
│   │   ├── thresholdCalibration.ts
│   │   └── landmarkRules/
│   │       ├── A.ts · B.ts · C.ts · D.ts · E.ts
│   │       └── mapping.ts               ← Landmark-to-letter map
│   │
│   ├── 📂  services/
│   │   ├── HistoryService.ts            ← CRUD + stats (200 entries)
│   │   ├── TFLiteModelIntegration.ts    ← Native model bridge
│   │   ├── SpellCheckService.ts
│   │   ├── WordSuggestionService.ts
│   │   └── VideoASLPredictionService.ts
│   │
│   ├── 📂  theme/
│   │   └── ThemeContext.tsx             ← Light / Dark mode provider
│   │
│   ├── 📂  types/
│   │   ├── auth.ts · HandTypes.ts · ModelTypes.ts · WordTypes.ts
│   │
│   └── 📂  assets/
│       └── models/
│           ├── sign_model.tflite        ← 2.3 MB TFLite model
│           ├── label_map.json           ← A–Z index mapping
│           └── model_metadata.json
│
├── 📂  android/                         ← Gradle + Firebase config
├── 📂  ios/                             ← CocoaPods + Xcode project
└── 📂  ASL/                             ← Python ML training pipeline
    ├── train_model.py
    ├── extract_keypoints.py
    ├── sign_model.h5                    ← Keras source model
    └── keypoints_data/                  ← 35 .npy training files
```

</details>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░   SECTION: GETTING STARTED   ░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🚀 Getting Started

### Prerequisites

<div align="center">

| Tool | Min Version | Notes |
|:---|:---:|:---|
| **Node.js** | `18+` | LTS recommended |
| **React Native CLI** | latest | `npm i -g react-native-cli` |
| **Android Studio** | Hedgehog+ | For Android builds |
| **Xcode** | `15+` | macOS only — for iOS builds |
| **JDK** | `17` | Required by Gradle |
| **CocoaPods** | `1.12+` | iOS dependency manager |

</div>

<br/>

### ⚡ Setup

```bash
# ── 1. Clone ────────────────────────────────────────────────────
git clone https://github.com/your-username/signconnect.git
cd signconnect

# ── 2. Install dependencies ─────────────────────────────────────
npm install

# ── 3. iOS pods (macOS only) ────────────────────────────────────
cd ios && pod install && cd ..

# ── 4. Firebase config ──────────────────────────────────────────
#   Android → android/app/google-services.json
#   iOS     → ios/MyFirstReactNativeApp/GoogleService-Info.plist
```

> 📖 Full setup guide: [GOOGLE_SIGNIN_SETUP.md](docs/GOOGLE_SIGNIN_SETUP.md)

### ▶️ Run

```bash
npm start           # Terminal 1 — Metro bundler
npm run android     # Terminal 2 — Android
npm run ios         # Terminal 2 — iOS
npm test            # Run test suite
```

### 📦 Production Build

```bash
# Android APK
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk

# iOS — Xcode → Product → Archive → Distribute App
```

> 📖 Full build guide: [RELEASE_APK_GUIDE.md](docs/RELEASE_APK_GUIDE.md)

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░   SECTION: AUTH & SECURITY   ░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🔐 Authentication & Security

```
  User
   │
   ├──► Email / Password ──► Firebase Auth ──► JWT Token ──► Secure Storage
   │
   └──► Google Sign-In ───► OAuth 2.0 ──────► ID Token  ──► Firebase Auth
                                                               │
                                                  ┌────────────▼───────────┐
                                                  │   Profile Management   │
                                                  │ name · email · photo   │
                                                  │ password · delete acct │
                                                  └────────────────────────┘
```

- 🔑 Password policy — 8+ chars, uppercase, lowercase, digit, symbol
- 🔁 Re-authentication enforced before email or password changes
- 🔒 JWT tokens stored securely — no plaintext credentials
- ♻️ Auto-refresh sessions via Firebase SDK token rotation

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░   SECTION: DATA MODEL   ░░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 📊 Data Model

```typescript
interface HistoryEntry {
  id:        string;
  userId:    string;
  timestamp: number;

  mode:     'sign_to_text' | 'text_to_sign' | 'voice_to_sign' | 'sign_to_voice';
  language: 'ASL' | 'PSL';

  input:  { type: 'text' | 'voice' | 'video' | 'image'; value: string; uri?: string; };
  output: { type: 'text' | 'video'; value: string; uri?: any; };

  confidence?: number;   // 0.0 – 1.0
  favorite:    boolean;
}
```

<div align="center">

| Operation | Description |
|:---|:---|
| `getAll(userId)` | Retrieve all entries for a user |
| `add(userId, entry)` | Append a new translation entry |
| `deleteOne(userId, id)` | Remove a specific entry |
| `clearAll(userId)` | Wipe the full history |
| `toggleFavorite(userId, id)` | Star / unstar an entry |
| `getStats(userId)` | Total · Favorites · By mode |

</div>

**Storage:** AsyncStorage — up to **200 entries** per user, fully offline

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░   SECTION: DESIGN SYSTEM   ░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🎨 Design System

<div align="center">

### Color Palette

| Token | Light | Dark | Hex |
|:---|:---|:---|:---:|
| `primary` | Indigo | Indigo | `#6366F1` |
| `accent` | Emerald | Emerald | `#10B981` |
| `background` | Snow | Abyss | `#F8FAFC` / `#0B1220` |
| `surface` | White | Graphite | `#FFFFFF` / `#111827` |
| `text-primary` | Slate | Mist | `#1E293B` / `#E5E7EB` |
| `text-secondary` | Dusk | Fog | `#64748B` / `#9CA3AF` |

### Spacing Scale

```
 ╭──────┬──────┬──────┬──────┬──────┬──────╮
 │  XS  │  SM  │  MD  │  LG  │  XL  │ XXL  │
 │  4px │  8px │ 16px │ 24px │ 32px │ 40px │
 ╰──────┴──────┴──────┴──────┴──────┴──────╯
```

### Typography

| Role | Size | Weight |
|:---|:---:|:---:|
| Display H1 | `28px` | `800` |
| Title H2 | `22px` | `700` |
| Subtitle H3 | `18px` | `600` |
| Body | `16px` | `500` |
| Button | `16px` | `600` |
| Caption | `12px` | `500` |

</div>

> All animations use `react-native-reanimated` with the **native driver** — consistent **60fps** on both platforms.

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░   SECTION: TESTING   ░░░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🧪 Testing

```bash
npm test                        # Full test suite
npm test -- --coverage          # With coverage report
npm test -- --watchAll=false    # CI mode
```

<div align="center">

| Test File | Area Covered |
|:---|:---|
| `App.test.tsx` | Root navigation & routing |
| `LoginScreen.test.tsx` | Auth flows — login, signup, reset |
| `HistoryService.test.ts` | CRUD operations & statistics |
| `SpellCheckService.test.ts` | Text correction pipeline |
| `ThemeService.test.ts` | Theme persistence & context |

</div>

**Stack:** Jest + React Native Testing Library + `@testing-library/jest-native`

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░░   SECTION: ROADMAP   ░░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🗺️ Roadmap

```
  v0.1  ████████████████████  ✅  Current Release
  v0.2  █████████░░░░░░░░░░░  🔲  Sentence Recognition + Multi-hand
  v0.3  ████░░░░░░░░░░░░░░░░  🔲  BSL / ISL / AUSLAN Support
  v0.4  ██░░░░░░░░░░░░░░░░░░  🔲  Cloud Sync + Full Offline
  v1.0  ░░░░░░░░░░░░░░░░░░░░  🔲  Community Features + 96%+ Accuracy
```

<div align="center">

| Priority | Feature | Milestone |
|:---:|:---|:---:|
| 🔴 | Sentence-level continuous recognition | v0.2 |
| 🔴 | Multi-hand detection support | v0.2 |
| 🟠 | Additional languages — BSL, ISL, AUSLAN | v0.3 |
| 🟠 | Full offline ML model support | v0.4 |
| 🟠 | Cloud sync for translation history | v0.4 |
| 🟡 | Community vocabulary contributions | v1.0 |
| 🟡 | Push model accuracy beyond 96% | v1.0 |
| 🟡 | CI/CD pipeline + crash analytics | v1.0 |

</div>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░   SECTION: DOCUMENTATION   ░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 📚 Documentation

<div align="center">

| Document | Description |
|:---|:---|
| [`SIGN_TO_TEXT_README.md`](docs/SIGN_TO_TEXT_README.md) | Feature deep-dive — Sign → Text |
| [`SIGN_TO_VOICE_README.md`](docs/SIGN_TO_VOICE_README.md) | Feature deep-dive — Sign → Voice |
| [`PROFILE_SCREEN_DOCUMENTATION.md`](docs/PROFILE_SCREEN_DOCUMENTATION.md) | Profile & settings reference |
| [`GOOGLE_SIGNIN_SETUP.md`](docs/GOOGLE_SIGNIN_SETUP.md) | Firebase + Google OAuth setup |
| [`RELEASE_APK_GUIDE.md`](docs/RELEASE_APK_GUIDE.md) | Android release build guide |
| [`THEME_IMPLEMENTATION_STATUS.md`](docs/THEME_IMPLEMENTATION_STATUS.md) | Theming system notes |

</div>

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░   SECTION: CONTRIBUTING   ░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

---

## 🤝 Contributing

```bash
git clone https://github.com/your-username/signconnect.git
git checkout -b feat/your-feature
git commit -m "feat: add your feature"
git push origin feat/your-feature
# → Open a Pull Request
```

<div align="center">

| Prefix | Use For |
|:---|:---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `refactor:` | Code restructure |
| `test:` | Tests |
| `chore:` | Tooling / build |

</div>

> Please open an **Issue** first for major changes before investing build time.

<br/>

---

## 📜 License

Distributed under the **MIT License** — see [`LICENSE`](LICENSE) for full terms.

<br/>

<!---------------------------------------------------------------------------->
<!--  ░░░░░░░░░░░░░░░░░░░░░░░░   FOOTER   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  -->
<!---------------------------------------------------------------------------->

<div align="center">

<img src="./footer.svg" width="100%" alt="SignConnect footer"/>

<p>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/-React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB"/></a>
  &nbsp;
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/></a>
  &nbsp;
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black"/></a>
  &nbsp;
  <a href="https://www.tensorflow.org/lite"><img src="https://img.shields.io/badge/-TFLite-FF6F00?style=flat-square&logo=tensorflow&logoColor=white"/></a>
  &nbsp;
  <a href="https://github.com/your-username/signconnect/stargazers"><img src="https://img.shields.io/badge/⭐_Star_this_repo-6366F1?style=flat-square"/></a>
</p>

</div>
