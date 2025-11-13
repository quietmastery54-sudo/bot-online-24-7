const mineflayer = require('mineflayer');
const express = require('express');
const http = require('http');

console.log('🧠 Starting SMART Minecraft Bot with Auto-Problem-Solving...');

class SmartAternosBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 8;
        this.uptime = Date.now();
        this.problemHistory = [];
        this.solutionsApplied = [];
        this.serverStatus = 'unknown';
        this.lastError = null;
        this.retryStrategy = 'standard';
        
        // إعدادات متعددة للتحايل على المشاكل
        this.configurations = [
            {
                host: 'server5498.aternos.me',
                port: 19306,
                username: 'SmartBot_' + Math.floor(Math.random() * 10000),
                version: '1.21.4',
                auth: 'offline'
            },
            {
                host: 'server5498.aternos.me',
                port: 19306,
                username: 'Player_' + Math.floor(Math.random() * 1000),
                version: '1.21.1',
                auth: 'offline'
            },
            {
                host: 'server5498.aternos.me',
                port: 19306,
                username: 'Keeper_' + Math.floor(Math.random() * 500),
                version: '1.20.4',
                auth: 'offline'
            },
            {
                host: 'server5498.aternos.me',
                port: 19306,
                username: 'User_' + Math.floor(Math.random() * 2000),
                version: false, // اكتشاف تلقائي
                auth: 'offline'
            }
        ];
        
        this.currentConfigIndex = 0;
        this.currentConfig = this.configurations[this.currentConfigIndex];
        
        this.setupWebServer();
        this.analyzeAndConnect();
    }

    // تحليل المشاكل واتخاذ القرار الذكي
    analyzeAndConnect() {
        console.log('\n🔍 Analyzing connection problems...');
        
        // تحليل آخر الأخطاء
        if (this.problemHistory.length > 0) {
            const lastProblem = this.problemHistory[this.problemHistory.length - 1];
            console.log(`📊 Last problem: ${lastProblem.type} - ${lastProblem.message}`);
            
            // تطبيق حلول ذكية بناءً على نوع المشكلة
            this.applySmartSolution(lastProblem);
        } else {
            console.log('🎯 No previous problems detected. Starting fresh connection...');
        }
        
        this.startConnection();
    }

    // تطبيق حلول ذكية للمشاكل
    applySmartSolution(problem) {
        console.log('💡 Applying smart solution...');
        
        switch(problem.type) {
            case 'version_mismatch':
                console.log('🔄 Switching to version detection mode...');
                this.currentConfigIndex = 3; // استخدام الاكتشاف التلقائي
                this.currentConfig = this.configurations[this.currentConfigIndex];
                this.solutionsApplied.push('auto_version_detection');
                break;
                
            case 'connection_refused':
                console.log('🕒 Server might be offline. Increasing retry delay...');
                this.retryStrategy = 'long_delay';
                this.solutionsApplied.push('increased_retry_delay');
                break;
                
            case 'authentication':
                console.log('👤 Changing username to avoid conflicts...');
                this.currentConfig.username = 'Bot_' + Date.now();
                this.solutionsApplied.push('username_change');
                break;
                
            case 'timeout':
                console.log('⚡ Reducing timeout and trying different version...');
                this.currentConfigIndex = (this.currentConfigIndex + 1) % this.configurations.length;
                this.currentConfig = this.configurations[this.currentConfigIndex];
                this.solutionsApplied.push('config_rotation');
                break;
                
            default:
                console.log('🔄 Rotating to next configuration...');
                this.currentConfigIndex = (this.currentConfigIndex + 1) % this.configurations.length;
                this.currentConfig = this.configurations[this.currentConfigIndex];
                this.solutionsApplied.push('config_rotation');
        }
        
        console.log(`🎯 New configuration: ${this.currentConfig.username} | v${this.currentConfig.version}`);
    }

    // بدء الاتصال الذكي
    startConnection() {
        this.connectionAttempts++;
        
        if (this.connectionAttempts > this.maxConnectionAttempts) {
            console.log(`🛑 Maximum smart attempts reached. Waiting 8 minutes...`);
            this.problemHistory.push({
                type: 'max_attempts',
                message: 'Reached maximum connection attempts',
                timestamp: new Date().toISOString()
            });
            
            setTimeout(() => {
                this.connectionAttempts = 0;
                this.analyzeAndConnect();
            }, 480000);
            return;
        }

        console.log(`\n🤖 Smart connection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
        console.log(`📍 Target: ${this.currentConfig.host}:${this.currentConfig.port}`);
        console.log(`👤 Username: ${this.currentConfig.username}`);
        console.log(`📋 Version: ${this.currentConfig.version}`);
        console.log(`🎯 Strategy: ${this.retryStrategy}`);
        
        if (this.solutionsApplied.length > 0) {
            console.log(`💡 Applied solutions: ${this.solutionsApplied.join(', ')}`);
        }

        try {
            this.bot = mineflayer.createBot(this.currentConfig);
            this.setupEventHandlers();
            
        } catch (error) {
            this.handleError('creation_failed', error.message);
        }
    }

    // إعداد معالجات الأحداث الذكية
    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('🎉 ✅ SMART SUCCESS: Connected to server!');
            console.log('🧠 Bot is now active with intelligent behavior...');
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.serverStatus = 'online';
            this.lastError = null;
            
            const pos = this.bot.entity.position;
            console.log(`📍 Position: X:${pos.x.toFixed(1)}, Y:${pos.y.toFixed(1)}, Z:${pos.z.toFixed(1)}`);
            
            this.startSmartActivities();
        });
        
        this.bot.on('error', (err) => {
            this.handleError('connection_error', err.message);
        });
        
        this.bot.on('end', (reason) => {
            console.log('🔌 Disconnected:', reason);
            this.isConnected = false;
            this.handleError('disconnection', reason);
        });
        
        this.bot.on('spawn', () => {
            console.log('📍 Bot spawned successfully');
            this.isConnected = true;
        });
        
        this.bot.on('message', (message) => {
            const msg = message.toString();
            if (!msg.includes(this.currentConfig.username)) {
                console.log(`💬 Chat: ${msg}`);
                
                // تحليل ذكي للرسائل
                this.analyzeChatMessage(msg);
            }
        });
        
        this.bot.on('kicked', (reason) => {
            console.log('🚫 Kicked:', reason);
            this.handleError('kicked', reason);
        });

        this.bot.on('connecting', () => {
            console.log('🔄 Establishing connection...');
        });
    }

    // تحليل رسائل الشات ذكياً
    analyzeChatMessage(message) {
        const lowerMsg = message.toLowerCase();
        
        if (lowerMsg.includes('stop') || lowerMsg.includes('no bot') || lowerMsg.includes('go away')) {
            console.log('⚠️  Detected negative message about bot. Changing strategy...');
            this.problemHistory.push({
                type: 'social_rejection',
                message: 'Players asking bot to leave',
                timestamp: new Date().toISOString()
            });
            
            // الانتظار لفترة ثم العودة بهوية مختلفة
            setTimeout(() => {
                this.currentConfig.username = 'Guest_' + Math.floor(Math.random() * 10000);
                this.analyzeAndConnect();
            }, 300000);
        }
        
        if (lowerMsg.includes('server') && lowerMsg.includes('full')) {
            console.log('🔄 Server is full. Waiting before retry...');
            this.problemHistory.push({
                type: 'server_full',
                message: 'Server player limit reached',
                timestamp: new Date().toISOString()
            });
        }
    }

    // معالجة الأخطاء الذكية
    handleError(type, message) {
        this.isConnected = false;
        this.lastError = { type, message, timestamp: new Date().toISOString() };
        
        // تسجيل المشكلة للتحليل المستقبلي
        this.problemHistory.push({
            type,
            message,
            timestamp: new Date().toISOString()
        });

        console.log(`❌ Problem detected: ${type} - ${message}`);
        
        // حساب التأخير الذكي بناءً على نوع المشكلة والاستراتيجية
        let delay;
        switch(this.retryStrategy) {
            case 'long_delay':
                delay = Math.min(this.connectionAttempts * 15000, 120000);
                break;
            case 'aggressive':
                delay = Math.min(this.connectionAttempts * 5000, 30000);
                break;
            default:
                delay = Math.min(this.connectionAttempts * 10000, 60000);
        }
        
        console.log(`🧠 Smart retry in ${delay/1000} seconds...`);
        setTimeout(() => this.analyzeAndConnect(), delay);
    }

    // بدء الأنشطة الذكية
    startSmartActivities() {
        console.log('🎮 Starting intelligent activities...');
        
        // نظام الحركة الذكي
        setInterval(() => {
            if (this.isConnected && this.bot.entity) {
                this.performSmartMovement();
            }
        }, 20000);

        // نظام الأوامر الذكي
        setInterval(() => {
            if (this.isConnected) {
                this.sendSmartCommand();
            }
        }, 90000);

        // نظام الرسائل الذكي
        setInterval(() => {
            if (this.isConnected) {
                this.sendSmartChat();
            }
        }, 120000);

        // نظام منع AFK الذكي
        setInterval(() => {
            if (this.isConnected) {
                this.smartAFKPrevention();
            }
        }, 45000);

        // نظام الصحة والمراقبة
        setInterval(() => {
            this.smartHealthCheck();
        }, 30000);

        // نظام التعلم والتكيف
        setInterval(() => {
            this.learnAndAdapt();
        }, 180000);
    }

    // حركة ذكية
    performSmartMovement() {
        try {
            const patterns = [
                { type: 'walk', moves: ['forward', 'left'], duration: 800 },
                { type: 'walk', moves: ['back', 'right'], duration: 600 },
                { type: 'action', moves: ['jump', 'sneak'], duration: 400 },
                { type: 'look', moves: ['look_around'], duration: 500 }
            ];
            
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            
            if (pattern.type === 'walk' || pattern.type === 'action') {
                pattern.moves.forEach(move => {
                    this.bot.setControlState(move, true);
                    setTimeout(() => {
                        this.bot.setControlState(move, false);
                    }, pattern.duration + Math.random() * 400);
                });
            } else {
                this.bot.look(
                    Math.random() * Math.PI * 2 - Math.PI,
                    Math.random() * 0.3 - 0.15,
                    true
                );
            }
            
            console.log(`🚶 Smart movement: ${pattern.type}`);
            
        } catch (error) {
            console.log('❌ Movement error:', error.message);
        }
    }

    // أوامر ذكية
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

    // رسائل شات ذكية
    sendSmartChat() {
        try {
            const messages = [
                'Smart bot maintaining server!',
                'Auto-maintenance active!',
                'Server looks great!',
                'Keeping things running smoothly!',
                'Intelligent maintenance in progress!'
            ];
            const message = messages[Math.floor(Math.random() * messages.length)];
            this.bot.chat(message);
            console.log(`💬 Smart chat: ${message}`);
        } catch (error) {
            console.log('❌ Chat error:', error.message);
        }
    }

    // منع AFK ذكي
    smartAFKPrevention() {
        try {
            const actions = ['sneak', 'jump'];
            const action = actions[Math.floor(Math.random() * actions.length)];
            
            this.bot.setControlState(action, true);
            setTimeout(() => {
                this.bot.setControlState(action, false);
            }, 800);
            
            console.log('🔄 Smart AFK prevention');
        } catch (error) {
            console.log('❌ AFK prevention error:', error.message);
        }
    }

    // فحص صحة ذكي
    smartHealthCheck() {
        console.log('\n🧠 SMART HEALTH CHECK:');
        console.log(`   - Status: ${this.isConnected ? '🟢 Connected' : '🔴 Disconnected'}`);
        console.log(`   - Uptime: ${this.formatUptime(Date.now() - this.uptime)}`);
        console.log(`   - Connection attempts: ${this.connectionAttempts}`);
        console.log(`   - Problems detected: ${this.problemHistory.length}`);
        console.log(`   - Solutions applied: ${this.solutionsApplied.length}`);
        console.log(`   - Current strategy: ${this.retryStrategy}`);
        
        if (this.lastError) {
            console.log(`   - Last error: ${this.lastError.type}`);
        }
    }

    // التعلم والتكيف
    learnAndAdapt() {
        console.log('🧠 Learning from experience and adapting...');
        
        // تحليل تاريخ المشاكل
        if (this.problemHistory.length > 3) {
            const recentProblems = this.problemHistory.slice(-3);
            const errorTypes = recentProblems.map(p => p.type);
            
            // إذا كانت معظم المشاكل حديثة من نفس النوع، غير الاستراتيجية
            const uniqueTypes = [...new Set(errorTypes)];
            if (uniqueTypes.length === 1) {
                console.log(`🎯 Detected recurring problem: ${uniqueTypes[0]}. Adapting strategy...`);
                
                switch(uniqueTypes[0]) {
                    case 'connection_refused':
                        this.retryStrategy = 'long_delay';
                        break;
                    case 'timeout':
                        this.retryStrategy = 'aggressive';
                        break;
                }
            }
        }
        
        // تنظيف التاريخ القديم
        if (this.problemHistory.length > 10) {
            this.problemHistory = this.problemHistory.slice(-5);
        }
        
        if (this.solutionsApplied.length > 8) {
            this.solutionsApplied = this.solutionsApplied.slice(-4);
        }
    }

    // تنسيق الوقت
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // إعداد خادم ويب للمراقبة
    setupWebServer() {
        const app = express();
        const port = process.env.PORT || 3000;

        app.get('/', (req, res) => {
            res.json({
                status: 'SMART BOT ACTIVE',
                intelligence: 'ENABLED',
                connected: this.isConnected,
                server: this.currentConfig.host,
                version: this.currentConfig.version,
                username: this.currentConfig.username,
                problems_detected: this.problemHistory.length,
                solutions_applied: this.solutionsApplied,
                current_strategy: this.retryStrategy,
                uptime: this.formatUptime(Date.now() - this.uptime),
                last_error: this.lastError
            });
        });

        app.get('/ping', (req, res) => {
            res.json({ 
                status: 'smart_active', 
                intelligence: true,
                connected: this.isConnected,
                timestamp: new Date().toISOString() 
            });
        });

        app.get('/status', (req, res) => {
            res.json({
                bot_intelligence: 'ACTIVE',
                connection_status: this.isConnected ? 'connected' : 'disconnected',
                problem_solving: this.solutionsApplied,
                learning_cycles: this.problemHistory.length
            });
        });

        app.listen(port, () => {
            console.log(`🌐 Smart web server running on port ${port}`);
            console.log(`📊 Monitor: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        });

        // Ping ذاتي ذكي
        setInterval(() => {
            this.smartSelfPing(port);
        }, 240000);
    }

    // Ping ذاتي ذكي
    smartSelfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET',
            timeout: 10000
        };

        const req = http.request(options, () => {
            console.log('✅ Smart self-ping successful');
        });
        
        req.on('error', () => {
            console.log('⚠️  Smart self-ping failed');
        });
        
        req.end();
    }
}

// بدء البوت الذكي
console.log('🎯 Initializing intelligent bot system...');
const smartBot = new SmartAternosBot();

// معالجة الإغلاق
process.on('SIGINT', () => {
    console.log('🛑 Smart shutdown initiated...');
    if (smartBot.bot) smartBot.bot.quit();
    process.exit(0);
});
