# Email-to-Notion Automation System

An intelligent automation system for processing emails and updating Notion databases.

## Features
- Email monitoring with flexible filtering rules
- PDF extraction and processing
- Notion database integration  
- Configurable automation rules
- Web-based management interface
- Scheduled execution

## Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Email Source  │───▶│  Rule Processor │───▶│ Notion Database │
│   (IMAP/API)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  PDF Extractor  │
                       │                 │
                       └─────────────────┘
```

## Components
- `config/` - Automation rule configurations
- `src/` - Core system code
- `web/` - Management interface
- `data/` - Processed files and logs

## Setup
1. Configure email access (IMAP credentials)
2. Set up Notion API integration
3. Define automation rules
4. Start the scheduler

## Usage
- Access web interface at http://localhost:3000
- Add/edit automation rules through the UI
- Monitor execution logs and status