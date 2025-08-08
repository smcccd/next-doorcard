#!/bin/bash

# Migration monitoring script
# Run this in a separate terminal to monitor progress

echo "🔍 Migration Monitor Started"
echo "=================================="
echo "Use Ctrl+C to stop monitoring"
echo ""

# Function to display current status
show_status() {
    if [ -f "migration-status.txt" ]; then
        echo "📊 Current Status:"
        cat migration-status.txt
        echo ""
    fi
}

# Function to show recent log entries
show_recent_logs() {
    if [ -f "migration-progress.log" ]; then
        echo "📋 Recent Progress (last 10 lines):"
        tail -10 migration-progress.log
        echo ""
    fi
}

# Main monitoring loop
while true; do
    clear
    echo "🔍 PRODUCTION MIGRATION MONITOR"
    echo "$(date)"
    echo "=================================="
    echo ""
    
    show_status
    show_recent_logs
    
    echo "Refreshing in 5 seconds... (Ctrl+C to stop)"
    sleep 5
done