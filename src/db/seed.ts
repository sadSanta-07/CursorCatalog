import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

const categories = ["Electronics", "Clothing", "Books", "Food", "Sports"];

async function seed() {
  console.log("Seeding 200,000 products...");

  await sql`
    INSERT INTO products (name, category, price)
    SELECT
      'Product ' || i,
      (ARRAY['Electronics','Clothing','Books','Food','Sports'])[floor(random()*5+1)],
      round((random()*1000)::numeric, 2)
    FROM generate_series(1, 200000) AS i
  `;

  console.log("Done!");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});