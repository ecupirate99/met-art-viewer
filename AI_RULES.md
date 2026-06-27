# AI Rules & Tech Stack

This document defines the architectural standards and technology stack for the Met Museum Voice Art Viewer.

## Tech Stack
- **Vanilla JavaScript (ES6+):** Core application logic using modern ECMAScript modules.
- **Vite:** Build tool and development server for fast HMR and optimized builds.
- **HTML5 & CSS3:** Semantic structure and custom CSS variables for a premium, themeable UI.
- **Web Speech API:** Native browser support for `SpeechRecognition` and `SpeechSynthesis`.
- **Met Museum API:** Integration with the Metropolitan Museum of Art's public collection data.
- **Google Fonts:** High-end typography using 'Playfair Display' and 'Inter'.
- **Lucide Icons:** Lightweight SVG-based iconography for UI controls.

## Development Rules

### 1. Library Usage & Dependencies
- **No Frameworks:** Stick to Vanilla JS for now to keep the app lightweight. Do not add React, Vue, or Angular unless a full migration is requested.
- **Styling:** Use the existing `style.css`. Do not add external CSS frameworks like Bootstrap. If Tailwind is needed, it must be configured via Vite.
- **Icons:** Use Lucide-style SVGs directly in the HTML or via JS templates to avoid heavy icon font dependencies.

### 2. Coding Standards
- **Modularity:** Extract complex logic (API calls, Speech handling) into separate `.js` files as the project grows.
- **CSS Variables:** Always use the variables defined in `:root` for colors and spacing to maintain design consistency.
- **Responsive Design:** Every new feature must be tested for mobile responsiveness.

### 3. Voice & Interaction
- **Dual Feedback:** Every voice action must trigger both a visual status update and a speech synthesis response.
- **Accessibility:** Maintain high accessibility standards with proper ARIA roles and keyboard navigation support.

### 4. API Best Practices
- **Efficiency:** Implement lazy loading or pagination for large result sets to respect API rate limits and improve performance.
- **Fallbacks:** Always handle "no results" or "API error" states gracefully with user-friendly messaging.