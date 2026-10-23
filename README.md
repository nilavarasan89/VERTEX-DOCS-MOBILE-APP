# Vertex Docs Mobile — Login Screen UI Prototype

**Company:** JM Vertex Technologies  
**Product:** Vertex Docs Mobile  
**Platform:** Android First (iOS Architecture Compatible)  
**Technology:** React Native + Expo (SDK 58) + TypeScript  

---

## 1. Project Overview

**Vertex Docs Mobile** is a modern document productivity application engineered for document management, PDF viewing and annotation, and bidirectional **Tamil ⇄ English** translation while preserving document structures.

This repository contains the high-fidelity **Login Screen UI Prototype** developed for the JM Vertex Technologies internship evaluation, featuring a clean SaaS aesthetic, responsive Android-first layouts, simulated authentication flows, and a placeholder post-login **Home Dashboard**.

---

## 2. Design System & Palette

The user interface adheres to the specification's exact color system:

| Role | Color Name | Hex Code | Description |
|---|---|---|---|
| **Primary** | Primary Blue | `#2563EB` | Main CTAs, active highlights, primary buttons |
| **Dark Navy** | Dark Navy | `#0B1533` | Brand mark, card backgrounds, high-contrast headings |
| **Background** | Soft Slate | `#F8FAFC` | Screen backgrounds and light surfaces |
| **Surface** | Pure White | `#FFFFFF` | Cards, input containers, modals |
| **Teal Accent** | Teal Accent | `#0EA5A4` | Translation pills, badges, secondary branding dots |
| **Main Text** | Charcoal Navy | `#172033` | Primary labels and typography |
| **Secondary Text**| Slate Gray | `#64748B` | Subtitles, helper text, timestamps |
| **Border** | Soft Periwinkle | `#D9E2EF` | Form field borders and card dividers |

### Design Highlights
- **Rounded input fields and buttons:** 10–14px radius with subtle elevation and soft glow focus states.
- **Micro-interactions:** Interactive show/hide password toggle, smooth checkbox animations, and touch feedback.
- **Responsive & Safe-Area Aware:** Tested with `react-native-safe-area-context` and `KeyboardAvoidingView`.
- **Reviewer Friendly:** Includes an **"Auto-Fill Demo Account"** pill and a **"Reviewer Mode"** floating switcher to seamlessly inspect all screens.

---

## 3. Screens & Features Implemented

### A. Login Screen (`src/screens/LoginScreen.tsx`)
1. **Brand Header:**
   - Custom layered geometric logo mark combining document outline, folded vertex accent, and teal indicator.
   - Company indicator: `JM VERTEX TECHNOLOGIES`.
   - Title: **Vertex Docs**.
   - Subtitle: *"Your documents. Simplified."*
2. **Welcome Section:**
   - **Welcome Back!**
   - *"Sign in to access your documents and continue where you left off."*
3. **Login Form:**
   - Email address input with `mail-outline` icon and regex validation.
   - Password input with `lock-closed-outline` icon, length validation (minimum 6 characters), and show/hide toggle (`eye-outline` / `eye-off-outline`).
   - Interactive **Remember Me** checkbox.
   - **Forgot Password?** text button navigating to password recovery.
   - Full-width **Sign In** button in `#2563EB` with simulated asynchronous loading state (1.2s delay).
   - Inline contextual validation error messages with warning icons.
4. **Alternative Login:**
   - Subtle `"OR"` divider line.
   - **Continue with Google** prototype button with informative modal explaining the prototype state.
5. **Registration Link:**
   - *"Don't have an account? Create account"* navigating to registration.
6. **Footer:**
   - Small lock icon with muted caption: *"Secure access to your documents"*.

### B. Sample Home Dashboard (`src/screens/DashboardScreen.tsx`)
- **Top Greeting Bar:** *"Hello, Welcome to Vertex Docs"* with user email and sign-out button.
- **Upload Document Card:** Dark navy card with file upload CTA, instant translation prompt, and metric counters (34 Total, 12 Translated, 3 Favorites).
- **Quick Action Cards:**
  - **Files:** Document directory and cloud repository.
  - **PDF Studio:** Document viewing, annotation, and digital signing (`Pro` badge).
  - **Language Bridge:** AI-driven Tamil ⇄ English translation (`AI` badge).
- **Recent Files Section:**
  - `Annual_Financial_Audit_2026.pdf` (PDF • 4.2 MB • Tamil ⇄ English verified)
  - `Legal_Vendor_Agreement_TN.docx` (DOCX • 1.8 MB • Translated to Tamil)
  - `Technical_Architecture_Overview.pdf` (PDF • 8.5 MB • Original English)
- **Bottom Navigation Bar:**
  - 5 interactive tabs: **Home**, **Files**, **PDF Studio**, **Language Bridge**, **Profile**.

### C. Forgot Password Screen (`src/screens/ForgotPasswordScreen.tsx`)
- Email recovery input with validation, instruction copy, simulated reset link dispatch, success confirmation card, and return to sign-in.

### D. Registration Prototype (`src/screens/RegisterScreen.tsx`)
- Full name, work email, password, confirm password, terms & conditions checkbox, validation feedback, and return to sign-in.

---

## 4. Project Directory Structure

```text
├── App.tsx                     # Main application entry point & screen router
├── app.json                    # Expo project configuration
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # TypeScript configuration
└── src/
    ├── constants/
    │   ├── mockData.ts         # Demo credentials, sample files, quick actions
    │   └── theme.ts            # Palette, typography, spacing, shadows, radius
    ├── types/
    │   └── index.ts            # TypeScript interfaces & navigation types
    ├── components/
    │   └── common/
    │       ├── BrandLogo.tsx       # Vector document & vertex logo mark
    │       ├── CustomInput.tsx     # Reusable text input with icons & validation
    │       ├── CustomButton.tsx    # Styled buttons with loading & variants
    │       ├── Checkbox.tsx        # Accessible toggle checkbox
    │       └── HeaderBar.tsx       # Screen top navigation bar
    └── screens/
        ├── LoginScreen.tsx          # Primary login UI prototype
        ├── DashboardScreen.tsx      # Post-login sample home dashboard
        ├── ForgotPasswordScreen.tsx # Password reset flow
        └── RegisterScreen.tsx       # Account registration flow
```

---

## 5. How to Run and Test on Android

### Prerequisites
- Node.js (v18+)
- Android device with **Expo Go** app installed, or an Android Emulator configured via Android Studio.

### Step 1: Install Dependencies
If not already installed:
```bash
npm install
```

### Step 2: Start the Expo Development Server
```bash
npx expo start
```

### Step 3: Launch on Android
- **Physical Device:** Open the **Expo Go** app on your Android device and scan the QR code displayed in the terminal.
- **Android Emulator:** Press `a` in the terminal to automatically connect and launch on an active Android emulator:
  ```bash
  npx expo start --android
  ```
- **Web Preview (Optional):** Press `w` to test in your web browser:
  ```bash
  npx expo start --web
  ```

---

## 6. Testing the Demo Credentials

For quick evaluation during the internship presentation:
- Click **"Auto-Fill Demo Account"** at the top of the Login Screen.
- Alternatively, enter:
  - **Email:** `alex.morgan@jmvertex.com`
  - **Password:** `Password123!`
- Tap **Sign In** to experience the loading state and transition to the **Home Dashboard**.
- Use the bottom-right **"Reviewer Mode"** floating button at any time to switch between screens instantaneously.

---

## 7. Verification & Code Quality

The codebase passes all Expo and TypeScript diagnostics:

```bash
# Verify TypeScript strict typecheck
npx tsc --noEmit

# Diagnose Expo dependencies
npx expo-doctor
```
Both commands report `0 errors` and `20/20 checks passed`.
