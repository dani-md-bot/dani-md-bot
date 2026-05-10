const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const pino = require('pino');

const app = express();
const port = process.env.PORT || 8000;

app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    if (!phone) return res.json({ error: "Please provide a phone number with country code (e.g. 92325...)" });

    const { state, saveCreds } = await useMultiFileAuthState('session');
    
    try {
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ["Chrome (Linux)", "", ""]
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            phone = phone.replace(/[^0-9]/g, '');
            // WhatsApp se pairing code mangwane ki request
            const code = await sock.requestPairingCode(phone);
            res.json({ code: code }); // Ye aapko 8-digit code dikhayega
        } else {
            res.json({ message: "Bot is already connected!" });
        }
    } catch (err) {
        res.json({ error: "Internal Server Error", details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Pairing Server is running on port ${port}`);
});