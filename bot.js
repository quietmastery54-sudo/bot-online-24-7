const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');
const net = require('net');

console.log('🧠 Starting ULTRA SMART Minecraft Bot with Deep Analysis...');

class UltraSmartAternosBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 6;
        this.uptime = Date.now();
        this.problemHistory = [];
        this.solutionsApplied = [];
        this.serverStatus = 'unknown';
        this.lastError = null;
        this.analysisMode = 'deep';
        this.serverOnline = false;
        
        // تحقق من حالة السيرفر أولاً
        this.checkServerStatus().then(online => {
            this.serverOnline = online;
            console.log(online ? '🟢 Server is ONLINE' : '🔴 Server is OFFLINE');
            
            if (!online) {
                console.log('🎯 Server appears to be offline. Waiting for it to start...');
                this.startOfflineMonitoring();
            } else {
                this.startSmartConnection();
            }
        });
        
        this.setupWebServer();
    }

    // تحقق من حالة السيرفر باستخدام TCP connection بسيط
    async checkServerStatus() {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            const timeout = 10000;
            
            socket.setTimeout(timeout);
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            socket.connect(19306, 'server5498.aternos.me');
        });
    }

    // مراقبة عندما يكون السيرفر مغلقاً
    startOfflineMonitoring() {
        console.log('📡 Starting offline server monitoring...');
        
        // تحقق كل دقيقة إذا كان السيرفر قد فتح
        const monitorInterval = setInterval(() => {
            this.checkServerStatus().then(online => {
                if (online && !this.serverOnline) {
                    console.log('🎉 SERVER JUST CAME ONLINE! Starting connection...');
                    this.serverOnline = true;
                    clearInterval(monitorInterval);
                    this.startSmartConnection();
                }
            });
        }, 60000);
        
        // Ping ذاتي للحفاظ على نشاط Replit
        this.startKeepAliveSystem();
    }

    // بدء نظام الاتصال الذكي
    startSmartConnection() {
        console.log('\n🔍 Starting intelligent connection analysis...');
        this.analyzeSocketClosedProblem();
    }

    // تحليل مشكلة socketClosed بشكل متعمق
    analyzeSocketClosedProblem() {
        console.log('🧠 Deep analyzing socketClosed issue...');
        
        // أسباب محتملة لـ socketClosed
        const possibleCauses = [
            'Server is not running',
            'Server is restarting',
            'Firewall blocking connection',
            'Wrong port number',
            'Server full',
            'Whitelist enabled',
            'IP blocked'
        ];
        
        console.log('📋 Possible causes:');
        possibleCauses.forEach((cause, index) => {
            console.log(`   ${index + 1}. ${cause}`);
        });
        
        this.applyAdvancedSolutions();
    }

    // تطبيق حلول متقدمة
    applyAdvancedSolutions() {
        console.log('\n💡 Applying advanced solutions...');
        
        // حلول متدرجة بناءً على عدد المحاولات
        const solutionStrategies = [
            { attempt: 1, solution: 'quick_retry', delay: 5000 },
            { attempt: 2, solution: 'version_rotation', delay: 10000 },
            { attempt: 3, solution: 'aggressive_mode', delay: 15000 },
            { attempt: 4, solution: 'ultra_patient', delay: 30000 },
            { attempt: 5, solution: 'server_monitoring', delay: 60000 },
            { attempt: 6, solution: 'long_wait', delay: 120000 }
        ];
        
        const currentStrategy = solutionStrategies[Math.min(this.connectionAttempts, solutionStrategies.length - 1)];
        
        console.log(`🎯 Strategy: ${currentStrategy.solution}`);
        console.log(`⏰ Delay: ${currentStrategy.delay / 1000} seconds`);
        
        this.solutionsApplied.push(currentStrategy.solution);
        
        setTimeout(() => {
            this.attemptSmartConnection(currentStrategy.solution);
        }, currentStrategy.delay);
    }

    // محاولة اتصال ذكية
    attemptSmartConnection(strategy) {
        this.connectionAttempts++;
        
        if (this.connectionAttempts > this.maxConnectionAttempts) {
            console.log(`🛑 Maximum intelligent attempts reached. Waiting 10 minutes...`);
            this.startOfflineMonitoring();
            return;
        }

        console.log(`\n🤖 Ultra Smart attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
        console.log(`🎯 Active strategy: ${strategy}`);
        
        // إعدادات مختلفة بناءً على الاستراتيجية
        const config = this.generateSmartConfig(strategy);
        
        console.log(`📍 Target: ${config.host}:${config.port}`);
        console.log(`👤 Username: ${config.username}`);
        console.log(`📋 Version: ${config.version}`);
        console.log(`⚡ Timeout: ${config.connectTimeout}ms`);

        this.tryConnection(config);
    }

    // إنشاء إعدادات ذكية بناءً على الاستراتيجية
    generateSmartConfig(strategy) {
        const baseConfig = {
            host: 'server5498.aternos.me',
            port: 19306,
            auth: 'offline',
            connectTimeout: 30000
        };
        
        const usernameStrategies = [
            `SmartBot_${Date.now()}`,
            `Player_${Math.floor(Math.random() * 10000)}`,
            `User_${Math.floor(Math.random() * 5000)}`,
            `Guest_${Math.floor(Math.random() * 2000)}`,
            `MC_${Math.floor(Math.random() * 3000)}`
        ];
        
        const versionStrategies = ['1.21.4', '1.21.1', '1.20.4', '1.19.4', false];
        
        let config;
        
        switch(strategy) {
            case 'quick_retry':
                config = {
                    ...baseConfig,
                    username: usernameStrategies[0],
                    version: versionStrategies[0],
                    connectTimeout: 15000
                };
                break;
                
            case 'version_rotation':
                config = {
                    ...baseConfig,
                    username: usernameStrategies[1],
                    version: versionStrategies[this.connectionAttempts % versionStrategies.length],
                    connectTimeout: 20000
                };
                break;
                
            case 'aggressive_mode':
                config = {
                    ...baseConfig,
                    username: usernameStrategies[2],
                    version: false, // اكتشاف تلقائي
                    connectTimeout: 25000
                };
                break;
                
            case 'ultra_patient':
                config = {
                    ...baseConfig,
                    username: usernameStrategies[3],
                    version: '1.20.4',
                    connectTimeout: 35000
                };
                break;
                
            case 'server_monitoring':
                // تحقق من السيرفر أولاً
                this.checkServerStatus().then(online => {
                    console.log(online ? '🟢 Server check: ONLINE' : '🔴 Server check: OFFLINE');
                });
                config = {
                    ...baseConfig,
                    username: usernameStrategies[4],
                    version: '1.21.1',
                    connectTimeout: 40000
                };
                break;
                
            default:
                config = {
                    ...baseConfig,
                    username: `Bot_${Math.floor(Math.random() * 100000)}`,
                    version: false,
                    connectTimeout: 45000
                };
        }
        
        return config;
    }

    // محاولة الاتصال
    tryConnection(config) {
        try {
            console.log('🔄 Attempting connection...');
            
            this.bot = mineflayer.createBot(config);
            this.setupBotEventHandlers();
            
        } catch (error) {
            console.log('❌ Connection setup failed:', error.message);
            this.handleConnectionError('setup_failed', error.message);
        }
    }

    // إعداد معالجات الأحداث للبوت
    setupBotEventHandlers() {
        this.bot.on('login', () => {
            console.log('🎉 🎉 🎉 ULTRA SUCCESS: Connected to server!');
            console.log('🧠 Intelligent connection established!');
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.serverStatus = 'online';
            this.lastError = null;
            
            const pos = this.bot.entity.position;
            console.log(`📍 Position: X:${pos.x.toFixed(1)}, Y:${pos.y.toFixed(1)}, Z:${pos.z.toFixed(1)}`);
            
            this.startUltraSmartActivities();
        });
        
        this.bot.on('error', (err) => {
            console.log('❌ Connection error:', err.message);
            this.handleConnectionError('connection_error', err.message);
        });
        
        this.bot.on('end', (reason) => {
            console.log('🔌 Disconnected:', reason);
            this.handleConnectionError('disconnection', reason);
        });
        
        this.bot.on('spawn', () => {
            console.log('📍 Bot spawned in world');
            this.isConnected = true;
        });
        
        this.bot.on('message', (message) => {
            const msg = message.toString();
            if (!msg.includes(this.bot.username)) {
                console.log(`💬 Chat: ${msg}`);
            }
        });
        
        this.bot.on('connecting', () => {
            console.log('🔄 Establishing connection to server...');
        });
    }

    // معالجة أخطاء الاتصال
    handleConnectionError(type, message) {
        this.isConnected = false;
        this.lastError = { type, message, timestamp: new Date().toISOString() };
        
        this.problemHistory.push({
            type,
            message,
            timestamp: new Date().toISOString(),
            attempt: this.connectionAttempts
        });

        console.log(`📊 Error analysis: ${type} - ${message}`);
        
        // إذا كانت المشكلة socketClosed، تحقق من حالة السيرفر
        if (message.includes('socketClosed') || type === 'disconnection') {
            this.checkServerStatus().then(online => {
                console.log(online ? '🟢 Server status: ONLINE' : '🔴 Server status: OFFLINE');
                this.serverOnline = online;
                
                if (!online) {
                    console.log('🎯 Server is offline. Switching to monitoring mode...');
                    this.startOfflineMonitoring();
                    return;
                }
            });
        }
        
        this.applyAdvancedSolutions();
    }

    // بدء الأنشطة فائقة الذكاء
    startUltraSmartActivities() {
        console.log('🎮 Starting ULTRA SMART activities...');
        
        // نظام حركة متطور
        this.setupAdvancedMovementSystem();
        
        // نظام أوامر ذكي
        this.setupSmartCommandSystem();
        
        // نظام تفاعل متقدم
        this.setupAdvancedInteractionSystem();
        
        // نظام مراقبة مستمر
        this.setupContinuousMonitoring();
    }

    setupAdvancedMovementSystem() {
        setInterval(() => {
            if (this.isConnected && this.bot.entity) {
                this.performAdvancedMovement();
            }
        }, 25000);
    }

    performAdvancedMovement() {
        try {
            const movementPatterns = [
                { type: 'explore', moves: ['forward', 'jump'], look: true },
                { type: 'social', moves: ['sneak', 'look'], look: true },
                { type: 'active', moves: ['jump', 'forward', 'back'], look: false },
                { type: 'chill', moves: ['sneak'], look: true }
            ];
            
            const pattern = movementPatterns[Math.floor(Math.random() * movementPatterns.length)];
            
            pattern.moves.forEach((move, index) => {
                setTimeout(() => {
                    this.bot.setControlState(move, true);
                    setTimeout(() => {
                        this.bot.setControlState(move, false);
                    }, 600 + Math.random() * 600);
                }, index * 800);
            });
            
            if (pattern.look) {
                this.bot.look(
                    Math.random() * Math.PI * 2 - Math.PI,
                    Math.random() * 0.4 - 0.2,
                    true
                );
            }
            
            console.log(`🚶 Advanced movement: ${pattern.type}`);
            
        } catch (error) {
            console.log('❌ Movement error:', error.message);
        }
    }

    setupSmartCommandSystem() {
        setInterval(() => {
            if (this.isConnected) {
                this.sendSmartCommand();
            }
        }, 95000);
        
        setInterval(() => {
            if (this.isConnected) {
                this.sendSmartChat();
            }
        }, 130000);
    }

    sendSmartCommand() {
        try {
            const commands = ['/list', '/time query daytime', '/gamerule doDaylightCycle true'];
            const command = commands[Math.floor(Math.random() * commands.length)];
            this.bot.chat(command);
            console.log(`📝 Smart command: ${command}`);
        } catch (error) {
            console.log('❌ Command error:', error.message);
        }
    }

    sendSmartChat() {
        try {
            const messages = [
                'Ultra smart bot active!',
                'Server maintenance optimized!',
                'AI-powered monitoring!',
                'Intelligent connection established!',
                'Advanced bot systems online!'
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.bot.chat(message);
            console.log(`💬 Smart chat: ${message}`);
        } catch (error) {
            console.log('❌ Chat error:', error.message);
        }
    }

    setupAdvancedInteractionSystem() {
        setInterval(() => {
            if (this.isConnected) {
                this.smartAFKPrevention();
            }
        }, 40000);
    }

    smartAFKPrevention() {
        try {
            const actions = [
                () => { this.bot.setControlState('sneak', true); },
                () => { this.bot.setControlState('jump', true); },
                () => { 
                    this.bot.look(
                        this.bot.entity.yaw + (Math.random() - 0.5),
                        this.bot.entity.pitch + (Math.random() - 0.3),
                        true
                    );
                }
            ];
            
            const action = actions[Math.floor(Math.random() * actions.length)];
            action();
            
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
                this.bot.setControlState('jump', false);
            }, 800);
            
        } catch (error) {
            console.log('❌ AFK prevention error:', error.message);
        }
    }

    setupContinuousMonitoring() {
        setInterval(() => {
            this.ultraSmartHealthCheck();
        }, 35000);
        
        setInterval(() => {
            this.deepLearningAnalysis();
        }, 120000);
    }

    ultraSmartHealthCheck() {
        console.log('\n🧠 ULTRA SMART HEALTH CHECK:');
        console.log(`   - Connection: ${this.isConnected ? '🟢 Connected' : '🔴 Disconnected'}`);
        console.log(`   - Server Status: ${this.serverOnline ? '🟢 Online' : '🔴 Offline'}`);
        console.log(`   - Uptime: ${this.formatUptime(Date.now() - this.uptime)}`);
        console.log(`   - Attempts: ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
        console.log(`   - Problems: ${this.problemHistory.length}`);
        console.log(`   - Solutions: ${this.solutionsApplied.slice(-3).join(', ')}`);
        
        if (this.lastError) {
            console.log(`   - Last Error: ${this.lastError.type}`);
        }
    }

    deepLearningAnalysis() {
        console.log('🧠 Deep learning analysis...');
        
        if (this.problemHistory.length > 2) {
            const recent = this.problemHistory.slice(-3);
            const socketClosedCount = recent.filter(p => p.message.includes('socketClosed')).length;
            
            if (socketClosedCount >= 2) {
                console.log('🎯 Pattern detected: Persistent socketClosed issues');
                console.log('💡 Recommendation: Extended monitoring with longer intervals');
            }
        }
    }

    // نظام الحفاظ على النشاط
    startKeepAliveSystem() {
        console.log('📡 Starting keep-alive system for Replit...');
        
        setInterval(() => {
            console.log('💖 Replit keep-alive ping');
        }, 240000);
    }

    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // إعداد خادم ويب متقدم
    setupWebServer() {
        const app = express();
        const port = process.env.PORT || 3000;

        app.get('/', (req, res) => {
            res.json({
                status: 'ULTRA SMART BOT ACTIVE',
                intelligence: 'ADVANCED_AI',
                connected: this.isConnected,
                server_online: this.serverOnline,
                server: 'server5498.aternos.me:19306',
                analysis_mode: this.analysisMode,
                problems_analyzed: this.problemHistory.length,
                solutions_applied: this.solutionsApplied,
                current_strategy: this.solutionsApplied[this.solutionsApplied.length - 1] || 'initial',
                health: {
                    uptime: this.formatUptime(Date.now() - this.uptime),
                    attempts: this.connectionAttempts,
                    last_error: this.lastError?.type
                }
            });
        });

        app.get('/ping', (req, res) => {
            res.json({ 
                status: 'ultra_smart_active', 
                intelligence: 'advanced',
                server_status: this.serverOnline ? 'online' : 'offline',
                bot_connected: this.isConnected,
                timestamp: new Date().toISOString() 
            });
        });

        app.get('/analysis', (req, res) => {
            res.json({
                problem_analysis: this.problemHistory.slice(-5),
                solution_strategy: this.solutionsApplied.slice(-3),
                connection_health: {
                    total_attempts: this.connectionAttempts,
                    successful: this.isConnected,
                    server_reachable: this.serverOnline
                }
            });
        });

        app.listen(port, () => {
            console.log(`🌐 Ultra smart web server running on port ${port}`);
            console.log(`📊 Monitor: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        });

        // Ping ذاتي متقدم
        setInterval(() => {
            this.advancedSelfPing(port);
        }, 300000);
    }

    advancedSelfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET',
            timeout: 15000
        };

        const req = http.request(options, () => {
            console.log('✅ Advanced self-ping successful');
        });
        
        req.on('error', () => {
            console.log('⚠️  Advanced self-ping failed');
        });
        
        req.end();
    }
}

// بدء البوت فائق الذكاء
console.log('🎯 Initializing ULTRA SMART bot system...');
const ultraSmartBot = new UltraSmartAternosBot();

// معالجة الإغلاق
process.on('SIGINT', () => {
    console.log('🛑 Ultra smart shutdown initiated...');
    if (ultraSmartBot.bot) ultraSmartBot.bot.quit();
    process.exit(0);
});
