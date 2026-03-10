// Set test environment variables
process.env.WHATSAPP_PROVIDER = "mock";
process.env.NEXTAUTH_SECRET = "test-secret-1234567890";

// Mock the Prisma client to avoid real DB connections in unit tests
// For integration tests that need real DB, use the actual DATABASE_URL
