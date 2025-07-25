#!/bin/bash

PID=$(pgrep -f "dotnet.*ProductService.dll")
if [ -n "$PID" ]; then
    echo "Stopping old process (PID $PID)..."
    kill -TERM $PID
    sleep 5
fi