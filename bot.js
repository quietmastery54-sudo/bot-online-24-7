const mineflayer = require('mineflayer');
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

class AternosBot {
    constructor() {
        this.bot = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.uptime = Date.now();
        this.app = express();
        this.server = null;
        
        console.log('🤖 Starting Aternos Bot...');
        console.log(`📍 Server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
        
        this.setupWebServer();
        this.initBot();
    }

    setupWebServer() {
        const port = process.env.PORT || 3000;

        this.app.get('/', (req, res) => {
            res.json({
                status: 'Bot Active',
                connected: this.isConnected,
                server: SERVER_CONFIG.host,
                uptime: Date.now() - this.uptime,
                reconnectAttempts: this.reconnectAttempts
            });
        });

        this.app.get('/ping', (req, res) => {
            res.json({ status: 'pong', timestamp: new Date().toISOString() });
        });

        this.server = this.app.listen(port, () => {
            console.log(`🌐 Web server running on port ${port}`);
        });

        // Ping every 4 minutes
        setInterval(() => {
            this.selfPing(port);
        }, 240000);
    }

    selfPing(port) {
        const options = {
            hostname: 'localhost',
            port: port,
            path: '/ping',
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ Ping successful - ${new Date().toLocaleTimeString()}`);
        });

        req.on('error', () => {
            console.log('⚠️  Ping failed');
        });

        req.end();
    }

    initBot() {
        try {
            this.bot = mineflayer.createBot(SERVER_CONFIG);
            this.setupEventHandlers();
            this.setupBotTasks();
            
        } catch (error) {
            console.error('❌ Bot creation failed:', error.message);
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.bot.on('login', () => {
            console.log('✅ Connected to server!');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            
            const pos = this.bot.entity.position;
            console.log(`📍 Position: X:${pos.x}, Y:${pos.y}, Z:${pos.z}`);
            
            // Send welcome message
            setTimeout(() => {
                this.bot.chat('Hello! Bot is online.');
            }, 3000);
        });

        this.bot.on('end', (reason) => {
            console.log(`🔌 Disconnected: ${reason}`);
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.bot.on('error', (err) => {
            console.error('❌ Bot error:', err.message);
            this.isConnected = false;
        });

        this.bot.on('message', (message) => {
            const msg = message.toString();
            console.log(`💬 Chat: ${msg}`);
        });

        this.bot.on('spawn', () => {
            console.log('🔄 Bot spawned');
            this.isConnected = true;
        });
    }

    setupBotTasks() {
        // Movement every 20 seconds
        setInterval(() => {
            if (this.isConnected && this.bot.entity) {
                this.performMovement();
            }
        }, 20000);

        // Commands every 90 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.sendCommand();
            }
        }, 90000);

        // Chat messages every 2 minutes
        setInterval(() => {
            if (this.isConnected) {
                this.sendChat();
            }
        }, 120000);

        // AFK prevention every 45 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.afkPrevention();
            }
        }, 45000);
    }

    performMovement() {
        try {
            const movements = ['forward', 'back', 'left', 'right', 'jump', 'sneak'];
            const randomMove = movements[Math.floor(Math.random() * movements.length)];
            
            this.bot.setControlState(randomMove, true);
            setTimeout(() => {
                this.bot.setControlState(randomMove, false);
            }, 800);
            
            // Random look
            this.bot.look(
                Math.random() * Math.PI * 2 - Math.PI,
                (Math.random() * 0.5) - 0.25,
                true
            );
            
            console.log(`🚶 Movement: ${randomMove}`);
            
        } catch (error) {
            console.error('❌ Movement error:', error.message);
        }
    }

    sendCommand() {
        try {
            const commands = ['/list', '/time query daytime'];
            const randomCommand = commands[Math.floor(Math.random() * commands.length)];
            this.bot.chat(randomCommand);
            console.log(`📝 Command: ${randomCommand}`);
        } catch (error) {
            console.error('❌ Command error:', error.message);
        }
    }

    sendChat() {
        try {
            const messages = [
                'Active!',
                'Server maintenance bot online!',
                'Keeping server active!'
            ];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            this.bot.chat(randomMsg);
            console.log(`💬 Chat: ${randomMsg}`);
        } catch (error) {
            console.error('❌ Chat error:', error.message);
        }
    }

    afkPrevention() {
        try {
            this.bot.setControlState('sneak', true);
            setTimeout(() => {
                this.bot.setControlState('sneak', false);
            }, 1000);
        } catch (error) {
            console.error('❌ AFK prevention error:', error.message);
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= 5) {
            console.log('🛑 Max reconnection attempts reached. Waiting 5 minutes...');
            setTimeout(() => {
                this.reconnectAttempts = 0;
                this.scheduleReconnect();
            }, 300000);
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(8000 * this.reconnectAttempts, 30000);
        
        console.log(`⏳ Reconnecting in ${delay/1000}s (Attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            console.log('🔄 Reconnecting...');
            this.initBot();
        }, delay);
    }
}

// Start bot
console.log('🚀 Starting Minecraft Bot on Replit...');
const bot = new AternosBot();

// Handle shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down...');
    if (bot.bot) bot.bot.quit();
    process.exit(0);
});
