import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';


const SERVER_PORT = process.env.SERVER_PORT || 3001;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, './public')));
app.use('/scripts', express.static(path.join(__dirname, '../node_modules/reconnecting-websocket/dist')));

app.listen(SERVER_PORT, () => {
    console.log(`Overlay server listening on port ${SERVER_PORT}`);
});
