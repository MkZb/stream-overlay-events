# Twitch Sound Streak Bot

This project is a Twitch-connected app/bot that listens to chat messages and triggers specific sounds when keywords are detected. It also provides a configuration UI for managing keywords, sound triggers, thresholds, and playback volume.

## Features
- Connects to Twitch chat
- Detects keywords in chat messages
- Triggers sounds based on keyword streaks
- Configuration UI to:
  - Add/remove keywords and their sounds
  - Set threshold for consecutive keyword messages
  - Adjust playback speed of sounds

## Tech Stack
- Node.js (backend/bot logic)
- React (frontend/configuration UI)
- WebSocket or REST API for communication between UI and bot
- Suitable sound playback library (e.g., node-aplay, howler.js)


## Getting Started

### 1. Backend (Bot)
1. Open a terminal in the `bot` folder:
  ```sh
  cd bot
  ```
2. Install dependencies:
  ```sh
  npm install
  ```
3. Set your Twitch credentials in `bot/.env`:
  ```env
  TWITCH_OAUTH_TOKEN=your_token_here
  TWITCH_USERNAME=your_username_here
  TWITCH_CHANNEL=your_channel_here
  ```
4. Start the configuration API server:
  ```sh
  node api.js
  ```
5. (In a separate terminal) Start the bot:
  ```sh
  node index.js
  ```

### 2. Frontend (UI)
1. Open a terminal in the `ui` folder:
  ```sh
  cd ui
  ```
2. Install dependencies:
  ```sh
  npm install
  ```
3. Start the React development server:
  ```sh
  npm start
  ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

Replace placeholder assets and configuration as needed for your setup.

---

Replace placeholder assets and configuration as needed for your setup.
