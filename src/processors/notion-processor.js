const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class NotionProcessor {
    constructor() {
        this.databases = {
            'betriebskosten': process.env.NOTION_BETRIEBSKOSTEN_DB_ID || null
        };
    }

    async execute(action, context) {
        console.log('Saving to Notion database...');
        
        try {
            const databaseId = this.databases[action.database];
            if (!databaseId) {
                throw new Error(`Database ${action.database} not configured`);
            }
            
            // Prepare properties for Notion
            const properties = {};
            
            for (const [notionField, contextField] of Object.entries(action.field_mapping)) {
                const value = context[contextField];
                if (value !== undefined && value !== null) {
                    properties[notionField] = await this.formatPropertyValue(notionField, value, context);
                }
            }
            
            // Create the page in Notion
            const pageData = {
                parent: { database_id: databaseId },
                properties: properties
            };
            
            // Use Notion skill if available, otherwise direct API call
            const result = await this.createNotionPage(pageData);
            
            console.log('Successfully saved to Notion:', result.id);
            return { 
                notion_page_id: result.id,
                notion_url: result.url 
            };
            
        } catch (error) {
            console.error('Notion processing failed:', error.message);
            throw error;
        }
    }

    async formatPropertyValue(fieldName, value, context) {
        // Format value based on Notion property type
        // This is a simplified version - real implementation would check property types
        
        if (fieldName.toLowerCase().includes('amount') || fieldName.toLowerCase().includes('betrag')) {
            // Number field
            const numValue = parseFloat(value.toString().replace(',', '.'));
            return { number: isNaN(numValue) ? null : numValue };
        }
        
        if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('datum')) {
            // Date field
            const date = this.parseDate(value);
            return { date: { start: date } };
        }
        
        if (fieldName === 'PDF' && context.pdf_path) {
            // File upload - this would need to be handled specially
            // For now, just store as text with file info
            return { 
                rich_text: [{ 
                    text: { 
                        content: `PDF: ${context.pdf_filename} (${context.pdf_path})` 
                    } 
                }] 
            };
        }
        
        // Default to rich text
        return { 
            rich_text: [{ 
                text: { 
                    content: value.toString().substring(0, 2000) 
                } 
            }] 
        };
    }

    parseDate(dateStr) {
        // Try to parse various date formats
        const formats = [
            /(\d{1,2})[.\\/](\d{1,2})[.\\/](\d{2,4})/,  // DD.MM.YYYY or DD/MM/YYYY
            /(\d{2,4})[.\\/](\d{1,2})[.\\/](\d{1,2})/,  // YYYY.MM.DD or YYYY/MM/DD
        ];
        
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let [, p1, p2, p3] = match;
                
                // Determine if it's DD.MM.YYYY or YYYY.MM.DD
                if (p1.length === 4) {
                    // YYYY.MM.DD
                    return `${p1}-${p2.padStart(2, '0')}-${p3.padStart(2, '0')}`;
                } else {
                    // DD.MM.YYYY
                    const year = p3.length === 2 ? `20${p3}` : p3;
                    return `${year}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`;
                }
            }
        }
        
        // Fallback to current date if parsing fails
        return new Date().toISOString().split('T')[0];
    }

    async createNotionPage(pageData) {
        try {
            // Check if Notion skill is available
            const skillPath = '/home/clawdbot/.nvm/versions/node/v24.12.0/lib/node_modules/clawdbot/skills/notion/create-page.js';
            
            try {
                await fs.access(skillPath);
                // Use Notion skill
                const { stdout } = await execAsync(`node "${skillPath}" '${JSON.stringify(pageData)}'`);
                return JSON.parse(stdout);
            } catch (error) {
                // Notion skill not available, use direct API call
                return await this.directNotionAPI(pageData);
            }
        } catch (error) {
            console.error('Error creating Notion page:', error.message);
            throw error;
        }
    }

    async directNotionAPI(pageData) {
        const notionToken = process.env.NOTION_API_TOKEN;
        if (!notionToken) {
            throw new Error('NOTION_API_TOKEN environment variable not set');
        }
        
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${notionToken}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(pageData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Notion API error: ${error.message}`);
        }
        
        return await response.json();
    }

    async setupDatabase(databaseName, schema) {
        // Helper method to create/configure Notion databases
        console.log(`Setting up database: ${databaseName}`);
        
        // This would create the database with the right schema
        // For now, just log the intent
        console.log('Database setup not yet implemented');
        console.log('Schema:', schema);
    }
}

module.exports = new NotionProcessor();