import * as vscode from "vscode";
import { execFile } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";

const ERROR_RE = /^(.+?):(\d+):(\d+)\s+(E_\w+)\s+(.+)$/;

interface ParsedError {
  file: string;
  line: number;
  col: number;
  code: string;
  message: string;
}

function parseErrors(stderr: string): ParsedError[] {
  const errors: ParsedError[] = [];
  for (const line of stderr.split("\n")) {
    const m = line.match(ERROR_RE);
    if (m) {
      errors.push({
        file: m[1],
        line: parseInt(m[2], 10),
        col: parseInt(m[3], 10),
        code: m[4],
        message: m[5],
      });
    }
  }
  return errors;
}

function toDiagnostic(err: ParsedError): vscode.Diagnostic {
  const line = Math.max(0, err.line - 1);
  const col = Math.max(0, err.col - 1);
  const range = new vscode.Range(line, col, line, col + 1);
  const diag = new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
  diag.source = "jaiph";
  diag.code = err.code;
  return diag;
}

export async function runDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection,
): Promise<void> {
  const config = vscode.workspace.getConfiguration("jaiph");
  if (!config.get<boolean>("diagnostics.enabled", true)) return;

  const compilerPath = config.get<string>("compilerPath", "jaiph");
  const filePath = document.uri.fsPath;
  const cwd = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath;

  let targetDir: string | undefined;
  try {
    targetDir = await mkdtemp(join(tmpdir(), "jaiph-check-"));
    const stderr = await new Promise<string>((resolve, reject) => {
      execFile(
        compilerPath,
        ["build", "--target", targetDir!, filePath],
        { cwd, timeout: 15_000 },
        (_error, _stdout, stderr) => {
          resolve(stderr);
        },
      );
    });

    const errors = parseErrors(stderr);
    const byFile = new Map<string, vscode.Diagnostic[]>();

    for (const err of errors) {
      const uri = vscode.Uri.file(err.file).toString();
      if (!byFile.has(uri)) byFile.set(uri, []);
      byFile.get(uri)!.push(toDiagnostic(err));
    }

    // Clear previous diagnostics, then set new ones per file
    collection.clear();
    for (const [uriStr, diags] of byFile) {
      collection.set(vscode.Uri.parse(uriStr), diags);
    }

    // If no errors, clear explicitly for the current file
    if (errors.length === 0) {
      collection.delete(document.uri);
    }
  } catch {
    // Compiler not found or crashed — silently ignore
  } finally {
    if (targetDir) {
      rm(targetDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
