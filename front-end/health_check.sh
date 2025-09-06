#!/bin/sh

# Health check script for front-end service
# This script checks if the nginx server is running and responding

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if the application is responding
if ! wget --no-verbose --tries=1 --spider http://localhost/health 2>/dev/null; then
    echo "Application is not responding"
    exit 1
fi

echo "Front-end service is healthy"
exit 0 