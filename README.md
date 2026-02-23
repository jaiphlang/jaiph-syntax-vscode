# Jaiph Syntax for VS Code

Syntax highlighting support for Jaiph (`.jph`) files.

## Features

- Highlights Jaiph keywords: `import`, `as`, `export`, `rule`, `workflow`, `ensure`, `run`, `prompt`, `if`, `then`, `fi`
- Highlights module references like `security.scan_passes`
- Supports comments (`# ...`) and strings (single and double-quoted, including multiline double-quoted prompts)
- Adds basic language configuration for comments, brackets, and folding
- Uses VS Code's shell grammar for command-like lines that are not Jaiph primitives
- Includes a manual fixture at `syntaxes/fixtures/sample.jph`

## Local usage

1. Open this folder in VS Code:
   - `jaiph-syntax-vscode`
2. Press `F5` to launch an Extension Development Host.
3. Open a `.jph` file in the new window.

## Package (optional)

If you want to build a `.vsix`:

```bash
npm install
npm run package
```

You can later move this folder to a standalone repository without changes.
