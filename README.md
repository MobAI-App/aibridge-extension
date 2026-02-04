# AiBridge Cursor Extension

A Cursor editor extension that exposes an HTTP API on `127.0.0.1:9999` allowing external applications to inject text into Cursor's Composer.

## Installation

1. Build the extension: `npm install && npm run compile`
2. Package: `npm run package`
3. Install the `.vsix` file in Cursor

## HTTP API

### GET /health

Health check endpoint.

```bash
curl http://127.0.0.1:9999/health
```

Response:
```json
{"status": "ok", "version": "1.0.0", "editor": "cursor"}
```

### GET /status

Get server status.

```bash
curl http://127.0.0.1:9999/status
```

Response:
```json
{"idle": true, "queueLength": 0, "chatOpen": true}
```

### POST /inject

Queue text for injection into Cursor chat.

```bash
curl -X POST http://127.0.0.1:9999/inject \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from external app"}'
```

Options:
- `?sync=true` - Wait for injection to complete before responding
- `priority` field - Higher priority items are processed first

Response:
```json
{"queued": true, "queueLength": 1}
```

### DELETE /queue

Clear pending injections.

```bash
curl -X DELETE http://127.0.0.1:9999/queue
```

## Permissions

Auto-submit requires OS-level keyboard simulation. On first use, you may be prompted to grant permissions:

- **macOS**: System Settings → Privacy & Security → Accessibility → Enable for Cursor
- **Windows**: No additional permissions required
- **Linux**: Requires `xdotool` installed (`sudo apt install xdotool`)

Set `aibridge.paranoid: true` to disable auto-submit and avoid permission prompts.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `aibridge.port` | 9999 | HTTP server port |
| `aibridge.host` | 127.0.0.1 | HTTP server host |
| `aibridge.paranoid` | false | Inject without auto-submit |
| `aibridge.autoStart` | true | Start server on activation |

## Commands

- **AiBridge: Start Server** - Start the HTTP server
- **AiBridge: Stop Server** - Stop the HTTP server
- **AiBridge: Show Status** - Show server status

## License

MIT
