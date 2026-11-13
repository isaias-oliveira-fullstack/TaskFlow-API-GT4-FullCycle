import 'dotenv/config';

const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl:
    process.env.DATABASE_URL ?? 'mysql://taskflow:taskflow_password@localhost:3306/taskflow'
};

export default env;
