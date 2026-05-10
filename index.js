process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    downloadContentFromMessage, 
    getContentType,
    delay 
} = require("@whiskeysockets/baileys")
const pino = require('pino')
const fs = require('fs')
const axios = require('axios')

// --- Bot Configuration & Features ---
let botSettings = {
    botName: "DANI-MD",
    ownerName: "Dani Baloch",
    version: "1.1.0",
    prefix: ".",
    autoStatusView: true,  // Status khud ba khud dekhega
    autoStatusLike: true,  // Status par 💚 reaction dega
    autoRead: false,
    publicMode: true,
    botDp: "https://https://ibb.co/JRRcMGsj" 
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: ["Dani-MD", "MacOS", "3.0.0"]
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection } = update
        if (connection === 'open') console.log(`🚀 ${botSettings.botName} v${botSettings.version} is Online!`)
        if (connection === 'close') startBot()
    })

    // --- AUTO STATUS VIEW & LIKE ---
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return

        const sender = msg.key.remoteJid
        const fromMe = msg.key.fromMe

        // Status Auto-View Logic
        if (sender === 'status@broadcast' && botSettings.autoStatusView) {
            await sock.readMessages([msg.key])
            console.log(`✅ Viewed Status from: ${msg.pushName}`)
            
            if (botSettings.autoStatusLike) {
                await sock.sendMessage(sender, { react: { text: '💚', key: msg.key } }, { statusJidList: [msg.key.participant] })
            }
        }

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || ''
        const prefix = botSettings.prefix
        if (!text.startsWith(prefix)) return

        const command = text.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
        const args = text.trim().split(/\s+/).slice(1)
        const q = args.join(" ")

        // --- COMMANDS ---
        switch (command) {
            case 'menu':
                const menuText = `*╭┈───〔 ${botSettings.botName} 〕┈───⊷*
*├▢ 👤 OWNER:* ${botSettings.ownerName}
*├▢ 🆙 VERSION:* ${botSettings.version}
*├▢ 🛠️ PREFIX:* ${prefix}
*├▢ 🟢 STATUS VIEW:* ${botSettings.autoStatusView ? 'ON' : 'OFF'}
*╰───────────────────⊷*

\`『 AUTOMATION 』\`
*┋ ⬡ .autostatus [on/off]*
*┋ ⬡ .autolike [on/off]*

\`『 DOWNLOADERS 』\`
*┋ ⬡ .tt [tiktok_link]*
*┋ ⬡ .ytv [video_link]*
*┋ ⬡ .song [audio_name]*

\`『 UTILS 』\`
*┋ ⬡ .ping*
*┋ ⬡ .sticker*
*┋ ⬡ .runtime*

> *© 2026 Powered by Dani Baloch*`
                try {
                    await sock.sendMessage(sender, { image: { url: botSettings.botDp }, caption: menuText }, { quoted: msg })
                } catch {
                    await sock.sendMessage(sender, { text: menuText }, { quoted: msg })
                }
                break

            case 'ping':
                const start = new Date().getTime()
                await sock.sendMessage(sender, { text: `⚡ *Testing Speed...*` }, { quoted: msg })
                const end = new Date().getTime()
                const responseTime = end - start
                
                const pingMsg = `*🚀 ${botSettings.botName} v${botSettings.version} is Active!*
                
*📡 Latency:* ${responseTime}ms
*💻 Server:* Koyeb Cloud
*📟 Status:* High Performance`
                await sock.sendMessage(sender, { text: pingMsg }, { quoted: msg })
                break

            case 'autostatus':
                if (!fromMe) return
                botSettings.autoStatusView = args[0] === 'on'
                await sock.sendMessage(sender, { text: `✅ Auto Status View is now ${args[0]}` })
                break

            case 'runtime':
                const uptime = process.uptime()
                const hours = Math.floor(uptime / 3600)
                const minutes = Math.floor((uptime % 3600) / 60)
                const seconds = Math.floor(uptime % 60)
                await sock.sendMessage(sender, { text: `⏱️ *Runtime:* ${hours}h ${minutes}m ${seconds}s` }, { quoted: msg })
                break
        }
    })
}

startBot()