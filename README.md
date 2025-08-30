# Twitch Sound Streak Bot

This project is a Twitch-connected app/bot that listens to chat messages and triggers specific sounds when keywords streaks are detected. It also provides a configuration UI for managing keywords, sounds, thresholds, and playback volume.

# Installation

1. Create .env file in the root of the app and add next variables:

- TWITCH_REFRESH_TOKEN= - your refresh token (this one could expire, I will try to work on automatic reneval)
- TWITCH_CLIENT_ID= - your client id
- TWITCH_CLIENT_SECRET= - your client secret
- TWITCH_BOT_USER_ID= - an id (not a login) of a monitoring (bot) account
- TWITCH_CHANNEL_ID= - an id (not a login) of a channel chat to monitor

- API_PORT= - an express app port (optional, default 3001)

2. Install required packages
> npm install
> cd ui
> npm install

3. Start an app
> cd .. (to get back to the root of a project from previous step)
> npm start