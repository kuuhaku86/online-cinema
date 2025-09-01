import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessageTable1756528868194 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "text" text NOT NULL,
        "user_id" uuid NOT NULL,
        "room_short_code" character varying(6) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages"`);
  }
}
