# Project description is out of date

This project evolved into entire container for a modules one of which was an initial idea of the project. Down bellow is description of a single module, this README will be updated later. Also configuration UI is removed, you should change config.json files by hand now.

## Twitch Sound Streak Bot

This project is a Twitch-connected app/bot that listens to chat messages and triggers specific sounds when keywords streaks are detected. It also provides a configuration for managing keywords, sounds, thresholds, and playback volume.

## Requirements
- Node.js and npm ([instruction for installation](https://nodejs.org/en/download/))
- MongoDB database ([instruction for installation](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/))
- Account that will be used by a bot with mod privileges in your channel
- User access token for bot account with `user:bot user:read:chat user:write:chat` scope

## Installation

1. Create .env file in the root of the app and add next variables:

```
TWITCH_CLIENT_ID= - your client id
TWITCH_CLIENT_SECRET= - your client secret
TWITCH_APP_TOKEN= - your app access token (if you leave this empty, new app access token will be created and output in the console, which you can then put here)
TWITCH_REFRESH_TOKEN= - your refresh token (this one could expire, I will try to work on automatic reneval)
TWITCH_BOT_USER_ID= - an id (not a login) of a monitoring (bot) account

MONGODB_URL= - a url to connect to your database
MONGODB_DATABASE= - name of your database

(optional) SERVER_PORT= - an express app port
(optional) WEBSOCKET_PORT= - a websocket port
```

- Client ID and secret obtained with [those instructions](https://dev.twitch.tv/docs/authentication/register-app/).
- You can get refresh token when creating a user access token with [Twitch CLI](https://dev.twitch.tv/docs/cli/).
- First you need to [configure it](https://dev.twitch.tv/docs/cli/configure-command/) with your client ID and secret.
- Make sure you create a token with a correct scope: `twitch token -u -s 'user:bot user:read:chat user:write:chat'`.
- You only need a refresh token from this command because token itself expires in 1 hour anyway, the app handles refreshing and getting the token itself.
- To obtain twitch channel ID you can use a tool like [this](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/).
- MongoDB URL doesn't have to be a local one, it could be a remote one as well, just make sure you have a database there and specify it in the file.

2. Update channelsIdList in server/twitch/channels.js for channel chats you want to listen to. You can use this to test the functionality of the bot on alt account without spamming your own chat. (Keep in mind that nothing is linked to specific channel except chat messages sent by a bot and available chat emotes, every single piece of information is shared between channels)

3. Install required packages
```bash
npm install
```

4. Start an app
```bash
npm start
```

5. Usage
- Edit config.json of each module by your liking
- Add a browser source http://localhost:3001/overlay.html to your OBS (the sounds might not play in browser because usually autoplay is disabled by default)