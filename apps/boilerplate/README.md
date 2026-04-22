<p align="center">
  <img src="public/android-chrome-512x512.png" alt="Eniem" width="120" height="120">
</p>

<h1 align="center">Eniem Boilerplate</h1>

<p align="center">
  A production-ready Next.js 15 boilerplate with authentication, payments, and everything you need to ship fast.
</p>

---

## Get Started

Scaffold a new project with the Eniem CLI:

```bash
npx eniem-cli my-app
```

Or clone manually:

```bash
git clone https://github.com/eniem-dev/eniem-boilerplate my-app
cd my-app
git remote remove origin && rm -rf .git && git init
pnpm install
pnpm dev
```

## Rebranding

This boilerplate uses `myapp` (slug) and `MyApp` (display name) as placeholders. Replace them with your own project name:

```bash
# Replace display name (e.g., "My Cool App")
grep -rl "MyApp" . --exclude-dir={node_modules,.git} | xargs sed -i 's/MyApp/Your App Name/g'

# Replace slug (e.g., "mycoolapp")
grep -rl "myapp" . --exclude-dir={node_modules,.git} | xargs sed -i 's/myapp/yourslug/g'
```

> **Note:** If your project name contains regex special characters (`.`, `*`, `+`, etc.), escape them in the sed commands.

## Documentation

Full documentation available at [doc.eniem.dev](https://doc.eniem.dev).
