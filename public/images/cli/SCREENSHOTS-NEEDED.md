# CLI Screenshots Needed

This file documents the screenshots required for the CLI Products Command documentation.

## Required Screenshots

### 1. main-menu.png
**Alt text:** "eniem products command main menu showing Add, Remove, Sync, Regenerate, and Unarchive options"

**What to capture:**
- Terminal window after running `eniem products`
- Show the interactive menu with all 5 options visible
- Include the command prompt showing `eniem products` was run

### 2. add-wizard.png
**Alt text:** "Add product wizard prompting for product slug, name, and configuration"

**What to capture:**
- Terminal showing the Add product wizard flow
- Display at least the first few prompts (slug, name, description)
- Show the interactive input fields

### 3. sync-confirmation.png
**Alt text:** "Sync operation showing products being pushed to Polar"

**What to capture:**
- Terminal output during a sync operation
- Show the confirmation message listing products being synced
- Include the prompt asking to confirm sync

### 4. sync-success.png
**Alt text:** "Successful sync showing created and updated products"

**What to capture:**
- Terminal output after successful sync
- Show the checkmarks and product status (created/updated/unchanged)
- Example: "✓ Synced 3 products to sandbox"

## Instructions for Capturing

1. Set up a clean terminal with good contrast
2. Use a standard terminal size (80x24 or similar)
3. Ensure font is readable at documentation width
4. Capture the full terminal window or just the relevant output
5. Save as PNG with descriptive filename
6. Place in this directory (`public/images/cli/`)

## After Capturing

Update `/content/docs/guides/cli/index.mdx` to replace the placeholder comments with actual image references:

```mdx
![Alt text](/images/cli/filename.png)
```
