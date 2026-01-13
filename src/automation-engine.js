#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class AutomationEngine {
    constructor() {
        this.rules = [];
        this.processors = new Map();
        this.running = false;
        this.configPath = path.join(__dirname, '../config/automation-rules.json');
        
        // Register processors
        this.registerProcessor('email', require('./processors/email-processor'));
        this.registerProcessor('extract_pdf', require('./processors/pdf-processor'));  
        this.registerProcessor('save_to_notion', require('./processors/notion-processor'));
        this.registerProcessor('archive_email', require('./processors/email-processor'));
    }

    async loadRules() {
        try {
            const data = await fs.readFile(this.configPath, 'utf8');
            const config = JSON.parse(data);
            this.rules = config.rules.filter(rule => rule.enabled);
            this.globalSettings = config.global_settings;
            console.log(`Loaded ${this.rules.length} automation rules`);
        } catch (error) {
            console.error('Error loading rules:', error.message);
            throw error;
        }
    }

    registerProcessor(type, processor) {
        this.processors.set(type, processor);
    }

    async executeRule(rule) {
        console.log(`Executing rule: ${rule.name}`);
        
        try {
            // Check trigger conditions
            const triggerProcessor = this.processors.get(rule.trigger.type);
            if (!triggerProcessor) {
                throw new Error(`Unknown trigger type: ${rule.trigger.type}`);
            }

            const triggered = await triggerProcessor.checkTrigger(rule.trigger);
            if (!triggered || triggered.length === 0) {
                console.log(`Rule ${rule.name}: No trigger matches found`);
                return;
            }

            // Execute actions for each trigger match
            for (const triggerData of triggered) {
                console.log(`Processing trigger data for rule ${rule.name}`);
                
                let context = { ...triggerData };
                
                for (const action of rule.actions) {
                    const actionProcessor = this.processors.get(action.type);
                    if (!actionProcessor) {
                        console.error(`Unknown action type: ${action.type}`);
                        continue;
                    }
                    
                    try {
                        const result = await actionProcessor.execute(action, context);
                        context = { ...context, ...result };
                        console.log(`Action ${action.type} completed successfully`);
                    } catch (error) {
                        console.error(`Action ${action.type} failed:`, error.message);
                        if (rule.notifications?.errors) {
                            await this.sendNotification(rule, 'error', `Action ${action.type} failed: ${error.message}`);
                        }
                    }
                }
                
                if (rule.notifications?.success) {
                    await this.sendNotification(rule, 'success', `Rule ${rule.name} executed successfully`);
                }
            }
            
        } catch (error) {
            console.error(`Rule ${rule.name} failed:`, error.message);
            if (rule.notifications?.errors) {
                await this.sendNotification(rule, 'error', `Rule ${rule.name} failed: ${error.message}`);
            }
        }
    }

    async sendNotification(rule, type, message) {
        if (rule.notifications?.channel) {
            const [platform, channelId] = rule.notifications.channel.split(':');
            // Integration with Clawdbot messaging system would go here
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    async start() {
        await this.loadRules();
        this.running = true;
        
        console.log('Starting automation engine...');
        
        // Schedule rules
        for (const rule of this.rules) {
            if (rule.schedule?.type === 'interval') {
                const minutes = rule.schedule.minutes;
                const cronExpr = `*/${minutes} * * * *`;
                
                cron.schedule(cronExpr, () => {
                    if (this.running) {
                        this.executeRule(rule).catch(console.error);
                    }
                });
                
                console.log(`Scheduled rule "${rule.name}" to run every ${minutes} minutes`);
            }
        }
        
        // Initial execution
        console.log('Running initial rule execution...');
        for (const rule of this.rules) {
            await this.executeRule(rule);
        }
    }

    async stop() {
        this.running = false;
        console.log('Automation engine stopped');
    }

    async reloadRules() {
        console.log('Reloading automation rules...');
        await this.loadRules();
    }

    async getRules() {
        return this.rules;
    }

    async updateRule(ruleId, updates) {
        const data = await fs.readFile(this.configPath, 'utf8');
        const config = JSON.parse(data);
        
        const ruleIndex = config.rules.findIndex(r => r.id === ruleId);
        if (ruleIndex === -1) {
            throw new Error(`Rule with id ${ruleId} not found`);
        }
        
        config.rules[ruleIndex] = { ...config.rules[ruleIndex], ...updates };
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
        await this.reloadRules();
    }
}

module.exports = AutomationEngine;

// CLI usage
if (require.main === module) {
    const engine = new AutomationEngine();
    
    process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await engine.stop();
        process.exit(0);
    });
    
    engine.start().catch(console.error);
}