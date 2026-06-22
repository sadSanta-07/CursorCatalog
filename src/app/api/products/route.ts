import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;

    const category = searchParams.get("category");
    const cursor = searchParams.get("cursor");

    const limit = 20;

    let cursorTime: string | null = null;
    let cursorId: string | null = null;

    if (cursor) {
        const decoded = JSON.parse(
            Buffer.from(cursor, "base64").toString()
        );

        cursorTime = decoded.createdAt;
        cursorId = decoded.id;
    }

    let rows;

    if (cursorTime && cursorId && category) {
        rows = await sql`
      SELECT *
      FROM products
      WHERE category = ${category}
        AND (
          created_at < ${cursorTime}
          OR (
            created_at = ${cursorTime}
            AND id < ${cursorId}
          )
        )
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit + 1}
    `;
    } else if (cursorTime && cursorId) {
        rows = await sql`
      SELECT *
      FROM products
      WHERE
        created_at < ${cursorTime}
        OR (
          created_at = ${cursorTime}
          AND id < ${cursorId}
        )
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit + 1}
    `;
    } else if (category) {
        rows = await sql`
      SELECT *
      FROM products
      WHERE category = ${category}
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit + 1}
    `;
    } else {
        rows = await sql`
      SELECT *
      FROM products
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit + 1}
    `;
    }

    const items = [...rows];

    const hasMore = items.length > limit;

    if (hasMore) {
        items.pop();
    }

    const lastItem = items.at(-1) as
        | { created_at: string; id: string }
        | undefined;

    const nextCursor =
        hasMore && lastItem
            ? Buffer.from(
                JSON.stringify({
                    createdAt: lastItem.created_at,
                    id: lastItem.id,
                })
            ).toString("base64")
            : null;

    let countResult;

    if (category) {
        countResult = await sql`
            SELECT COUNT(*)::int as count FROM products WHERE category = ${category}
        `;
    } else {
        countResult = await sql`
            SELECT COUNT(*)::int as count FROM products
        `;
    }

    const total = (countResult[0] as { count: number }).count;

    return NextResponse.json({ items, nextCursor, total });
}