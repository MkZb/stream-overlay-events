# Project description is out of date

This project evolved into entire container for a modules one of which was an initial idea of the project. Down bellow is description of a single module, this README will be updated later. Also configuration UI is removed, you should change config.json files by hand now, it will take a long time to fix it (still do the build part from the installation steps).

## Twitch Sound Streak Bot

This project is a Twitch-connected app/bot that listens to chat messages and triggers specific sounds when keywords streaks are detected. It also provides a configuration UI for managing keywords, sounds, thresholds, and playback volume.

## Requirements
- Node.js and npm ([instruction for installation](https://nodejs.org/en/download/))
- MongoDB database ([instruction for installation](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/))
- User access token with `user:bot user:read:chat user:write:chat` scope

## Installation

1. Create .env file in the root of the app and add next variables:

```
TWITCH_CLIENT_ID= - your client id
TWITCH_CLIENT_SECRET= - your client secret
TWITCH_APP_TOKEN= - your app access token (if you leave this empty, new app access token will be created and output in the console, which you can then put here)
TWITCH_REFRESH_TOKEN= - your refresh token (this one could expire, I will try to work on automatic reneval)
TWITCH_BOT_USER_ID= - an id (not a login) of a monitoring (bot) account
TWITCH_CHANNEL_ID= - an id (not a login) of a channel chat to monitor

MONGODB_URL= - a url to connect to your database
MONGODB_DATABASE= - name of your database

(optional) SERVER_PORT= - an express app port
(optional) WEBSOCKET_PORT= - a websocket port
```

- Client ID and secret obtained with [those instructions](https://dev.twitch.tv/docs/authentication/register-app/).
- You can get refresh token when creating a user access token with [Twitch CLI](https://dev.twitch.tv/docs/cli/).
- First you need to [configure it](https://dev.twitch.tv/docs/cli/configure-command/) with your client ID and secret.
- Make sure you create a token with a correct scope: `twitch token -u -s user:bot user:read:chat user:write:chat`.
- You only need a refresh token from this command because token itself expires in 1 hour anyway, the app handles refreshing and getting the token itself.
- To obtain twitch channel ID you can use a tool like [this](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/).
- MongoDB URL doesn't have to be a local one, it could be a remote one as well, just make sure you have a database there and specify it in the file.

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
- Go to http://localhost:3001/ (or other port you configured) (This page doesn't work as expected as of now)
- Alternativly you can edit config.json by hand following given template
- Add a browser source http://localhost:3001/overlay.html to your OBS (the sounds might not play in browser because usually autoplay is disabled by default)