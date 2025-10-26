#!/bin/bash

# Bot Management Script
# Usage: ./bot.sh [start|stop|restart|status|logs]

BOT_NAME="telegram-interview-bot"
PID_FILE="/tmp/$BOT_NAME.pid"
LOG_FILE="/tmp/$BOT_NAME.log"

start_bot() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "❌ Bot is already running (PID: $PID)"
            return 1
        else
            rm "$PID_FILE"
        fi
    fi

    echo "🚀 Starting bot..."
    npm run build && nohup npm start > "$LOG_FILE" 2>&1 &
    BOT_PID=$!
    echo $BOT_PID > "$PID_FILE"
    echo "✅ Bot started successfully (PID: $BOT_PID)"
    echo "📝 Logs: tail -f $LOG_FILE"
}

stop_bot() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ Bot is not running"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "🛑 Stopping bot (PID: $PID)..."
        kill $PID
        rm "$PID_FILE"
        echo "✅ Bot stopped successfully"
    else
        echo "❌ Bot process not found, cleaning up PID file"
        rm "$PID_FILE"
    fi
}

status_bot() {
    if [ ! -f "$PID_FILE" ]; then
        echo "❌ Bot is not running"
        return 1
    fi

    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Bot is running (PID: $PID)"
        echo "📊 Memory usage: $(ps -p $PID -o rss= | awk '{print $1/1024 " MB"}')"
        echo "⏱️  Started: $(ps -p $PID -o lstart=)"
    else
        echo "❌ Bot is not running (stale PID file)"
        rm "$PID_FILE"
    fi
}

restart_bot() {
    echo "🔄 Restarting bot..."
    stop_bot
    sleep 2
    start_bot
}

show_logs() {
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE"
    else
        echo "❌ No log file found"
    fi
}

case "$1" in
    start)
        start_bot
        ;;
    stop)
        stop_bot
        ;;
    restart)
        restart_bot
        ;;
    status)
        status_bot
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the bot"
        echo "  stop    - Stop the bot"
        echo "  restart - Restart the bot"
        echo "  status  - Check bot status"
        echo "  logs    - Show live logs"
        exit 1
        ;;
esac
