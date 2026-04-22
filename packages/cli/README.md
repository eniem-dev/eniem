# eni

Interactive CLI for scaffolding and managing [Eniem](https://eniem.dev) projects.

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

### Create a new project

```bash
eni [project-name]
```

| Option | Description |
|--------|-------------|
| `--app-name` | Display name for the app (skips the interactive prompt) |
| `--ssh` | Clone via SSH instead of auto-detecting gh/git HTTPS |
| `--git-host` | SSH host alias from `~/.ssh/config` (implies `--ssh`, default: `github.com`) |
| `--help, -h` | Show help message |
| `--version, -v` | Show version number |

```bash
# Interactive wizard
eni my-app

# Skip the display-name prompt
eni my-app --app-name "My App"

# Force SSH clone with a custom host alias
eni my-app --git-host github.com-work
```

The wizard configures project name, OAuth providers (GitHub, Twitter), payments (Polar), storage (DigitalOcean Spaces), and analytics (Umami, PostHog).

### Generate a production `.env`

Run from inside an Eniem project directory. Walks you through filling in each environment variable interactively and writes the result to `.env.production`.

```bash
eni ready
```

### Manage Polar products

Run from inside an Eniem project directory.

```bash
eni products [options]
```

| Option | Description |
|--------|-------------|
| `--env` | Environment: `sandbox` or `production` (default: `sandbox`) |
| `--prod` | Shorthand for `--env=production` |
| `--token` | Polar access token (bypasses `.env` lookup) |

```bash
eni products
eni products --prod
eni products --prod --token=polar_xxx
```

Products are stored in `products.sandbox.json` and `products.production.json`, with TypeScript exports generated in `src/features/subscription/products.generated.ts`.

## License

MIT
