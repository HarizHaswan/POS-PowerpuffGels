"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Successful login, refresh/redirect to home
        window.location.href = "/";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "16px",
        background: "linear-gradient(135deg, #090d16 0%, #111827 100%)",
      }}
    >
      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: 0,
          textAlign: "center",
          padding: "32px 24px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "800",
            marginBottom: "8px",
            background: "linear-gradient(135deg, #ec4899, #f59e0b)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Booth POS
        </h1>
        <p style={{ marginBottom: "28px", fontSize: "0.95rem" }}>
          Popup Booth Staff Portal
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              style={{
                textAlign: "center",
                letterSpacing: "0.2em",
                fontSize: "1.4rem",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "var(--color-danger)",
                backgroundColor: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.2)",
                borderRadius: "var(--border-radius-sm)",
                padding: "10px",
                marginBottom: "16px",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              padding: "14px",
              marginTop: "8px",
              background: loading
                ? "var(--text-muted)"
                : "linear-gradient(135deg, #ec4899, #f59e0b)",
              boxShadow: loading ? "none" : "0 4px 14px rgba(236, 72, 153, 0.3)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
