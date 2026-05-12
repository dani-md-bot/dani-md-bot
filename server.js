const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require('pino');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DANI-MD FIXED</title>
            <style>
                body { background: #0f172a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #1e293b; padding: 30px; border-radius: 20px; text-align: center; width: 90%; max-width: 350px; }
                input { width: 100%; padding: 12px; margin: 15px 0; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; }
                button { width: 100%; padding: 12px; border-radius: 8px; border: none; background: #38bdf8; color: #0f172a; font-weight: bold; cursor: pointer; }
                #result { margin-top: 20px; font-size: 28px; color: #10b981; font-weight: bold; letter-spacing: 3px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>DANI-MD</h2>
                <p>Enter number with Country Code</p>
                <input type="number" id="num" placeholder="e.g. 923259379507">
                <button onclick="get()">GENERATE CODE</button>
                <div id="result"></div>
            </div>
            <script>
                async function get() {
                    const n = document.getElementById('num').value;
                    const r = document.getElementById('result');
                    if(!n) return alert('Number please!');
                    r.innerText = 'WAITING...';
                    try {
                        const res = await fetch('/pair?number=' + n);
                        const data = await res.json();
                        r.innerText = data.code || data.error || 'ERROR';
                    } catch(e) { r.innerText = 'FAILED'; }
                }
            </script>
        </body>
        </html>
    `);
});

app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    try {
        // Har baar bilkul naya session folder banega
        const sessionName = 'session_' + Date.now();
        const { state } = await useMultiFileAuthState(sessionName);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Chrome (Linux)", "", ""]
        });

        if (!sock.authState.creds.registered) {
            await delay(5000); // 5 seconds wait for stability
            const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
            res.json({ code: code });
        }
    } catch (e) {
        res.json({ error: "Try Again" });
    }
});

app.listen(port, "0.0.0.0");
