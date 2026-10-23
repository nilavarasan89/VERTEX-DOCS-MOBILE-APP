# Vertex Docs Mobile — Premium Mobile UI Prototype

**Company:** JM Vertex Technologies  
**Product:** Vertex Docs Mobile  
**Platform:** Android First (iOS & Web Compatible)  
**Technology:** React Native + Expo (SDK 58) + TypeScript  

---

## 1. Project Overview

**Vertex Docs Mobile** is a commercial-grade mobile document productivity application engineered for enterprise document management, PDF viewing and annotation, and bidirectional **Tamil ⇄ English** neural translation while preserving complex document structures and tables.

This repository contains the redesigned **Login Screen** and commercial-quality **Home Dashboard** inspired by Microsoft 365, Google Drive, and Notion.

---

## 2. Redesign Highlights & Solved Problems

| Area | Before | Redesigned (Premium SaaS Design) |
|---|---|---|
| **Bottom Navigation** | Long labels overlapping and cramped; clipped text | Clean 5-tab fixed bar (`Home`, `Files`, `PDF Studio`, `Translate`, `Profile`) with zero wrapping, safe-area insets, and clear active states |
| **Reviewer Mode** | Floating badge covering dashboard content | Removed from dashboard surface; cleanly relocated into **Profile > Internship Demo Screen Navigation** |
| **Header** | Oversized sign-out button, verbose email subtitle | Refined compact header with greeting, brand tag, functional notification bell, and user avatar button |
| **Upload Section** | Heavy dark navy rectangle dominating the screen | Clean white card with subtle `#E2E8F0` border, primary "Choose a file" button, and secondary "Scan document" option |
| **Statistics** | Crowded inside dark card | Compact, elegant 3-item row (`Total files`, `Translated`, `Favorites`) leaving useful content visible above the fold |
| **Quick Actions** | Inconsistent card heights and awkward line wraps | Uniform 3-card grid with balanced heights, consistent icons (`32x32px`), and concise descriptions |
| **Recent Files** | Basic items with awkward truncation | Professional document manager rows with file badges, format, size, relative timestamps, Tamil translation pills, interactive filter chips, and a full document preview action sheet |

---

## 3. Brand & Color Palette

- **Primary Blue (`#2563EB`)**: Main CTAs, interactive tabs, active highlights.
- **Dark Navy (`#0B1533`)**: Typography headers, brand identity, profile avatar.
- **Background (`#F8FAFC`)**: Clean off-white canvas.
- **Card Surface (`#FFFFFF`)**: Pure white cards with subtle `#E2E8F0` borders.
- **Teal Accent (`#0EA5A4`)**: Translation status badges, verified pills, and company dots.
- **Main Text (`#172033`)**: Primary labels and high-contrast titles.
- **Secondary Text (`#64748B`)**: File sizes, dates, and subtitles.

---

## 4. Key Interactive Capabilities

1. **Document Upload Simulation:**
   - Tap **"Choose a file"** to open a sample document picker modal.
   - Selecting a file displays a realistic upload progress bar and adds the file directly to your Recent Files list.
   - Tap **"Scan document"** for quick camera simulation.
2. **Interactive Recent Files Filtering:**
   - Use the horizontal chips (`All`, `PDFs`, `Word`, `Tamil ⇄ English`, `Favorites`) to dynamically filter documents.
3. **Document Details & Action Sheet:**
   - Tap any file row to open a bottom action sheet with metadata, "Open in PDF Studio", "Translate Document", "Add to Favorites", and "Share".
4. **Rich Sub-Tab Experiences:**
   - **Files:** Search bar, cloud directory folders (`Financial Audits`, `Legal & Contracts`, `Tamil Vault`), and full document repository.
   - **PDF Studio:** Document viewer mockup with toolbar (`Annotate`, `Highlight`, `Sign`, `Search`, `Translate`), page indicators, and zoom controls.
   - **Language Bridge:** Dedicated translation studio with source/target selector (`தமிழ்` ⇄ `English`), document preview, side-by-side comparison, and 1-tap translation.
   - **Profile:** User profile (`Alex Morgan`), cloud storage meter (`1.2 GB of 15 GB`), settings, and **Demo Screen Navigation** to return to Login or Register.

---

## 5. How to Run the App

### Start Server
```bash
npx expo start
```

### Accessing the App
- **Browser:** Open [http://localhost:8081](http://localhost:8081).
- **Android Phone:** Scan the terminal QR code in the **Expo Go** app.
- **Android Emulator:** Press `a` in the terminal.

---

## 6. Demo Credentials
- **Email:** `alex.morgan@jmvertex.com`
- **Password:** `Password123!`
*(Or tap the **"Auto-Fill Demo Account"** button on the Login screen)*
