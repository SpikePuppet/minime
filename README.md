# 🤖 Minime

A minimal, retro-styled coding agent for your terminal. Chat with AI in style!

```
╔══════════════════════════════════════════════════════════════╗
║ 👋 Hello, Captain!                             10:32:07 PM  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Captain: Tell me a joke about coding                        ║
║                                                              ║
║  🤖 Assistant: Why do programmers prefer dark mode?          ║
║     Because light attracts bugs! 🐛                          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║ > _                                                          ║
╚══════════════════════════════════════════════════════════════╝
```

## ✨ Features

- 🎨 **Retro TUI** - Beautiful double-line borders, just like the old days
- 🔄 **Multi-provider** - Works with Anthropic, OpenAI, and OpenRouter
- ⏰ **Live clock** - Because why not?
- 💭 **Thinking animation** - Watch the emojis dance while AI thinks
- ⬆️ **Input history** - Press up to recall previous messages
- 🎛️ **Command overlays** - Fancy menus for power users

And soon to come!

- 📜 **Scrollable history** - Keyboard and optional mouse scrolling

## 🚀 Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Set up your config

Copy the example settings file:

```bash
cp settings.example.json settings.json
```

Add your API key(s) to `settings.json` (see configuration below).

### 3. Run it!

```bash
bun index.tsx
```

## ⚙️ Configuration

Edit `settings.json` to customize your experience:

```json
{
  "provider": "anthropic",
  "apiKeys": {
    "anthropic": "sk-ant-your-key-here",
    "openai": "sk-your-key-here",
    "openrouter": "sk-or-your-key-here"
  },
  "model": "claude-sonnet-4-20250514",
  "logLevel": "error",
  "userName": "Captain",
  "mouseScrolling": true,
  "historySize": 10
}
```

| Setting | Description | Options |
|---------|-------------|---------|
| `provider` | Which AI to talk to | `anthropic`, `openai`, `openrouter` |
| `apiKeys` | Your API keys for each provider | Get them from each provider's dashboard |
| `model` | Override the default model | Any model string (e.g., `gpt-4o`, `anthropic/claude-sonnet-4`) |
| `logLevel` | How chatty the logs are | `debug`, `info`, `warn`, `error` |
| `userName` | Your name in the chat | Any string you like! |
| `mouseScrolling` | Enable mouse wheel scrolling | `true` or `false` |
| `historySize` | How many inputs to remember | Any number (default: 10) |

### 🔑 Getting API Keys

- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI**: [platform.openai.com](https://platform.openai.com/)
- **OpenRouter**: [openrouter.ai](https://openrouter.ai/) (access to many models with one key!)

## 🎮 Commands

### Admin Commands (`!`)

Type these to manage your session:

| Command | What it does |
|---------|--------------|
| `!fill` | 📝 Fill the chat with test messages (great for testing scrolling) |
| `!fill 50` | 📝 Fill with a custom number of test messages |
| `!clear` | 🧹 Clear all messages |

### UI Commands (`#`)

Type these to open overlays:

| Command | What it does |
|---------|--------------|
| `#commands` | ⚡ Open the admin commands overlay |
| `#history` | 📜 Open the input history overlay |

### Built-in Commands

| Command | What it does |
|---------|--------------|
| `exit` / `quit` | 👋 Exit the app |

## ⌨️ Keyboard Shortcuts

### In Chat
| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll through chat history |
| `Page Up` / `Page Down` | Scroll by page |
| `Esc` / `Ctrl+C` | Exit the app |

### In Input Box
| Key | Action |
|-----|--------|
| `↑` | Previous input from history |
| `↓` | Next input from history |
| `Enter` | Send message |

### In Overlays
| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate options |
| `Enter` | Select option |
| `Esc` | Close overlay |

## 🎪 The Thinking Dance

While the AI is thinking, you'll see a little emoji show:

🤔 → 🧠 → 💭 → ✨ → 💡 → 🔮 → ⚡ → 🌟 → 🤔 ...

It's mesmerizing. You're welcome.

## 🛠️ Built With

- [Bun](https://bun.sh) - Fast JavaScript runtime
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Pino](https://getpino.io) - Speedy logging

## 📄 License

It's MIT licensed, so do what you want but make sure you reference where you found it! 🎉
