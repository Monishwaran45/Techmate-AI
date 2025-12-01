import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVectorStorage1700000001000 implements MigrationInterface {
  name = 'CreateVectorStorage1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Create embedding_documents table with vector column
    await queryRunner.query(`
      CREATE TABLE "embedding_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "source_type" character varying NOT NULL CHECK ("source_type" IN ('code', 'documentation', 'note')),
        "source_id" character varying NOT NULL,
        "content" text NOT NULL,
        "embedding" vector(1536),
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_embedding_documents" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "embedding_documents"
      ADD CONSTRAINT "FK_embedding_documents_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    // Create indexes for efficient querying
    await queryRunner.query(
      `CREATE INDEX "IDX_embedding_documents_user_id" ON "embedding_documents" ("user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_embedding_documents_source_type" ON "embedding_documents" ("source_type")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_embedding_documents_source_id" ON "embedding_documents" ("source_id")`
    );

    // Create vector similarity search index using HNSW (Hierarchical Navigable Small World)
    // This provides fast approximate nearest neighbor search
    await queryRunner.query(`
      CREATE INDEX "IDX_embedding_documents_embedding_cosine" 
      ON "embedding_documents" 
      USING hnsw (embedding vector_cosine_ops)
    `);

    // Alternative: Create IVFFlat index (can be used instead of HNSW)
    // Uncomment if you prefer IVFFlat over HNSW
    // await queryRunner.query(`
    //   CREATE INDEX "IDX_embedding_documents_embedding_ivfflat" 
    //   ON "embedding_documents" 
    //   USING ivfflat (embedding vector_cosine_ops)
    //   WITH (lists = 100)
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_embedding_documents_embedding_cosine"`);
    await queryRunner.query(`DROP INDEX "IDX_embedding_documents_source_id"`);
    await queryRunner.query(`DROP INDEX "IDX_embedding_documents_source_type"`);
    await queryRunner.query(`DROP INDEX "IDX_embedding_documents_user_id"`);
    await queryRunner.query(
      `ALTER TABLE "embedding_documents" DROP CONSTRAINT "FK_embedding_documents_user"`
    );
    await queryRunner.query(`DROP TABLE "embedding_documents"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS vector`);
  }
}
