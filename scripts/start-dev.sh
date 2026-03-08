
#!/bin/bash

echo "Starting Waitlist local stack..."

docker compose up -d

echo "Database running on port 5432"
echo "pgAdmin running on http://localhost:5050"

echo "Next steps:"
echo "1. npm install"
echo "2. npx prisma generate"
echo "3. npx prisma migrate dev"
echo "4. npm run dev"
