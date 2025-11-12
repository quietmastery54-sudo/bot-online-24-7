{
  "name": "minecraft-aternos-bot",
  "version": "3.1.0",
  "description": "Minecraft Bot for Aternos with improved connection handling",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js",
    "dev": "nodemon bot.js",
    "test": "node -e \"require('./bot.js')\""
  },
  "dependencies": {
    "mineflayer": "^4.20.0",
    "mineflayer-pathfinder": "^2.4.3",
    "express": "^4.18.2",
    "minecraft-server-ping": "^1.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": [
    "minecraft",
    "bot",
    "aternos",
    "keepalive"
  ],
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=16.0.0"
  }
}
