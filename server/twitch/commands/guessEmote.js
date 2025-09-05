import { getTopGuessEmotePlayers } from "../../db/mongoDB.js";
import { sendMessage } from "../bot.js";

export async function getGuessEmoteLeaderboard({ }) {
    const topTen = await getTopGuessEmotePlayers();
    let message = '';

    topTen.forEach((item, idx) => {
        message += `${idx + 1}. ${item.userName} - ${item.wins} `
    });

    await sendMessage(message);
}