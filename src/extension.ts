import * as vscode from "vscode";
import * as server from "./server";

let statusBarItem: vscode.StatusBarItem;

function updateStatusBar(): void {
  if (server.isRunning()) {
    statusBarItem.text = "$(broadcast) AiBridge";
    statusBarItem.tooltip = "AiBridge server running";
  } else {
    statusBarItem.text = "$(circle-slash) AiBridge";
    statusBarItem.tooltip = "AiBridge server stopped";
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = "aibridge.status";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand("aibridge.start", async () => {
      await server.start();
      updateStatusBar();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("aibridge.stop", () => {
      server.stop();
      updateStatusBar();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("aibridge.status", () => {
      const config = vscode.workspace.getConfiguration("aibridge");
      const port = config.get<number>("port") || 9999;
      const host = config.get<string>("host") || "127.0.0.1";

      if (server.isRunning()) {
        vscode.window.showInformationMessage(`AiBridge running on ${host}:${port}`);
      } else {
        vscode.window.showInformationMessage("AiBridge server is not running");
      }
    })
  );

  const config = vscode.workspace.getConfiguration("aibridge");
  if (config.get<boolean>("autoStart")) {
    await server.start();
  }

  updateStatusBar();
}

export function deactivate(): void {
  server.stop();
}
