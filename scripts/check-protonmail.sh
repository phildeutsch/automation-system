#!/bin/bash

echo "🔍 Checking ProtonMail Bridge connectivity..."

# Check if ProtonMail Bridge is running
if ! nc -z 127.0.0.1 1143 2>/dev/null; then
    echo "❌ ProtonMail Bridge not accessible on localhost:1143"
    echo "   Please ensure:"
    echo "   1. ProtonMail Bridge is installed and running"
    echo "   2. Your ProtonMail account is configured in Bridge"
    echo "   3. Bridge is listening on port 1143"
    echo ""
    echo "   Download Bridge from: https://proton.me/mail/bridge"
    exit 1
fi

echo "✅ ProtonMail Bridge is running"

# Check Himalaya configuration
if ! command -v himalaya &> /dev/null; then
    echo "❌ Himalaya not found. Install it with:"
    echo "   cargo install himalaya"
    exit 1
fi

echo "✅ Himalaya is installed"

# Test Himalaya connection
echo "🧪 Testing email connection..."
if himalaya list --max-width 0 > /dev/null 2>&1; then
    echo "✅ Email connection working"
    
    # Count emails
    EMAIL_COUNT=$(himalaya list --max-width 0 2>/dev/null | wc -l)
    echo "📧 Found $EMAIL_COUNT emails in inbox"
else
    echo "❌ Email connection failed"
    echo "   Please check:"
    echo "   1. Himalaya is configured: himalaya configure"
    echo "   2. Bridge credentials are correct"
    echo "   3. Your ProtonMail account is properly set up in Bridge"
    echo ""
    echo "   Run 'himalaya configure' and use Bridge settings:"
    echo "   - Host: 127.0.0.1"
    echo "   - Port: 1143"
    echo "   - Security: start-tls"
    echo "   - Username: your-email@protonmail.com"
    echo "   - Password: (from Bridge app)"
    exit 1
fi

echo ""
echo "🎉 ProtonMail setup looks good!"
echo "   Your automation system should work properly."