# Email Automation System - Overview

A complete automation system built for Philipp to process emails (especially from Spotty) and save invoice data to Notion.

## 🎯 What It Does

1. **Monitors your ProtonMail inbox** every 5 minutes (configurable)
2. **Finds emails from Spotty** with PDF invoices 
3. **Extracts key information** from PDFs (amount, date, vendor, etc.)
4. **Saves data to your Betriebskosten database** in Notion
5. **Archives processed emails** to keep inbox clean
6. **Provides web interface** to manage all automation rules

## 📁 System Structure

```
automation-system/
├── 📄 README.md              # Main documentation
├── 📄 OVERVIEW.md            # This file
├── 📄 package.json           # Node.js dependencies
├── 🚀 setup.sh               # One-time setup script
├── 🚀 start.sh               # Smart startup script
├── config/
│   └── automation-rules.json # All automation rules
├── src/
│   ├── automation-engine.js  # Core automation logic
│   ├── web-server.js         # Web interface server
│   └── processors/           # Email, PDF, Notion handlers
├── web/
│   └── index.html            # Management web interface
├── scripts/
│   ├── check-protonmail.sh   # ProtonMail connectivity test
│   └── test-automation.js    # System test script
├── docs/
│   └── PROTONMAIL-SETUP.md   # ProtonMail configuration guide
└── data/                     # PDFs and processed emails log
```

## 🚀 Quick Start

```bash
# Navigate to the system
cd /home/clawdbot/clawd/automation-system

# Run setup (one time)
./setup.sh

# Configure your credentials in .env
nano .env

# Start the system
./start.sh
# or just: npm start

# Open web interface
# http://localhost:3000
```

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Notion Integration
NOTION_API_TOKEN=your_notion_integration_token
NOTION_BETRIEBSKOSTEN_DB_ID=your_database_id

# ProtonMail via Bridge (already configured for you)
IMAP_HOST=127.0.0.1
IMAP_PORT=1143
IMAP_USERNAME=your-email@protonmail.com
IMAP_PASSWORD=bridge_generated_password

# System
PORT=3000
LOG_LEVEL=info
```

### Default Automation Rule

The system comes pre-configured with your Spotty invoice rule:

- **Trigger**: Emails from "*spotty*" with PDF attachments
- **Actions**: Extract PDF data → Save to Notion → Archive email
- **Schedule**: Every 5 minutes
- **Notifications**: Errors to Slack channel

## 🖥️ Web Interface

Access at `http://localhost:3000` to:

- ✏️ **Edit automation rules**
- ➕ **Add new automations** 
- 🔄 **Enable/disable rules**
- 🧪 **Test individual rules**
- 📊 **View system status**
- 📋 **Monitor execution logs**

## 🔌 Integration Points

### ProtonMail
- Uses **ProtonMail Bridge** for IMAP access
- Configured via **Himalaya** CLI client
- Automatic email processing and archiving

### Notion
- Direct API integration
- Saves to your existing Betriebskosten database
- Handles PDF file references and extracted data

### PDF Processing
- Extracts text using `pdftotext`
- AI-powered data extraction (planned)
- Saves PDFs to `data/pdfs/` directory

## 🛠️ Commands

```bash
# Setup and start
./setup.sh                   # Initial setup
./start.sh                   # Smart start with checks
npm start                    # Direct start

# Testing and debugging
./scripts/check-protonmail.sh    # Test ProtonMail connection
node scripts/test-automation.js  # Test automation without running

# Development
npm run dev                  # Start with nodemon for development
```

## 📋 Automation Rule Structure

Each rule has:
- **Trigger**: When to run (email conditions)
- **Actions**: What to do (extract, save, archive)
- **Schedule**: How often to check
- **Notifications**: Where to send alerts

Example rule:
```json
{
  "id": "spotty-invoice-processor",
  "name": "Spotty PDF Invoice to Betriebskosten", 
  "enabled": true,
  "trigger": {
    "conditions": {
      "from": "*spotty*",
      "has_attachments": true,
      "attachment_types": ["pdf"]
    }
  },
  "actions": [
    { "type": "extract_pdf" },
    { "type": "save_to_notion" },
    { "type": "archive_email" }
  ],
  "schedule": { "minutes": 5 }
}
```

## 🚨 Troubleshooting

**Common Issues:**

1. **ProtonMail Bridge not running**
   - Start ProtonMail Bridge application
   - Run `./scripts/check-protonmail.sh`

2. **Himalaya connection failed**
   - Reconfigure: `himalaya configure` 
   - Use Bridge settings (localhost:1143)

3. **Notion API errors**
   - Check NOTION_API_TOKEN in .env
   - Verify database permissions

4. **PDF extraction fails**
   - Install poppler-utils: `sudo apt install poppler-utils`

## 🔄 Adding More Automations

1. Open web interface: `http://localhost:3000`
2. Click "Add New Rule"
3. Configure trigger conditions
4. Set up actions (extract → save → archive)
5. Set schedule and notifications
6. Save and enable

## 📊 Monitoring

- **Web interface**: Real-time status and rule management
- **Logs**: Execution history and error details  
- **Slack notifications**: Error alerts to your channel
- **Test mode**: Dry-run rules without processing

---

**Built for Philipp Deutsch** - Ready to automate your invoice processing! 🤖