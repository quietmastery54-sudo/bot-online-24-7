const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');
const http = require('http');

// إعدادات السيرفر الصحيحة - Aternos
const SERVER_CONFIG = {
    host: 'server55540.aternos.me', // ✅ العنوان الصحيح
    port: 19306, // ✅ المنفذ الصحيح
    username: 'Bot_Online_24_7',
    version: '1.21.4',
    auth: 'offline'
};

// إعدادات التوقيت
const TIMING_CONFIG = {
    consoleCommandInterval: 120000,
    movementInterval: 30000,
    reconnectDelay: 10000,
    afkCheckInterval: 60000,
    selfPingInterval: 300000,
    healthCheckInterval: 30000
};

class AternosKeepAliveBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.uptime = Date.now();
        this.serverOnline = false;
        this.app = express();
        this.server = null;
        this.lastError = null;
        
        console.log('🎮 بدء تشغيل بوت Aternos...');
        console.log('📋 الإعدادات الصحيحة:');
        console.log(`   - السيرفر: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
        console.log(`   - الإصدار: ${SERVER_CONFIG.version}`);
        console.log(`   - اسم البوت: ${SERVER_CONFIG.username}`);
        
        this.setupWebServer();
        this.initBot();
    }

    /**
     * إعداد خادم ويب
     */
    setupWebServer() {
        const port = process.env.PORT || 3000;

        this.app.use(express.json());

        this.app.get('/', (req, res) => {
            res.json({
                status: this.isConnected ? '🟢 متصل' : '🔴 غير متصل',
                minecraft: {
                    connected: this.isConnected,
                    server: SERVER_CONFIG.host,
                    botName: SERVER_CONFIG.username,
                    version: SERVER_CONFIG.version,
                    serverOnline: this.serverOnline,
                    lastError: this.lastError
                },
                system: {
                    uptime: this.formatUptime(Date.now() - this.uptime),
                    reconnectAttempts: this.reconnectAttempts
                },
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/ping', (req, res) => {
            res.json({ 
                status: 'pong', 
                minecraftConnected: this.isConnected,
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: this.isConnected ? 'healthy' : 'unhealthy',
                minecraftConnected: this.isConnected,
                uptime: Date.now() - this.uptime,
                lastError: this.lastError
            });
        });

        this.server = this.app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 خادم الويب يعمل على المنفذ ${port}`);
            console.log(`📊 رابط المراقبة: http://localhost:${port}`);
        });

        this.startSelfPinging();
    }

    /**
     * بدء إرسال Ping الذاتي
     */
    startSelfPinging() {
        const port = process.env.PORT || 3000;
        
        setTimeout(() => this.selfPing(port), 2000);
        
        setInterval(() => {
            this.selfPing(port);
        }, TIMING_CONFIG.selfPingInterval);

        console.log('📡 نظام Ping الذاتي مفعل');
    }

    /**
     * إرسال Ping ذاتي
     */
    selfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ Ping: ${new Date().toLocaleTimeString()}`);
        });

        req.on('error', (err) => {
            console.log('⚠️  فشل في Ping الذاتي');
        });

        req.end();
    }

    /**
     * تهيئة البوت مع الإعدادات الصحيحة
     */
    initBot() {
        console.log('🚀 جاري الاتصال بـ Aternos...');
        
        try {
            // التأكد من استخدام الإعدادات الصحيحة
            console.log('🔧 إعدادات الاتصال:');
            console.log(`   - Host: ${SERVER_CONFIG.host}`);
            console.log(`   - Port: ${SERVER_CONFIG.port}`);
            console.log(`   - Version: ${SERVER_CONFIG.version}`);
            
            this.bot = mineflayer.createBot(SERVER_CONFIG);
            
            this.bot.loadPlugin(pathfinder);
            this.setupEventHandlers();
            this.setupMovementSystem();
            this.setupPeriodicTasks();
            
        } catch (error) {
            console.error('❌ خطأ في إنشاء البوت:', error.message);
            this.lastError = error.message;
            this.scheduleReconnect();
        }
    }

    /**
     * إعداد معالجات الأحداث
     */
    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('✅ تم الاتصال بـ Aternos بنجاح!');
            this.isConnected = true;
            this.serverOnline = true;
            this.reconnectAttempts = 0;
            this.lastError = null;
            
            const pos = this.bot.entity.position;
            console.log(`📍 موقع البوت: X:${pos.x.toFixed(2)}, Y:${pos.y.toFixed(2)}, Z:${pos.z.toFixed(2)}`);
            
            setTimeout(() => {
                if (this.isConnected) {
                    this.bot.chat('Bot Online - Server Active! 🟢');
                }
            }, 3000);
        });

        this.bot.on('end', (reason) => {
            console.log(`🔌 انقطع الاتصال: ${reason}`);
            this.isConnected = false;
            this.serverOnline = false;
            this.lastError = reason;
            this.scheduleReconnect();
        });

        this.bot.on('error', (err) => {
            console.error('❌ خطأ في البوت:', err.message);
            this.isConnected = false;
            this.serverOnline = false;
            this.lastError = err.message;
            this.scheduleReconnect();
        });

        this.bot.on('kicked', (reason) => {
            console.log(`🚫 تم طرد البوت: ${reason}`);
            this.lastError = `Kicked: ${reason}`;
            this.scheduleReconnect();
        });

        this.bot.on('message', (message) => {
            const msg = message.toString();
            console.log(`💬 شات: ${msg}`);
        });

        this.bot.on('spawn', () => {
            console.log('🎮 البوت ظهر في العالم');
            this.isConnected = true;
        });

        console.log('✅ تم إعداد معالجات الأحداث');
    }

    /**
     * إعداد نظام الحركة
     */
    setupMovementSystem() {
        this.bot.once('spawn', () => {
            const movements = new Movements(this.bot);
            this.bot.pathfinder.setMovements(movements);
            console.log('🎯 نظام الحركة جاهز');
        });
    }

    /**
     * إعداد المهام الدورية
     */
    setupPeriodicTasks() {
        setInterval(() => {
            if (this.isConnected) {
                this.sendConsoleCommands();
            }
        }, TIMING_CONFIG.consoleCommandInterval);

        setInterval(() => {
            if (this.isConnected) {
                this.performRandomMovement();
            }
        }, TIMING_CONFIG.movementInterval);

        setInterval(() => {
            if (this.isConnected) {
                this.afkPreventionRoutine();
            }
        }, TIMING_CONFIG.afkCheckInterval);

        setInterval(() => {
            this.healthCheck();
        }, TIMING_CONFIG.healthCheckInterval);

        console.log('✅ تم إعداد المهام الدورية');
    }

    /**
     * إرسال أوامر إلى الكونسول
     */
    sendConsoleCommands() {
        try {
            const safeCommands = [
                '/list',
                '/time query daytime',
                '/gamerule doDaylightCycle true',
                '/say Server Active! 🟢'
            ];
            
            const randomCommand = safeCommands[Math.floor(Math.random() * safeCommands.length)];
            this.bot.chat(randomCommand);
            console.log(`📝 أمر: ${randomCommand}`);
            
        } catch (error) {
            console.error('❌ خطأ في الأمر:', error.message);
        }
    }

    /**
     * حركات عشوائية
     */
    performRandomMovement() {
        if (!this.bot.entity) return;

        try {
            const movements = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
            const randomMove = movements[Math.floor(Math.random() * movements.length)];
            const duration = Math.random() * 1000 + 500;
            
            this.bot.setControlState(randomMove, true);
            setTimeout(() => {
                this.bot.setControlState(randomMove, false);
            }, duration);
            
            this.bot.look(
                Math.random() * Math.PI * 2 - Math.PI,
                Math.random() * Math.PI - Math.PI / 2,
                true
            );
            
        } catch (error) {
            console.error('❌ خطأ في الحركة:', error.message);
        }
    }

    /**
     * روتين منع الخروج التلقائي
     */
    afkPreventionRoutine() {
        try {
            this.bot.setControlState('sneak', true);
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
            }, 1000);
        } catch (error) {
            console.error('❌ خطأ في النشاط:', error.message);
        }
    }

    /**
     * فحص صحة النظام
     */
    healthCheck() {
        console.log('\n❤️  فحص صحة النظام:');
        console.log(`   - حالة الاتصال: ${this.isConnected ? '🟢 متصل' : '🔴 غير متصل'}`);
        console.log(`   - وقت التشغيل: ${this.formatUptime(Date.now() - this.uptime)}`);
        console.log(`   - محاولات إعادة الاتصال: ${this.reconnectAttempts}`);
        if (this.lastError) {
            console.log(`   - آخر خطأ: ${this.lastError}`);
        }
    }

    /**
     * جدولة إعادة الاتصال
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log(`🛑 توقف المحاولات بعد ${this.maxReconnectAttempts} محاولة`);
            console.log('⏳ جاري إعادة المحاولة بعد 10 دقائق...');
            
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.scheduleReconnect();
            }, 600000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(TIMING_CONFIG.reconnectDelay * this.reconnectAttempts, 60000);
        
        console.log(`⏳ إعادة الاتصال بعد ${delay/1000} ثانية (المحاولة ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            console.log('🔄 محاولة إعادة الاتصال...');
            this.initBot();
        }, delay);
    }

    /**
     * تنسيق وقت التشغيل
     */
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours} ساعة, ${minutes % 60} دقيقة`;
        } else if (minutes > 0) {
            return `${minutes} دقيقة, ${seconds % 60} ثانية`;
        } else {
            return `${seconds} ثانية`;
        }
    }

    /**
     * إيقاف البوت بشكل آمن
     */
    safeShutdown() {
        console.log('🛑 إيقاف البوت...');
        if (this.bot && this.isConnected) {
            this.bot.quit();
        }
        if (this.server) {
            this.server.close();
        }
        process.exit(0);
    }
}

// معالجات الإشارات
process.on('SIGINT', () => {
    console.log('🛑 تم استقبال إشارة الإيقاف...');
    botInstance.safeShutdown();
});

process.on('SIGTERM', () => {
    console.log('🛑 تم استقبال إشارة الإيقاف...');
    botInstance.safeShutdown();
});

process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير معالج:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ رفض غير معالج:', reason);
});

// بدء التشغيل
const botInstance = new AternosKeepAliveBot();
