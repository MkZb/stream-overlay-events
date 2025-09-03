import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import { getConfig, updateConfig } from './events/event_modules/voiced_streaks/config.js';
import multer from 'multer';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import sizeOf from 'image-size';
import { randomInt } from 'crypto';

const SERVER_PORT = process.env.SERVER_PORT || 3001;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3002;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../ui/build')));

const modulesDir = path.join(__dirname, 'events', 'event_modules');

// List all modules
app.get('/api/modules', (req, res) => {
    const modules = fs.readdirSync(modulesDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
    res.json({ modules });
});

// Get config for a module
app.get('/api/modules/:module/config', async (req, res) => {
    try {
        const mod = req.params.module;
        const configPath = path.join(modulesDir, mod, 'config.js');
        if (!fs.existsSync(configPath)) return res.status(404).json({ error: 'Module not found' });
        const { getConfig } = await import(`./events/event_modules/${mod}/config.js`);
        res.json(getConfig());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Update config for a module
app.put('/api/modules/:module/config', express.json(), async (req, res) => {
    try {
        const mod = req.params.module;
        const configPath = path.join(modulesDir, mod, 'config.js');
        if (!fs.existsSync(configPath)) return res.status(404).json({ error: 'Module not found' });
        const { updateConfig, getConfig } = await import(`./events/event_modules/${mod}/config.js`);
        updateConfig(req.body);
        res.json(getConfig());
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Settings API ---
const soundsDir = path.join(__dirname, '../ui/build/sounds');
if (!fs.existsSync(soundsDir)) fs.mkdirSync(soundsDir, { recursive: true });
const upload = multer({ dest: soundsDir });

let config = getConfig();

// Get current config
app.get('/api/config', (req, res) => {
    res.json(getConfig());
});

// Add a new keyword (with file upload)
app.post('/api/keywords', upload.single('sound'), (req, res) => {
    const { word, threshold, volume } = req.body;
    config = getConfig();
    if (!word) return res.status(400).json({ error: 'Missing keyword' });
    let soundFile = req.file ? req.file.filename : null;
    if (req.file) {
        // Move file to correct name
        const name = path.basename(req.file.originalname);
        fs.renameSync(req.file.path, path.join(soundsDir, name));
        soundFile = name;
    }
    config.keywords.push({
        word,
        sound: soundFile || '',
        volume: volume ? Number(volume) : 1,
        threshold: threshold ? Number(threshold) : config.globalThreshold || 3
    });
    updateConfig({ keywords: config.keywords });
    res.json({ success: true, keywords: config.keywords });
});

// Update a keyword's properties
app.put('/api/keywords/:index', upload.single('sound'), (req, res) => {
    const { word, threshold, volume } = req.body;
    config = getConfig();
    const idx = Number(req.params.index);
    if (isNaN(idx) || !config.keywords[idx]) return res.status(404).json({ error: 'Keyword not found' });
    if (word) config.keywords[idx].word = word;
    if (threshold) config.keywords[idx].threshold = Number(threshold);
    if (volume) config.keywords[idx].volume = Number(volume);
    if (req.file) {
        const name = path.basename(req.file.originalname);
        fs.renameSync(req.file.path, path.join(soundsDir, name));
        config.keywords[idx].sound = name;
    }
    updateConfig({ keywords: config.keywords });
    res.json({ success: true, keyword: config.keywords[idx] });
});

// Remove a keyword
app.delete('/api/keywords/:index', (req, res) => {
    config = getConfig();
    const idx = Number(req.params.index);
    if (isNaN(idx) || !config.keywords[idx]) return res.status(404).json({ error: 'Keyword not found' });
    config.keywords.splice(idx, 1);
    updateConfig({ keywords: config.keywords });
    res.json({ success: true });
});

// Update threshold
app.post('/api/globalThreshold', (req, res) => {
    const { globalThreshold } = req.body;
    if (typeof globalThreshold !== 'number' || globalThreshold < 1) return res.status(400).json({ error: 'Invalid threshold' });
    config.globalThreshold = globalThreshold;
    updateConfig({ globalThreshold: config.globalThreshold });
    res.json({ success: true });
});

// --- Overlay WebSocket and API trigger ---
const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
let overlayClients = [];

wss.on('connection', (ws) => {
    overlayClients.push(ws);
    ws.on('close', () => {
        overlayClients = overlayClients.filter(c => c !== ws);
    });
});

function triggerOverlaySound(sound, url, volume, playbackSpeed = 1.0) {
    const msg = JSON.stringify({ type: 'play_sound', sound, url, volume, playbackSpeed });
    overlayClients.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(msg);
    });
}

app.post('/api/trigger-sound', (req, res) => {
    const { sound, playbackSpeed, volume } = req.body;
    if (!sound) return res.status(400).json({ error: 'Missing sound' });
    const url = `/sounds/${sound}`;
    triggerOverlaySound(sound, url, volume, playbackSpeed || 1);
    res.json({ success: true });
});

function triggerOverlayImage(data, x, y, duration) {
    const msg = JSON.stringify({ type: 'show_image', data, x, y, duration });
    overlayClients.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(msg);
    });
}

app.post('/api/showEmote', (req, res) => {
    const { id, duration } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const imageBuffer = fs.readFileSync(`./server/cache/emotes/${id}.webp`);
    const dimensions = sizeOf(imageBuffer);
    const base64 = imageBuffer.toString('base64');
    const x = randomInt(0, 1920 - dimensions.width);
    const y = randomInt(0, 1080 - dimensions.height);
    triggerOverlayImage(`data:image/webp;base64,${base64}`, x || 0, y || 0, duration || 3000);
    res.json({ success: true });
});

app.listen(SERVER_PORT, () => {
    console.log(`Config API listening on port ${SERVER_PORT}`);
});
