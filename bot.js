const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');

// إعدادات السيرفر مع ViaVersion - يمكن استخدام أي إصدار
const SERVER_CONFIG = {
    host: 'server5498.aternos.me',
    port: 19306,
    username: 'Active_Player_Bot',
    version: '1.21.8', // أو أي إصدار تريده - ViaVersion سيتعامل معه
    auth: 'offline'
};

// يمكنك حتى تجربة إصدارات أخرى إذا أردت:
const ALTERNATIVE_VERSIONS = [
    '1.21.8',
    '1.21.4', 
    '1.21.1',
    '1.20.4',
    '1.19.4',
    false // اكتشاف تلقائي
];

class ViaVersionBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.currentVersionIndex = 0;
        this.uptime = Date.now();
        this.app = express();
        this.server = null;
        
        console.log('🚀 بدء تشغيل البوت مع ViaVersion...');
        console.log('📋 ViaVersion مفعل - يدعم جميع الإصدارات');
        
        this.setupWebServer();
        this.initBot();
    }

    setupWebServer() {
        const port = process.env.PORT || 3000;

        this.app.get('/', (req, res) => {
            res.json({
                status: 'Bot Active - ViaVersion Supported',
                connected: this.isConnected,
                server: SERVER_CONFIG.host,
                version: SERVER_CONFIG.version,
                viaVersion: true,
                uptime: Date.now() - this.uptime
            });
        });

        this.app.get('/ping', (req, res) => {
            res.json({ 
                status: 'pong', 
                viaVersion: true,
                timestamp: new Date().toISOString() 
            });
        });

        this.server = this.app.listen(port, () => {
            console.log(`🌐 خادم ويب نشط على المنفذ ${port}`);
        });

        // Ping كل 4 دقائق
        setInterval(() => {
            this.selfPing(port);
        }, 240000);
    }

    selfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET'
        };

        const req = http.request(options, () => {
            console.log(`✅ Ping ناجح - ${new Date().toLocaleTimeString()}`);
        });

        req.on('error', () => {
            console.log('⚠️  Ping فاشل');
        });

        req.end();
    }

    initBot() {
        try {
            console.log(`🤖 جرب الاتصال بإصدار: ${SERVER_CONFIG.version}`);
            
            this.bot = mineflayer.createBot(SERVER_CONFIG);
            this.setupEventHandlers();
            this.setupBotTasks();
            
        } catch (error) {
            console.error('❌ فشل إنشاء البوت:', error.message);
            this.tryAlternativeVersion();
        }
    }

    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('🎉 تم الاتصال بنجاح عبر ViaVersion!');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            const pos = this.bot.entity.position;
            console.log(`📍 الموقع: X:${pos.x}, Y:${pos.y}, Z:${pos.z}`);
            
            setTimeout(() => {
                this.bot.chat('Hello! Bot connected via ViaVersion!');
            }, 3000);
        });

        this.bot.on('end', (reason) => {
            console.log(`🔌 انقطع الاتصال: ${reason}`);
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.bot.on('error', (err) => {
            console.error('❌ خطأ:', err.message);
            this.isConnected = false;
            
            // إذا كان الخطأ متعلقاً بالإصدار، جرب إصداراً آخر
            if (err.message.includes('version') || err.message.includes('Version')) {
                this.tryAlternativeVersion();
            } else {
                this.scheduleReconnect();
            }
        });

        this.bot.on('message', (message) => {
            const msg = message.toString();
            console.log(`💬 ${msg}`);
        });

        this.bot.on('spawn', () => {
            console.log('🔄 البوت ظهر في العالم');
            this.isConnected = true;
        });
    }

    tryAlternativeVersion() {
        this.currentVersionIndex++;
        
        if (this.currentVersionIndex < ALTERNATIVE_VERSIONS.length) {
            const newVersion = ALTERNATIVE_VERSIONS[this.currentVersionIndex];
            console.log(`🔄 جرب إصدار بديل: ${newVersion}`);
            
            // أنشئ إعدادات جديدة بالإصدار البديل
            const newConfig = {
                ...SERVER_CONFIG,
                version: newVersion
            };
            
            setTimeout(() => {
                try {
                    if (this.bot) this.bot.end();
                    this.bot = mineflayer.createBot(newConfig);
                    this.setupEventHandlers();
                    this.setupBotTasks();
                } catch (error) {
                    console.error('❌ فشل الإصدار البديل:', error.message);
                    this.tryAlternativeVersion();
                }
            }, 3000);
            
        } else {
            console.log('🛑 جربت جميع الإصدارات، جاري إعادة المحاولة...');
            this.scheduleReconnect();
        }
    }

    setupBotTasks() {
        // حركة كل 20 ثانية
        setInterval(() => {
            if (this.isConnected && this.bot.entity) {
                this.performMovement();
            }
        }, 20000);

        // أوامر كل 90 ثانية
        setInterval(() => {
            if (this.isConnected) {
                this.sendCommand();
            }
        }, 90000);

        // رسائل شات كل دقيقتين
        setInterval(() => {
            if (this.isConnected) {
                this.sendChat();
            }
        }, 120000);

        // منع AFK كل 45 ثانية
        setInterval(() => {
            if (this.isConnected) {
                this.afkPrevention();
            }
        }, 45000);

        // فحص الصحة كل 30 ثانية
        setInterval(() => {
            this.healthCheck();
        }, 30000);
    }

    performMovement() {
        try {
            const movements = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
            const randomMove = movements[Math.floor(Math.random() * movements.length)];
            
            this.bot.setControlState(randomMove, true);
            setTimeout(() => {
                this.bot.setControlState(randomMove, false);
            }, 800);
            
            // حركة عشوائية للكاميرا
            this.bot.look(
                Math.random() * Math.PI * 2 - Math.PI,
                (Math.random() * 0.5) - 0.25,
                true
            );
            
            console.log(`🚶 حركة: ${randomMove}`);
            
        } catch (error) {
            console.error('❌ خطأ في الحركة:', error.message);
        }
    }

    sendCommand() {
        try {
            const commands = ['/list', '/time query daytime', '/gamerule doDaylightCycle true'];
            const randomCommand = commands[Math.floor(Math.random() * commands.length)];
            this.bot.chat(randomCommand);
            console.log(`📝 أمر: ${randomCommand}`);
        } catch (error) {
            console.error('❌ خطأ في الأمر:', error.message);
        }
    }

    sendChat() {
        try {
            const messages = [
                'ViaVersion works great!',
                'Bot connected successfully!',
                'Server maintenance active!',
                'Multi-version support!'
            ];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            this.bot.chat(randomMsg);
            console.log(`💬 رسالة: ${randomMsg}`);
        } catch (error) {
            console.error('❌ خطأ في الرسالة:', error.message);
        }
    }

    afkPrevention() {
        try {
            this.bot.setControlState('sneak', true);
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
            }, 1000);
        } catch (error) {
            console.error('❌ خطأ في منع AFK:', error.message);
        }
    }

    healthCheck() {
        console.log('\n❤️  فحص صحة:');
        console.log(`   - الحالة: ${this.isConnected ? '🟢 متصل' : '🔴 غير متصل'}`);
        console.log(`   - الإصدار: ${SERVER_CONFIG.version}`);
        console.log(`   - ViaVersion: ✅ مفعل`);
        console.log(`   - محاولات إعادة الاتصال: ${this.reconnectAttempts}`);
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= 5) {
            console.log('🛑 وصل للحد الأقصى، انتظر 5 دقائق...');
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.currentVersionIndex = 0;
                this.scheduleReconnect();
            }, 300000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(8000 * this.reconnectAttempts, 30000);
        
        console.log(`⏳ إعادة اتصال بعد ${delay/1000}ث (المحاولة ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            console.log('🔄 إعادة الاتصال...');
            this.currentVersionIndex = 0;
            this.initBot();
        }, delay);
    }
}

// بدء التشغيل
console.log('🎮 تشغيل البوت مع دعم ViaVersion...');
const bot = new ViaVersionBot();

// إيقاف آمن
process.on('SIGINT', () => {
    console.log('🛑 إيقاف...');
    if (bot.bot) bot.bot.quit();
    process.exit(0);
});
