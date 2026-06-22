import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Creating indexes...");

  await sql`
    CREATE INDEX IF NOT EXISTS idx_products_created_at_id 
    ON products (created_at DESC, id DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_products_category_created_at_id 
    ON products (category, created_at DESC, id DESC)
  `;

  console.log("Done!");
  process.exit(0);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});