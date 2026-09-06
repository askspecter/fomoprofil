"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fff3fa", color: "#2a0f1e", margin: 0 }}>
        <div style={{ maxWidth: 480, margin: "10vh auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#6b5560" }}>{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: "#ec0e7b",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
