import * as http from "http";
import * as vscode from "vscode";
import * as queue from "./queue";
import * as chat from "./chat";
import {
  HealthResponse,
  StatusResponse,
  InjectResponse,
  InjectionRequest,
} from "./types";

let server: http.Server | null = null;
let processing = false;

function json(res: http.ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function parseBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length() > 0) {
    const item = queue.dequeue();
    if (item) {
      await chat.injectText(item.text);
    }
  }

  processing = false;
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    json(res, {});
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    const response: HealthResponse = {
      status: "ok",
      version: "1.0.0",
      editor: "cursor",
    };
    json(res, response);
    return;
  }

  if (req.method === "GET" && url.pathname === "/status") {
    const response: StatusResponse = {
      idle: !processing && queue.length() === 0,
      queueLength: queue.length(),
      chatOpen: chat.isChatOpen(),
    };
    json(res, response);
    return;
  }

  if (req.method === "POST" && url.pathname === "/inject") {
    const body = await parseBody(req);
    let data: InjectionRequest;

    try {
      data = JSON.parse(body);
    } catch {
      json(res, { error: "Invalid JSON" }, 400);
      return;
    }

    if (!data.text) {
      json(res, { error: "Missing text field" }, 400);
      return;
    }

    const sync = url.searchParams.get("sync") === "true";

    if (sync) {
      await chat.injectText(data.text);
      const response: InjectResponse = { queued: false, queueLength: 0 };
      json(res, response);
    } else {
      const length = queue.enqueue(data.text, data.priority);
      const response: InjectResponse = { queued: true, queueLength: length };
      json(res, response);
      processQueue();
    }
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/queue") {
    queue.clear();
    json(res, { cleared: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/commands") {
    const filter = url.searchParams.get("filter") || "";
    const commands = await vscode.commands.getCommands(true);
    const filtered = commands.filter(c => c.toLowerCase().includes(filter.toLowerCase()));
    json(res, { commands: filtered });
    return;
  }

  json(res, { error: "Not found" }, 404);
}

export function start(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve();
      return;
    }

    const config = vscode.workspace.getConfiguration("aibridge");
    const port = config.get<number>("port") || 9999;
    const host = config.get<string>("host") || "127.0.0.1";

    server = http.createServer((req, res) => {
      handleRequest(req, res).catch((err) => {
        json(res, { error: String(err) }, 500);
      });
    });

    server.on("error", reject);
    server.listen(port, host, () => {
      vscode.window.showInformationMessage(`AiBridge server running on ${host}:${port}`);
      resolve();
    });
  });
}

export function stop(): void {
  if (server) {
    server.close();
    server = null;
    vscode.window.showInformationMessage("AiBridge server stopped");
  }
}

export function isRunning(): boolean {
  return server !== null;
}
