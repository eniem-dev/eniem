# Database File Upload (Zero-Config Storage)

## Overview

Add a database-backed file upload option as the default storage provider, so developers can use the boilerplate's image upload features immediately without configuring DigitalOcean Spaces. An environment variable (`FILE_UPLOAD_PROVIDER`) toggles between `database` (default) and `digitalocean`. The upload interface stays identical regardless of provider — consumers always receive a URL string.

## Problem Statement

**Who:** Developers evaluating the eniem boilerplate for the first time
**Problem:** File upload (profile picture) requires DigitalOcean Spaces configuration — creating an account, a Space, API keys, CDN, and CORS settings — before the feature works at all. This friction slows down the "0 to 1" experience.
**Impact:** New users either skip the upload feature entirely, hit confusing errors, or abandon the evaluation because setup feels heavy. Removing this barrier lets them experience the full boilerplate immediately.

## Scope

### Included
- New env var `FILE_UPLOAD_PROVIDER` with values `database` or `digitalocean`
- Database storage: images saved as base64 strings in a new database table
- API route to serve database-stored images (returns image binary from base64)
- Uniform interface: both providers return a URL string (`uploadImage()` contract unchanged)
- Default to `database` when `FILE_UPLOAD_PROVIDER` is not set
- CLI setup: ask user whether to configure DigitalOcean now or skip (sets `database`)
- Documentation updates: DO not required to start; database mode not recommended for production

### Excluded
- Migration tooling from database to DigitalOcean (not needed — dev-only use case)
- Local filesystem storage option
- Image optimization, resizing, or transformation
- Support for other cloud providers (S3, GCS, Azure)
- Changes to existing DigitalOcean Spaces behavior

### Constraints
- Same file size limit applies to both providers: `MAX_FILE_SIZE_MB` (default 1MB)
- Database storage is explicitly for development use only, not production
- When switching providers via env var, previously stored images from the old provider will not resolve (acceptable for dev)

## User Stories

### Primary Flow

- [ ] As a developer, I can clone the boilerplate and upload a profile picture without configuring any external service, so that I can evaluate the full feature set immediately
- [ ] As a developer, I can set `FILE_UPLOAD_PROVIDER=digitalocean` in my `.env` to switch to production-grade storage when I'm ready, so that I have a clear upgrade path

### CLI Setup Flow

- [ ] As a developer running the CLI setup, I am asked whether I want to configure DigitalOcean Spaces now or skip, so that I can defer external service setup
- [ ] As a developer who skips DO setup in the CLI, my `.env` is generated with `FILE_UPLOAD_PROVIDER=database`, so that uploads work immediately

### Documentation Flow

- [ ] As a developer reading the getting started docs, I learn that DigitalOcean is not required to start using the boilerplate, so that I'm not discouraged by perceived complexity
- [ ] As a developer reading the file upload docs, I see a clear warning that database storage is not recommended for production, so that I know to switch before going live

## Business Rules

### Provider Selection
- When `FILE_UPLOAD_PROVIDER` is not set or empty → use `database` provider
- When `FILE_UPLOAD_PROVIDER=database` → store files in the database as base64
- When `FILE_UPLOAD_PROVIDER=digitalocean` → use existing DigitalOcean Spaces behavior (unchanged)
- Any other value → fail with a clear error message listing valid options

### Validation
- Same validation rules apply regardless of provider:
  - File must be an image (MIME type starts with `image/`)
  - File size must not exceed `MAX_FILE_SIZE_MB` (default: 1)
- Validation happens both client-side and server-side (existing behavior preserved)

### Limits & Constraints
- Max file size: configurable via `MAX_FILE_SIZE_MB`, default 1MB, same for both providers
- No limit on number of stored files (beyond database capacity)
- Files are scoped to the authenticated user who uploaded them

### URL Contract
- Both providers return a URL string from the upload function
- DigitalOcean: returns CDN URL (e.g. `https://bucket.ams3.cdn.digitaloceanspaces.com/...`)
- Database: returns internal API route URL (e.g. `/api/files/abc123`)
- Consumer code stores and renders URLs the same way regardless of provider

## Data Model

### Entities

**File** (new entity — only used when provider is `database`)
| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier, used in the API route URL |
| base64Data | text | Base64-encoded image content |
| mimeType | string | MIME type of the file (e.g. `image/png`, `image/jpeg`) |
| userId | string | ID of the user who uploaded the file |
| createdAt | datetime | When the file was uploaded |

### Relationships
- File belongs to User (via userId)
- User has many Files

## UI/UX Specification

### Screen: Profile Settings (Image Upload)

**No UI changes.** The existing image upload form on the settings page works identically. The user selects a file, it uploads, and the profile picture updates. The only difference is invisible — where the file is stored.

**States (unchanged):**
| State | Display |
|-------|---------|
| Empty | Default avatar, "Click to upload" prompt |
| Loading | "Uploading image..." with disabled state |
| Success | New profile picture displayed |
| Error | Error toast with localized message |

### Screen: CLI Setup Wizard

**Modified step: Storage Setup**

The existing DigitalOcean Spaces configuration step is wrapped in a new question:

1. **Question:** "Configure DigitalOcean Spaces for file storage?"
   - **Option A: "Yes, configure now"** → Proceed to existing DO configuration prompts (endpoint, bucket, keys, region)
   - **Option B: "Skip (use database storage for development)"** → Set `FILE_UPLOAD_PROVIDER=database` in .env, skip DO prompts, move to next setup step

When user selects "Yes": the existing DO setup flow runs, and `FILE_UPLOAD_PROVIDER=digitalocean` is written to `.env` alongside the DO credentials.

### API Route: Serve Database Files

**Entry point:** `GET /api/files/[id]`

**Behavior:**
- Look up file record by ID in database
- Return the decoded base64 content with correct `Content-Type` header
- No authentication required (mirrors DO Spaces public-read behavior for profile pictures)

**States:**
| State | Response |
|-------|----------|
| File found | 200 with image binary and correct Content-Type |
| File not found | 404 |
| Server error | 500 |

## Edge Cases

### Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Upload with database provider, DB unreachable | Upload fails with existing "Failed to upload file" error message |
| Upload with DO provider, DO credentials missing/invalid | Upload fails with existing "Storage is not properly configured" error |
| Invalid FILE_UPLOAD_PROVIDER value | Application shows clear error listing valid options (`database`, `digitalocean`) |
| Request to /api/files/[id] with non-existent ID | 404 response |
| Request to /api/files/[id] when provider is set to DO | Still serves the file if it exists in DB (the route doesn't check current provider) |

### Boundary Conditions

| Condition | Expected Behavior |
|-----------|-------------------|
| File exactly at MAX_FILE_SIZE_MB | Upload succeeds |
| File exceeds MAX_FILE_SIZE_MB | Upload rejected with "Image exceeds maximum file size" (existing behavior) |
| Switch env from database to digitalocean | Old database-stored image URLs (`/api/files/...`) still resolve (API route exists regardless of provider). New uploads go to DO. |
| Switch env from digitalocean to database | Old DO CDN URLs may break if CDN is deactivated. New uploads go to DB. Profile shows broken image. |
| Very long base64 string (1MB file → ~1.37MB base64) | Database handles it (TEXT columns support this size) |

## Acceptance Criteria

### Zero-config upload works

- [ ] **Given** a fresh boilerplate clone with no `FILE_UPLOAD_PROVIDER` set, **when** a user uploads a profile picture, **then** the image is stored in the database and displayed correctly
- [ ] **Given** `FILE_UPLOAD_PROVIDER=database`, **when** a user uploads a profile picture, **then** the image is stored in the database and displayed via `/api/files/[id]`
- [ ] **Given** `FILE_UPLOAD_PROVIDER=digitalocean` with valid credentials, **when** a user uploads a profile picture, **then** the image is stored in DO Spaces and displayed via CDN URL (existing behavior preserved)

### Provider toggle works

- [ ] **Given** an invalid `FILE_UPLOAD_PROVIDER` value (e.g. `s3`), **when** the application starts, **then** a clear error is shown listing valid options
- [ ] **Given** `FILE_UPLOAD_PROVIDER` is not set, **when** the application reads config, **then** it defaults to `database`

### API route serves images

- [ ] **Given** a file stored in the database, **when** a GET request is made to `/api/files/[id]`, **then** the image is returned with correct Content-Type and renders in a browser
- [ ] **Given** a non-existent file ID, **when** a GET request is made to `/api/files/[id]`, **then** a 404 is returned

### CLI setup offers skip option

- [ ] **Given** a user running the CLI setup wizard, **when** they reach the storage step, **then** they are asked whether to configure DigitalOcean now or skip
- [ ] **Given** a user who skips DO setup, **when** the `.env` file is generated, **then** it contains `FILE_UPLOAD_PROVIDER=database` and no DO credentials
- [ ] **Given** a user who configures DO, **when** the `.env` file is generated, **then** it contains `FILE_UPLOAD_PROVIDER=digitalocean` and the DO credentials they entered

### Documentation is updated

- [ ] **Given** the getting started / setup documentation, **then** it states that DigitalOcean is not required to start using the boilerplate
- [ ] **Given** the file upload feature documentation, **then** it explains both providers, notes that database mode is not recommended for production, and describes how to switch to DigitalOcean

### Validation is consistent

- [ ] **Given** either provider, **when** a user uploads a non-image file, **then** it is rejected with "Please select an image file"
- [ ] **Given** either provider, **when** a user uploads a file exceeding MAX_FILE_SIZE_MB, **then** it is rejected with "Image exceeds maximum file size"
