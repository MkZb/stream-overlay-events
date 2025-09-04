import 'dotenv/config'
import { WebSocketServer } from "ws";

const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3002;

const wss = new WebSocketServer({ port: WEBSOCKET_PORT });
let overlayClients = [];

wss.on('connection', (ws) => {
    overlayClients.push(ws);
    ws.on('close', () => {
        overlayClients = overlayClients.filter(c => c !== ws);
    });
});


export function broadcastOverlayEvent(payload) {
    const msg = JSON.stringify(payload);
    overlayClients.forEach(ws => {
        if (ws.readyState === ws.OPEN) ws.send(msg);
    });
}