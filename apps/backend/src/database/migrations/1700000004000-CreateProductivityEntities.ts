import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductivityEntities1700000004000
  implements MigrationInterface
{
  name = 'CreateProductivityEntities1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tasks table
    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "status" character varying NOT NULL DEFAULT 'todo' CHECK ("status" IN ('todo', 'in_progress', 'done')),
        "priority" character varying NOT NULL DEFAULT 'medium' CHECK ("priority" IN ('low', 'medium', 'high')),
        "due_date" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tasks" PRIMARY KEY ("id")
      )
    `);

    // Create notes table
    await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "summary" text,
        "tags" text NOT NULL DEFAULT '',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notes" PRIMARY KEY ("id")
      )
    `);

    // Create timer_sessions table
    await queryRunner.query(`
      CREATE TABLE "timer_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "duration" integer NOT NULL,
        "started_at" TIMESTAMP NOT NULL,
        "completed_at" TIMESTAMP,
        "interrupted" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_timer_sessions" PRIMARY KEY ("id")
      )
    `);

    // Create reminders table
    await queryRunner.query(`
      CREATE TABLE "reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "message" text NOT NULL,
        "scheduled_for" TIMESTAMP NOT NULL,
        "sent" boolean NOT NULL DEFAULT false,
        "sent_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reminders" PRIMARY KEY ("id")
      )
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "FK_tasks_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "notes"
      ADD CONSTRAINT "FK_notes_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "timer_sessions"
      ADD CONSTRAINT "FK_timer_sessions_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders"
      ADD CONSTRAINT "FK_reminders_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_user_id" ON "tasks" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_user_id_status" ON "tasks" ("user_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_status" ON "tasks" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tasks_due_date" ON "tasks" ("due_date")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_notes_user_id" ON "notes" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notes_user_id_created_at" ON "notes" ("user_id", "created_at")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_timer_sessions_user_id" ON "timer_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_timer_sessions_started_at" ON "timer_sessions" ("started_at")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_reminders_user_id" ON "reminders" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reminders_user_id_scheduled_for" ON "reminders" ("user_id", "scheduled_for")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reminders_sent_scheduled_for" ON "reminders" ("sent", "scheduled_for")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "IDX_reminders_sent_scheduled_for"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_reminders_user_id_scheduled_for"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_reminders_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_timer_sessions_started_at"`);
    await queryRunner.query(`DROP INDEX "IDX_timer_sessions_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notes_user_id_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_notes_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_status"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_user_id_status"`);
    await queryRunner.query(`DROP INDEX "IDX_tasks_user_id"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "reminders" DROP CONSTRAINT "FK_reminders_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "timer_sessions" DROP CONSTRAINT "FK_timer_sessions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" DROP CONSTRAINT "FK_notes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_user"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "reminders"`);
    await queryRunner.query(`DROP TABLE "timer_sessions"`);
    await queryRunner.query(`DROP TABLE "notes"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
  }
}
