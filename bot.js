const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');
const http = require('http');

// إعدادات السيرفر
const SERVER_CONFIG = {
    host: 'server5498.aternos.me',
    port: 19306,
    username: 'Active_Player_Bot',
    version: '1.21.8',
    auth: 'offline'
};

// إعدادات التوقيت
const TIMING_CONFIG = {
    consoleCommandInterval: 90000,
    movementInterval: 20000,
    reconnectDelay: 8000,
    afkCheckInterval: 45000,
    selfPingInterval: 240000,
    healthCheckInterval: 25000,
    chatMessageInterval: 120000
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
        
        console.log('🎮 Starting Advanced Aternos Bot...');
        console.log('📋 Server Settings:');
        console.log(`   - Host: ${SERVER_CONFIG.host}`);
        console.log(`   - Port: ${SERVER_CONFIG.port}`);
        console.log(`   - Version: ${SERVER_CONFIG.version}`);
        console.log(`   - Bot Name: ${SERVER_CONFIG.username}`);
        
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
                    lastError: this.lastError
                },
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/ping', (req, res) => {
            res.json({ 
                status: 'active', 
                botStatus: this.isConnected ? 'connected' : 'disconnected',
                movementCycle: this.movementCycle,
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/health', (req, res) => {
            res.json({
                bot: this.isConnected ? 'healthy' : 'unhealthy',
                uptime: Date.now() - this.uptime,
                movementActivity: this.movementCycle,
                lastError: this.lastError
            });
        });

        this.server = this.app.listen(port, '0.0.0.0', () => {
            console.log(`🌐 Web server running on port ${port}`);
            console.log(`📊 Monitor: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        });

        this.startSelfPinging();
    }

    /**
     * نظام Ping الذاتي
     */
    startSelfPinging() {
        const port = process.env.PORT || 3000;
        const replUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        
        console.log('📡 Starting self-ping system...');
        
        // Ping فوري
        setTimeout(() => this.selfPing(replUrl, port), 3000);
        
        // تكرار منتظم
        setInterval(() => {
            this.selfPing(replUrl, port);
        }, TIMING_CONFIG.selfPingInterval);
    }

    /**
     * إرسال Ping
     */
    selfPing(replUrl, port) {
        // محاولة Ping للرابط الخارجي أولاً
        const externalPing = http.request(new URL(`${replUrl}/ping`), (res) => {
            console.log(`✅ External Ping: ${new Date().toLocaleTimeString()}`);
        });

        externalPing.on('error', (err) => {
            // إذا فشل الخارجي، جرب المحلي
            const localPing = http.request({
                hostname: 'localhost',
                port: port,
                path: '/ping',
                method: 'GET',
                timeout: 5000
            }, (res) => {
                console.log(`✅ Local Ping: ${new Date().toLocaleTimeString()}`);
            });

            localPing.on('error', (err) => {
                console.log('⚠️  Ping failed');
            });

            localPing.end();
        });

        externalPing.end();
    }

    /**
     * تهيئة البوت
     */
    initBot() {
        console.log('🤖 Creating bot...');
        
        try {
            this.bot = mineflayer.createBot(SERVER_CONFIG);
            
            this.bot.loadPlugin(pathfinder);
            
            this.setupEventHandlers();
            this.setupMovementSystem();
            this.setupPeriodicTasks();
            
        } catch (error) {
            console.error('❌ Bot creation failed:', error.message);
            this.lastError = error.message;
            this.scheduleReconnect();
        }
    }

    /**
     * معالجات الأحداث
     */
    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('✅ Connected to server!');
            this.isConnected = true;
            this.serverOnline = true;
            this.reconnectAttempts = 0;
            this.lastError = null;
            
            const pos = this.bot.entity.position;
            console.log(`📍 Position: X:${pos.x.toFixed(1)}, Y:${pos.y.toFixed(1)}, Z:${pos.z.toFixed(1)}`);
            
            setTimeout(() => {
                if (this.isConnected) {
                    this.bot.chat('Hello! Bot is now active.');
                }
            }, 4000);
        });

        this.bot.on('end', (reason) => {
            console.log(`🔌 Disconnected: ${reason}`);
            this.isConnected = false;
            this.serverOnline = false;
            this.lastError = reason;
            this.scheduleReconnect();
        });

        this.bot.on('error', (err) => {
            console.error('❌ Bot error:', err.message);
            this.isConnected = false;
            this.serverOnline = false;
            this.lastError = err.message;
        });

        this.bot.on('message', (message) => {
            const msg = message.toString();
            if (!msg.includes(this.bot.username)) {
                console.log(`💬 ${msg}`);
            }
        });

        this.bot.on('spawn', () => {
            console.log('🔄 Bot respawned');
            this.isConnected = true;
        });
    }

    /**
     * نظام الحركة
     */
    setupMovementSystem() {
        this.bot.once('spawn', () => {
            const movements = new Movements(this.bot);
            this.bot.pathfinder.setMovements(movements);
            console.log('🎯 Movement system ready');
        });
    }

    /**
     * المهام الدورية
     */
    setupPeriodicTasks() {
        console.log('⏰ Setting up periodic tasks...');

        // حركة دورية
        setInterval(() => {
            if (this.isConnected && this.bot.entity) {
                this.performNaturalMovement();
            }
        }, TIMING_CONFIG.movementInterval);

        // أوامر دورية
        setInterval(() => {
            if (this.isConnected) {
                this.sendNaturalCommands();
            }
        }, TIMING_CONFIG.consoleCommandInterval);

        // منع AFK
        setInterval(() => {
            if (this.isConnected) {
                this.advancedAFKPrevention();
            }
        }, TIMING_CONFIG.afkCheckInterval);

        // رسائل شات
        setInterval(() => {
            if (this.isConnected) {
                this.sendNaturalChat();
            }
        }, TIMING_CONFIG.chatMessageInterval);

        // فحص الصحة
        setInterval(() => {
            this.comprehensiveHealthCheck();
        }, TIMING_CONFIG.healthCheckInterval);
    }

    /**
     * حركة طبيعية
     */
    performNaturalMovement() {
        if (!this.bot.entity) return;

        try {
            this.movementCycle++;
            
            const movements = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
            const randomMove = movements[Math.floor(Math.random() * movements.length)];
            const duration = 800 + Math.random() * 700;
            
            this.bot.setControlState(randomMove, true);
            setTimeout(() => {
                this.bot.setControlState(randomMove, false);
            }, duration);
            
            // تحريك الكاميرا
            this.bot.look(
                Math.random() * Math.PI * 2 - Math.PI,
                (Math.random() * 0.5) - 0.25,
                true
            );
            
            console.log(`🚶 Movement ${this.movementCycle}: ${randomMove}`);
            
        } catch (error) {
            console.error('❌ Movement error:', error.message);
        }
    }

    /**
     * أوامر طبيعية
     */
    sendNaturalCommands() {
        try {
            const commands = [
                '/list',
                '/time query daytime',
                '/gamerule doDaylightCycle true'
            ];
            
            const randomCommand = commands[Math.floor(Math.random() * commands.length)];
            this.bot.chat(randomCommand);
            console.log(`📝 Command: ${randomCommand}`);
            
        } catch (error) {
            console.error('❌ Command error:', error.message);
        }
    }

    /**
     * رسائل شات
     */
    sendNaturalChat() {
        try {
            const messages = [
                'Active and maintaining server!',
                'Server looks great!',
                'Keeping the server alive!',
                'Everything running smoothly!'
            ];
            
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            this.bot.chat(randomMsg);
            console.log(`💬 Chat: ${randomMsg}`);
            
        } catch (error) {
            console.error('❌ Chat error:', error.message);
        }
    }

    /**
     * منع AFK
     */
    advancedAFKPrevention() {
        try {
            this.bot.setControlState('sneak', true);
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
            }, 800);
        } catch (error) {
            console.error('❌ AFK prevention error:', error.message);
        }
    }

    /**
     * فحص الصحة
     */
    comprehensiveHealthCheck() {
        console.log('\n❤️  Health Check:');
        console.log(`   - Status: ${this.isConnected ? '🟢 Connected' : '🔴 Disconnected'}`);
        console.log(`   - Uptime: ${this.formatUptime(Date.now() - this.uptime)}`);
        console.log(`   - Movement Cycles: ${this.movementCycle}`);
        console.log(`   - Reconnect Attempts: ${this.reconnectAttempts}`);
        
        if (this.lastError) {
            console.log(`   - Last Error: ${this.lastError}`);
        }
    }

    /**
     * إعادة الاتصال
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log(`🛑 Pausing after ${this.maxReconnectAttempts} attempts`);
            console.log('⏳ Retrying in 8 minutes...');
            
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.scheduleReconnect();
            }, 480000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(TIMING_CONFIG.reconnectDelay * this.reconnectAttempts, 45000);
        
        console.log(`⏳ Reconnect in ${delay/1000}s (Attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            console.log('🔄 Reconnecting...');
            this.initBot();
        }, delay);
    }

    /**
     * تنسيق الوقت
     */
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * إيقاف آمن
     */
    safeShutdown() {
        console.log('🛑 Shutting down...');
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
    console.log('🛑 Received shutdown signal...');
    botInstance.safeShutdown();
});

process.on('SIGTERM', () => {
    console.log('🛑 Received termination signal...');
    botInstance.safeShutdown();
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// بدء التشغيل
console.log('🚀 Starting Advanced Aternos Bot on Replit...');
const botInstance = new AdvancedAternosBot();
