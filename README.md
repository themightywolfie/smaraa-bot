# SmaraaBot

Discord bot with AI-powered message archiving and search capabilities using OpenAI embeddings and LangChain.js.

## Features

- **Message Archiving**: Archive important messages by replying and mentioning the bot
- **Semantic Search**: Find messages using natural language queries with vector similarity
- **AI Summarization**: Generate summaries of archived content with citations
- **Role-based Permissions**: Configure who can archive and search messages
- **Data Retention**: Automatic cleanup based on configurable retention policies

## Architecture

This is a monorepo containing:

- `packages/bot`: Discord bot client (discord.js + TypeScript)
- `packages/backend`: REST API server (Express.js + TypeScript)
- PostgreSQL database with pgvector extension for vector storage

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Discord bot token and OpenAI API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Start the PostgreSQL database:

```bash
docker-compose up -d postgres
```

3. Copy environment files and configure:

```bash
cp .env.example .env
cp packages/bot/.env.example packages/bot/.env
cp packages/backend/.env.example packages/backend/.env
```

4. Update the `.env` files with your Discord bot token, OpenAI API key, and other configuration.

### Development Commands

```bash
# Start both bot and backend in development mode
npm run dev

# Build all packages
npm run build

# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

### Database

The PostgreSQL database with pgvector extension will be automatically initialized with the required schema when you start it with Docker Compose.

## Configuration

See the `.env.example` files for all available configuration options.

## License

MIT
