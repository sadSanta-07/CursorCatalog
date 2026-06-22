"use client";
import { useEffect, useState } from "react";

const CATEGORIES = ["All", "Electronics", "Clothing", "Books", "Food", "Sports"];

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  Electronics: { bg: "#e8f0fd", color: "#1a4fa0" },
  Clothing:    { bg: "#f0ebfd", color: "#5b21b6" },
  Books:       { bg: "#eaf3de", color: "#27500a" },
  Food:        { bg: "#fef3e2", color: "#92400e" },
  Sports:      { bg: "#fce8e8", color: "#991b1b" },
};

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  created_at: string;
}

const SF = {
  bg: "#fbfaf5",
  bgAlt: "#ece8dd",
  surface: "#f4f1ea",
  border: "#d8d2c4",
  textPrimary: "#14171a",
  textSecondary: "#5a6066",
  textMuted: "#656a72",
  primary: "#157f5b",
  primaryHover: "#0f5f44",
  textInverse: "#f4f1ea",
  fontDisplay: "'Fraunces', serif",
  fontBody: "'Public Sans', system-ui, sans-serif",
  fontMono: "'Space Mono', monospace",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("All");
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [page, setPage] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCursor, setActiveCursor] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (activeCursor) params.set("cursor", activeCursor);
      const res = await fetch(`/api/products?${params}`);
      const data: { items: Product[]; nextCursor: string | null } = await res.json();
      if (!cancelled) {
        setProducts(data.items);
        setNextCursor(data.nextCursor);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeCursor, category]);

  function handleCategory(cat: string) {
    setCategory(cat);
    setCursorStack([null]);
    setPage(0);
    setActiveCursor(null);
  }

  function handleNext() {
    if (!nextCursor) return;
    setCursorStack((prev) => [...prev.slice(0, page + 1), nextCursor]);
    setPage((p) => p + 1);
    setActiveCursor(nextCursor);
  }

  function handlePrev() {
    if (page === 0) return;
    const prevCursor = cursorStack[page - 1];
    setPage((p) => p - 1);
    setActiveCursor(prevCursor ?? null);
  }

  const start = page * 20 + 1;
  const end = page * 20 + products.length;

  return (
    <main style={{ background: SF.bg, minHeight: "100vh", fontFamily: SF.fontBody }}>

      {/* Nav */}
      <nav style={{
        background: SF.bg,
        borderBottom: `1px solid ${SF.border}`,
        padding: "0 32px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <span style={{
          fontFamily: SF.fontDisplay,
          fontSize: 22,
          fontWeight: 400,
          color: SF.textPrimary,
          letterSpacing: "-0.01em",
        }}>
          Products
        </span>
        <span style={{
          fontFamily: SF.fontMono,
          fontSize: 12,
          color: SF.textMuted,
        }}>
          200,000 items
        </span>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>

        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: SF.fontDisplay,
            fontSize: 40,
            fontWeight: 400,
            color: SF.textPrimary,
            margin: "0 0 8px",
            lineHeight: 1.2,
          }}>
            Browse catalogue
          </h1>
          <p style={{
            fontFamily: SF.fontBody,
            fontSize: 14,
            color: SF.textSecondary,
            margin: 0,
          }}>
            Newest products first. Filter by category below.
          </p>
        </div>

        {/* Category filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            const hovered = hoveredCat === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategory(cat)}
                onMouseEnter={() => setHoveredCat(cat)}
                onMouseLeave={() => setHoveredCat(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 2,
                  border: `1px solid ${active ? SF.primary : SF.border}`,
                  background: active ? SF.primary : hovered ? SF.bgAlt : SF.bg,
                  color: active ? SF.textInverse : hovered ? SF.textPrimary : SF.textSecondary,
                  fontFamily: SF.fontBody,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease-out",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results meta */}
        <div style={{
          fontFamily: SF.fontMono,
          fontSize: 12,
          color: SF.textMuted,
          marginBottom: 12,
          minHeight: 20,
        }}>
          {loading ? "Loading…" : `Showing ${start}–${end}`}
        </div>

        {/* Product table */}
        <div style={{
          border: `1px solid ${SF.border}`,
          borderRadius: 3,
          overflow: "hidden",
          background: SF.surface,
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 140px 100px",
            padding: "10px 20px",
            borderBottom: `1px solid ${SF.border}`,
            background: SF.bgAlt,
          }}>
            {["Product", "Category", "Price"].map((h) => (
              <span key={h} style={{
                fontFamily: SF.fontBody,
                fontSize: 11,
                fontWeight: 500,
                color: SF.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textAlign: h === "Price" ? "right" : "left",
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 100px",
                  padding: "14px 20px",
                  borderTop: `1px solid ${SF.border}`,
                  alignItems: "center",
                  gap: 12,
                }}>
                  <div style={{ height: 13, width: `${55 + (i % 4) * 10}%`, borderRadius: 2, background: SF.border }} />
                  <div style={{ height: 20, width: 72, borderRadius: 2, background: SF.border }} />
                  <div style={{ height: 13, width: 52, borderRadius: 2, background: SF.border, marginLeft: "auto" }} />
                </div>
              ))
            : products.map((p, i) => {
                const badge = BADGE_COLORS[p.category];
                const hovered = hoveredRow === p.id;
                return (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredRow(p.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 140px 100px",
                      padding: "14px 20px",
                      borderTop: i === 0 ? "none" : `1px solid ${SF.border}`,
                      alignItems: "center",
                      background: hovered ? SF.bgAlt : SF.surface,
                      transition: "background 0.1s ease-out",
                    }}
                  >
                    <span style={{
                      fontFamily: SF.fontBody,
                      fontSize: 14,
                      color: SF.textPrimary,
                      fontWeight: 400,
                    }}>
                      {p.name}
                    </span>

                    <span>
                      {badge && (
                        <span style={{
                          display: "inline-block",
                          padding: "2px 6px",
                          borderRadius: 2,
                          background: badge.bg,
                          color: badge.color,
                          fontFamily: SF.fontBody,
                          fontSize: 10,
                          fontWeight: 500,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {p.category}
                        </span>
                      )}
                    </span>

                    <span style={{
                      fontFamily: SF.fontMono,
                      fontSize: 13,
                      color: SF.textPrimary,
                      textAlign: "right",
                    }}>
                      ${Number(p.price).toFixed(2)}
                    </span>
                  </div>
                );
              })}
        </div>

        {/* Pagination */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
          paddingTop: 24,
          borderTop: `1px solid ${SF.border}`,
        }}>
          <button
            onClick={handlePrev}
            disabled={page === 0}
            style={{
              padding: "8px 16px",
              borderRadius: 2,
              border: `1px solid ${SF.border}`,
              background: SF.bg,
              color: SF.textSecondary,
              fontFamily: SF.fontBody,
              fontSize: 14,
              fontWeight: 500,
              cursor: page === 0 ? "default" : "pointer",
              opacity: page === 0 ? 0.35 : 1,
              transition: "all 0.2s ease-out",
            }}
          >
            ← Previous
          </button>

          <span style={{
            fontFamily: SF.fontMono,
            fontSize: 12,
            color: SF.textMuted,
          }}>
            Page {page + 1}
          </span>

          <button
            onClick={handleNext}
            disabled={!nextCursor}
            style={{
              padding: "8px 16px",
              borderRadius: 2,
              border: "none",
              background: nextCursor ? SF.primary : SF.border,
              color: SF.textInverse,
              fontFamily: SF.fontBody,
              fontSize: 14,
              fontWeight: 500,
              cursor: nextCursor ? "pointer" : "default",
              opacity: nextCursor ? 1 : 0.5,
              transition: "all 0.2s ease-out",
            }}
          >
            Next →
          </button>
        </div>

      </div>
    </main>
  );
}