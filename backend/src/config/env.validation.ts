import * as Joi from 'joi';

export const validateEnv = (config: Record<string, unknown>) => {
  const schema = Joi.object({
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    REDIS_URL: Joi.string().uri().required(),
    JWT_SECRET: Joi.string().min(16).required(),
    ACCESS_TOKEN_TTL: Joi.string().default('15m'),
    REFRESH_TOKEN_TTL: Joi.string().default('7d'),
    S3_ENDPOINT: Joi.string().required(),
    S3_REGION: Joi.string().default('us-east-1'),
    S3_BUCKET: Joi.string().required(),
    S3_ACCESS_KEY: Joi.string().required(),
    S3_SECRET_KEY: Joi.string().required(),
    AI_API_KEY: Joi.string().allow('').default(''),
    GOOGLE_API_KEY: Joi.string().allow('').default(''),
    GEMINI_API_KEY: Joi.string().allow('').default(''),
    AI_MODEL: Joi.string().default('gemma-4-31b-it'),
    GEMINI_MODEL: Joi.string().allow('').default(''),
  });

  const { error, value } = schema.validate(config, { allowUnknown: true });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return value;
};
