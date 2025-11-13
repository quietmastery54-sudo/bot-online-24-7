const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');
const http = require('http');

// إعدادات السيرفر - تم التحديث للسيرفر الجديد
const SERVER_CONFIG = {
    host: 'server5498.aternos.me',
    port: 19306,
    username: 'Active_Player_Bot',
    version: '1.21.8',
    auth: 'offline'
};

// إعدادات التوقيت المحسنة
const TIMING_CONFIG = {
    consoleCommandInterval: 90000,     // كل 1.5 دقيقة
    movementInterval: 20000,           // كل 20 ثانية
    reconnectDelay: 8000,              // 8 ثواني قبل إعادة الاتصال
    afkCheckInterval: 45000,           // كل 45 ثانية للتحقق من النشاط
    selfPingInterval: 240000,          // كل 4 دقائق لإرسال Ping ذاتي
    healthCheckInterval: 25000,        // كل 25 ثانية للتحقق من صحة البوت
    chatMessageInterval: 120000        // كل دقيقتين لإرسال رسالة
};

class AdvancedAternosBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 8;
        this.uptime = Date.now();
        this.serverOnline = false;
        this.app = express();
        this.server = null;
        this.lastError = null;
        this.movementCycle = 0;
        
        console.log('🎮 بدء تشغيل البوت المتقدم لسيرفر Aternos...');
        console.log('📋 إعدادات السيرفر:');
        console.log(`   - العنوان: ${SERVER_CONFIG.host}`);
        console.log(`   - المنفذ: ${SERVER_CONFIG.port}`);
        console.log(`   - الإصدار: ${SERVER_CONFIG.version}`);
        console.log(`   - اسم البوت: ${SERVER_CONFIG.username}`);
        console.log('⚡ جاري تهيئة النظام...');
        
        this.setupWebServer();
        this.initBot();
    }

    /**
     * إعداد خادم ويب متقدم للمراقبة والـ Ping
     */
    setupWebServer() {
        const port = process.env.PORT || 3000;

        this.app.use(express.json());

        // الصفحة الرئيسية مع معلومات شاملة
        this.app.get('/', (req, res) => {
            res.json({
                status: 'Bot Online - Active Player',
                minecraft: {
                    connected: this.isConnected,
                    server: SERVER_CONFIG.host,
                    botName: SERVER_CONFIG.username,
                    version: SERVER_CONFIG.version,
                    serverOnline: this.serverOnline,
                    movementCycle: this.movementCycle
                },
                system: {
                    uptime: this.formatUptime(Date.now() - this.uptime),
                    reconnectAttempts: this.reconnectAttempts,
                    lastError: this.lastError,
                    health: this.bot ? this.bot.health : 0,
                    food: this.bot ? this.bot.food : 0
                },
                timestamp: new Date().toISOString()
            });
        });

        // نقطة نهاية للـ Ping
        this.app.get('/ping', (req, res) => {
            res.json({ 
                status: 'active', 
                botStatus: this.isConnected ? 'connected' : 'disconnected',
                movementCycle: this.movementCycle,
                timestamp: new Date().toISOString()
            });
        });

        // نقطة نهاية لصحة النظام
        this.app.get('/health', (req, res) => {
            const systemHealth = {
                bot: this.isConnected ? 'healthy' : 'unhealthy',
                uptime: Date.now() - this.uptime,
                movementActivity: this.movementCycle,
                lastError: this.lastError
            };
            res.json(systemHealth);
        });

        // بدء الخادم
        this.server = this.app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 خادم الويب نشط على المنفذ ${port}`);
            console.log(`📊 لوحة المراقبة: http://localhost:${port}`);
        });

        // بدء نظام Ping الذاتي
        this.startSelfPinging();
    }

    /**
     * نظام Ping الذاتي المتقدم
     */
    startSelfPinging() {
        const port = process.env.PORT || 3000;
        
        console.log('📡 تفعيل نظام Ping الذاتي...');
        
        // Ping فوري عند البدء
        setTimeout(() => this.selfPing(port), 3000);
        
        // تكرار منتظم كل 4 دقائق
        const pingInterval = setInterval(() => {
            this.selfPing(port);
        }, TIMING_CONFIG.selfPingInterval);

        console.log('✅ نظام Ping الذاتي مفعل بنجاح');
    }

    /**
     * إرسال Ping ذاتي موثوق
     */
    selfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET',
            timeout: 8000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`🔄 Ping ناجح - ${new Date().toLocaleTimeString()}`);
            });
        });

        req.on('error', (err) => {
            console.log('⚠️  Ping فاشل (مشكلة شبكة محلية)');
        });

        req.on('timeout', () => {
            console.log('⏰ انتهت مهلة Ping');
            req.destroy();
        });

        req.end();
    }

    /**
     * تهيئة البوت المتقدم
     */
    initBot() {
        console.log('🤖 جاري إنشاء البوت...');
        
        try {
            this.bot = mineflayer.createBot(SERVER_CONFIG);
            
            // تحميل إضافات الحركة
            this.bot.loadPlugin(pathfinder);
            
            // إعداد جميع الأنظمة
            this.setupEventHandlers();
            this.setupMovementSystem();
            this.setupAdvancedBehaviors();
            this.setupPeriodicTasks();
            
            console.log('✅ تم تهيئة البوت بنجاح');
            
        } catch (error) {
            console.error('❌ فشل في إنشاء البوت:', error.message);
            this.lastError = error.message;
            this.scheduleReconnect();
        }
    }

    /**
     * إعداد معالجات الأحداث المتقدمة
     */
    setupEventHandlers() {
        // حدث الاتصال الناجح
        this.bot.on('login', () => {
            console.log('🎉 تم الاتصال بالسيرفر بنجاح!');
            this.isConnected = true;
            this.serverOnline = true;
            this.reconnectAttempts = 0;
            this.lastError = null;
            this.movementCycle = 0;
            
            const pos = this.bot.entity.position;
            console.log(`📍 الموقع: X:${pos.x.toFixed(1)}, Y:${pos.y.toFixed(1)}, Z:${pos.z.toFixed(1)}`);
            
            // رسالة ترحيب بعد اتصال ناجح
            setTimeout(() => {
                if (this.isConnected) {
                    this.bot.chat('Hello! Bot is now active and maintaining server.');
                }
            }, 4000);
        });

        // حدث انقطاع الاتصال
        this.bot.on('end', (reason) => {
            console.log(`🔌 انقطع الاتصال: ${reason}`);
            this.isConnected = false;
            this.serverOnline = false;
            this.lastError = reason;
            this.scheduleReconnect();
        });

        // حدث الأخطاء
        this.bot.on('error', (err) => {
            console.error('❌ خطأ في البوت:', err.message);
            this.isConnected = false;
            this.serverOnline = false;
            this.lastError = err.message;
        });

        // حدث رسائل الشات
        this.bot.on('message', (message) => {
            const msg = message.toString();
            if (!msg.includes(this.bot.username)) {
                console.log(`💬 ${msg}`);
            }
        });

        // حدث الموت وإعادة الظهور
        this.bot.on('death', () => {
            console.log('💀 البوت مات! جاري إعادة الظهور...');
        });

        this.bot.on('spawn', () => {
            console.log('🔄 البوت أعيد ظهوره');
            this.isConnected = true;
        });

        // حدث تغيير الصحة والجوع
        this.bot.on('health', () => {
            if (this.bot.health < 10) {
                console.log('⚠️  تحذير: صحة البوت منخفضة!');
            }
        });

        console.log('✅ تم إعداد معالجات الأحداث');
    }

    /**
     * إعداد نظام الحركة المتقدم
     */
    setupMovementSystem() {
        this.bot.once('spawn', () => {
            const movements = new Movements(this.bot);
            this.bot.pathfinder.setMovements(movements);
            console.log('🎯 نظام الحركة المتقدم جاهز');
        });
    }

    /**
     * إعداد السلوكيات المتقدمة
     */
    setupAdvancedBehaviors() {
        // سلوكيات إضافية تجعل البوت يبدو أكثر طبيعية
        this.bot.on('spawn', () => {
            console.log('🎮 تفعيل السلوكيات الطبيعية...');
        });
    }

    /**
     * إعداد المهام الدورية المتقدمة
     */
    setupPeriodicTasks() {
        console.log('⏰ تفعيل المهام الدورية...');

        // نظام الحركة الدورية
        setInterval(() => {
            if (this.isConnected && this.bot.entity) {
                this.performNaturalMovement();
            }
        }, TIMING_CONFIG.movementInterval);

        // نظام الأوامر الدورية
        setInterval(() => {
            if (this.isConnected) {
                this.sendNaturalCommands();
            }
        }, TIMING_CONFIG.consoleCommandInterval);

        // نظام النشاط الدوري
        setInterval(() => {
            if (this.isConnected) {
                this.advancedAFKPrevention();
            }
        }, TIMING_CONFIG.afkCheckInterval);

        // نظام الرسائل الدورية
        setInterval(() => {
            if (this.isConnected) {
                this.sendNaturalChat();
            }
        }, TIMING_CONFIG.chatMessageInterval);

        // نظام فحص الصحة
        setInterval(() => {
            this.comprehensiveHealthCheck();
        }, TIMING_CONFIG.healthCheckInterval);

        console.log('✅ تم تفعيل جميع المهام الدورية');
    }

    /**
     * نظام الحركة الطبيعية المتقدمة
     */
    performNaturalMovement() {
        if (!this.bot.entity) return;

        try {
            this.movementCycle++;
            
            // أنماط حركة متنوعة لتجنب التكرار
            const movementPatterns = [
                { type: 'walk', directions: ['forward', 'left'] },
                { type: 'walk', directions: ['back', 'right'] },
                { type: 'action', actions: ['jump', 'sneak'] },
                { type: 'look', actions: ['look_around'] }
            ];
            
            const pattern = movementPatterns[this.movementCycle % movementPatterns.length];
            
            switch (pattern.type) {
                case 'walk':
                    this.performWalking(pattern.directions);
                    break;
                case 'action':
                    this.performActions(pattern.actions);
                    break;
                case 'look':
                    this.performLooking();
                    break;
            }
            
            console.log(`🚶 حركة ${this.movementCycle}: ${pattern.type}`);
            
        } catch (error) {
            console.error('❌ خطأ في الحركة:', error.message);
        }
    }

    /**
     * تنفيذ حركة المشي
     */
    performWalking(directions) {
        directions.forEach((dir, index) => {
            setTimeout(() => {
                this.bot.setControlState(dir, true);
                setTimeout(() => {
                    this.bot.setControlState(dir, false);
                }, 800 + Math.random() * 700);
            }, index * 900);
        });
    }

    /**
     * تنفيذ الحركات الخاصة
     */
    performActions(actions) {
        actions.forEach((action, index) => {
            setTimeout(() => {
                this.bot.setControlState(action, true);
                setTimeout(() => {
                    this.bot.setControlState(action, false);
                }, 500 + Math.random() * 500);
            }, index * 1200);
        });
    }

    /**
     * تنفيذ حركات النظر
     */
    performLooking() {
        this.bot.look(
            Math.random() * Math.PI * 2 - Math.PI, // yaw عشوائي
            (Math.random() * 0.5) - 0.25,          // pitch محدود
            true
        );
    }

    /**
     * إرسال أوامر طبيعية
     */
    sendNaturalCommands() {
        try {
            const commands = [
                '/list',
                '/time query daytime',
                '/gamerule doDaylightCycle true',
                '/seed'
            ];
            
            const randomCommand = commands[Math.floor(Math.random() * commands.length)];
            this.bot.chat(randomCommand);
            console.log(`📝 أمر: ${randomCommand}`);
            
        } catch (error) {
            console.error('❌ خطأ في الأمر:', error.message);
        }
    }

    /**
     * إرسال رسائل طبيعية في الشات
     */
    sendNaturalChat() {
        try {
            const messages = [
                'Active and maintaining server!',
                'Server looks great today!',
                'Nice weather for mining!',
                'Keeping the server alive!',
                'Everything running smoothly!'
            ];
            
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            this.bot.chat(randomMsg);
            console.log(`💬 رسالة: ${randomMsg}`);
            
        } catch (error) {
            console.error('❌ خطأ في الرسالة:', error.message);
        }
    }

    /**
     * نظام متقدم لمنع الخروج التلقائي
     */
    advancedAFKPrevention() {
        try {
            // تبديل بين عدة أنماط لمنع التكرار
            const patterns = [
                () => { this.bot.setControlState('sneak', true); },
                () => { this.bot.setControlState('jump', true); },
                () => { 
                    this.bot.look(
                        this.bot.entity.yaw + (Math.random() - 0.5) * 0.8,
                        this.bot.entity.pitch + (Math.random() - 0.5) * 0.4,
                        true
                    );
                }
            ];
            
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            pattern();
            
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
                this.bot.setControlState('jump', false);
            }, 600 + Math.random() * 400);
            
        } catch (error) {
            console.error('❌ خطأ في نظام النشاط:', error.message);
        }
    }

    /**
     * فحص صحة شامل للنظام
     */
    comprehensiveHealthCheck() {
        console.log('\n❤️  فحص صحة شامل:');
        console.log(`   - الحالة: ${this.isConnected ? '🟢 متصل' : '🔴 غير متصل'}`);
        console.log(`   - مدة التشغيل: ${this.formatUptime(Date.now() - this.uptime)}`);
        console.log(`   - دورات الحركة: ${this.movementCycle}`);
        console.log(`   - محاولات إعادة الاتصال: ${this.reconnectAttempts}`);
        
        if (this.bot && this.isConnected) {
            console.log(`   - الصحة: ${this.bot.health} | الجوع: ${this.bot.food}`);
        }
        
        if (this.lastError) {
            console.log(`   - آخر خطأ: ${this.lastError}`);
        }
    }

    /**
     * جدولة إعادة الاتصال الذكية
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log(`🛑 توقف مؤقت بعد ${this.maxReconnectAttempts} محاولة`);
            console.log('⏳ جاري إعادة المحاولة بعد 8 دقائق...');
            
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.scheduleReconnect();
            }, 480000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(TIMING_CONFIG.reconnectDelay * this.reconnectAttempts, 45000);
        
        console.log(`⏳ إعادة اتصال بعد ${delay/1000} ثانية (المحاولة ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            console.log('🔄 جاري إعادة الاتصال...');
            this.initBot();
        }, delay);
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
            return `${days} يوم, ${hours % 24} ساعة`;
        } else if (hours > 0) {
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

// معالجات النظام
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
console.log('🚀 بدء تشغيل البوت المتقدم...');
const botInstance = new AdvancedAternosBot();
