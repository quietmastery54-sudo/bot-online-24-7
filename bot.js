const mineflayer = require('mineflayer');
const express = require('express');

console.log('🚀 Starting Minecraft Bot for Aternos...');

// إعدادات السيرفر - تم التحديث للإصدار 1.21.4
const config = {
    host: 'server5498.aternos.me',
    port: 19306,
    username: 'ServerKeeper_' + Math.floor(Math.random() * 1000), // اسم عشوائي لتجنب التكرار
    version: '1.21.4', // ✅ الإصدار المدعوم
    auth: 'offline'
};

let bot = null;
let isConnected = false;

// إنشاء البوت
function createBot() {
    try {
        console.log(`🤖 Attempting connection to ${config.host}:${config.port}`);
        console.log(`📋 Using version: ${config.version}`);
        console.log(`👤 Bot username: ${config.username}`);
        
        bot = mineflayer.createBot(config);
        
        bot.on('login', () => {
            console.log('✅ Successfully connected to Aternos server!');
            console.log('🎮 Bot is now active and maintaining server...');
            isConnected = true;
        });
        
        bot.on('error', (err) => {
            console.log('❌ Bot error:', err.message);
            isConnected = false;
        });
        
        bot.on('end', () => {
            console.log('🔌 Disconnected from server');
            isConnected = false;
            console.log('🔄 Reconnecting in 15 seconds...');
            setTimeout(createBot, 15000);
        });
        
        bot.on('spawn', () => {
            console.log('📍 Bot spawned in world');
            isConnected = true;
            
            // نظام الحركة المنتظمة كل 25 ثانية
            setInterval(() => {
                if (bot.entity && isConnected) {
                    performMovement();
                }
            }, 25000);
            
            // نظام الأوامر كل 90 ثانية
            setInterval(() => {
                if (isConnected) {
                    sendCommand();
                }
            }, 90000);
            
            // نظام الرسائل كل دقيقتين
            setInterval(() => {
                if (isConnected) {
                    sendChat();
                }
            }, 120000);
            
            // نظام منع AFK كل 40 ثانية
            setInterval(() => {
                if (isConnected) {
                    preventAFK();
                }
            }, 40000);
        });
        
        bot.on('message', (message) => {
            const msg = message.toString();
            if (!msg.includes(config.username)) {
                console.log(`💬 ${msg}`);
            }
        });
        
        bot.on('kicked', (reason) => {
            console.log(`🚫 Kicked from server: ${reason}`);
            isConnected = false;
        });
        
    } catch (error) {
        console.log('❌ Failed to create bot:', error.message);
        console.log('🔄 Retrying in 20 seconds...');
        setTimeout(createBot, 20000);
    }
}

// نظام الحركة
function performMovement() {
    try {
        const movements = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
        const move = movements[Math.floor(Math.random() * movements.length)];
        const duration = 600 + Math.random() * 800;
        
        bot.setControlState(move, true);
        setTimeout(() => {
            bot.setControlState(move, false);
        }, duration);
        
        // تحريك الكاميرا بشكل عشوائي
        bot.look(
            Math.random() * Math.PI * 2 - Math.PI,
            Math.random() * 0.4 - 0.2,
            true
        );
        
        console.log(`🚶 Movement: ${move} for ${Math.round(duration)}ms`);
        
    } catch (error) {
        console.log('❌ Movement error:', error.message);
    }
}

// نظام الأوامر
function sendCommand() {
    try {
        const commands = ['/list', '/time query daytime', '/gamerule doDaylightCycle true'];
        const command = commands[Math.floor(Math.random() * commands.length)];
        bot.chat(command);
        console.log(`📝 Command: ${command}`);
    } catch (error) {
        console.log('❌ Command error:', error.message);
    }
}

// نظام الرسائل
function sendChat() {
    try {
        const messages = [
            'Server maintenance active!',
            'Keeping server online!',
            'Bot is working!',
            'All systems operational!',
            'Maintaining server activity!'
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        bot.chat(message);
        console.log(`💬 Chat: ${message}`);
    } catch (error) {
        console.log('❌ Chat error:', error.message);
    }
}

// نظام منع AFK
function preventAFK() {
    try {
        bot.setControlState('sneak', true);
        setTimeout(() => {
            bot.setControlState('sneak', false);
        }, 1000);
        console.log('🔄 AFK prevention activated');
    } catch (error) {
        console.log('❌ AFK prevention error:', error.message);
    }
}

// إنشاء خادم ويب للـ Ping والمراقبة
const app = express();

app.get('/', (req, res) => {
    res.json({
        status: 'Minecraft Bot Active',
        server: config.host,
        version: config.version,
        connected: isConnected,
        username: config.username,
        timestamp: new Date().toISOString()
    });
});

app.get('/ping', (req, res) => {
    res.json({ 
        status: 'active', 
        bot_connected: isConnected,
        timestamp: new Date().toISOString() 
    });
});

app.get('/status', (req, res) => {
    res.json({
        bot_status: isConnected ? 'connected' : 'disconnected',
        server: `${config.host}:${config.port}`,
        version: config.version,
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
    console.log(`📊 Monitor: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    console.log('🔗 URLs:');
    console.log(`   - Status: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/`);
    console.log(`   - Ping: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/ping`);
});

// نظام Uptime Ping الذاتي كل 4 دقائق
setInterval(() => {
    const http = require('http');
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/ping',
        method: 'GET',
        timeout: 10000
    };

    const req = http.request(options, (res) => {
        console.log('✅ Self-ping successful - ' + new Date().toLocaleTimeString());
    });
    
    req.on('error', (err) => {
        console.log('⚠️  Self-ping failed: ' + err.message);
    });
    
    req.on('timeout', () => {
        console.log('⏰ Self-ping timeout');
        req.destroy();
    });
    
    req.end();
}, 240000); // كل 4 دقائق

// بدء البوت بعد 3 ثواني
setTimeout(() => {
    console.log('🎯 Starting bot connection...');
    createBot();
}, 3000);

// معلومات التشغيل
console.log('\n✨ Bot Configuration:');
console.log(`   - Server: ${config.host}:${config.port}`);
console.log(`   - Version: ${config.version} ✅`);
console.log(`   - Username: ${config.username}`);
console.log(`   - Web Port: ${PORT}`);
console.log('⏳ Initializing...');
