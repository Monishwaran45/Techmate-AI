import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobMatchingEntities1700000003000 implements MigrationInterface {
  name = 'CreateJobMatchingEntities1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create resumes table
    await queryRunner.query(`
      CREATE TABLE "resumes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "file_name" character varying NOT NULL,
        "file_url" character varying NOT NULL,
        "parsed_data" jsonb NOT NULL,
        "uploaded_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resumes" PRIMARY KEY ("id")
      )
    `);

    // Create resume_scores table
    await queryRunner.query(`
      CREATE TABLE "resume_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resume_id" uuid NOT NULL,
        "overall_score" integer NOT NULL,
        "ats_compatibility" integer NOT NULL,
        "content_quality" integer NOT NULL,
        "suggestions" text NOT NULL,
        "calculated_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resume_scores" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_resume_scores_resume_id" UNIQUE ("resume_id")
      )
    `);

    // Create job_matches table
    await queryRunner.query(`
      CREATE TABLE "job_matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "job_title" character varying NOT NULL,
        "company" character varying NOT NULL,
        "match_score" integer NOT NULL,
        "match_reasons" text NOT NULL,
        "job_url" character varying,
        "description" text,
        "requiredSkills" text,
        "location" character varying,
        "salary_range" character varying,
        "notified" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_job_matches" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "resumes"
      ADD CONSTRAINT "FK_resumes_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "resume_scores"
      ADD CONSTRAINT "FK_resume_scores_resume"
      FOREIGN KEY ("resume_id") REFERENCES "resumes"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "job_matches"
      ADD CONSTRAINT "FK_job_matches_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_resumes_user_id" ON "resumes" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_resume_scores_resume_id" ON "resume_scores" ("resume_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_matches_user_id" ON "job_matches" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_matches_user_id_match_score" ON "job_matches" ("user_id", "match_score")`);
    await queryRunner.query(`CREATE INDEX "IDX_job_matches_notified" ON "job_matches" ("notified")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_job_matches_notified"`);
    await queryRunner.query(`DROP INDEX "IDX_job_matches_user_id_match_score"`);
    await queryRunner.query(`DROP INDEX "IDX_job_matches_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_resume_scores_resume_id"`);
    await queryRunner.query(`DROP INDEX "IDX_resumes_user_id"`);

    // Drop foreign keys
    await queryRunner.query(`ALTER TABLE "job_matches" DROP CONSTRAINT "FK_job_matches_user"`);
    await queryRunner.query(`ALTER TABLE "resume_scores" DROP CONSTRAINT "FK_resume_scores_resume"`);
    await queryRunner.query(`ALTER TABLE "resumes" DROP CONSTRAINT "FK_resumes_user"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "job_matches"`);
    await queryRunner.query(`DROP TABLE "resume_scores"`);
    await queryRunner.query(`DROP TABLE "resumes"`);
  }
}
