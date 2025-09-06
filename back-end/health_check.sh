#!/bin/bash

# Career Compass Health Check Script
echo "🏥 Career Compass Health Check"
echo "==============================="

# Function to check service health
check_service() {
    local service_name="$1"
    local url="$2"
    local expected_status="$3"
    
    echo -n "Checking $service_name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FAIL ($response)"
        return 1
    fi
}

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check all services
echo ""
echo "🔍 Checking individual services:"

check_service "Main Health Check" "http://localhost/health" "200"
check_service "CV Evaluation" "http://localhost:5000/health" "200"
check_service "Interview Service" "http://localhost:5001/health" "200"
check_service "RAG Service" "http://localhost:5002/health" "200"
check_service "University List" "http://localhost:8000/health" "200"
check_service "Major List" "http://localhost:8001/health" "200"
check_service "Nginx Proxy" "http://localhost" "200"

echo ""
echo "📊 Service URLs:"
echo "  Main: http://localhost"
echo "  CV Evaluation: http://localhost:5000"
echo "  Interview: http://localhost:5001"
echo "  RAG System: http://localhost:5002"
echo "  Universities: http://localhost:8000"
echo "  Majors: http://localhost:8001"
echo ""

# Check Docker container status
echo "🐳 Docker Container Status:"
docker ps --filter "name=career-compass" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Health check complete!"
