# DESCRIPTION IS OUT OF DATE

This project evolved into entire container for a modules one of which was an initial idea of the project. Down bellow is description of a single module, this README will be updated later. Also UI is COMOLETELY broken, you should change config.json files by hand now, it will take a long time to fix it.

## Twitch Sound Streak Bot

This project is a Twitch-connected app/bot that listens to chat messages and triggers specific sounds when keywords streaks are detected. It also provides a configuration UI for managing keywords, sounds, thresholds, and playback volume.

## Installation

1. Create .env file in the root of the app and add next variables:

- TWITCH_REFRESH_TOKEN= - your refresh token (this one could expire, I will try to work on automatic reneval)
- TWITCH_CLIENT_ID= - your client id
- TWITCH_CLIENT_SECRET= - your client secret
- TWITCH_BOT_USER_ID= - an id (not a login) of a monitoring (bot) account
- TWITCH_CHANNEL_ID= - an id (not a login) of a channel chat to monitor

- (optional) SERVER_PORT= - an express app port
- (optional) WEBSOCKET_PORT= - a websocket port

2. Install required packages and build the ui
```bash
npm install
cd ui
npm install
npm build
```

3. Starting an app
```bash
# Get back to the root of a project from previous step)
cd .. 

npm start
```

3. Usage
- Go to http://localhost:3001/ (or other port you configured)
- Alternativly you can edit config.json by hand following given template
- Add a browser source http://localhost:3001/overlay.html to your OBS (the sounds might not play in browser because usually autoplay is disabled by default)