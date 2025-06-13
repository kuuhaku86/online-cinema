import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRoomsTable1749828168097 implements MigrationInterface {
    name = 'CreateRoomsTable1749828168097';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "rooms" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "short_code" character varying(6) NOT NULL DEFAULT SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', ''), 1, 6),
                "user_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_rooms_short_code" UNIQUE ("short_code"),
                CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(
            `CREATE INDEX "IDX_rooms_short_code" ON "rooms" ("short_code")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_rooms_short_code"`);
        await queryRunner.query(`DROP TABLE "rooms"`);
    }

}
