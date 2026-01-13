# ProtonMail Setup Guide

This guide helps you configure the automation system with ProtonMail.

## Prerequisites

1. **ProtonMail Bridge** must be installed and running
2. **Himalaya** email client installed
3. Bridge authentication completed

## ProtonMail Bridge Configuration

ProtonMail requires Bridge to access IMAP/SMTP. Bridge runs locally and provides standard email protocols.

### 1. Install ProtonMail Bridge

Download from: https://proton.me/mail/bridge

### 2. Configure Bridge

1. Start ProtonMail Bridge
2. Add your ProtonMail account
3. Note the IMAP settings (usually):
   - Host: `127.0.0.1` or `localhost`
   - Port: `1143` (IMAP)
   - Security: `STARTTLS`

### 3. Configure Himalaya

```bash
himalaya configure
```

Use these settings when prompted:
- **IMAP host**: `127.0.0.1`
- **IMAP port**: `1143`
- **IMAP security**: `start-tls`
- **IMAP username**: Your ProtonMail email
- **IMAP password**: Bridge password (from Bridge app)

## Testing Email Access

Test that Himalaya can connect:

```bash
# List recent emails
himalaya list

# Check a specific email
himalaya read 1
```

## Automation Configuration

Update your `.env` file with ProtonMail settings:

```bash
# ProtonMail via Bridge
IMAP_HOST=127.0.0.1
IMAP_PORT=1143
IMAP_SECURITY=starttls
IMAP_USERNAME=your-email@protonmail.com
IMAP_PASSWORD=bridge_generated_password

# Notion Configuration
NOTION_API_TOKEN=your_notion_token
NOTION_BETRIEBSKOSTEN_DB_ID=your_database_id
```

## Troubleshooting

### Bridge Not Running
- Ensure ProtonMail Bridge is started
- Check Bridge logs for connection issues
- Restart Bridge if needed

### Authentication Issues
- Verify Bridge password in Himalaya config
- Re-authenticate with Bridge if needed
- Check that account is properly added to Bridge

### Connection Timeouts
- Bridge might take a moment to start
- Try increasing timeout in automation settings
- Check firewall settings for localhost connections

## Security Notes

- Bridge password is different from your ProtonMail password
- Bridge creates app-specific passwords for each client
- Keep Bridge running for automation to work
- Bridge data is encrypted locally

## Automation Rules for ProtonMail

The default rule configuration works with ProtonMail:

```json
{
  "trigger": {
    "type": "email",
    "source": "imap",
    "conditions": {
      "from": "spotty@*",
      "subject_contains": ["invoice", "rechnung"],
      "has_attachments": true,
      "attachment_types": ["pdf"]
    }
  }
}
```

## Performance Tips

- Bridge caches emails locally for faster access
- First sync might take longer
- Consider running Bridge at system startup
- Monitor Bridge resource usage for large mailboxes