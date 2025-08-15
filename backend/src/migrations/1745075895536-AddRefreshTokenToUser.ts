import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRefreshTokenToUser1745075895536 implements MigrationInterface {
  name = 'AddRefreshTokenToUser1745075895536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'current_hashed_refresh_token',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'current_hashed_refresh_token');
  }
}
