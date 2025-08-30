import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import { getConfig, updateConfig } from "./config.js";
import multer from 'multer';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const soundsDir = path.join(__dirname, '../ui/public/sounds');
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
        const ext = path.extname(req.file.originalname);
        const newName = `${word}${ext}`;
        fs.renameSync(req.file.path, path.join(soundsDir, newName));
        soundFile = newName;
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
        const ext = path.extname(req.file.originalname);
        const newName = `${word || config.keywords[idx].word}${ext}`;
        fs.renameSync(req.file.path, path.join(soundsDir, newName));
        config.keywords[idx].sound = newName;
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
const wss = new WebSocketServer({ port: 3002 });
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

// API endpoint to trigger sound on overlay
app.post('/api/trigger-sound', (req, res) => {
    const { sound, playbackSpeed, volume } = req.body;
    if (!sound) return res.status(400).json({ error: 'Missing sound' });
    const url = `/sounds/${sound}`;
    triggerOverlaySound(sound, url, volume, playbackSpeed || 1);
    res.json({ success: true });
});

const PORT = process.env.API_PORT || 3001;

app.listen(PORT, () => {
    console.log(`Config API listening on port ${PORT}`);
});
