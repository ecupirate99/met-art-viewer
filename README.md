# Voice-Activated Art Viewer (Met Museum)

A premium, interactive web application that allows users to explore The Metropolitan Museum of Art's extensive public domain collection using **voice commands** and manual exploration features.

## Features

- 🎙️ **Voice Activation:** Uses the Web Speech API (`SpeechRecognition`) to let users naturally request artwork (e.g., *"Show me oil paintings by Van Gogh from 1889"*).
- 🖼️ **Immersive UI/UX:** A minimalist, mobile-first gallery design with high-end typography (`Playfair Display` and `Inter`) and a dark/light mode adaptable layout.
- 🎨 **Smart NLP Fallback:** Analyzes voice queries for artists, mediums, and dates. If a query is too broad, it smartly falls back to highlighted museum works.
- 📱 **Interactive Modals:** Click on any artwork to launch a sleek fullscreen carousel, perfect for exploring fine details on mobile or desktop.
- 🔊 **Audio Feedback:** The app responds verbally (`speechSynthesis`) confirming search results.
- 🏛️ **Manual Exploration:** For times when voice isn't ideal, users can manually explore Museum Departments or a curated list of Famous Artists.

## Tech Stack

- **Core:** Vanilla JavaScript, HTML5, CSS3
- **Build Tool:** Vite (for rapid development and highly optimized production builds)
- **API:** [The Metropolitan Museum of Art Collection API](https://metmuseum.github.io/)

## Running Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Deployment (Vercel)

This project is built using Vite and is ready for **Zero-Config Deployment** on Vercel:
1. Push this repository to GitHub.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect Vite and configure the build settings (`npm run build` with `dist` output).
5. Click **Deploy**!

## Author
Built with ❤️ for art lovers everywhere.
