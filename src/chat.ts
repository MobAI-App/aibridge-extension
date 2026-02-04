import * as vscode from "vscode";
import { execFile } from "child_process";
import * as os from "os";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pressEnter(): Promise<void> {
  return new Promise((resolve) => {
    const platform = os.platform();

    if (platform === "darwin") {
      const script = `
        tell application "Cursor" to activate
        delay 0.5
        tell application "System Events" to key code 36
      `;
      execFile("osascript", ["-e", script], () => resolve());
    } else if (platform === "win32") {
      const script = `
        Add-Type -AssemblyName System.Windows.Forms
        Start-Sleep -Milliseconds 500
        [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
      `;
      execFile("powershell", ["-Command", script], () => resolve());
    } else {
      // Linux - try xdotool
      execFile("xdotool", ["key", "Return"], () => resolve());
    }
  });
}

export function isChatOpen(): boolean {
  return true;
}

export async function injectText(text: string): Promise<void> {
  const paranoid = vscode.workspace.getConfiguration("aibridge").get<boolean>("paranoid");

  const savedClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(text);

  await vscode.commands.executeCommand("composer.focusComposer");
  await sleep(500);
  await vscode.commands.executeCommand("editor.action.clipboardPasteAction");

  await vscode.env.clipboard.writeText(savedClipboard);

  if (!paranoid) {
    await sleep(100);
    await pressEnter();
  }
}
