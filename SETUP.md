# Email Automation System - Setup Guide

## Quick Start

1. **Run setup script:**
   ```bash
   cd automation-system
   ./setup.sh
   ```

2. **✅ Email already configured!**
   Your ProtonMail account is already connected and working.

3. **Set up Notion integration:**
   - Go to https://developers.notion.com/
   - Create a new integration
   - Copy the Internal Integration Token
   - Share your Betriebskosten database with the integration

4. **Update environment variables:**
   Edit `.env` file with your tokens and database IDs

5. **Start the system:**
   ```bash
   npm start
   ```

6. **Access web interface:**
   Open http://localhost:3000

## Detailed Configuration

### 1. Email Setup with Himalaya

Install Himalaya CLI:
```bash
# Using Cargo (Rust package manager)
cargo install himalaya

# Or download from releases
# https://github.com/soywod/himalaya/releases
```

Configure your email account:
```bash
himalaya configure
```

Example Gmail setup:
- Email: your-email@gmail.com  
- IMAP Host: imap.gmail.com
- IMAP Port: 993
- IMAP Encryption: SSL/TLS
- Username: your-email@gmail.com
- Password: [App Password - not your regular password]

For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password" for Himalaya
3. Use the app password, not your regular Gmail password

### 2. Notion Database Setup

#### Create Betriebskosten Database:
1. In Notion, create a new database
2. Add these properties:
   - **Amount** (Number)
   - **Date** (Date)
   - **Invoice Number** (Text)
   - **Vendor** (Text)
   - **Description** (Text)
   - **PDF** (Files & media)

#### Get Database ID:
1. Open your database in Notion
2. Copy the URL - it looks like: 
   `https://notion.so/workspace/DATABASE_ID?v=...`
3. The DATABASE_ID is the long string between the last `/` and `?`
4. Add this to your `.env` file as `NOTION_BETRIEBSKOSTEN_DB_ID`

#### Create Notion Integration:
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Give it a name (e.g., "Email Automation")
4. Copy the "Internal Integration Token"
5. Add this to your `.env` file as `NOTION_API_TOKEN`

#### Share Database with Integration:
1. Open your database in Notion
2. Click "Share" → "Invite"
3. Search for your integration name
4. Select it and click "Invite"

### 3. PDF Processing Setup

Install PDF text extraction tool:

**Ubuntu/Debian:**
```bash
sudo apt-get install poppler-utils
```

**macOS:**
```bash
brew install poppler
```

**Windows:**
Download and install Poppler from: https://poppler.freedesktop.org/

### 4. Environment Variables

Edit `.env` file:
```env
# Notion Integration
NOTION_API_TOKEN=secret_xyz123...
NOTION_BETRIEBSKOSTEN_DB_ID=abc123def456...

# System Configuration
PORT=3000
LOG_LEVEL=info
```

## Usage

### Starting the System
```bash
npm start
```

This starts both:
- The automation engine (checking emails every 5 minutes)
- The web interface (http://localhost:3000)

### Web Interface Features
- **View all automation rules**
- **Add/edit/delete rules**
- **Enable/disable rules**
- **Test rules manually**
- **View system status**
- **Export configuration**

### Creating Automation Rules

1. Click "Add New Rule" in the web interface
2. Fill in:
   - **Rule Name**: Descriptive name
   - **Description**: What this rule does
   - **Email From**: Sender pattern (use * for wildcard)
   - **Subject Keywords**: Words that must appear in subject
   - **Notion Database**: Which database to save to
   - **Schedule**: How often to check (in minutes)
   - **Enabled**: Whether rule is active

### Example Rule Configuration

**Spotty Invoice Rule:**
- Name: "Spotty PDF Invoice Processor"
- Email From: `*@spotty.com` or `spotty@*`
- Subject Keywords: `invoice, rechnung, bill`
- Database: `betriebskosten`
- Schedule: Every 5 minutes
- Enabled: ✓

This will:
1. Check for emails from Spotty with invoice-related subjects
2. Extract PDF attachments
3. Parse invoice details (amount, date, vendor, etc.)
4. Save to Notion Betriebskosten database
5. Archive the processed email

## Troubleshooting

### Email Issues
- **"Authentication failed"**: Check app password for Gmail
- **"Connection timeout"**: Verify IMAP settings and firewall
- **"No emails found"**: Check Himalaya config with `himalaya list`

### Notion Issues  
- **"Database not found"**: Verify database ID and integration permissions
- **"Unauthorized"**: Check integration token and database sharing
- **"Property not found"**: Ensure database has required columns

### PDF Issues
- **"pdftotext not found"**: Install poppler-utils package
- **"Text extraction failed"**: PDF might be image-based (needs OCR)
- **"No data extracted"**: Check PDF contains searchable text

### System Issues
- **Port in use**: Change PORT in .env file
- **Permission denied**: Check file permissions for data/ folder
- **Module not found**: Run `npm install` to install dependencies

## File Structure
```
automation-system/
├── config/
│   └── automation-rules.json     # Rule configurations
├── src/
│   ├── automation-engine.js      # Core automation logic
│   ├── web-server.js             # Web interface server
│   └── processors/               # Action processors
│       ├── email-processor.js
│       ├── pdf-processor.js
│       └── notion-processor.js
├── web/
│   └── index.html               # Web interface
├── data/
│   ├── pdfs/                    # Stored PDF files
│   └── processed-emails.json   # Tracking processed emails
└── logs/                        # System logs
```

## Advanced Configuration

### Custom Field Extraction
Edit the PDF processor to add custom extraction patterns for your specific invoice formats.

### Multiple Databases
Add more database configurations in the Notion processor and web interface.

### Slack Notifications
Configure Slack webhook URL to get notifications when rules execute or fail.

### Cron Scheduling
Modify rule schedules to use cron expressions for more precise timing.

## Support

If you encounter issues:
1. Check the logs in the web interface
2. Test individual components (email, PDF extraction, Notion API)
3. Verify all environment variables are set correctly
4. Ensure all required tools are installed and accessible