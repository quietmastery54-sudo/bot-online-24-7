const mineflayer = require('mineflayer');
const express = require('express');

console.log('🚀 Starting Minecraft Bot for Aternos...');

// إعدادات السيرفر
const config = {
    host: 'server5498.aternos.me',
    port: 19306,
    username: 'ServerKeeper',
    version: '1.21.8',
    auth: 'offline'
};

// إنشاء البوت
function createBot() {
    try {
        const bot = mineflayer.createBot(config);
        
        bot.on('login', () => {
            console.log('✅ Connected to Aternos server!');
            console.log('🎮 Bot is now active and moving...');
        });
        
        bot.on('error', (err) => {
            console.log('❌ Connection error:', err.message);
        });
        
        bot.on('end', () => {
            console.log('🔌 Disconnected, reconnecting in 10 seconds...');
            setTimeout(createBot, 10000);
        });
        
        bot.on('spawn', () => {
            console.log('📍 Bot spawned in world');
            
            // حركات منتظمة كل 20 ثانية
            setInterval(() => {
                if (bot.entity) {
                    // حركة عشوائية
                    const moves = ['forward', 'back', 'left', 'right', 'jump'];
                    const move = moves[Math.floor(Math.random() * moves.length)];
                    
                    bot.setControlState(move, true);
                    setTimeout(() => {
                        bot.setControlState(move, false);
                    }, 800);
                    
                    // تحريك الكاميرا
                    bot.look(Math.random() * Math.PI * 2 - Math.PI, Math.random() * 0.5 - 0.25, true);
                    
                    console.log(`🚶 Movement: ${move}`);
                }
            }, 20000);
            
            // أوامر كل دقيقتين
            setInterval(() => {
                bot.chat('/list');
                console.log('📝 Sent command: /list');
            }, 120000);
            
            // رسائل شات كل 3 دقائق
            setInterval(() => {
                const messages = ['Active!', 'Server maintenance!', 'All good!'];
                const msg = messages[Math.floor(Math.random() * messages.length)];
                bot.chat(msg);
                console.log(`💬 Chat: ${msg}`);
            }, 180000);
        });
        
        bot.on('message', (message) => {
            console.log(`💬 ${message.toString()}`);
        });
        
        return bot;
    } catch (error) {
        console.log('❌ Bot creation failed:', error.message);
        setTimeout(createBot, 10000);
    }
}

// إنشاء خادم ويب بسيط للـ Ping
const app = express();
app.get('/', (req, res) => {
    res.send('Minecraft Bot is Running! 🎮');
});

app.get('/ping', (req, res) => {
    res.json({ status: 'active', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
    console.log(`📊 Monitor: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
});

// Ping ذاتي كل 5 دقائق
setInterval(() => {
    const req = require('http').request({
        hostname: 'localhost',
        port: PORT,
        path: '/ping',
        method: 'GET'
    }, () => {
        console.log('✅ Self-ping successful');
    });
    
    req.on('error', () => {
        console.log('⚠️  Self-ping failed');
    });
    
    req.end();
}, 300000);

// بدء البوت
console.log('🤖 Creating Minecraft bot...');
createBot();

console.log('🎯 Bot should connect shortly...');
console.log('📋 Server: server5498.aternos.me:19306');
console.log('⚡ Version: 1.21.8');
