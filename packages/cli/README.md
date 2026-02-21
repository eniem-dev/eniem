# eniem-cli

Interactive CLI wizard for scaffolding [Eniem](https://eniem.dev) projects.

- Website: [eniem.dev](https://eniem.dev)
- Documentation: [doc.eniem.dev](https://doc.eniem.dev)

## Installation

```bash
npm install -g eniem-cli
```

Or run directly without installing:

```bash
pnpm dlx eniem-cli my-app
npx eniem-cli my-app
```

## Usage

```bash
eni [project-name]
```

### Options

| Option | Description |
|--------|-------------|
| `--git-host` | SSH host alias for git clone (default: `github.com`) |
| `--help, -h` | Show help message |
| `--version, -v` | Show version number |

### Examples

```bash
# Create a new project
eni my-app

# Use a custom SSH host alias (from ~/.ssh/config)
eni --git-host 0xtiby my-app
```

## Products Command

Manage Polar products interactively. **Run this command from your Eniem project directory.**

```bash
eni products [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--env` | Environment: `sandbox` or `production` (default: `sandbox`) |
| `--prod` | Shorthand for `--env=production` |
| `--token` | Polar access token (bypasses `.env` lookup) |

### Examples

```bash
# Manage sandbox products
eni products

# Manage production products
eni products --prod

# Use a specific access token
eni products --prod --token=polar_xxx
```

### Features

- **Add products**: Create new products with pricing, features, and display options
- **Remove products**: Archive products on Polar and remove from local file
- **Sync to Polar**: Push local product changes to Polar API
- **Sync from sandbox**: Copy sandbox products to production environment
- **Unarchive products**: Restore archived products on Polar
- **Clean up Polar**: Manage orphaned products (archive or import to local file)
- **Regenerate TypeScript**: Update generated product exports

Products are stored in `products.sandbox.json` and `products.production.json`, with TypeScript exports generated in `src/features/subscription/products.generated.ts`.

## AI Workflow Command

Initialize or update the AI workflow files (`.eni/`, `.claude/`, `specs/`) in the current project.

```bash
# Initialize AI workflow (prompts for confirmation if .eni/ already exists)
eni ai init

# Overwrite existing files without confirmation
eni ai init --force
```

This sparse-clones the latest `.eni` and `.claude` directories from the boilerplate repo and copies them into your project. A `specs/` folder is created if it doesn't exist.

Once initialized, run `./loop.sh plan` to start planning with AI.

## What it sets up

The wizard will guide you through configuring:

- Project name and directory
- OAuth providers (GitHub, Twitter)
- Payment integration (Polar)
- Storage configuration (DigitalOcean Spaces)
- Analytics (Umami, PostHog)

## License

MIT
