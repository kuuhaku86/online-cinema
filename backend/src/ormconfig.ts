import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Adjust path if needed
  migrations: [__dirname + '/**/migrations/*{.ts,.js}'], // Path to store migrations
  synchronize: false, // IMPORTANT: Disable synchronize when using migrations
  // Add any other options like ssl if needed
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; // Export the DataSource instance
