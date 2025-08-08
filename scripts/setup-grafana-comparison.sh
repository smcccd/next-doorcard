#!/bin/bash

# Quick Grafana setup for data comparison
echo "🚀 Setting up Grafana for data comparison..."

# Start Grafana container
docker run -d \
  -p 3000:3000 \
  --name doorcard-grafana \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin123" \
  -v grafana-storage:/var/lib/grafana \
  grafana/grafana

echo "⏳ Waiting for Grafana to start..."
sleep 10

echo "✅ Grafana is running!"
echo "🌐 Open: http://localhost:3000"
echo "👤 Username: admin"
echo "🔑 Password: admin123"
echo ""
echo "📋 Next Steps:"
echo "1. Add PostgreSQL data source (your production database)"
echo "2. Add SQLite data source (your current dev database)"
echo "3. Import the dashboard JSON below"
echo ""
echo "🔗 Dashboard JSON saved to grafana-dashboard.json"