<div align="center">

<br/>

```
  ███████╗██╗ ██████╗ ███╗   ██╗ ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗
  ██╔════╝██║██╔════╝ ████╗  ██║██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝
  ███████╗██║██║  ███╗██╔██╗ ██║██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   
  ╚════██║██║██║   ██║██║╚██╗██║██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   
  ███████║██║╚██████╔╝██║ ╚████║╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   
  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   
```

**Bridging the Gap Between Sign Language and the World**

<br/>

[![React Native](https://img.shields.io/badge/React_Native-0.81.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TensorFlow Lite](https://img.shields.io/badge/TensorFlow_Lite-On--Device_ML-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)
[![License](https://img.shields.io/badge/License-MIT-6366F1?style=for-the-badge)](LICENSE)

<br/>

> **SignConnect** is a production-grade React Native mobile application that enables real-time, bidirectional translation between sign language (ASL/PSL) and text/voice — powered by on-device AI/ML.

<br/>

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [ML Pipeline](#-ml-pipeline) · [Roadmap](#-roadmap)

<br/>

---

</div>

<br/>

## 🌟 Why SignConnect?

Over **70 million** deaf people worldwide use sign language as their primary means of communication. Despite this, seamless tools for real-time translation remain scarce. SignConnect tackles this gap head-on — combining computer vision, on-device machine learning, and an intuitive mobile experience to make communication truly universal.

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤟 Sign → Text
Real-time camera-based hand gesture recognition that converts ASL/PSL signs into readable text using a trained TFLite model with **~94% accuracy**.

</td>
<td width="50%">

### 🔊 Sign → Voice
Gestures are recognized, converted to text, and then spoken aloud via TTS — enabling deaf users to communicate with non-signers effortlessly.

</td>
</tr>
<tr>
<td width="50%">

### ✍️ Text → Sign
Enter any text and receive a word-by-word sign language video demonstration drawn from a curated ASL/PSL video library.

</td>
<td width="50%">

### 🎤 Voice → Sign
Speak naturally and watch your words transform into sign language video output in real time.

</td>
</tr>
<tr>
<td colspan="2" align="center">

### 🔄 ASL ↔ PSL Translation
Full bidirectional translation between American Sign Language and Pakistani Sign Language — a first-of-its-kind feature.

</td>
</tr>
</table>

<br/>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SignConnect App                           │
├──────────────┬──────────────────────────────┬───────────────────┤
│  Auth Layer  │       Feature Screens         │   AI/ML Core      │
│              │                               │                   │
│  Firebase    │  SignToText  ─┐               │  Hand Landmark    │
│  Email/Pass  │  SignToVoice  ├── Shared UI   │  Detection        │
│  Google SSO  │  TextToSign  ─┤   Components  │       ↓           │
│              │  VoiceToSign  │               │  Feature Extraction│
│              │  SignToSign  ─┘               │       ↓           │
├──────────────┴──────────────────────────────┤  TFLite Inference │
│              Data Layer                      │       ↓           │
│  AsyncStorage (History, Prefs, Theme)        │  Rule Refinement  │
│  Firebase Firestore (Cloud Sync)             │       ↓           │
│  History Service (max 200 entries)           │  Classification   │
└──────────────────────────────────────────────┴───────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native 0.81.0 + React 19.1.0 |
| **Language** | TypeScript 5.8.3 (strict mode) |
| **Navigation** | React Navigation (Stack + Bottom Tabs) |
| **Authentication** | Firebase Auth + Google Sign-In |
| **Database** | Firebase Firestore + AsyncStorage |
| **ML Runtime** | TensorFlow Lite + ONNX Runtime |
| **Camera** | react-native-vision-camera |
| **Animations** | react-native-reanimated (native driver) |
| **TTS** | react-native-tts |

<br/>

## 📁 Project Structure

```
SignConnect/
├── App.tsx                         # Root entry point & navigator
├── src/
│   ├── screens/                    # 12 screen components
│   │   ├── SplashScreen.tsx
│   │   ├── GetStartedScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── MainAppScreen.tsx       # 3-tab dashboard
│   │   ├── SignToTextScreen.tsx
│   │   ├── SignToVoiceScreen.tsx
│   │   ├── TextToSignScreen.tsx
│   │   ├── VoiceToSignScreen.tsx
│   │   ├── SignToSignScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── HandLandmarks.tsx
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── AppBottomNav.tsx        # Custom animated navigation
│   │   ├── HandLandmarkRenderer.tsx
│   │   ├── ASL/                    # A–Z + 0–10 alphabet images
│   │   ├── ASL-Words/              # 22 ASL word videos
│   │   └── PSL-Words/              # 7 PSL word videos
│   │
│   ├── lib/ai/                     # ML classification engine
│   │   ├── signClassifier.ts       # Core classification logic
│   │   ├── rules.ts                # Post-processing rules
│   │   └── landmarkRules/          # Per-letter detection (A–E + mapping)
│   │
│   ├── services/                   # Business logic
│   │   ├── HistoryService.ts
│   │   ├── TFLiteModelIntegration.ts
│   │   ├── SpellCheckService.ts
│   │   └── WordSuggestionService.ts
│   │
│   ├── theme/                      # Light/Dark theming
│   │   └── ThemeContext.tsx
│   │
│   ├── types/                      # TypeScript interfaces
│   ├── data/                       # Static JSON datasets
│   └── assets/
│       └── models/
│           ├── sign_model.tflite   # 2.3MB on-device model
│           └── label_map.json      # A–Z label mappings
│
├── android/                        # Android native code
├── ios/                            # iOS native code
└── ASL/                            # Python ML training pipeline
    ├── train_model.py
    ├── extract_keypoints.py
    └── keypoints_data/             # 35 .npy training files
```

<br/>

## 🧠 ML Pipeline

SignConnect uses a **4-stage hybrid inference pipeline** that balances speed with accuracy:

```
Camera Frame
     │
     ▼
┌─────────────────────────┐
│  1. Landmark Detection  │  ← MediaPipe-style: 21 keypoints (x, y)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  2. Feature Extraction  │  ← Normalize → Rasterize → 400×400px skeleton
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  3. TFLite Inference    │  ← ~15ms per frame, 26-class output
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  4. Rule Refinement     │  ← Hardcoded rules for ambiguous signs
└────────────┬────────────┘
             │
             ▼
     Classified Letter
     + Confidence Score
```

| Metric | Value |
|---|---|
| **Model Size** | 2.3 MB |
| **Inference Time** | ~15ms |
| **Accuracy** | ~94.2% |
| **Classes** | 26 (A–Z) |
| **Input** | 400×400 grayscale skeleton image |

<br/>

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- React Native CLI
- Android Studio / Xcode
- Firebase project (see [setup guide](docs/GOOGLE_SIGNIN_SETUP.md))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/signconnect.git
cd signconnect

# 2. Install dependencies
npm install

# 3. iOS only — install pods
cd ios && pod install && cd ..

# 4. Add Firebase config
#    Android: place google-services.json in android/app/
#    iOS: place GoogleService-Info.plist in ios/MyFirstReactNativeApp/
```

### Running the App

```bash
# Start Metro bundler
npm start

# Android
npm run android

# iOS
npm run ios
```

### Production Build

```bash
# Android APK
cd android && ./gradlew assembleRelease

# iOS — use Xcode > Product > Archive
```

<br/>

## 🔐 Authentication

SignConnect uses Firebase Authentication with two providers:

- **Email/Password** — Registration, login, password reset, profile management
- **Google Sign-In** — OAuth 2.0 via `@react-native-google-signin/google-signin`

Security features include password strength validation (8+ chars, mixed case, number, symbol), re-authentication for sensitive operations, and secure token storage.

<br/>

## 📊 Data Model

### Translation History Entry

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
  confidence?: number;
  favorite: boolean;
}
```

History is stored locally via AsyncStorage (max 200 entries) with operations for filtering, favorites, and statistics.

<br/>

## 🎨 Design System

### Color Palette

| Token | Light | Dark |
|---|---|---|
| `primary` | `#6366F1` Indigo | `#6366F1` Indigo |
| `accent` | `#10B981` Green | `#10B981` Green |
| `background` | `#F8FAFC` | `#0B1220` |
| `surface` | `#FFFFFF` | `#111827` |
| `text-primary` | `#1E293B` | `#E5E7EB` |

### Spacing Scale
`4px` · `8px` · `16px` · `24px` · `32px` · `40px`

All animations use react-native-reanimated with native driver for consistent 60fps performance.

<br/>

## 🧪 Testing

```bash
npm test
```

| Test File | Coverage |
|---|---|
| `App.test.tsx` | Root navigation |
| `LoginScreen.test.tsx` | Auth flows |
| `HistoryService.test.ts` | CRUD operations |
| `SpellCheckService.test.ts` | Text processing |
| `ThemeService.test.ts` | Theme persistence |

Framework: **Jest** + **React Native Testing Library**

<br/>

## 🗺️ Roadmap

- [ ] Sentence-level (continuous) sign recognition
- [ ] Multi-hand detection
- [ ] Additional languages — BSL, ISL, AUSLAN
- [ ] Offline ML model support
- [ ] Cloud sync for translation history
- [ ] Community vocabulary contributions
- [ ] Model accuracy improvements beyond 94%
- [ ] CI/CD pipeline + crash reporting
- [ ] Accessibility audit & WCAG 2.1 AA compliance

<br/>

## 📄 Documentation

| Doc | Description |
|---|---|
| [`SIGN_TO_TEXT_README.md`](docs/SIGN_TO_TEXT_README.md) | Sign → Text feature deep-dive |
| [`SIGN_TO_VOICE_README.md`](docs/SIGN_TO_VOICE_README.md) | Sign → Voice feature deep-dive |
| [`PROFILE_SCREEN_DOCUMENTATION.md`](docs/PROFILE_SCREEN_DOCUMENTATION.md) | Profile & settings |
| [`GOOGLE_SIGNIN_SETUP.md`](docs/GOOGLE_SIGNIN_SETUP.md) | Firebase/Google auth setup |
| [`RELEASE_APK_GUIDE.md`](docs/RELEASE_APK_GUIDE.md) | Android release build |

<br/>

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a pull request

<br/>

## 📜 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

<br/>

---

<div align="center">

Built with ❤️ by **Zain**

*Making communication accessible for everyone.*

<br/>

[![React Native](https://img.shields.io/badge/-React_Native-20232A?style=flat-square&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TensorFlow](https://img.shields.io/badge/-TensorFlow_Lite-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)

</div>
