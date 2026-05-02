<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=200&section=header&text=SignConnect&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Bridging%20Sign%20Language%20%26%20the%20World%20Through%20AI&descAlignY=58&descAlign=50"/>

<br/>

<p align="center">
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-0.81.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Auth_%26_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black"/></a>
  <a href="https://www.tensorflow.org/lite"><img src="https://img.shields.io/badge/TFLite-On--Device_ML-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-black?style=flat-square&logo=android"/>
  <img src="https://img.shields.io/badge/ML_Accuracy-94.2%25-brightgreen?style=flat-square"/>
  <img src="https://img.shields.io/badge/Inference-~15ms-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/Languages-ASL%20%7C%20PSL-purple?style=flat-square"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-orange?style=flat-square"/>
</p>

<br/>

<p align="center">
  <b>SignConnect</b> is a production-grade React Native app enabling <b>real-time, bidirectional translation</b><br/>
  between sign language (ASL/PSL) and text/voice — powered entirely by <b>on-device AI/ML</b>.
</p>

<br/>

<p align="center">
  <a href="#-overview">Overview</a> &nbsp;•&nbsp;
  <a href="#-features">Features</a> &nbsp;•&nbsp;
  <a href="#-architecture">Architecture</a> &nbsp;•&nbsp;
  <a href="#-ml-pipeline">ML Pipeline</a> &nbsp;•&nbsp;
  <a href="#-getting-started">Getting Started</a> &nbsp;•&nbsp;
  <a href="#-roadmap">Roadmap</a>
</p>

</div>

<br/>

---

## 📌 Overview

<table>
<tr>
<td>

Over **70 million** deaf and hard-of-hearing people worldwide rely on sign language as their primary mode of communication — yet tools to bridge that gap with the hearing world remain deeply limited.

**SignConnect** changes that. It brings together:

- 🧠 **On-device AI** — No cloud dependency. TFLite inference at ~15ms per frame
- 📷 **Computer Vision** — Real-time hand landmark detection and skeleton rasterization
- 🌐 **Bidirectional Translation** — ASL ↔ PSL, Sign ↔ Text, Sign ↔ Voice
- 🔐 **Secure Auth** — Firebase Email/Password + Google OAuth
- 💾 **Persistent History** — Full translation log with favorites and statistics

</td>
<td width="38%">

```
┌──────────────────────────┐
│     SignConnect v0.1     │
│                          │
│  ┌────────┐  ┌────────┐  │
│  │  ASL   │↔ │  PSL   │  │
│  │  🤟   │  │  🤙   │  │
│  └────────┘  └────────┘  │
│                          │
│  Sign  ──→  Text/Voice   │
│  Text  ──→  Sign/Video   │
│  Voice ──→  Sign/Video   │
│                          │
│  ⚡ 15ms · 94.2% · 2.3MB │
└──────────────────────────┘
```

</td>
</tr>
</table>

<br/>

---

## ✨ Features

<div align="center">

| | Feature | Description | Status |
|:---:|:---|:---|:---:|
| 🤟 | **Sign → Text** | Real-time camera gesture recognition → readable text | ✅ Live |
| 🔊 | **Sign → Voice** | Gesture recognition → text → spoken audio via TTS | ✅ Live |
| ✍️ | **Text → Sign** | Text input → word-by-word sign language video | ✅ Live |
| 🎤 | **Voice → Sign** | Speech recognition → sign language video output | ✅ Live |
| 🔄 | **ASL ↔ PSL** | Bidirectional cross-dialect sign language translation | ✅ Live |
| 📜 | **History** | Full translation log with filters, favorites, stats | ✅ Live |
| 🌗 | **Theming** | Light / Dark mode with persistent preference | ✅ Live |
| 👤 | **Profile** | Edit name, email, password, photo, delete account | ✅ Live |

</div>

<br/>

<details>
<summary><b>🤟 Sign → Text — Real-time Gesture Recognition</b></summary>
<br/>

- Camera feed via `react-native-vision-camera`
- MediaPipe-style hand landmark extraction (21 keypoints)
- Skeleton rasterized to 400×400 grayscale image
- TFLite inference over 26 ASL/PSL letter classes
- Confidence score overlay with live letter display
- Auto-saves entry to translation history

</details>

<details>
<summary><b>🔊 Sign → Voice — Gesture to Speech</b></summary>
<br/>

- Built on the Sign → Text pipeline
- Recognized text passed to `react-native-tts` engine
- Editable text before playback
- Playback speed control
- Waveform audio visualization

</details>

<details>
<summary><b>✍️ Text → Sign — Word-by-Word Video</b></summary>
<br/>

- Text tokenized word-by-word
- Each word mapped to curated ASL/PSL video library
- 22 ASL + 7 PSL word videos bundled in-app
- Smooth sequential video playback
- Falls back to letter-spelling for unknown words

</details>

<details>
<summary><b>🔄 ASL ↔ PSL — Cross-Dialect Translation</b></summary>
<br/>

- First-of-its-kind bidirectional ASL ↔ PSL support
- Source dialect recognized by on-device model
- Target dialect rendered as video output in real time
- Full pipeline processing without network requests

</details>

<br/>

---

## 🏗️ Architecture

```
╔══════════════════════════════════════════════════════════════════════════╗
║                          SignConnect App                                 ║
╠═══════════════════╦══════════════════════════╦═══════════════════════════╣
║  🔐 Auth Layer    ║  📱 Feature Screens       ║  🧠 AI / ML Core          ║
║                   ║                           ║                           ║
║  Firebase Auth    ║  ┌── SignToText           ║  ① Landmark Detection     ║
║  Email + Pass     ║  ├── SignToVoice          ║          ↓                ║
║  Google OAuth     ║  ├── TextToSign    ───────╬──  ② Feature Extraction   ║
║                   ║  ├── VoiceToSign          ║          ↓                ║
║  Profile Mgmt     ║  └── SignToSign           ║  ③ TFLite Inference       ║
╠═══════════════════╩══════════════════════════╣          ↓                ║
║  💾 Data Layer                               ║  ④ Rule Refinement        ║
║  AsyncStorage  ·  Firestore  ·  History Svc  ║          ↓                ║
║  (theme · prefs · 200-entry translation log) ║  ⑤ Letter + Confidence    ║
╚══════════════════════════════════════════════╩═══════════════════════════╝
```

### 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Version |
|:---|:---|:---:|
| **Framework** | React Native | `0.81.0` |
| **UI Library** | React | `19.1.0` |
| **Language** | TypeScript (strict mode) | `5.8.3` |
| **Navigation** | React Navigation — Stack + Bottom Tabs | `^7.x` |
| **Authentication** | Firebase Auth + Google Sign-In | latest |
| **Database** | Cloud Firestore + AsyncStorage | latest |
| **ML Runtime** | TensorFlow Lite + ONNX Runtime | latest |
| **Camera** | react-native-vision-camera | latest |
| **Animations** | react-native-reanimated (native driver) | `^3.x` |
| **TTS Engine** | react-native-tts | latest |
| **Icons** | react-native-vector-icons | latest |
| **Effects** | @react-native-community/blur + Lottie | latest |

</div>

<br/>

---

## 🧠 ML Pipeline

A **4-stage hybrid inference pipeline** combining model-based and rule-based approaches for maximum accuracy with minimal latency.

```
  📷 Camera Frame
         │
         ▼
  ┌─────────────────────────────────────────────────┐
  │  STAGE 1 — Hand Landmark Detection              │
  │  · MediaPipe-style tracking on every frame      │
  │  · 21 keypoints extracted (x, y coordinates)   │
  │  · Coordinates normalized to [0.0 – 1.0]       │
  └───────────────────────┬─────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────┐
  │  STAGE 2 — Feature Extraction                   │
  │  · Skeleton rendered as green lines on white    │
  │  · Rasterized to 400 × 400 grayscale bitmap     │
  │  · Matches exact training distribution          │
  └───────────────────────┬─────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────┐
  │  STAGE 3 — TFLite Inference                     │
  │  · sign_model.tflite — 2.3 MB on-device model   │
  │  · Outputs 26-class probability distribution    │
  │  · ~15ms per inference on mid-range hardware    │
  └───────────────────────┬─────────────────────────┘
                          │
                          ▼
  ┌─────────────────────────────────────────────────┐
  │  STAGE 4 — Rule Refinement                      │
  │  · Hardcoded disambiguation for A, B, C, D, E   │
  │  · mapLandmarksToLetter() post-processing       │
  │  · Confidence gating + temporal smoothing       │
  └───────────────────────┬─────────────────────────┘
                          │
                          ▼
          ✅  Classified Letter + Confidence Score
```

<div align="center">

| Metric | Value |
|:---|:---:|
| 🗜️ Model Size | **2.3 MB** |
| ⚡ Inference Speed | **~15 ms / frame** |
| 🎯 Accuracy | **~94.2%** |
| 🔡 Output Classes | **26 (A–Z)** |
| 📐 Input Shape | **400 × 400 grayscale** |
| 🏃 Execution | **On-device — no network** |

</div>

<br/>

---

## 📁 Project Structure

<details>
<summary><b>Click to expand full directory tree</b></summary>

```
SignConnect/
│
├── 📄 App.tsx                           # Root entry point & screen router
├── 📦 package.json
├── 🔧 tsconfig.json                     # Strict TypeScript config
│
├── 📂 src/
│   │
│   ├── 📂 screens/                      # 12 screen components
│   │   ├── SplashScreen.tsx             # 8s animated launch screen
│   │   ├── GetStartedScreen.tsx         # Onboarding / welcome
│   │   ├── LoginScreen.tsx              # Email + Google auth
│   │   ├── SignupScreen.tsx             # New user registration
│   │   ├── MainAppScreen.tsx            # 3-tab dashboard hub
│   │   ├── SignToTextScreen.tsx         # 🤟 → 📝
│   │   ├── SignToVoiceScreen.tsx        # 🤟 → 🔊
│   │   ├── TextToSignScreen.tsx         # 📝 → 🤟
│   │   ├── VoiceToSignScreen.tsx        # 🎤 → 🤟
│   │   ├── SignToSignScreen.tsx         # ASL ↔ PSL
│   │   ├── HistoryScreen.tsx            # Translation log
│   │   └── HandLandmarks.tsx            # Debug landmark visualizer
│   │
│   ├── 📂 components/
│   │   ├── AppBottomNav.tsx             # Custom animated tab bar
│   │   ├── HandLandmarkRenderer.tsx
│   │   ├── HandLandmarkVisualizer.tsx
│   │   ├── ASL/                         # A–Z + 0–10 static images
│   │   ├── ASL-Words/                   # 22 ASL vocabulary videos
│   │   └── PSL-Words/                   # 7 PSL vocabulary videos
│   │
│   ├── 📂 lib/ai/                       # ML classification engine
│   │   ├── signClassifier.ts            # Main inference orchestrator
│   │   ├── rules.ts                     # Post-processing ruleset
│   │   ├── thresholdCalibration.ts
│   │   └── landmarkRules/
│   │       ├── A.ts  B.ts  C.ts  D.ts  E.ts
│   │       └── mapping.ts               # Landmark-to-letter mapping
│   │
│   ├── 📂 services/
│   │   ├── HistoryService.ts            # CRUD + stats (200-entry log)
│   │   ├── TFLiteModelIntegration.ts    # Native model bridge
│   │   ├── SpellCheckService.ts
│   │   ├── WordSuggestionService.ts
│   │   └── VideoASLPredictionService.ts
│   │
│   ├── 📂 theme/
│   │   └── ThemeContext.tsx             # Light / Dark mode provider
│   │
│   ├── 📂 types/                        # TypeScript interfaces
│   │   ├── auth.ts
│   │   ├── HandTypes.ts
│   │   ├── ModelTypes.ts
│   │   └── WordTypes.ts
│   │
│   ├── 📂 data/                         # Static JSON datasets
│   └── 📂 assets/
│       └── models/
│           ├── sign_model.tflite        # 2.3 MB TFLite model
│           ├── label_map.json           # A–Z index mapping
│           └── model_metadata.json
│
├── 📂 android/                          # Gradle + Firebase config
├── 📂 ios/                              # CocoaPods + Xcode project
│
└── 📂 ASL/                              # Python ML training pipeline
    ├── train_model.py
    ├── extract_keypoints.py
    ├── realtime_prediction.py
    ├── sign_model.h5                    # Keras source model
    └── keypoints_data/                  # 35 .npy training files
```

</details>

<br/>

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version |
|:---|:---|
| Node.js | `≥ 18` |
| React Native CLI | latest |
| Android Studio | Hedgehog+ |
| Xcode | 15+ *(macOS only)* |
| JDK | 17 |

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-username/signconnect.git
cd signconnect

# 2. Install JS dependencies
npm install

# 3. iOS only — install CocoaPods
cd ios && pod install && cd ..
```

### Firebase Setup

```bash
# Android — place in android/app/
cp path/to/google-services.json android/app/google-services.json

# iOS — place in ios/MyFirstReactNativeApp/
cp path/to/GoogleService-Info.plist ios/MyFirstReactNativeApp/GoogleService-Info.plist
```

> 📖 Full walkthrough: [Firebase & Google Sign-In Setup](docs/GOOGLE_SIGNIN_SETUP.md)

### Running

```bash
# Terminal 1 — Start Metro bundler
npm start

# Terminal 2 — Android
npm run android

# Terminal 2 — iOS
npm run ios
```

### Production Build

```bash
# Android — generates signed APK
cd android
./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk

# iOS — Xcode > Product > Archive > Distribute App
```

> 📖 Full walkthrough: [Release APK Guide](docs/RELEASE_APK_GUIDE.md)

<br/>

---

## 🔐 Authentication & Security

```
User
 │
 ├── Email / Password ──► Firebase Auth ──► JWT Token ──► Secure Storage
 │
 └── Google Sign-In ───► OAuth 2.0 ──► ID Token ──► Firebase Auth
                                                           │
                                                 Profile Management
                                           (name · email · photo · password)
```

**Security hardening:**
- Password policy: 8+ chars, uppercase, lowercase, number, symbol
- Re-authentication enforced for email/password updates
- Secure token storage — no plaintext credentials persisted
- Auto-refresh session management via Firebase SDK

<br/>

---

## 📊 Data Model

```typescript
interface HistoryEntry {
  id: string;
  userId: string;
  timestamp: number;

  mode: 'sign_to_text' | 'text_to_sign' | 'voice_to_sign' | 'sign_to_voice';
  language: 'ASL' | 'PSL';

  input: {
    type: 'text' | 'voice' | 'video' | 'image';
    value: string;
    uri?: string;
  };
  output: {
    type: 'text' | 'video';
    value: string;
    uri?: any;
  };

  confidence?: number;  // 0.0 – 1.0 model confidence
  favorite: boolean;
}
```

**Available operations:** `getAll` · `add` · `deleteOne` · `clearAll` · `toggleFavorite` · `getStats`

**Storage:** AsyncStorage — up to **200 entries** per user, zero network required

<br/>

---

## 🎨 Design System

<div align="center">

### Color Palette

| Token | Light Mode | Dark Mode |
|:---|:---|:---|
| `primary` | `#6366F1` — Indigo | `#6366F1` — Indigo |
| `accent` | `#10B981` — Emerald | `#10B981` — Emerald |
| `background` | `#F8FAFC` — Snow | `#0B1220` — Abyss |
| `surface` | `#FFFFFF` — White | `#111827` — Graphite |
| `text-primary` | `#1E293B` — Slate | `#E5E7EB` — Mist |
| `text-secondary` | `#64748B` — Dusk | `#9CA3AF` — Fog |
| `gradient` | `#667eea → #764ba2` | — |

### Spacing Scale

```
 XS     SM     MD     LG     XL    XXL
 4px    8px   16px   24px   32px   40px
```

### Typography

| Role | Size | Weight |
|:---|:---:|:---:|
| H1 Display | 28px | 800 |
| H2 Title | 22px | 700 |
| H3 Subtitle | 18px | 600 |
| Body | 16px | 500 |
| Button | 16px | 600 |
| Caption | 12px | 500 |

</div>

All animations use `react-native-reanimated` with the **native driver** — smooth 60fps guaranteed on both platforms.

<br/>

---

## 🧪 Testing

```bash
npm test                       # Run full test suite
npm test -- --coverage         # With coverage report
npm test -- --watchAll=false   # CI mode
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

---

## 🗺️ Roadmap

<div align="center">

| Priority | Feature | Status |
|:---:|:---|:---:|
| 🔴 | Sentence-level continuous recognition | 🔲 Planned |
| 🔴 | Multi-hand detection support | 🔲 Planned |
| 🟠 | Additional languages — BSL, ISL, AUSLAN | 🔲 Planned |
| 🟠 | Full offline ML model support | 🔲 Planned |
| 🟠 | Cloud sync for translation history | 🔲 Planned |
| 🟡 | Community vocabulary contributions | 🔲 Planned |
| 🟡 | Push model accuracy beyond 96% | 🔲 Planned |
| 🟡 | CI/CD pipeline + crash analytics | 🔲 Planned |
| 🟡 | WCAG 2.1 AA full accessibility audit | 🔲 Planned |

</div>

<br/>

---

## 📚 Documentation

| Document | Description |
|:---|:---|
| [`SIGN_TO_TEXT_README.md`](docs/SIGN_TO_TEXT_README.md) | Feature deep-dive — Sign → Text |
| [`SIGN_TO_VOICE_README.md`](docs/SIGN_TO_VOICE_README.md) | Feature deep-dive — Sign → Voice |
| [`PROFILE_SCREEN_DOCUMENTATION.md`](docs/PROFILE_SCREEN_DOCUMENTATION.md) | Profile & settings reference |
| [`GOOGLE_SIGNIN_SETUP.md`](docs/GOOGLE_SIGNIN_SETUP.md) | Firebase + Google OAuth setup guide |
| [`RELEASE_APK_GUIDE.md`](docs/RELEASE_APK_GUIDE.md) | Android release build walkthrough |
| [`THEME_IMPLEMENTATION_STATUS.md`](docs/THEME_IMPLEMENTATION_STATUS.md) | Theming system notes |

<br/>

---

## 🤝 Contributing

All contributions are welcome — from bug reports to new features!

```bash
# 1. Fork and clone
git clone https://github.com/your-username/signconnect.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Commit using Conventional Commits
git commit -m 'feat: add sentence-level recognition'

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

### Commit Convention

| Prefix | Purpose |
|:---|:---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code restructure, no feature change |
| `test:` | Adding or updating tests |
| `chore:` | Build process or tooling |

Please open an issue first for major changes so we can discuss the approach.

<br/>

---

## 📜 License

Distributed under the **MIT License** — see [`LICENSE`](LICENSE) for full terms.

<br/>

---

<div align="center">

<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=120&section=footer"/>

**Crafted with 🤟 by [Zain](https://github.com/your-username)**

*"Communication is a human right — let's make it universal."*

<br/>

<p>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/-React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB"/></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white"/></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black"/></a>
  <a href="https://www.tensorflow.org/lite"><img src="https://img.shields.io/badge/-TFLite-FF6F00?style=flat-square&logo=tensorflow&logoColor=white"/></a>
  <a href="https://github.com/your-username/signconnect/stargazers"><img src="https://img.shields.io/badge/⭐_Star_this_repo-6366F1?style=flat-square"/></a>
</p>

<br/>

<sub>© 2025 SignConnect · Built for the 70 million+ sign language users worldwide</sub>

</div>
