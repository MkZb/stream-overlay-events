import 'dotenv/config'
import { MongoClient } from 'mongodb'

const MONGODB_URL = process.env.MONGODB_URL;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

if (!MONGODB_URL || !MONGODB_DATABASE) {
    console.error('Please specify database url and name in .env');
    process.exit(1);
}

const client = new MongoClient(MONGODB_URL);
let db;

try {
    await client.connect();
    console.log('[mongoDB] Connected successfully to server');
    db = client.db(MONGODB_DATABASE);
} catch (err) {
    console.error('[mongoDB] Could not estabilish connection');
    process.exit(1);
}

/**
 * Creates document in DB if it wasn't found; adds an emote win, and updates the username
 * @param {string} userId a twitch user id of a user to update
 * @param {string} userName a twitch user name of a user to update
 */
export async function addGuessEmoteWin(userId, userName) {
    const collection = db.collection('users');
    collection.updateOne(
        { _id: userId },
        {
            $inc: { wins: 1 },
            $setOnInsert: {
                createdAt: new Date(),
            },
            $set: {
                userName
            }
        },
        { upsert: true }
    )
}

/**
 * Returns specified amount of documents from database ordered by wins
 * @param {number} amount number of documents to return
 * @returns {object[]} an array of documents from DB
 */
export async function getTopGuessEmotePlayers(amount = 10) {
    const collection = db.collection('users');
    return collection.find({})
        .sort({ wins: -1 })
        .limit(amount)
        .toArray();
}

/**
 * Returns a role of a user (access level)
 * @param {string} userId twitch id of user whose role to get
 * @returns {number} a number representation of a user role
 */
export async function getRole(userId) {
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: userId });
    return user?.role ?? null;
}

/**
 * Sets a specified user role
 * @param {string} userName user twitch name whose role to update
 * @param {number} role a role corresponding number
 * @returns {number} an amount of modified documents (it is supposed to be 0 or 1)
 */
export async function setRole(userName, role) {
    const collection = db.collection('users');
    const result = await collection.updateOne(
        { userName },
        {
            $set: {
                role
            }
        },
        { upsert: false }
    )

    return result.modifiedCount;
}