const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require('pino');

const app = express();
const port = process.env.PORT || 8080;

// Simple Frontend UI
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dani-MD Pairing</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0f172a; color: white; margin: 0; }
                .card { background: #1e293b; padding: 30px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; width: 90%; max-width: 400px; }
                input { width: 100%; padding: 12px; margin: 20px 0; border-radius: 8px; border: none; outline: none; box-sizing: border-box; }
                button { background: #3b82f6; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; }
                button:hover { background: #2563eb; }
                h2 { color: #60a5fa; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2>Dani-MD Pairer</h2>
                <p>Enter your number with Country Code</p>
                <input type="number" id="number" placeholder="e.g. 923259379507">
                <button onclick="getPair()">Get Pairing Code</button>
                <div id="result" style="margin-top: 20px; font-size: 24px; font-weight: bold; color: #10b981;"></div>
            </div>
            <script>
                async function getPair() {
                    const num = document.getElementById('number').value;
                    const resDiv = document.getElementById('result');
                    if(!num) return alert('Number daalein!');
                    resDiv.innerText = 'Connecting...';
                    try {
                        const response = await fetch('/pair?number=' + num);
                        const data = await response.json();
                        resDiv.innerText = data.code || data.error || data.message;
                    } catch (e) { resDiv.innerText = 'Error!'; }
                }
            </script>
        </body>
        </html>
    `);
});

// Pairing Logic
app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    if (!phone) return res.json({ error: "Number missing!" });

    try {
        const { state } = await useMultiFileAuthState('session');
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Chrome (Linux)", "", ""]
        });

        if (!sock.authState.creds.registered) {
            await delay(2000);
            const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
            res.json({ code: code });
        } else {
            res.json({ message: "Already Connected" });
        }
    } catch (e) {
        res.json({ error: e.message });
    }
});

app.listen(port, () => console.log('Server live on ' + port));
