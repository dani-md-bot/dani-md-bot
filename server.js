const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require('pino');

const app = express();
const port = process.env.PORT || 8080;

// --- FRONTEND: PROFESSIONAL DASHBOARD ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DANI-MD PAIRING</title>
            <style>
                body { font-family: 'Poppins', sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .box { background: #1e293b; padding: 40px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: center; width: 90%; max-width: 400px; border: 1px solid #334155; }
                h1 { color: #38bdf8; font-size: 28px; margin-bottom: 10px; }
                p { color: #94a3b8; font-size: 14px; margin-bottom: 25px; }
                input { width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #334155; background: #0f172a; color: white; font-size: 16px; margin-bottom: 20px; outline: none; text-align: center; }
                input:focus { border-color: #38bdf8; }
                button { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #38bdf8; color: #0f172a; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; }
                button:hover { background: #7dd3fc; transform: scale(1.02); }
                #result { margin-top: 25px; padding: 20px; border-radius: 12px; background: #000; color: #10b981; font-size: 30px; font-weight: bold; letter-spacing: 5px; display: none; border: 2px dashed #10b981; }
                .status { margin-top: 15px; font-size: 12px; color: #facc15; display: none; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>DANI-MD</h1>
                <p>Enter your number with country code</p>
                <input type="number" id="num" placeholder="e.g. 923259379507">
                <button onclick="getCode()">GENERATE CODE</button>
                <div id="status" class="status">SYNCING WITH WHATSAPP...</div>
                <div id="result"></div>
            </div>
            <script>
                async function getCode() {
                    const n = document.getElementById('num').value;
                    const r = document.getElementById('result');
                    const s = document.getElementById('status');
                    if(!n || n.length < 10) return alert('Sahi number likhein!');
                    r.style.display = 'none';
                    s.style.display = 'block';
                    try {
                        const response = await fetch('/pair?number=' + n);
                        const data = await response.json();
                        s.style.display = 'none';
                        if(data.code) {
                            r.style.display = 'block';
                            r.innerText = data.code;
                        } else {
                            alert(data.error || 'Server Busy');
                        }
                    } catch(e) { 
                        s.style.display = 'none';
                        alert('Connection Error!'); 
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// --- BACKEND: OPTIMIZED PAIRING LOGIC ---
app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    if (!phone) return res.json({ error: "Number missing!" });

    try {
        // Dynamic session to avoid conflicts
        const { state } = await useMultiFileAuthState('session_' + Date.now());
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            // BROWSER FIX FOR FAST LINKING
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 120000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            emitOwnEvents: true
        });

        if (!sock.authState.creds.registered) {
            // Wait for socket to stabilize
            await delay(4000); 
            const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
            res.json({ code: code });
        } else {
            res.json({ message: "Already Connected" });
        }
    } catch (e) {
        console.error(e);
        res.json({ error: "Service Busy, Try Again" });
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port ${port}`);
});
