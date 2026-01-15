# eniem-cli

Interactive CLI wizard for scaffolding Eniem projects.

## Installation

```bash
npm install -g eniem-cli
```

## Usage

```bash
eniem-cli [project-name]
```

The wizard will guide you through setting up:

- Project name and directory
- OAuth providers (GitHub, Twitter)
- Payment integration (Polar)
- Storage configuration (DigitalOcean Spaces)
- Analytics (Umami, PostHog)

## Development

```bash
# Install dependencies
pnpm install

# Development mode (watch)
pnpm dev

# Build for production
pnpm build

# Run locally
pnpm start

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Linting
pnpm lint
pnpm lint:fix
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment.

### Pull Request Checks

On every pull request to `main`, the CI workflow runs:

- Linting (`pnpm lint`)
- Type checking (`pnpm typecheck`)
- Tests with coverage (`pnpm test:coverage`)

### Releases

Releases are automated using [semantic-release](https://semantic-release.gitbook.io/). When commits are pushed to `main`, the release workflow:

1. Analyzes commit messages using [Conventional Commits](https://www.conventionalcommits.org/)
2. Determines the next version number
3. Generates release notes and updates `CHANGELOG.md`
4. Publishes to npm
5. Creates a GitHub release

### Required Secrets

To enable automated npm publishing, you must add the following secret to your repository:

| Secret | Description |
|--------|-------------|
| `NPM_TOKEN` | npm access token with publish permissions. Generate one at [npmjs.com/settings/tokens](https://www.npmjs.com/settings/~/tokens) |

The `GITHUB_TOKEN` is automatically provided by GitHub Actions.

## License

MIT
