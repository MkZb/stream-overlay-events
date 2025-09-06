import 'dotenv/config'

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.TWITCH_REFRESH_TOKEN;


let userToken;
let appToken = process.env.TWITCH_APP_TOKEN;

if(!appToken) {
    appToken = await getNewAppAccessToken();
    console.log(appToken);
}

export async function getAuth(maxRetries = 2) {
    let currentToken = await getUserAccessToken();
    let response = await fetch('https://id.twitch.tv/oauth2/validate', {
        method: 'GET',
        headers: {
            'Authorization': 'OAuth ' + currentToken
        }
    });

    if (response.status != 200) {
        let data = await response.json();
        console.error('Token is not valid. /oauth2/validate returned status code ' + response.status);
        console.error(data);
        if (response.status == 401 && maxRetries > 0) {
            currentToken = await handleExpiredToken(maxRetries - 1);
        } else {
            process.exit(1);
        }
    }

    console.log('Validated token.');
    return currentToken;
}

async function handleExpiredToken(maxRetries) {
    await getNewUserAccessToken();
    return await getAuth(maxRetries);
}

async function getUserAccessToken() {
    if (!userToken) {
        await getNewUserAccessToken();
    }
    return userToken;
}

export async function getAppAccessToken() {
    return appToken;
}

async function getNewUserAccessToken() {
    let response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: REFRESH_TOKEN
        })
    });

    if (response.status != 200) {
        console.error('Failed to create a user access token /oauth2/token returned status code ' + response.status);
        console.log(JSON.stringify(response, null, 2));
        process.exit(1);
    } else {
        let data = await response.json();
        userToken = data.access_token;
    }
}

async function getNewAppAccessToken() {
    let response = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
        })
    });

    if (response.status != 200) {
        console.error('Failed to create an app access token /oauth2/token returned status code ' + response.status);
        console.log(JSON.stringify(response, null, 2));
        process.exit(1);
    } else {
        let data = await response.json();
        return data.access_token;
    }
}