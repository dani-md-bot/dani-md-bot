const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require('pino');

const app = express();
const port = process.env.PORT || 8080;

// FRONTEND UI (Professional Design)
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
                .box { background: #1e293b; padding: 40px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: center; width: 100%; max-width: 420px; border: 1px solid #334155; }
                h1 { color: #38bdf8; font-size: 28px; margin-bottom: 5px; letter-spacing: 1px; }
                p { color: #94a3b8; margin-bottom: 30px; font-size: 14px; }
                .input-group { position: relative; margin-bottom: 20px; }
                input { width: 100%; padding: 15px; border-radius: 12px; border: 2px solid #334155; background: #0f172a; color: white; font-size: 16px; box-sizing: border-box; outline: none; transition: 0.3s; }
                input:focus { border-color: #38bdf8; box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
                button { width: 100%; padding: 15px; border-radius: 12px; border: none; background: #38bdf8; color: #0f172a; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.3s; }
                button:hover { background: #7dd3fc; transform: translateY(-2px); }
                #displayCode { margin-top: 25px; padding: 20px; border-radius: 12px; background: #000; color: #10b981; font-size: 32px; font-weight: bold; letter-spacing: 4px; display: none; border: 2px dashed #10b981; }
                .loading { color: #facc15; font-weight: bold; margin-top: 15px; display: none; }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>DANI-MD</h1>
                <p>Pair your WhatsApp number easily</p>
                <div class="input-group">
                    <input type="number" id="phoneNumber" placeholder="e.g. 923259379507">
                </div>
                <button onclick="requestCode()">GENERATE CODE</button>
                <div id="loading" class="loading">CONNECTING TO WHATSAPP...</div>
                <div id="displayCode"></div>
            </div>

            <script>
                async function requestCode() {
                    const num = document.getElementById('phoneNumber').value;
                    const codeDiv = document.getElementById('displayCode');
                    const loadDiv = document.getElementById('loading');
                    
                    if(!num || num.length < 10) return alert('Sahi number enter karein!');
                    
                    codeDiv.style.display = 'none';
                    loadDiv.style.display = 'block';
                    
                    try {
                        const response = await fetch('/pair?number=' + num);
                        const data = await response.json();
                        loadDiv.style.display = 'none';
                        
                        if(data.code) {
                            codeDiv.style.display = 'block';
                            codeDiv.innerText = data.code;
                        } else {
                            alert(data.error || data.message || 'Error occurred');
                        }
                    } catch (e) {
                        loadDiv.style.display = 'none';
                        alert('Server error! Try again.');
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// BACKEND PAIRING LOGIC
app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    if (!phone) return res.json({ error: "Number missing!" });

    try {
        // Har baar naya session create hoga taake har user apna naya code le sakay
        const { state } = await useMultiFileAuthState('session_' + Math.random().toString(36).substring(7));
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
        });

        if (!sock.authState.creds.registered) {
            await delay(2000);
            const code = await sock.requestPairingCode(phone.replace(/[^0-9]/g, ''));
            res.json({ code: code });
        } else {
            res.json({ message: "Already Linked" });
        }
    } catch (e) {
        res.json({ error: "Server Busy, try again" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
