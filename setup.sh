#!/bin/bash

echo "🤖 Setting up Email Automation System..."

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create required directories
echo "📁 Creating directories..."
mkdir -p data/pdfs
mkdir -p logs

# Check for required tools
echo "🔧 Checking for required tools..."

# Check for Himalaya (email client) - should already be configured
if command -v himalaya &> /dev/null; then
    echo "✅ Himalaya found and configured"
    himalaya account list
else
    echo "⚠️  Himalaya not found. Install it from: https://github.com/soywod/himalaya"
    echo "   Or use: cargo install himalaya"
fi

# Check and install pdftotext
if ! command -v pdftotext &> /dev/null; then
    echo "📦 Installing PDF tools (poppler-utils)..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y poppler-utils
    elif command -v brew &> /dev/null; then
        brew install poppler
    else
        echo "⚠️  Please install poppler-utils manually:"
        echo "   Ubuntu/Debian: sudo apt-get install poppler-utils"
        echo "   macOS: brew install poppler"
    fi
else
    echo "✅ PDF tools (pdftotext) found"
fi

# Create environment file template
if [ ! -f .env ]; then
    echo "📄 Creating .env template..."
    cat > .env << 'EOL'
# Notion Integration
NOTION_API_TOKEN=your_notion_integration_token_here
NOTION_BETRIEBSKOSTEN_DB_ID=your_database_id_here

# Email Configuration (if not using Himalaya config)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USERNAME=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# System Configuration
PORT=3000
LOG_LEVEL=info
EOL
    echo "📝 Created .env template. Please update it with your credentials."
fi

# Scripts directory not needed - system is ready to use

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. ✅ Email already configured with ProtonMail!"
echo "   2. Edit .env with your Notion API token and database ID"  
echo "   3. Set up your Notion integration and get database ID"
echo "   4. Run: npm start"
echo "   5. Open: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - Setup Guide: SETUP.md"
echo "   - Himalaya: https://github.com/soywod/himalaya"
echo "   - Notion API: https://developers.notion.com/"
echo ""