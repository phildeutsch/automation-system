#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const AutomationEngine = require('./automation-engine');

class WebServer {
    constructor() {
        this.app = express();
        this.engine = new AutomationEngine();
        this.port = process.env.PORT || 3000;
        this.configPath = path.join(__dirname, '../config/automation-rules.json');
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../web')));
    }

    setupRoutes() {
        // Serve the main interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../web/index.html'));
        });

        // API Routes
        this.app.get('/api/rules', this.getRules.bind(this));
        this.app.post('/api/rules', this.createRule.bind(this));
        this.app.put('/api/rules/:id', this.updateRule.bind(this));
        this.app.delete('/api/rules/:id', this.deleteRule.bind(this));
        this.app.post('/api/rules/:id/test', this.testRule.bind(this));
        this.app.post('/api/reload', this.reloadRules.bind(this));
        this.app.get('/api/status', this.getStatus.bind(this));
        this.app.get('/api/logs', this.getLogs.bind(this));
    }

    async getRules(req, res) {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(data);
            res.json(config.rules);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async createRule(req, res) {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(data);
            
            const newRule = req.body;
            newRule.id = newRule.id || `rule-${Date.now()}`;
            
            config.rules.push(newRule);
            
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            await this.engine.reloadRules();
            
            res.json({ success: true, id: newRule.id });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateRule(req, res) {
        try {
            const ruleId = req.params.id;
            const updates = req.body;
            
            const data = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(data);
            
            const ruleIndex = config.rules.findIndex(r => r.id === ruleId);
            if (ruleIndex === -1) {
                return res.status(404).json({ error: 'Rule not found' });
            }
            
            config.rules[ruleIndex] = { ...config.rules[ruleIndex], ...updates };
            
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            await this.engine.reloadRules();
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteRule(req, res) {
        try {
            const ruleId = req.params.id;
            
            const data = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(data);
            
            config.rules = config.rules.filter(r => r.id !== ruleId);
            
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
            await this.engine.reloadRules();
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async testRule(req, res) {
        try {
            const ruleId = req.params.id;
            const rules = await this.engine.getRules();
            const rule = rules.find(r => r.id === ruleId);
            
            if (!rule) {
                return res.status(404).json({ error: 'Rule not found' });
            }
            
            // Execute rule once for testing
            await this.engine.executeRule(rule);
            
            res.json({ 
                success: true, 
                message: `Rule "${rule.name}" executed successfully` 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: `Rule test failed: ${error.message}` 
            });
        }
    }

    async reloadRules(req, res) {
        try {
            await this.engine.reloadRules();
            res.json({ success: true, message: 'Rules reloaded successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getStatus(req, res) {
        try {
            const rules = await this.engine.getRules();
            const enabledRules = rules.filter(r => r.enabled);
            
            res.json({
                running: this.engine.running,
                totalRules: rules.length,
                enabledRules: enabledRules.length,
                lastUpdate: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getLogs(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            // This would read from a log file
            // For now, return mock data
            res.json({
                logs: [
                    {
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        message: 'Automation engine started',
                        rule: null
                    }
                ]
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async start() {
        // Start the automation engine
        await this.engine.start();
        
        // Start the web server
        this.app.listen(this.port, () => {
            console.log(`Web server running at http://localhost:${this.port}`);
            console.log('Automation system ready!');
        });
    }

    async stop() {
        await this.engine.stop();
    }
}

// CLI usage
if (require.main === module) {
    const server = new WebServer();
    
    process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await server.stop();
        process.exit(0);
    });
    
    server.start().catch(console.error);
}

module.exports = WebServer;