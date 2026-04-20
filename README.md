# Territory Run 🏃‍♂️🗺️

**Google Prompt Wars Submission**

## 1. Chosen Vertical
*(Replace this with your chosen vertical from the prompt, e.g., "Health & Wellness", "Gamification", or "Personal Assistant")*

## 2. Approach and Logic
Territory Run transforms the physical world into a dynamic game board to solve the core problem of workout motivation. Instead of staring at generic distance metrics, users run to "claim" geographic areas on a real-time map.

*   **Logic:** The application uses high-accuracy geolocation to track the user's path. Once a boundary is closed (or a run ends), the path is converted into a geometric polygon representing the captured territory.
*   **Assistant Persona:** We leverage Google AI (Gemini) *(Optional: if you plan to add the AI coach)* to provide dynamic, context-aware coaching in real-time, encouraging the user when their pace drops and advising them on which routes offer the most unclaimed territory.

## 3. How the Solution Works
1.  **Authentication:** Users sign in securely using Google Firebase Authentication.
2.  **Geolocation Tracking:** Using the browser's Geolocation API, we track continuous coordinate streams.
3.  **Real-Time Data Sync:** Territories, leaderboards, and map data are securely synchronized using Google Cloud Firestore (Firebase).
4.  **Map Rendering:** The live coordinates are projected onto a styled Carto map.
5.  **Smart Assistant Integration:** *(Optional: "The app features a Google Gemini-powered smart coach that..." )*

## 4. Assumptions Made
*   Users have access to a mobile device with reliable GPS and internet connectivity.
*   The application operates primarily in a mobile browser environment.
*   We assume a basic level of trust in standard GPS accuracy, implementing a "Simulation" mode as a fallback/developer tool for environments with blocked GPS signals.

## Evaluation Focus Areas Addressed:
*   **Google Services integration:** Deeply integrated with Google Firebase Authentication and Cloud Firestore for real-time multiplayer functionality.
*   **Security:** Strict Firebase Security Rules (`firestore.rules`) prevent unauthorized territory tampering or user spoofing.
*   **Code Quality:** Component-based React architecture heavily utilizing custom React hooks (`useLocation`, `useFirebase`) for single-responsibility separation.
*   **Accessibility:** High-contrast Dark Mode support and clear error states (e.g., GPS blockage fallback).
