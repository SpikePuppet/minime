# Minime - Development History

A minimal coding agent built in TypeScript using Bun, featuring a retro terminal UI.

## Project Overview

Minime is a terminal-based chat agent that connects to LLM providers (Anthropic, OpenAI, OpenRouter) with a retro-styled TUI built using Ink (React for terminals).

## Architecture

```
minime/
├── index.tsx          # Entry point - renders Ink app
├── settings.ts        # Settings loader and types
├── settings.json      # User config (gitignored)
├── settings.example.json
├── logger.ts          # Pino logger initialization
├── llm.ts             # LLM provider abstraction (chat + chatWithTools)
├── tools/
│   ├── types.ts       # Tool type definitions
│   ├── registry.ts    # Tool registry and executor
│   ├── grep.ts        # Grep tool implementation
│   └── grep.test.ts   # Grep tool tests
└── tui/
    ├── App.tsx        # Main app component, state management, tool loop
    ├── Header.tsx     # Greeting + live clock
    ├── ChatBox.tsx    # Message display, scrolling, thinking indicator, tool blocks
    ├── InputBox.tsx   # Text input with blinking arrow, history navigation
    ├── CommandOverlay.tsx  # Admin commands overlay (#commands)
    ├── HistoryOverlay.tsx  # Input history overlay (#history)
    └── ToolCallBlock.tsx   # Tool call display component
```

## Features Implemented

### 1. Agent Loop (Initial)
- Basic REPL-style loop reading from stdin
- Evolved into full Ink TUI

### 2. Settings System (`settings.ts`)
- **Provider selection**: `anthropic`, `openai`, `openrouter`
- **API keys**: Per-provider key storage
- **Model override**: Optional model specification (useful for OpenRouter)
- **Log level**: `debug`, `info`, `warn`, `error`
- **User name**: Displayed in greeting and chat history
- **Mouse scrolling**: Toggle for mouse wheel support
- **History size**: Number of input history items to keep (default: 10)

### 3. Logging (`logger.ts`)
- Uses Pino for structured JSON logging
- Log level configurable via settings
- Async initialization with `initLogger()`
- Access via `getLogger()`

### 4. LLM Integration (`llm.ts`)
- **Anthropic**: Direct SDK, defaults to `claude-sonnet-4-20250514`
- **OpenAI**: Direct SDK, defaults to `gpt-4o`
- **OpenRouter**: Uses OpenAI SDK with custom baseURL, defaults to `anthropic/claude-sonnet-4`
- Unified `chat(messages)` interface for simple conversations
- `chatWithTools(messages, options)` interface for tool-enabled conversations
- Message history maintained in App component

### 5. Tool Calling Support

#### Type System (`tools/types.ts`)
- `ToolDefinition` - Schema for defining tools (name, description, inputSchema)
- `ToolCall` - Represents a tool invocation (id, name, input)
- `ToolResult` - Result from tool execution (toolUseId, content, isError)
- `ExtendedMessage` - Message with string or array content (text, tool_use, tool_result)
- `ChatResponse` - Response with content, toolCalls, and stopReason

#### Tool Registry (`tools/registry.ts`)
- Central registry for managing tools
- `register(tool)` - Register a tool
- `getDefinitions()` - Get all tool definitions for LLM
- `execute(toolCall)` - Execute a tool and return result

#### Grep Tool (`tools/grep.ts`)
- Search files using ripgrep (`rg`) with fallback to `grep -r`
- **Parameters**:
  - `pattern` (required) - Regex pattern to search
  - `path` - Directory to search (default: `.`)
  - `fileType` - Filter by file type (e.g., `ts`, `js`)
  - `caseSensitive` - Case sensitive search (default: false)
  - `maxResults` - Maximum results (default: 50)

#### Provider-Specific Handling
- **Anthropic**: Uses `tool_use`/`tool_result` content blocks within messages
- **OpenAI/OpenRouter**: Uses `tool_calls` in assistant message, separate `role: "tool"` messages for results

#### Tool Call Loop (`tui/App.tsx`)
- Executes up to 10 iterations of tool calls
- Flow: User message → LLM response → Execute tools → Send results → Repeat until `end_turn`
- Tool results stored in Map for UI display

#### UI Display (`tui/ToolCallBlock.tsx`)
- Shows tool name with icon (🔧)
- Displays input parameters as JSON
- Shows truncated results (500 chars max in UI, full result sent to LLM)
- Error results shown in red

### 6. Terminal UI (Ink/React)

#### Design
```
╔═══════════════════════════════════════════════════════════════╗
║ 👋 Hello, Rhys!                                 10:32:07 PM  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Rhys: What is 2 + 2?                                         ║
║                                                               ║
║  🤖 Assistant: The answer is 4!                               ║
║                                                               ║
║  🤔 Thinking...                                               ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║ > Type your message here...                                   ║
╚═══════════════════════════════════════════════════════════════╝
```

#### Components

**Header.tsx**
- Displays greeting with userName from settings
- Live clock updating every second

**ChatBox.tsx**
- Scrollable message history
- Keyboard scrolling: ↑/↓ (single), Page Up/Down (page)
- Optional mouse scrolling (SGR mouse mode)
- Thinking indicator with emoji animation: 🤔 🧠 💭 ✨ 💡 🔮 ⚡ 🌟
- Scroll indicators: "↑ More messages above" / "↓ More messages below"
- Line spacing between messages

**InputBox.tsx**
- Blinking `>` arrow (500ms interval)
- Input history navigation with ↑/↓ arrows
- Saves current input when navigating, restores when returning
- Filters out mouse escape sequences from input

**CommandOverlay.tsx**
- Triggered by `#commands`
- Lists admin commands with descriptions
- Navigate with ↑/↓, select with Enter, close with Esc

**HistoryOverlay.tsx**
- Triggered by `#history`
- Shows input history list
- Navigate with ↑/↓, select with Enter, close with Esc

### 7. Commands

#### Admin Commands (! prefix)
- `!fill` - Fill history with 30 test message pairs
- `!fill N` - Fill history with N test message pairs
- `!clear` - Clear all messages

#### UI Commands (# prefix)
- `#commands` - Open admin commands overlay
- `#history` - Open input history overlay

#### Built-in
- `exit` / `quit` - Exit the application
- `Esc` / `Ctrl+C` - Exit the application

## Configuration

### settings.json
```json
{
  "provider": "openrouter",
  "apiKeys": {
    "anthropic": "sk-ant-...",
    "openai": "sk-...",
    "openrouter": "sk-or-..."
  },
  "model": "anthropic/claude-sonnet-4",
  "logLevel": "error",
  "userName": "Rhys",
  "mouseScrolling": false,
  "historySize": 10
}
```

## Dependencies

- `ink` - React for CLI
- `ink-text-input` - Text input component
- `react` - React runtime
- `@anthropic-ai/sdk` - Anthropic API
- `openai` - OpenAI API (also used for OpenRouter)
- `pino` - Logging

## Running

```bash
bun index.tsx
```

## Development Notes

### Mouse Scrolling
When enabled, uses SGR mouse mode escape sequences:
- Enable: `\x1b[?1000h\x1b[?1006h`
- Disable: `\x1b[?1000l\x1b[?1006l`
- Scroll up: `\x1b[<64;x;yM`
- Scroll down: `\x1b[<65;x;yM`

Mouse sequences are filtered from text input to prevent garbage characters.

### Fullscreen Mode
Ink's `render()` is called with `{ fullscreen: true }` to use alternate screen buffer.

### Input History
- Stored in App component state
- Most recent first, duplicates removed
- Configurable size via `historySize` setting
- Persists during session only (not saved to disk)

## Future Considerations

Potential next steps for development:
- ~~Tool/function calling support~~ ✅ Implemented
- System prompt configuration
- Conversation persistence (save/load)
- Streaming responses
- Code syntax highlighting in responses
- File operations (read/write/edit) - add as tools
- Shell command execution - add as tool
- Multi-turn context management
- Token counting and cost tracking
- Additional tools: read file, write file, list directory, etc.
