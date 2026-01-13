#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

async function testEmailConnection() {
    console.log('🔍 Testing ProtonMail connection...');
    
    try {
        const { stdout } = await execAsync('himalaya account list');
        console.log('✅ Email accounts found:');
        console.log(stdout);
        
        // Test listing emails
        const { stdout: emails } = await execAsync('himalaya envelope list --page-size 5');
        console.log('✅ Recent emails:');
        console.log(emails);
        
        return true;
    } catch (error) {
        console.error('❌ Email connection failed:', error.message);
        return false;
    }
}

async function testSpottyEmail() {
    console.log('🔍 Testing Spotty email detection...');
    
    try {
        const { stdout } = await execAsync('himalaya envelope list subject spotty --output json');
        const emails = JSON.parse(stdout);
        
        if (emails.length === 0) {
            console.log('⚠️  No Spotty emails found');
            return false;
        }
        
        console.log(`✅ Found ${emails.length} Spotty email(s):`);
        emails.forEach(email => {
            console.log(`   - ID: ${email.id}, Subject: ${email.subject}, From: ${email.from}`);
        });
        
        // Test downloading attachment from first Spotty email
        const testEmail = emails[0];
        const downloadDir = '/tmp/automation-test';
        
        try {
            await fs.mkdir(downloadDir, { recursive: true });
            await execAsync(`himalaya attachment download ${testEmail.id} --dir "${downloadDir}"`);
            
            // Check if PDF was downloaded
            const files = await fs.readdir(downloadDir);
            const pdfFiles = files.filter(f => f.endsWith('.pdf'));
            
            if (pdfFiles.length > 0) {
                console.log(`✅ Downloaded ${pdfFiles.length} PDF attachment(s):`, pdfFiles);
                return { emailId: testEmail.id, pdfPath: path.join(downloadDir, pdfFiles[0]) };
            } else {
                console.log('⚠️  No PDF attachments found');
                return false;
            }
        } catch (error) {
            console.log('⚠️  Could not download attachments:', error.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Spotty email test failed:', error.message);
        return false;
    }
}

async function testPDFExtraction(pdfPath) {
    console.log('🔍 Testing PDF text extraction...');
    
    try {
        const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`);
        
        if (stdout.length > 0) {
            console.log('✅ PDF text extraction successful');
            console.log('📄 Sample text (first 200 chars):');
            console.log(stdout.substring(0, 200) + '...');
            
            // Look for common invoice fields
            const text = stdout.toLowerCase();
            const foundFields = [];
            
            if (text.includes('betrag') || text.includes('summe') || text.includes('€')) foundFields.push('amount');
            if (text.includes('datum') || text.match(/\d{1,2}\.\d{1,2}\.\d{2,4}/)) foundFields.push('date');
            if (text.includes('rechnung') || text.includes('invoice')) foundFields.push('invoice_number');
            if (text.includes('spotty')) foundFields.push('vendor');
            
            console.log(`✅ Detected fields: ${foundFields.join(', ')}`);
            return true;
        } else {
            console.log('⚠️  PDF appears to be empty or image-only');
            return false;
        }
    } catch (error) {
        console.error('❌ PDF extraction failed:', error.message);
        if (error.message.includes('pdftotext: command not found')) {
            console.log('💡 Install with: sudo apt-get install poppler-utils');
        }
        return false;
    }
}

async function testNotionConnection() {
    console.log('🔍 Testing Notion configuration...');
    
    const notionToken = process.env.NOTION_API_TOKEN;
    const databaseId = process.env.NOTION_BETRIEBSKOSTEN_DB_ID;
    
    if (!notionToken) {
        console.log('⚠️  NOTION_API_TOKEN not set in environment');
        return false;
    }
    
    if (!databaseId) {
        console.log('⚠️  NOTION_BETRIEBSKOSTEN_DB_ID not set in environment');
        return false;
    }
    
    console.log('✅ Notion environment variables configured');
    console.log(`   Token: ${notionToken.substring(0, 10)}...`);
    console.log(`   Database ID: ${databaseId.substring(0, 10)}...`);
    
    // Could add actual Notion API test here
    return true;
}

async function runSystemTest() {
    console.log('🤖 Email Automation System Test\n');
    
    // Test email connection
    const emailOk = await testEmailConnection();
    if (!emailOk) return;
    
    console.log('');
    
    // Test Spotty email detection
    const spottyResult = await testSpottyEmail();
    if (!spottyResult) return;
    
    console.log('');
    
    // Test PDF extraction if we have a PDF
    if (spottyResult.pdfPath) {
        const pdfOk = await testPDFExtraction(spottyResult.pdfPath);
        if (!pdfOk) return;
        console.log('');
    }
    
    // Test Notion configuration  
    const notionOk = await testNotionConnection();
    
    console.log('');
    console.log('🎉 System test completed!');
    console.log('');
    console.log('✅ Ready to run automation:');
    console.log('   1. Set up your Notion integration (see SETUP.md)');
    console.log('   2. Run: npm start');
    console.log('   3. Open: http://localhost:3000');
}

// Run the test
if (require.main === module) {
    runSystemTest().catch(console.error);
}

module.exports = { testEmailConnection, testSpottyEmail, testPDFExtraction, testNotionConnection };