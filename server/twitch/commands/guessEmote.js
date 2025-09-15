import { getTopGuessEmotePlayers } from "../../db/mongoDB.js";
import { sendMessage } from "../bot.js";
import { obfuscateName } from "../../utils/utils.js";

export async function getGuessEmoteLeaderboard({ }) {
    const topTen = await getTopGuessEmotePlayers();
    let message = '';

    topTen.forEach((item, idx) => {
        message += `${idx + 1}. ${obfuscateName(item.userName)} - ${item.wins} `
    });

    await sendMessage(message);
}