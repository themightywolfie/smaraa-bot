# Implementation Plan

- [x] 1. Set up project structure and development environment
  - Create monorepo structure with separate packages for bot and backend
  - Configure TypeScript, ESLint, Prettier, and build tools
  - Set up Docker Compose for local PostgreSQL with pgvector extension
  - Create package.json files with required dependencies (discord.js, express, pg, openai, langchain)
  - _Requirements: 6.4, 9.1_

- [x] 2. Implement database schema and migrations
  - [x] 2.1 Create PostgreSQL database schema with pgvector extension
    - Write SQL migration files for archived_messages, settings, and audit_log tables
    - Create vector indexes using ivfflat with cosine distance operators
    - Add composite B-tree indexes for filtering by guild_id, channel_id, and created_at
    - _Requirements: 1.2, 4.1, 5.2_

  - [x] 2.2 Implement database client and connection management
    - Create DatabaseClient class with connection pooling using pg library
    - Implement query methods with proper error handling and logging
    - Add health check functionality for database connectivity
    - _Requirements: 6.1, 9.2_

  - [ ]\* 2.3 Create database seeding and test fixtures
    - Write seed scripts with sample archived messages and embeddings
    - Create test data generators for performance testing with 50k messages
    - _Requirements: 5.1_

- [ ] 3. Build backend API server foundation
  - [ ] 3.1 Create Express.js server with middleware setup
    - Implement Express application with CORS, JSON parsing, and security headers
    - Add authentication middleware for X-ARCHIVE-KEY header validation
    - Configure structured logging with Pino and request correlation IDs
    - _Requirements: 6.1, 7.1, 7.2_

  - [ ] 3.2 Implement health check and monitoring endpoints
    - Create /api/healthz endpoint with database connectivity checks
    - Add basic metrics collection for request counts and response times
    - Implement graceful shutdown handling for in-flight requests
    - _Requirements: 6.4, 9.3_

  - [ ]\* 3.3 Add request validation and error handling middleware
    - Implement input validation using Joi or Zod schemas
    - Create standardized error response format with proper HTTP status codes
    - Add rate limiting middleware to prevent abuse
    - _Requirements: 6.2, 7.1_

- [ ] 4. Implement OpenAI integration and embedding service
  - [ ] 4.1 Create EmbeddingService with OpenAI client
    - Initialize OpenAI client with API key and proper configuration
    - Implement generateEmbedding method using text-embedding-3-small model
    - Add batch embedding generation for multiple texts
    - _Requirements: 1.2, 5.2_

  - [ ] 4.2 Add embedding caching and error handling
    - Implement in-memory cache for identical content embeddings using content hashes
    - Add exponential backoff retry logic for OpenAI API failures
    - Create circuit breaker pattern for API resilience
    - _Requirements: 6.2, 6.3_

  - [ ]\* 4.3 Write unit tests for embedding service
    - Mock OpenAI API responses and test embedding generation
    - Test caching behavior and cache hit/miss scenarios
    - Verify error handling and retry mechanisms
    - _Requirements: 6.2_

- [ ] 5. Build message archiving functionality
  - [ ] 5.1 Implement ArchiveService for message processing
    - Create archiveMessage method with deduplication using ON CONFLICT DO NOTHING
    - Integrate embedding generation and database storage in single transaction
    - Add attachment metadata extraction and JSON storage
    - _Requirements: 1.1, 1.2, 1.3, 10.1_

  - [ ] 5.2 Create POST /api/archive endpoint
    - Implement request validation for message data structure
    - Add guild-specific permission checking integration points
    - Return structured success/error responses with proper HTTP status codes
    - _Requirements: 1.4, 1.5, 3.5_

  - [ ] 5.3 Add audit logging for archive operations
    - Implement AuditService with structured logging to audit_log table
    - Log archive actions with actor_id, guild_id, and message metadata
    - Include correlation IDs for request tracing
    - _Requirements: 6.1, 4.4_

  - [ ]\* 5.4 Write integration tests for archive workflow
    - Test end-to-end archive flow with real database and mocked OpenAI
    - Verify deduplication behavior and idempotency
    - Test error scenarios and rollback behavior
    - _Requirements: 1.3, 9.2_

- [ ] 6. Implement semantic search functionality
  - [ ] 6.1 Create SearchService with vector similarity search
    - Implement vector search using pgvector cosine distance operators
    - Add filtering by guild_id, channel_id, author_id, and date ranges
    - Optimize query performance with proper index usage and LIMIT clauses
    - _Requirements: 2.2, 2.3, 5.1, 5.2_

  - [ ] 6.2 Build POST /api/search endpoint with filtering
    - Implement request validation for search queries and filter parameters
    - Add pagination support with configurable result limits
    - Return ranked results with relevance scores and message metadata
    - _Requirements: 2.2, 2.5, 5.3, 5.4_

  - [ ] 6.3 Add search result formatting and deep links
    - Format search results with message snippets and author information
    - Generate Discord deep links using https://discord.com/channels/{guild}/{channel}/{message} format
    - Include attachment information in search result display
    - _Requirements: 2.5, 10.2, 10.3_

  - [ ]\* 6.4 Implement performance testing for search latency
    - Create load testing scripts to measure p95 latency with 50k messages
    - Test concurrent search requests and system behavior under load
    - Optimize pgvector index parameters (lists, probes) for performance
    - _Requirements: 5.1_

- [ ] 7. Build summarization with LangChain.js integration
  - [ ] 7.1 Implement SummarizationService with LangChain.js
    - Create LangChain retriever using custom PGVector integration
    - Implement document retrieval with configurable top-k parameter
    - Add prompt templates for summarization with citation requirements
    - _Requirements: 8.1, 8.2_

  - [ ] 7.2 Create POST /api/summarize endpoint
    - Implement summarization workflow: search → retrieve → generate summary
    - Add OpenAI LLM integration using gpt-4o-mini model
    - Return summary with message ID citations and confidence scores
    - _Requirements: 8.3, 8.4_

  - [ ] 7.3 Add fallback handling for summarization failures
    - Implement graceful degradation when LLM services are unavailable
    - Add timeout handling for long-running summarization requests
    - Create fallback to simple search results when summarization fails
    - _Requirements: 8.4_

  - [ ]\* 7.4 Write unit tests for summarization service
    - Mock LangChain and OpenAI responses for consistent testing
    - Test prompt generation and citation extraction
    - Verify error handling and fallback behavior
    - _Requirements: 8.4_

- [ ] 8. Implement guild settings and permissions management
  - [ ] 8.1 Create SettingsService for guild configuration
    - Implement CRUD operations for guild settings in database
    - Add default settings initialization for new guilds
    - Create settings validation for role IDs and retention policies
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 8.2 Build POST /api/admin/settings endpoint
    - Implement guild settings update with proper validation
    - Add role-based authorization for admin-only operations
    - Return updated settings with confirmation responses
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 8.3 Add data retention cleanup functionality
    - Implement scheduled job for automatic message deletion based on retention_days
    - Add vector index maintenance after bulk deletions
    - Log retention cleanup activities for audit compliance
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ]\* 8.4 Write tests for settings and retention functionality
    - Test guild settings CRUD operations and validation
    - Verify retention cleanup logic and database consistency
    - Test permission enforcement for admin operations
    - _Requirements: 4.2, 4.4_

- [ ] 9. Create Discord bot client with discord.js v14+
  - [ ] 9.1 Initialize Discord bot client with proper intents
    - Create SmaraaBot class extending discord.js Client
    - Configure required gateway intents: Guilds, GuildMessages, MessageContent
    - Set up event handlers for Events.ClientReady and Events.InteractionCreate
    - _Requirements: 1.1, 2.1_

  - [ ] 9.2 Implement slash command registration and deployment
    - Create SlashCommandBuilder definitions for /archive, /search, /summarize commands
    - Implement command deployment using REST API and Routes.applicationCommands
    - Add guild-specific command deployment for development/testing
    - _Requirements: 2.1, 2.2_

  - [ ] 9.3 Build InteractionHandler for command processing
    - Implement ChatInputCommandInteraction handling with proper deferral
    - Add command option parsing and validation
    - Create error handling with user-friendly Discord responses
    - _Requirements: 2.1, 2.2, 1.5_

  - [ ]\* 9.4 Write unit tests for bot command parsing
    - Mock Discord interactions and test command option extraction
    - Test permission validation and error response formatting
    - Verify proper interaction deferral and response handling
    - _Requirements: 2.1, 3.5_

- [ ] 10. Implement message mention archiving workflow
  - [ ] 10.1 Create message mention event handler
    - Implement Events.MessageCreate handler to detect bot mentions in replies
    - Add message.reference validation to extract referenced message
    - Fetch referenced message content and metadata from Discord API
    - _Requirements: 1.1, 1.2_

  - [ ] 10.2 Add permission validation for archiving
    - Create PermissionManager class with guild settings integration
    - Implement role-based permission checking for archive operations
    - Add graceful error handling for permission denied scenarios
    - _Requirements: 3.1, 3.5_

  - [ ] 10.3 Integrate backend API calls for archiving
    - Create BackendApiClient with HTTP client and authentication
    - Implement archiveMessage API call with proper error handling
    - Add confirmation responses using Discord embeds and replies
    - _Requirements: 1.4, 1.5, 7.1_

  - [ ]\* 10.4 Write integration tests for mention archiving
    - Mock Discord message events and API responses
    - Test end-to-end archiving workflow from mention to confirmation
    - Verify permission enforcement and error handling
    - _Requirements: 1.1, 1.4, 3.5_

- [ ] 11. Build search command implementation
  - [ ] 11.1 Implement /search slash command handler
    - Create search command with query, limit, user, channel, and date filter options
    - Add interaction deferral for processing time during API calls
    - Implement search API integration with proper error handling
    - _Requirements: 2.2, 2.3_

  - [ ] 11.2 Create search result display with embeds
    - Use EmbedBuilder to format search results with message snippets
    - Add deep links to original messages using Discord URL format
    - Include relevance scores and metadata (author, channel, timestamp)
    - _Requirements: 2.5, 5.3_

  - [ ] 11.3 Add pagination with interactive buttons
    - Create ActionRowBuilder with ButtonBuilder for navigation
    - Implement ButtonInteraction handling for next/previous page actions
    - Add page state management and result caching for smooth navigation
    - _Requirements: 5.4_

  - [ ]\* 11.4 Write tests for search command functionality
    - Mock search API responses and test result formatting
    - Test pagination button interactions and state management
    - Verify filter application and error handling scenarios
    - _Requirements: 2.3, 5.4_

- [ ] 12. Implement summarization command
  - [ ] 12.1 Create /summarize slash command handler
    - Implement summarize command with query parameter and optional document limit
    - Add interaction deferral for longer processing time during LLM calls
    - Integrate summarization API with proper timeout handling
    - _Requirements: 8.1_

  - [ ] 12.2 Format summary responses with citations
    - Create summary embed with generated text and confidence indicators
    - Add clickable message references using Discord deep links
    - Include fallback display when summarization fails or times out
    - _Requirements: 8.3, 8.5_

  - [ ]\* 12.3 Write tests for summarization command
    - Mock summarization API responses and test embed formatting
    - Test citation link generation and fallback behavior
    - Verify timeout handling and error response formatting
    - _Requirements: 8.4, 8.5_

- [ ] 13. Add comprehensive error handling and resilience
  - [ ] 13.1 Implement circuit breaker patterns for external services
    - Add circuit breakers for OpenAI API calls with configurable thresholds
    - Implement fallback behavior when external services are unavailable
    - Add service health monitoring and automatic recovery
    - _Requirements: 6.2, 6.3_

  - [ ] 13.2 Add retry logic with exponential backoff
    - Implement retry mechanisms for transient failures in API calls
    - Add jitter to prevent thundering herd problems
    - Configure different retry policies for different types of operations
    - _Requirements: 6.2, 9.2_

  - [ ] 13.3 Enhance logging and observability
    - Add structured logging with correlation IDs across bot and backend
    - Implement metrics collection for operation counts, latencies, and error rates
    - Add alerting thresholds for critical system health indicators
    - _Requirements: 6.1, 6.5_

  - [ ]\* 13.4 Write resilience and error handling tests
    - Test circuit breaker behavior under various failure scenarios
    - Verify retry logic and exponential backoff implementation
    - Test graceful degradation and fallback mechanisms
    - _Requirements: 6.2_

- [ ] 14. Security hardening and deployment preparation
  - [ ] 14.1 Implement security best practices
    - Add input sanitization and validation for all API endpoints
    - Implement IP allowlist functionality for backend API access
    - Add secrets management integration for sensitive configuration
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ] 14.2 Create deployment configurations
    - Write Dockerfiles for bot and backend services with multi-stage builds
    - Create docker-compose.yml for local development environment
    - Add environment variable configuration with secure defaults
    - _Requirements: 7.4, 9.1_

  - [ ] 14.3 Add production monitoring and health checks
    - Implement comprehensive health check endpoints for all services
    - Add metrics export for monitoring systems (Prometheus format)
    - Create deployment readiness and liveness probes
    - _Requirements: 6.4, 9.3_

  - [ ]\* 14.4 Write security and deployment tests
    - Test authentication and authorization mechanisms
    - Verify input validation and sanitization effectiveness
    - Test deployment configurations and health check endpoints
    - _Requirements: 7.1, 7.2_
