import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOwnerIdAndStatusToRoomsTable1755259883887
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'rooms',
      new TableColumn({
        name: 'owner_id',
        type: 'varchar',
        isNullable: false,
      }),
    );
    await queryRunner.addColumn(
      'rooms',
      new TableColumn({
        name: 'active',
        type: 'boolean',
        default: "'false'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('rooms', 'status');
    await queryRunner.dropColumn('rooms', 'ownerId');
  }
}
