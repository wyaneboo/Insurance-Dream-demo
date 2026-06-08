const firstConfigured = (...values: Array<string | undefined>) =>
  values.find((value) => value && value !== 'your_google_gemini_api_key') || '';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    secret: process.env.JWT_SECRET || 'devsecret',
    accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
  },
  ai: {
    apiKey: firstConfigured(process.env.AI_API_KEY, process.env.GOOGLE_API_KEY, process.env.GEMINI_API_KEY),
    model: process.env.AI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // The Python LangGraph agent service the backend delegates chat requests to.
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    // Shared secret guarding the internal CRM tool endpoint the agent calls back into.
    internalSecret: process.env.AI_INTERNAL_SECRET || 'dev_internal_secret',
  },
});
