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
eniem-cli [project-name]
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
eniem-cli my-app

# Use a custom SSH host alias (from ~/.ssh/config)
eniem-cli --git-host 0xtiby my-app
```

## What it sets up

The wizard will guide you through configuring:

- Project name and directory
- OAuth providers (GitHub, Twitter)
- Payment integration (Polar)
- Storage configuration (DigitalOcean Spaces)
- Analytics (Umami, PostHog)

## License

MIT
