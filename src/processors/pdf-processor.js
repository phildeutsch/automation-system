const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execFileAsync = promisify(execFile);

class PDFProcessor {
    constructor() {
        this.pdfStoragePath = path.join(__dirname, '../../data/pdfs');
    }

    async execute(action, context) {
        console.log('Processing PDF extraction...');
        
        try {
            // Find PDF attachments
            const pdfAttachments = context.attachments.filter(att => 
                att.filename && att.filename.toLowerCase().endsWith('.pdf')
            );
            
            if (pdfAttachments.length === 0) {
                throw new Error('No PDF attachments found');
            }
            
            const results = {};
            
            for (const pdfAttachment of pdfAttachments) {
                const filename = pdfAttachment.filename || `invoice_${Date.now()}.pdf`;
                const pdfPath = path.join(this.pdfStoragePath, filename);
                
                // Download PDF
                const emailProcessor = require('./email-processor');
                await emailProcessor.downloadAttachment(
                    context.email.id, 
                    pdfAttachment.id, 
                    pdfPath
                );
                
                // Extract text from PDF
                const pdfText = await this.extractTextFromPDF(pdfPath);
                
                // Extract structured data
                let extractedData = {};
                if (action.ai_extraction) {
                    extractedData = await this.aiExtraction(pdfText, action.fields);
                } else {
                    extractedData = await this.basicExtraction(pdfText, action.fields);
                }
                
                // Store PDF path for later use
                extractedData.pdf_path = pdfPath;
                extractedData.pdf_filename = filename;
                
                // Merge results
                Object.assign(results, extractedData);
            }
            
            console.log('PDF extraction completed:', results);
            return results;
            
        } catch (error) {
            console.error('PDF processing failed:', error.message);
            throw error;
        }
    }

    async extractTextFromPDF(pdfPath) {
        try {
            // Validate pdfPath is within expected directory to prevent path traversal
            const resolvedPath = path.resolve(pdfPath);
            const dataDir = path.resolve(path.join(__dirname, '../../data'));
            const tmpDir = '/tmp';

            if (!resolvedPath.startsWith(dataDir) && !resolvedPath.startsWith(tmpDir)) {
                throw new Error('Invalid PDF path - must be within data or tmp directory');
            }

            // Use pdftotext if available, fallback to basic methods
            try {
                const { stdout } = await execFileAsync('pdftotext', [resolvedPath, '-']);
                return stdout;
            } catch (error) {
                console.warn('pdftotext not available, trying alternative...');
                // Could add other PDF extraction methods here
                throw new Error('PDF text extraction failed - no suitable tool available');
            }
        } catch (error) {
            console.error('Error extracting text from PDF:', error.message);
            throw error;
        }
    }

    async basicExtraction(text, fields) {
        const extracted = {};
        const lines = text.split('\\n').map(line => line.trim());
        
        // Basic pattern matching for common invoice fields
        const patterns = {
            amount: [
                /total[:\\s]+(\\d+[,.]\\d{2})/i,
                /betrag[:\\s]+(\\d+[,.]\\d{2})/i,
                /summe[:\\s]+(\\d+[,.]\\d{2})/i,
                /(\\d+[,.]\\d{2})\\s*€/,
            ],
            date: [
                /datum[:\\s]+(\\d{1,2}[.\\/]\\d{1,2}[.\\/]\\d{2,4})/i,
                /date[:\\s]+(\\d{1,2}[.\\/]\\d{1,2}[.\\/]\\d{2,4})/i,
                /(\\d{1,2}[.\\/]\\d{1,2}[.\\/]\\d{2,4})/,
            ],
            invoice_number: [
                /rechnung[:\\s#]*(\\w+)/i,
                /invoice[:\\s#]*(\\w+)/i,
                /nr[:\\s#]*(\\w+)/i,
            ],
            vendor: [
                /von[:\\s]+([^\\n]+)/i,
                /from[:\\s]+([^\\n]+)/i,
            ]
        };
        
        for (const field of fields) {
            if (patterns[field]) {
                for (const pattern of patterns[field]) {
                    const match = text.match(pattern);
                    if (match) {
                        extracted[field] = match[1].trim();
                        break;
                    }
                }
            }
        }
        
        // Add description as first few lines of text
        if (fields.includes('description')) {
            const description = lines
                .filter(line => line.length > 10)
                .slice(0, 3)
                .join(' ')
                .substring(0, 200);
            extracted.description = description;
        }
        
        return extracted;
    }

    async aiExtraction(text, fields) {
        // This would integrate with an AI service to extract structured data
        // For now, use basic extraction as fallback
        console.log('AI extraction not yet implemented, using basic extraction');
        return await this.basicExtraction(text, fields);
    }

    async savePDFToStorage(sourcePath, filename) {
        await fs.mkdir(this.pdfStoragePath, { recursive: true });
        const targetPath = path.join(this.pdfStoragePath, filename);
        await fs.copyFile(sourcePath, targetPath);
        return targetPath;
    }
}

module.exports = new PDFProcessor();