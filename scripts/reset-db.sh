
#!/bin/bash

echo "Resetting database..."

docker compose down -v
docker compose up -d

echo "Database reset complete"
