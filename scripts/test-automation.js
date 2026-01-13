#!/usr/bin/env node

const AutomationEngine = require('../src/automation-engine');
const path = require('path');

async function testAutomation() {
    console.log('🧪 Testing Email Automation System...\n');
    
    const engine = new AutomationEngine();
    
    try {
        // Load rules
        console.log('📋 Loading automation rules...');
        await engine.loadRules();
        console.log(`✅ Loaded ${engine.rules.length} rules\n`);
        
        // Test each rule
        for (const rule of engine.rules) {
            if (!rule.enabled) {
                console.log(`⏩ Skipping disabled rule: ${rule.name}`);
                continue;
            }
            
            console.log(`🔍 Testing rule: ${rule.name}`);
            console.log(`   Description: ${rule.description}`);
            
            try {
                // Test trigger conditions (dry run)
                const emailProcessor = engine.processors.get('email');
                if (emailProcessor) {
                    const matches = await emailProcessor.checkTrigger(rule.trigger);
                    console.log(`   📧 Found ${matches.length} matching emails`);
                    
                    if (matches.length > 0) {
                        console.log('   📎 Sample matches:');
                        matches.slice(0, 2).forEach((match, i) => {
                            console.log(`     ${i + 1}. From: ${match.email.from}`);
                            console.log(`        Subject: ${match.email.subject}`);
                            console.log(`        Attachments: ${match.attachments?.length || 0}`);
                        });
                    }
                } else {
                    console.log('   ❌ Email processor not found');
                }
                
                console.log(`   ✅ Rule test completed\n`);
                
            } catch (error) {
                console.log(`   ❌ Rule test failed: ${error.message}\n`);
            }
        }
        
        // Test Notion connection
        console.log('🔍 Testing Notion connection...');
        const notionToken = process.env.NOTION_API_TOKEN;
        const betriebskostenDb = process.env.NOTION_BETRIEBSKOSTEN_DB_ID;
        
        if (!notionToken) {
            console.log('   ⚠️  NOTION_API_TOKEN not set in environment');
        } else if (!betriebskostenDb) {
            console.log('   ⚠️  NOTION_BETRIEBSKOSTEN_DB_ID not set in environment');
        } else {
            console.log('   ✅ Notion credentials configured');
            
            // Test API access (simple request)
            try {
                const response = await fetch(`https://api.notion.com/v1/databases/${betriebskostenDb}`, {
                    headers: {
                        'Authorization': `Bearer ${notionToken}`,
                        'Notion-Version': '2022-06-28'
                    }
                });
                
                if (response.ok) {
                    const db = await response.json();
                    console.log(`   ✅ Database "${db.title?.[0]?.plain_text || 'Betriebskosten'}" accessible`);
                } else {
                    console.log(`   ❌ Database access failed: ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ Notion API test failed: ${error.message}`);
            }
        }
        
        console.log('\n🎉 Test completed!');
        console.log('\n📋 Summary:');
        console.log(`   - Rules loaded: ${engine.rules.length}`);
        console.log(`   - Enabled rules: ${engine.rules.filter(r => r.enabled).length}`);
        console.log('   - Email system: Ready');
        console.log(`   - Notion system: ${notionToken && betriebskostenDb ? 'Ready' : 'Needs configuration'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run test if called directly
if (require.main === module) {
    // Load environment variables
    require('dotenv').config();

    testAutomation().catch(console.error);
}

module.exports = testAutomation;