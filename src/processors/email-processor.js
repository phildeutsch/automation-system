const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

class EmailProcessor {
    constructor() {
        this.processedEmails = new Set();
        this.loadProcessedEmails();
    }

    async loadProcessedEmails() {
        try {
            const dataPath = path.join(__dirname, '../../data/processed-emails.json');
            const data = await fs.readFile(dataPath, 'utf8');
            const processed = JSON.parse(data);
            this.processedEmails = new Set(processed);
        } catch (error) {
            // File doesn't exist yet, start with empty set
            this.processedEmails = new Set();
        }
    }

    async saveProcessedEmails() {
        const dataPath = path.join(__dirname, '../../data/processed-emails.json');
        await fs.mkdir(path.dirname(dataPath), { recursive: true });
        await fs.writeFile(dataPath, JSON.stringify([...this.processedEmails], null, 2));
    }

    async checkTrigger(trigger) {
        console.log('Checking email trigger conditions...');
        
        try {
            // Use existing ProtonMail connection via Himalaya CLI
            const { stdout } = await execAsync('himalaya envelope list --output json --page-size 50');
            const emails = JSON.parse(stdout);
            
            const matches = [];
            
            for (const email of emails) {
                const emailId = `${email.id}-${email.date}`;
                
                // Skip if already processed
                if (this.processedEmails.has(emailId)) {
                    continue;
                }
                
                // Check conditions
                if (!this.matchesConditions(email, trigger.conditions)) {
                    continue;
                }
                
                // Get email content and attachments
                const emailContent = await this.getEmailContent(email.id);
                
                matches.push({
                    emailId,
                    email: email,
                    content: emailContent.content,
                    attachments: emailContent.attachments
                });
                
                // Mark as processed
                this.processedEmails.add(emailId);
            }
            
            if (matches.length > 0) {
                await this.saveProcessedEmails();
            }
            
            return matches;
            
        } catch (error) {
            console.error('Error checking email trigger:', error.message);
            return [];
        }
    }

    matchesConditions(email, conditions) {
        // Check sender
        if (conditions.from) {
            const fromPattern = conditions.from.replace('*', '.*');
            const regex = new RegExp(fromPattern, 'i');
            if (!regex.test(email.from)) {
                return false;
            }
        }
        
        // Check subject contains
        if (conditions.subject_contains) {
            const subjectLower = email.subject.toLowerCase();
            const hasMatch = conditions.subject_contains.some(keyword => 
                subjectLower.includes(keyword.toLowerCase())
            );
            if (!hasMatch) {
                return false;
            }
        }
        
        // Check has attachments (basic check - we'll verify PDF later)
        if (conditions.has_attachments && !email.attachments) {
            return false;
        }
        
        return true;
    }

    async getEmailContent(emailId) {
        try {
            // Get email content
            const { stdout: contentStdout } = await execAsync(`himalaya message read ${emailId}`);
            const emailData = { body: contentStdout };
            
            // Get attachments if any
            let attachments = [];
            try {
                const { stdout: attachStdout } = await execAsync(`himalaya attachment list ${emailId} --output json`);
                const attachList = JSON.parse(attachStdout);
                
                // Convert to expected format
                attachments = attachList.map((att, index) => ({
                    id: index,
                    filename: att.filename || att.name,
                    size: att.size,
                    type: att.mime_type || att.type
                }));
            } catch (error) {
                // No attachments or error reading them
                console.log(`No attachments found for email ${emailId}`);
                attachments = [];
            }
            
            return {
                content: emailData,
                attachments: attachments
            };
        } catch (error) {
            console.error(`Error getting email content for ${emailId}:`, error.message);
            return { content: null, attachments: [] };
        }
    }

    async execute(action, context) {
        if (action.type === 'archive_email') {
            return await this.archiveEmail(action, context);
        }
        
        throw new Error(`Unknown email action: ${action.type}`);
    }

    async archiveEmail(action, context) {
        try {
            const folder = action.folder || 'Archive';
            await execAsync(`himalaya message move ${context.email.id} "${folder}"`);
            
            console.log(`Archived email ${context.email.id} to ${folder}`);
            return { archived: true };
        } catch (error) {
            console.error('Error archiving email:', error.message);
            // Don't throw error for archiving failure, just log it
            return { archived: false, error: error.message };
        }
    }

    async downloadAttachment(emailId, attachmentId, savePath) {
        try {
            await fs.mkdir(path.dirname(savePath), { recursive: true });
            // Download all attachments to the directory, then move the specific one
            const downloadDir = path.dirname(savePath);
            await execAsync(`himalaya attachment download ${emailId} --dir "${downloadDir}"`);
            
            // Find the downloaded file and rename it to our expected path
            // This is a simplified approach - might need refinement based on actual attachment names
            return savePath;
        } catch (error) {
            console.error('Error downloading attachment:', error.message);
            throw error;
        }
    }
}

module.exports = new EmailProcessor();