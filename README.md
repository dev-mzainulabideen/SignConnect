<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=200&section=header&text=SignConnect&fontSize=60&fontColor=ffffff&fontAlignY=35&desc=Sign%20Language%20%E2%86%94%20Text%20%7C%20Voice%20%7C%20AI-Powered&descAlignY=55&descSize=18&animation=fadeIn" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&pause=1000&color=6366F1&center=true&vCenter=true&width=600&lines=🤟+Real-time+Sign+Language+Recognition;ASL+%26+PSL+Translation+%E2%86%94+Text+%2F+Voice;On-Device+AI+%7C+TensorFlow+Lite+%7C+~15ms" alt="Typing SVG" />

<br/><br/>

[![React Native](https://img.shields.io/badge/React_Native-0.81.0-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=0d1117)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0d1117)](https://typescriptlang.org)
[![TensorFlow](https://img.shields.io/badge/TFLite-On--Device_AI-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white&labelColor=0d1117)](https://tensorflow.org/lite)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_+_DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=white&labelColor=0d1117)](https://firebase.google.com)

[![Android](https://img.shields.io/badge/Android-Supported-3DDC84?style=for-the-badge&logo=android&logoColor=white&labelColor=0d1117)](https://developer.android.com)
[![iOS](https://img.shields.io/badge/iOS-Supported-000000?style=for-the-badge&logo=apple&logoColor=white&labelColor=0d1117)](https://developer.apple.com)
[![License](https://img.shields.io/badge/License-MIT-A855F7?style=for-the-badge&labelColor=0d1117)](LICENSE)

<br/>

![Accuracy](https://img.shields.io/badge/Model_Accuracy-94.2%25-10B981?style=flat-square&labelColor=0d1117)
![Speed](https://img.shields.io/badge/Inference_Speed-~15ms-6366F1?style=flat-square&labelColor=0d1117)
![Signs](https://img.shields.io/badge/ASL_Signs-A--Z_(26)-8B5CF6?style=flat-square&labelColor=0d1117)
![Screens](https://img.shields.io/badge/Screens-15+-3B82F6?style=flat-square&labelColor=0d1117)
![Modes](https://img.shields.io/badge/Translation_Modes-5-F59E0B?style=flat-square&labelColor=0d1117)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [AI & ML Pipeline](#-ai--ml-pipeline)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [App Flow](#-app-flow)
- [Design System](#-design-system)
- [Roadmap](#-roadmap)
- [Known Issues](#-known-issues)
- [Author](#-author)

---

## 🎯 Overview

**SignConnect** is a production-ready React Native app that bridges communication between **sign language users** and the hearing community through five real-time AI translation modes. All inference runs **entirely on-device** via TensorFlow Lite — no internet required for core features.

> *"Breaking barriers, one gesture at a time."*

<div align="center">

| 🎯 Accuracy | ⚡ Speed | 🔤 Coverage | 🌐 Languages | 📱 Platforms |
|:-----------:|:--------:|:-----------:|:------------:|:------------:|
| **94.2%** | **~15ms** | **A – Z** | **ASL + PSL** | **Android + iOS** |

</div>

---

## ✨ Features

<div align="center">

| Mode | Input | Output | Description |
|------|-------|--------|-------------|
| 👁️ **Sign → Text** | Camera | Text | Real-time gesture-to-text with confidence scoring |
| 🔊 **Sign → Voice** | Camera | Audio | Live sign recognition + TTS with waveform UI |
| 📝 **Text → Sign** | Text | Video | Word-by-word sign language video demonstrations |
| 🎙️ **Voice → Sign** | Microphone | Video | Speech transcription → sign language video |
| 🔄 **Sign → Sign** | Camera | Video | Bidirectional **ASL ↔ PSL** translation |

</div>

### Additional Highlights

- 🔐 **Authentication** — Email/Password + Google OAuth via Firebase
- 📚 **History** — Full translation log with favorites & filtering
- 🌗 **Theming** — Smooth Light / Dark mode with persisted preference
- 🏃 **Animations** — 60fps native animations via Reanimated 3
- 📴 **Offline Core** — TFLite inference works without internet
- ♿ **Accessible** — WCAG-compliant contrast, 48px+ touch targets

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

| Package | Version | Role |
|---------|---------|------|
| `react-native` | 0.81.0 | Cross-platform mobile framework |
| `react` | 19.1.0 | UI rendering |
| `typescript` | 5.8.3 | Type-safe development |
| `react-native-reanimated` | latest | Native-driver 60fps animations |
| `@react-navigation/native` | latest | Stack + bottom-tab navigation |
| `react-native-vision-camera` | latest | Real-time camera frames |
| `lottie-react-native` | latest | Micro-animation support |

### AI / ML

| Package | Role |
|---------|------|
| TensorFlow Lite | On-device model inference (2.3MB model) |
| ONNX Runtime | Alternative ML runtime |
| MediaPipe | 21-point hand landmark detection |
| Custom Classifier | Rule-based hybrid refinement engine |

### Backend & Data

| Service | Role |
|---------|------|
| Firebase Auth | Email/Password + Google OAuth |
| Firebase Firestore | Cloud database |
| AsyncStorage | Local history & theme persistence |
| react-native-tts | Text-to-speech output |

</div>

---

## 🧠 AI / ML Pipeline

```
Camera Frame
     │
     ▼
┌─────────────────┐
│  STEP 1         │  MediaPipe extracts 21 hand keypoints
│  Landmark       │  (x, y) normalized to 0 to 1 range
│  Detection      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  STEP 2         │  Skeleton rendered to 400x400 grayscale
│  Rasterization  │  Green lines on white background
│                 │  (matches training data distribution)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  STEP 3         │  sign_model.tflite inference
│  TFLite         │  26-class probability distribution
│  Inference      │  ~15ms per frame
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  STEP 4         │  Hardcoded rules boost A-E accuracy
│  Rule           │  refineGroupToLetter() post-processing
│  Refinement     │  Hybrid final output returned
└─────────────────┘
```

### Classification Interface

```typescript
interface SignClassifier {
  init(modelAsset: string): Promise<boolean>;
  inferImage(flatInput: number[]): Promise<number[]>;
  inferImageChunked(
    chunk1: number[],
    chunk2: number[],
    chunk3: number[]
  ): Promise<number[]>;
}
```

### Model Stats

| Property | Value |
|----------|-------|
| Model file | `sign_model.tflite` |
| Model size | 2.3 MB |
| Input shape | 400 × 400 × 1 (grayscale) |
| Output classes | 26 (A–Z) |
| Accuracy | 94.2% |
| Inference time | ~15ms |
| Runtime | TensorFlow Lite + ONNX fallback |

---

## 📁 Project Structure

```
SignConnect/
├── App.tsx                        # Entry point & screen router
├── package.json
├── tsconfig.json
│
├── src/
│   ├── screens/                   # 15 screen components
│   │   ├── SplashScreen.tsx
│   │   ├── GetStartedScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── MainAppScreen.tsx      # 3-tab dashboard
│   │   ├── SignToTextScreen.tsx
│   │   ├── SignToVoiceScreen.tsx
│   │   ├── TextToSignScreen.tsx
│   │   ├── VoiceToSignScreen.tsx
│   │   ├── SignToSignScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── HandLandmarks.tsx
│   │
│   ├── lib/ai/                    # Classification engine
│   │   ├── signClassifier.ts
│   │   ├── rules.ts
│   │   ├── thresholdCalibration.ts
│   │   └── landmarkRules/         # Per-letter rules (A-E)
│   │       ├── A.ts
│   │       ├── B.ts
│   │       └── mapping.ts
│   │
│   ├── services/                  # Business logic
│   │   ├── HistoryService.ts
│   │   ├── TFLiteModelIntegration.ts
│   │   ├── SpellCheckService.ts
│   │   ├── WordSuggestionService.ts
│   │   └── ThemeService.ts
│   │
│   ├── components/                # Reusable UI
│   │   ├── AppBottomNav.tsx
│   │   ├── ASL/                   # A-Z + 1-10 images
│   │   ├── ASL-Words/             # 22 ASL word videos
│   │   └── PSL-Words/             # 7 PSL word videos
│   │
│   ├── theme/
│   │   └── ThemeContext.tsx
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── HandTypes.ts
│   │   ├── ModelTypes.ts
│   │   └── WordTypes.ts
│   │
│   └── assets/
│       └── models/
│           ├── sign_model.tflite  # 2.3MB TFLite model
│           ├── label_map.json
│           └── model_metadata.json
│
├── android/                       # Gradle + google-services.json
├── ios/                           # CocoaPods + Swift
│
└── ASL/                           # Python ML training
    ├── train_model.py
    ├── extract_keypoints.py
    ├── realtime_prediction.py
    └── sign_model.h5
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android)
- Xcode 14+ (for iOS, macOS only)
- JDK 17

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/SignConnect.git
cd SignConnect

# 2. Install JS dependencies
npm install

# 3. iOS only — install CocoaPods
cd ios && pod install && cd ..
```

### Running

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run tests
npm test

# Build release APK
cd android && ./gradlew assembleRelease
```

### Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** and **Google Sign-In** under Authentication
3. Download `google-services.json` and place it in `android/app/`
4. Add your Web Client ID to `src/config/firebase.ts`

---

## 🔄 App Flow

```
App Launch
    │
    ▼
SplashScreen (8s animated)
    │
    ▼
Auth State Check
    │
    ├── Authenticated ──────────────────► MainAppScreen
    │                                          │
    ▼                               ┌──────────┼──────────┐
GetStartedScreen               Translate    History    Profile
    │                             Tab          Tab        Tab
    ├── LoginScreen                 │
    │   ├── Email / Password        ▼
    │   ├── Google Sign-In    Feature Screens
    │   └── Forgot Password   (overlay animations)
    │
    └── SignupScreen
        ├── Email / Password
        └── Google Sign-In
```

---

## 🎨 Design System

### Color Palette

<div align="center">

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| **Primary** | `#6366F1` Indigo | `#6366F1` Indigo |
| **Accent** | `#10B981` Emerald | `#10B981` Emerald |
| **Background** | `#F8FAFC` | `#0B1220` |
| **Surface** | `#FFFFFF` | `#111827` |
| **Text Primary** | `#1E293B` | `#E5E7EB` |
| **Text Secondary** | `#64748B` | `#9CA3AF` |
| **Gradient** | `#667eea → #764ba2` | `#667eea → #764ba2` |

</div>

### Typography

| Style | Size | Weight |
|-------|------|--------|
| H1 | 28px | 800 |
| H2 | 22px | 700 |
| H3 | 18px | 600 |
| Body | 16px | 500 |
| Button | 16px | 600 |
| Caption | 12px | 500 |

### Spacing Scale

```
XS=4px   SM=8px   MD=16px   LG=24px   XL=32px   XXL=40px
```

---

## 🗺️ Roadmap

### Completed

- [x] Email / Password Authentication
- [x] Google OAuth Sign-In
- [x] TFLite Sign Recognition — A to Z (94.2% accuracy)
- [x] Sign to Text real-time recognition
- [x] Sign to Voice with TTS output
- [x] Text to Sign video lookup
- [x] Voice to Sign speech transcription
- [x] ASL to PSL bidirectional translation
- [x] Translation history with favorites
- [x] Dark / Light theme with persistence
- [x] Cross-platform Android + iOS support

### In Progress

- [ ] Sentence-level recognition (beyond letter-by-letter)
- [ ] Multi-hand simultaneous detection

### Planned

- [ ] British Sign Language (BSL) support
- [ ] Indian Sign Language (ISL) support
- [ ] Cloud history sync via Firestore
- [ ] Full offline mode for all ML models
- [ ] Custom vocabulary training by users
- [ ] Social sharing and community features
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Analytics and crash reporting
- [ ] A/B testing framework

---

## ⚠️ Known Issues

| Issue | Status | Notes |
|-------|--------|-------|
| Letter-only recognition | In Progress | No full-word or sentence recognition yet |
| Low-end device lag | Known | Some lag on devices with less than 4GB RAM |
| Limited sign vocabulary | Planned | 22 ASL words and 7 PSL words in current library |
| Auth requires network | By Design | Firebase authentication needs internet |

---

## 🧪 Testing

```bash
npm test                      # Run all tests
npm test -- --coverage        # With coverage report
npm test -- --watchAll        # Watch mode
```

| Test File | Coverage Area |
|-----------|---------------|
| `App.test.tsx` | App routing and state |
| `LoginScreen.test.tsx` | Authentication flows |
| `HistoryService.test.ts` | Data persistence |
| `SpellCheckService.test.ts` | Text processing |
| `ThemeService.test.ts` | Theme management |

---

## 👤 Author

<div align="center">

**Zain**

*React Native · AI/ML · Computer Vision · Firebase*

[![GitHub](https://img.shields.io/badge/GitHub-@zain-181717?style=for-the-badge&logo=github&labelColor=0d1117)](https://github.com)

`React Native` · `TypeScript` · `TensorFlow Lite` · `Firebase` · `Python` · `MediaPipe`

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6366F1&height=120&section=footer&text=SignConnect+v0.0.1&fontSize=24&fontColor=ffffff&fontAlignY=65" width="100%"/>

*Built with ❤️ to bridge the communication gap — one gesture at a time.*

</div>
