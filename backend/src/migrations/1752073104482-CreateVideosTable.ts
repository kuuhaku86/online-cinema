import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVideosTable1752073104482 implements MigrationInterface {
  name = 'CreateVideosTable1752073104482';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "videos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "ready" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_videos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_videos_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_videos_user_id" ON "videos" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_videos_user_id"`);
    await queryRunner.query(`DROP TABLE "videos"`);
  }
}
