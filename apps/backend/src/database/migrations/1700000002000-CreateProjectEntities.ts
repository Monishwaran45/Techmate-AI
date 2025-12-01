import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectEntities1700000002000 implements MigrationInterface {
  name = 'CreateProjectEntities1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create project_ideas table
    await queryRunner.query(`
      CREATE TABLE "project_ideas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "difficulty" character varying NOT NULL CHECK ("difficulty" IN ('beginner', 'intermediate', 'advanced')),
        "technologies" text NOT NULL,
        "estimated_hours" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_ideas" PRIMARY KEY ("id")
      )
    `);

    // Create project_architectures table
    await queryRunner.query(`
      CREATE TABLE "project_architectures" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "project_idea_id" uuid NOT NULL,
        "folder_structure" jsonb NOT NULL,
        "tech_stack" jsonb NOT NULL,
        "tasks" jsonb NOT NULL,
        "dependencies" jsonb NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_architectures" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_project_architectures_project_idea_id" UNIQUE ("project_idea_id")
      )
    `);

    // Create code_files table
    await queryRunner.query(`
      CREATE TABLE "code_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "architecture_id" uuid NOT NULL,
        "path" character varying NOT NULL,
        "content" text NOT NULL,
        "language" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_code_files" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "project_ideas"
      ADD CONSTRAINT "FK_project_ideas_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "project_architectures"
      ADD CONSTRAINT "FK_project_architectures_project_idea"
      FOREIGN KEY ("project_idea_id") REFERENCES "project_ideas"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "code_files"
      ADD CONSTRAINT "FK_code_files_architecture"
      FOREIGN KEY ("architecture_id") REFERENCES "project_architectures"("id")
      ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_project_ideas_user_id" ON "project_ideas" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_project_ideas_difficulty" ON "project_ideas" ("difficulty")`);
    await queryRunner.query(`CREATE INDEX "IDX_project_ideas_user_id_difficulty" ON "project_ideas" ("user_id", "difficulty")`);
    await queryRunner.query(`CREATE INDEX "IDX_project_architectures_project_idea_id" ON "project_architectures" ("project_idea_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_code_files_architecture_id" ON "code_files" ("architecture_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_code_files_architecture_id"`);
    await queryRunner.query(`DROP INDEX "IDX_project_architectures_project_idea_id"`);
    await queryRunner.query(`DROP INDEX "IDX_project_ideas_user_id_difficulty"`);
    await queryRunner.query(`DROP INDEX "IDX_project_ideas_difficulty"`);
    await queryRunner.query(`DROP INDEX "IDX_project_ideas_user_id"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "code_files" DROP CONSTRAINT "FK_code_files_architecture"`);
    await queryRunner.query(`ALTER TABLE "project_architectures" DROP CONSTRAINT "FK_project_architectures_project_idea"`);
    await queryRunner.query(`ALTER TABLE "project_ideas" DROP CONSTRAINT "FK_project_ideas_user"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "code_files"`);
    await queryRunner.query(`DROP TABLE "project_architectures"`);
    await queryRunner.query(`DROP TABLE "project_ideas"`);
  }
}
