import * as vscode from "vscode";
import { runDiagnostics } from "./diagnostics";

const LANGUAGE_ID = "jaiph";

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection(LANGUAGE_ID);
  context.subscriptions.push(diagnosticCollection);

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (doc.languageId === LANGUAGE_ID) {
        runDiagnostics(doc, diagnosticCollection);
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === LANGUAGE_ID) {
        runDiagnostics(doc, diagnosticCollection);
      }
    }),
  );

  // Run on all already-open jaiph files
  for (const doc of vscode.workspace.textDocuments) {
    if (doc.languageId === LANGUAGE_ID) {
      runDiagnostics(doc, diagnosticCollection);
    }
  }
}

export function deactivate(): void {
  diagnosticCollection?.dispose();
}
