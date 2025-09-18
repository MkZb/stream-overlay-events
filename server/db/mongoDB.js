import 'dotenv/config'
import { MongoClient } from 'mongodb'

const MONGODB_URL = process.env.MONGODB_URL;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE;

if(!MONGODB_URL || !MONGODB_DATABASE) {
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

export async function addGuessEmoteWin({ userId, userName }) {
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

export async function getTopGuessEmotePlayers(amount = 10) {
    const collection = db.collection('users');
    return collection.find({})
        .sort({ wins: -1 })
        .limit(amount)
        .toArray();
}

export async function getRole({ userId }) {
    const collection = db.collection('users');
    const user = await collection.findOne({ _id: userId });
    return user?.role ?? null;
}

export async function setRole({ userName, role }) {
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