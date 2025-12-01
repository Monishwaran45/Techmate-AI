import { DataSource } from 'typeorm';

let testDataSource: DataSource;

export async function setupTestDatabase() {
  testDataSource = new DataSource({
    type: 'postgres',
    host: process.env.TEST_DATABASE_HOST || 'localhost',
    port: parseInt(process.env.TEST_DATABASE_PORT || '5432'),
    username: process.env.TEST_DATABASE_USER || 'postgres',
    password: process.env.TEST_DATABASE_PASSWORD || 'password',
    database: process.env.TEST_DATABASE_NAME || 'techmate_test',
    entities: ['src/**/*.entity.ts'],
    synchronize: true,
    dropSchema: true,
  });

  await testDataSource.initialize();
  return testDataSource;
}

export async function cleanupTestDatabase() {
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
}

export function getTestDataSource() {
  return testDataSource;
}
