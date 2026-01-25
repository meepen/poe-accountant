# Infrastructure for POE-Accountant

At a high level, poe-accountant can be boiled down to the following services:
1. Valkey (caching and queues)
2. Postgres (storage)
3. Cloudflare R2 (S3-compatible storage bucket)
4. API (Cloudflare Workers)
5. Frontend (Cloudflare Pages)
6. Background Processor (DO App Platform)

## Redis / Valkey
Redis (Valkey implementation) is used for:
1. Queue Management System (via BullMQ / mailbox system from API)
2. NoSQL Caching (API Sessions)

### Queues
The queue management system is used from the API Service submitted via a regular redis message to the Background Processor to utilize via BullMQ over Redis

### Caching
The caching system allows us to cache data with expiration timer support, as well as general speed and availability.

## Postgres
Postgres is used for long-term storage such as user account information and other system-wide data.

## API Service
The API Service is a gateway into the backend system, essentially acting as an entrypoint for many actions. It connects to the rest of the system.

## Frontend
The frontend project that connects to the API Service. Built with vite / react.

## Background Processor
The Background Processor contains jobs that need to be run (generally by queues / scheduled queues with BullMQ).
