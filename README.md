# 🤖 Telegram Interview Bot

An interactive Telegram bot for technical interview preparation with multiple-choice questions, practice mode, and timed tests.

## 📋 Features

- **🎓 Practice Mode**: Learn at your own pace with instant feedback
- **🔥 Test Mode**: Timed mock interviews with 5 questions and scoring
- **📚 Multiple Topics**: TypeScript, QA Testing, Playwright (10 questions each)
- **💯 Smart Scoring**: Automatic evaluation with detailed breakdowns
- **⏱️ Time Limits**: 2 minutes per question in test mode
- **📊 Difficulty Levels**: Easy, Medium, and Hard questions

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- Telegram Bot Token (from [@BotFather](https://t.me/botfather))

### Installation

1. Clone the repository:

```bash
git clone https://github.com/NazarT17/telegram-interview-bot.git
cd telegram-interview-bot
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Running the Bot

#### Development Mode (with auto-restart)

```bash
npm run dev
```

This will start the bot with nodemon, automatically restarting when you make changes.

#### Production Mode

```bash
# Build the TypeScript code
npm run build

# Start the bot
npm start
```

### Stopping the Bot

- **Development Mode**: Press `Ctrl+C` in the terminal
- **Production Mode**: Press `Ctrl+C` or send SIGTERM signal

The bot handles graceful shutdown to clean up resources properly.

## 📖 Bot Commands

| Command                  | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `/start`                 | Start the bot and see welcome message                  |
| `/menu`                  | Show the main menu with all options                    |
| `/help`                  | Display detailed help and instructions                 |
| `/topics`                | List all available topics with question counts         |
| `/mockinterview <topic>` | Start a timed test (e.g., `/mockinterview typescript`) |

## 🎯 How to Use

### Practice Mode

1. Type `/start` or `/menu`
2. Click "🎓 Practice Mode"
3. Select a topic (TypeScript, QA, or Playwright)
4. Answer the multiple-choice question by clicking A, B, or C
5. See instant feedback with explanation
6. Click "🔄 Another Question" to continue practicing

### Test Mode

1. Type `/start` or `/menu`
2. Click "🔥 Test Mode"
3. Select a topic
4. Answer 5 timed questions (2 minutes each)
5. Get your score with detailed breakdown by difficulty level

## 📁 Project Structure

```
telegram-interview-bot/
├── src/
│   ├── bot.ts                 # Main bot configuration
│   ├── commands/              # Command handlers
│   │   ├── start.ts          # Welcome message
│   │   ├── menu.ts           # Menu and help
│   │   ├── topics.ts         # Topic listing
│   │   ├── topic.ts          # Single topic view
│   │   └── mockInterview.ts  # Test mode logic
│   ├── services/
│   │   └── dataService.ts    # Question data access
│   ├── data/                 # Question databases
│   │   ├── typescript.json
│   │   ├── qa.json
│   │   └── playwright.json
│   └── types/
│       └── index.ts          # TypeScript interfaces
├── .env                      # Environment variables
├── package.json
└── tsconfig.json
```

## 🛠️ Development

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

### Adding New Questions

Edit the JSON files in `src/data/`:

```json
{
  "id": 11,
  "question": "Your question here?",
  "answer": "Detailed explanation here",
  "options": ["First option", "Second option (correct)", "Third option"],
  "correctOption": 1,
  "difficulty": "medium",
  "tags": ["tag1", "tag2"]
}
```

## 🌐 Deployment

The bot is deployed on [Railway.app](https://railway.app) with auto-deployment from the main branch.

### Deploy to Railway

1. Push to the main branch:

```bash
git push origin main
```

2. Railway will automatically:
   - Build the TypeScript code
   - Deploy the new version
   - Restart the bot

### Manual Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

## 🔧 Environment Variables

| Variable             | Description                          | Required |
| -------------------- | ------------------------------------ | -------- |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather            | Yes      |
| `NODE_ENV`           | Environment (development/production) | No       |

## 📊 Question Statistics

- **TypeScript**: 10 questions (3 easy, 4 medium, 3 hard)
- **QA General**: 10 questions (3 easy, 5 medium, 2 hard)
- **Playwright**: 10 questions (3 easy, 4 medium, 3 hard)
- **Total**: 30 multiple-choice questions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

ISC

## 🙋 Support

For issues or questions:

- Open an issue on GitHub
- Contact the bot on Telegram

## 🎉 Credits

Built with:

- [Grammy](https://grammy.dev/) - Telegram Bot Framework
- [TypeScript](https://www.typescriptlang.org/)
- [Node.js](https://nodejs.org/)
