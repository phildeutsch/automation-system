#!/bin/bash

echo "🚀 Starting Email Automation System..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Please run ./setup.sh first and configure your credentials."
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check ProtonMail Bridge (if using ProtonMail)
if [[ "$IMAP_HOST" == "127.0.0.1" || "$IMAP_HOST" == "localhost" ]]; then
    echo "🔍 Detected ProtonMail Bridge configuration..."
    if ! ./scripts/check-protonmail.sh; then
        echo "❌ ProtonMail Bridge check failed. Please fix the issues above."
        exit 1
    fi
    echo ""
fi

# Check Notion credentials
if [ -z "$NOTION_API_TOKEN" ] || [ -z "$NOTION_BETRIEBSKOSTEN_DB_ID" ]; then
    echo "⚠️  Notion credentials not fully configured in .env"
    echo "   The system will start but Notion integration may fail."
    echo ""
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Run a quick test
echo "🧪 Running quick system test..."
if node scripts/test-automation.js; then
    echo ""
    echo "✅ System test passed!"
else
    echo ""
    echo "⚠️  System test had issues. Check the output above."
    echo "   The system will start anyway, but some features may not work."
fi

echo ""
echo "🎯 Starting automation engine..."
echo "   Web interface will be available at: http://localhost:${PORT:-3000}"
echo "   Press Ctrl+C to stop"
echo ""

# Start the server
npm start