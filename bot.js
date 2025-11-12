const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');
const http = require('http');

// إعدادات السيرفر الأساسية
const SERVER_CONFIG = {
    host: 'server55540.aternos.me',
    port: 19306,
    username: 'Bot Online 24/7',
    version: '1.21.8',
    auth: 'offline'
};

// إعدادات التوقيت للعمليات الدورية
const TIMING_CONFIG = {
    consoleCommandInterval: 120000,    // كل دقيقتين
    movementInterval: 30000,           // كل 30 ثانية
    reconnectDelay: 5000,              // 5 ثواني قبل إعادة الاتصال
    afkCheckInterval: 60000,           // كل دقيقة للتحقق من النشاط
    selfPingInterval: 300000,          // كل 5 دقائق لإرسال Ping ذاتي
    healthCheckInterval: 30000         // كل 30 ثانية للتحقق من صحة البوت
};

class AternosKeepAliveBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 15;
        this.uptime = Date.now();
        this.serverOnline = false;
        this.app = express();
        this.server = null;
        
        // إعداد خادم ويب للـ Ping والمراقبة
        this.setupWebServer();
        this.initBot();
    }

    /**
     * إعداد خادم ويب للـ Ping والمراقبة
     */
    setupWebServer() {
        const port = process.env.PORT || 3000;

        // middleware
        this.app.use(express.json());

        // صفحة الرئيسية لعرض حالة البوت
        this.app.get('/', (req, res) => {
            const status = this.isConnected ? '🟢 متصل' : '🔴 غير متصل';
            const uptime = this.formatUptime(Date.now() - this.uptime);
            
            res.json({
                status: 'Bot Online 24/7 - يعمل',
                minecraft: {
                    connected: this.isConnected,
                    server: SERVER_CONFIG.host,
                    botName: SERVER_CONFIG.username,
                    version: SERVER_CONFIG.version,
                    serverOnline: this.serverOnline
                },
                system: {
                    uptime: uptime,
                    reconnectAttempts: this.reconnectAttempts,
                    memory: process.memoryUsage()
                },
                timestamp: new Date().toISOString()
            });
        });

        // نقطة نهاية للـ Ping
        this.app.get('/ping', (req, res) => {
            res.json({ 
                status: 'pong', 
                timestamp: new Date().toISOString(),
                minecraft: {
                    connected: this.isConnected,
                    version: SERVER_CONFIG.version
                }
            });
        });

        // نقطة نهاية لصحة البوت
        this.app.get('/health', (req, res) => {
            const healthStatus = this.isConnected ? 'healthy' : 'unhealthy';
            res.json({
                status: healthStatus,
                minecraftConnected: this.isConnected,
                uptime: Date.now() - this.uptime
            });
        });

        // نقطة نهاية لإعادة تشغيل البوت
        this.app.post('/restart', (req, res) => {
            res.json({ status: 'restarting', message: 'جاري إعادة تشغيل البوت...' });
            console.log('🔄 طلب إعادة تشغيل عبر HTTP...');
            this.restartBot();
        });

        // بدء الخادم
        this.server = this.app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 خادم الويب يعمل على المنفذ ${port}`);
            console.log(`📊 يمكنك مراقبة البوت عبر:`);
            console.log(`   → http://localhost:${port}`);
            console.log(`   → http://localhost:${port}/ping`);
            console.log(`   → http://localhost:${port}/health`);
        });

        // بدء إرسال Ping الذاتي
        this.startSelfPinging();
    }

    /**
     * بدء إرسال Ping الذاتي لمنع توقف السيرفر
     */
    startSelfPinging() {
        // إرسال ping فوري عند البدء
        this.selfPing();
        
        // ثم تكرار كل 5 دقائق
        setInterval(() => {
            this.selfPing();
        }, TIMING_CONFIG.selfPingInterval);

        console.log('📡 نظام Ping الذاتي مفعل (كل 5 دقائق)');
    }

    /**
     * إرسال Ping ذاتي للحفاظ على نشاط السيرفر
     */
    async selfPing() {
        try {
            const port = process.env.PORT || 3000;
            
            // استخدام الرابط الخارجي إذا كان متوفراً (للمنصات السحابية)
            const baseUrl = process.env.RAILWAY_STATIC_URL || `http://localhost:${port}`;
            
            console.log(`📡 جاري إرسال Ping ذاتي إلى: ${baseUrl}`);
            
            const options = {
                hostname: new URL(baseUrl).hostname,
                port: new URL(baseUrl).port || (baseUrl.startsWith('https') ? 443 : 80),
                path: '/ping',
                method: 'GET',
                timeout: 10000
            };
            
            // استخدام http أو https حسب الرابط
            const protocol = baseUrl.startsWith('https') ? require('https') : require('http');
            
            const req = protocol.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    console.log(`✅ تم إرسال Ping ذاتي بنجاح: ${new Date().toLocaleTimeString()}`);
                });
            });
            
            req.on('error', (err) => {
                console.error('❌ فشل في Ping الذاتي:', err.message);
                
                // محاولة بديلة باستخدام localhost
                if (baseUrl !== `http://localhost:${port}`) {
                    console.log('🔄 جاري المحاولة باستخدام localhost...');
                    this.alternativeSelfPing(port);
                }
            });
            
            req.on('timeout', () => {
                console.error('⏰ انتهت مهلة Ping الذاتي');
                req.destroy();
            });
            
            req.end();
            
        } catch (error) {
            console.error('❌ خطأ في نظام Ping الذاتي:', error.message);
        }
    }

    /**
     * طريقة بديلة لإرسال Ping الذاتي باستخدام localhost
     */
    alternativeSelfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ تم إرسال Ping ذاتي (بديل): ${new Date().toLocaleTimeString()}`);
        });

        req.on('error', (err) => {
            console.error('❌ فشل في Ping الذاتي البديل:', err.message);
        });

        req.on('timeout', () => {
            console.error('⏰ انتهت مهلة Ping الذاتي البديل');
            req.destroy();
        });

        req.end();
    }

    /**
     * تهيئة البوت وإعداد جميع الأحداث والمراقبات
     */
    initBot() {
        try {
            console.log('🚀 جاري تهيئة البوت لإصدار 1.21.8...');
            console.log(`🎯 السيرفر: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
            
            this.bot = mineflayer.createBot(SERVER_CONFIG);
            
            // تحميل plugins إضافية
            this.bot.loadPlugin(pathfinder);
            
            this.setupEventHandlers();
            this.setupMovementSystem();
            this.setupPeriodicTasks();
            this.startHealthMonitoring();
            
        } catch (error) {
            console.error('❌ خطأ في تهيئة البوت:', error.message);
            this.scheduleReconnect();
        }
    }

    /**
     * إعادة تشغيل البوت
     */
    restartBot() {
        console.log('🔄 إعادة تشغيل البوت...');
        if (this.bot) {
            this.bot.end();
        }
        setTimeout(() => {
            this.initBot();
        }, 2000);
    }

    /**
     * بدء مراقبة صحة النظام
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.healthCheck();
        }, TIMING_CONFIG.healthCheckInterval);

        console.log('❤️  نظام مراقبة الصحة مفعل');
    }

    /**
     * فحص صحة البوت والنظام
     */
    healthCheck() {
        console.log('❤️  فحص صحة النظام:');
        console.log(`   - حالة الاتصال: ${this.isConnected ? '🟢 متصل' : '🔴 غير متصل'}`);
        console.log(`   - وقت التشغيل: ${this.formatUptime(Date.now() - this.uptime)}`);
        console.log(`   - محاولات إعادة الاتصال: ${this.reconnectAttempts}`);
    }

    /**
     * تنسيق وقت التشغيل بشكل مقروء
     */
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} يوم, ${hours % 24} ساعة, ${minutes % 60} دقيقة`;
        } else if (hours > 0) {
            return `${hours} ساعة, ${minutes % 60} دقيقة, ${seconds % 60} ثانية`;
        } else if (minutes > 0) {
            return `${minutes} دقيقة, ${seconds % 60} ثانية`;
        } else {
            return `${seconds} ثانية`;
        }
    }

    /**
     * إعداد معالجات الأحداث للبوت
     */
    setupEventHandlers() {
        // حدث الاتصال الناجح
        this.bot.on('login', () => {
            console.log('✅ تم الاتصال بالسيرفر بنجاح!');
            this.isConnected = true;
            this.serverOnline = true;
            this.reconnectAttempts = 0;
            
            const pos = this.bot.entity.position;
            console.log(`📍 موقع البوت: X:${pos.x.toFixed(2)}, Y:${pos.y.toFixed(2)}, Z:${pos.z.toFixed(2)}`);
            
            // إرسال رسالة ترحيب
            setTimeout(() => {
                this.bot.chat('مرحباً! البوت يعمل الآن للحفاظ على نشاط السيرفر.');
            }, 3000);
        });

        // حدث عند الخروج
        this.bot.on('end', (reason) => {
            console.log(`🔌 انقطع الاتصال بالسيرفر: ${reason}`);
            this.isConnected = false;
            this.serverOnline = false;
            this.scheduleReconnect();
        });

        // حدث عند حدوث خطأ
        this.bot.on('error', (err) => {
            console.error('❌ حدث خطأ في البوت:', err.message);
            this.isConnected = false;
            this.serverOnline = false;
        });

        // حدث عند ظهور رسالة في الشات
        this.bot.on('message', (message) => {
            const msg = message.toString();
            console.log(`💬 شات: ${msg}`);
            
            // الرد على بعض الأوامر الأساسية
            if (msg.includes('!ping')) {
                this.bot.chat('🏓 Pong! البوت يعمل بشكل طبيعي.');
            }
            
            if (msg.includes('!status')) {
                const uptime = this.formatUptime(Date.now() - this.uptime);
                this.bot.chat(`🟢 البوت يعمل منذ: ${uptime}`);
            }
        });

        console.log('✅ تم إعداد معالجات الأحداث بنجاح');
    }

    /**
     * إعداد نظام الحركة للمشي العشوائي
     */
    setupMovementSystem() {
        this.bot.once('spawn', () => {
            const movements = new Movements(this.bot);
            this.bot.pathfinder.setMovements(movements);
            
            console.log('🎯 نظام الحركة جاهز لإصدار 1.21.8');
        });
    }

    /**
     * إعداد المهام الدورية للحفاظ على نشاط السيرفر
     */
    setupPeriodicTasks() {
        // إرسال أوامر إلى الكونسول بشكل دوري
        setInterval(() => {
            if (this.isConnected) {
                this.sendConsoleCommands();
            }
        }, TIMING_CONFIG.consoleCommandInterval);

        // حركة دورية لمنع الخروج التلقائي
        setInterval(() => {
            if (this.isConnected) {
                this.performRandomMovement();
            }
        }, TIMING_CONFIG.movementInterval);

        // التحقق من النشاط بشكل دوري
        setInterval(() => {
            if (this.isConnected) {
                this.afkPreventionRoutine();
            }
        }, TIMING_CONFIG.afkCheckInterval);

        console.log('✅ تم إعداد المهام الدورية بنجاح');
    }

    /**
     * إرسال أوامر إلى الكونسول للحفاظ على نشاط السيرفر
     */
    sendConsoleCommands() {
        try {
            // أوامر آمنة وغير مؤذية للحفاظ على النشاط
            const safeCommands = [
                '/list',
                '/time query daytime',
                '/gamerule doDaylightCycle true'
            ];
            
            const randomCommand = safeCommands[Math.floor(Math.random() * safeCommands.length)];
            this.bot.chat(randomCommand);
            
            console.log(`📝 تم إرسال أمر: ${randomCommand}`);
            
        } catch (error) {
            console.error('❌ خطأ في إرسال الأمر:', error.message);
        }
    }

    /**
     * تنفيذ حركات عشوائية لمنع الخروج التلقائي
     */
    performRandomMovement() {
        if (!this.bot.entity) return;

        try {
            const movements = [
                'forward',
                'back',
                'left',
                'right',
                'jump',
                'sneak'
            ];
            
            const randomMove = movements[Math.floor(Math.random() * movements.length)];
            const duration = Math.random() * 1000 + 500; // بين 0.5 و 1.5 ثانية
            
            this.bot.setControlState(randomMove, true);
            
            setTimeout(() => {
                this.bot.setControlState(randomMove, false);
                console.log(`🎮 حركة: ${randomMove} لمدة ${duration}ms`);
            }, duration);
            
            // تحريك الكاميرا بشكل عشوائي
            this.bot.look(
                Math.random() * Math.PI * 2 - Math.PI, // yaw
                Math.random() * Math.PI - Math.PI / 2,  // pitch
                true
            );
            
        } catch (error) {
            console.error('❌ خطأ في الحركة:', error.message);
        }
    }

    /**
     * روتين إضافي لمنع الخروج التلقائي
     */
    afkPreventionRoutine() {
        try {
            // تبديل بين الوقوف والجلوس
            this.bot.setControlState('sneak', true);
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
            }, 1000);
            
            console.log('🔄 تم تنفيذ روتين منع الخروج التلقائي');
            
        } catch (error) {
            console.error('❌ خطأ في روتين النشاط:', error.message);
        }
    }

    /**
     * جدولة إعادة الاتصال عند انقطاع الاتصال
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('🛑 تم تجاوز الحد الأقصى لمحاولات إعادة الاتصال');
            console.log('⏳ جاري إعادة المحاولة بعد 5 دقائق...');
            
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.scheduleReconnect();
            }, 300000); // 5 دقائق
            return;
        }

        this.reconnectAttempts++;
        const delay = TIMING_CONFIG.reconnectDelay * this.reconnectAttempts;
        
        console.log(`⏳ إعادة الاتصال بعد ${delay/1000} ثواني (المحاولة ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            console.log('🔄 محاولة إعادة الاتصال...');
            this.initBot();
        }, delay);
    }

    /**
     * إيقاف البوت بشكل آمن
     */
    safeShutdown() {
        console.log('🛑 إيقاف البوت بشكل آمن...');
        
        if (this.bot && this.isConnected) {
            this.bot.quit();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        process.exit(0);
    }
}

// معالجات لإيقاف البرنامج بشكل آمن
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

// بدء تشغيل البوت
console.log('🎮 بدء تشغيل بوت الحفاظ على نشاط سيرفر Aternos...');
console.log('📋 تفاصيل السيرفر:');
console.log(`   - العنوان: ${SERVER_CONFIG.host}`);
console.log(`   - المنفذ: ${SERVER_CONFIG.port}`);
console.log(`   - اسم البوت: ${SERVER_CONFIG.username}`);
console.log(`   - الإصدار: ${SERVER_CONFIG.version}`);
console.log('⚡ البوت يعمل الآن...');

const botInstance = new AternosKeepAliveBot();
