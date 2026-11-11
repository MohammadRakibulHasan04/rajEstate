# AURA — Architectural Residences

A modern real estate showcase and listing management web application built with React, TypeScript, GSAP, and Firebase.

## Features

- **Editorial Landing Experience**: Scroll-scrubbed frame sequence hero and typography reveals powered by GSAP ScrollTrigger.
- **Residences Portfolio**: Filterable collection supporting standalone properties and multi-unit developments, with saved-listing bookmarks.
- **Property Detail Pages (`/property/:slug`)**: Full residence views with media lightbox, floor plans, tiered architectural specifications, proximity context, unit availability, and viewing inquiry submission.
- **Management Console (`/manage`)**: Role-gated admin workspace via Google Sign-In and Cloud Firestore for creating, editing, publishing, and managing listings and inquiries.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **Animation & Icons**: GSAP (ScrollTrigger), Lucide React
- **Backend**: Firebase Authentication (Google), Cloud Firestore

## Getting Started

### Prerequisites

- Node.js and npm
- A Firebase project with **Authentication (Google provider)** and **Cloud Firestore** enabled

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the project root (ignored by Git via `.gitignore`) with your Firebase project values:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
# Optional: set if using a named Firestore database instead of (default)
VITE_FIREBASE_FIRESTORE_DATABASE_ID=
```

Deploy `firestore.rules` to your Firebase project and configure admin access in your project's security rules and auth settings before using `/manage`.

### Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Start the Vite development server on port `3000` |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |
| `npm run build` | Build the production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |

## Project Structure

```text
├── firestore.rules   # Firestore security and validation rules
├── vercel.json       # SPA route rewrites for deployment
└── src/
    ├── assets/       # Visual media and hero frame sequences
    ├── components/   # Home, property detail, shared UI, and admin components
    ├── context/      # Authentication and theme state providers
    ├── data/         # Initial and seed listing definitions
    ├── lib/          # Firebase client, history router, queries, and helpers
    ├── pages/        # Route views (PropertyPage, ManagePage)
    └── types/        # TypeScript interfaces and domain models
```

## Privacy & Security

- Keep all environment credentials and project-specific configuration files private; `.env*` files are excluded from version control.
- Read/write authorization for listings, user bookmarks, and inquiries is enforced server-side through `firestore.rules`.
