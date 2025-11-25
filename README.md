# YourChords

YourChords is a modern, AI-powered platform for musicians to find, generate, and practice guitar chords and lyrics. Built with **React**, **Vite**, **TypeScript**, and **Supabase**, it leverages **Google Gemini AI** for intelligent chord generation and analysis.

## Features

*   **Comprehensive Song Library:** Access a vast collection of songs with verified chords and lyrics.
*   **AI Chord Generator:** Instantly generate chord sheets for any song using Google Gemini AI. Paste lyrics or record audio to get started.
*   **Interactive Chord Sheets:** View chords and lyrics with transposition, auto-scroll, and font size adjustment.
*   **Smart Tools:**
    *   **Guitar Tuner:** Built-in chromatic tuner using the Web Audio API.
    *   **Metronome:** Precise metronome with adjustable BPM.
    *   **Chord Visualizer:** Interactive chord diagrams for thousands of variations.
*   **Professor Harmony AI:** An AI assistant for music theory, history, and composition questions.
*   **User Accounts:** Save favorite songs, manage profiles, and contribute to the community.
*   **Admin Dashboard:** Manage songs, users, and platform content (for authorized admins).
*   **Responsive Design:** Optimized for desktop, tablet, and mobile devices with dark mode support.

## Project Structure

The project follows a standard React application structure:

*   `components/`: Reusable UI components (e.g., `Navbar`, `Footer`, `ChordDiagram`).
*   `contexts/`: React Context definitions (e.g., `AuthContext`).
*   `lib/`: Utility functions, hooks, and service integrations.
    *   `musicUtils.ts`: Music theory logic and chord parsing.
    *   `chordService.ts`: Chord database and fretboard logic.
    *   `gemini.ts`: Google Gemini AI integration.
    *   `supabase.ts`: Supabase client configuration.
*   `pages/`: Route components representing individual pages (e.g., `Home`, `SongDetail`).
*   `types.ts`: TypeScript interface definitions.
*   `App.tsx`: Main application component and routing setup.
*   `index.tsx`: Entry point.

## Setup & Installation

**Prerequisites:**

*   Node.js (v18 or higher)
*   npm or yarn

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd yourchords
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add the following keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_API_KEY=your_google_gemini_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

## Usage

*   **Home:** Browse trending songs, featured albums, and tutorials.
*   **Search:** Use the search bar to find songs, artists, or tutorials.
*   **Tools:** Access the Tuner, Metronome, and AI Generator from the "Tools" page.
*   **Song Detail:** Click on a song to view its chords. Use the toolbar to transpose, change font size, or export to PDF. Click chord names to see diagrams.
*   **Auth:** Sign up or log in to save favorites and access personalized features.

## Contributing

Contributions are welcome! Please follow the standard code style and document any new functions or components.

## License

[MIT License](LICENSE)
