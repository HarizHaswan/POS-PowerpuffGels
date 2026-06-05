"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navigation({ type }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        // Force reload to let root layout recalculate auth state and redirect
        window.location.href = "/login";
      } else {
        alert("Failed to log out");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging out");
    }
  };

  if (type === "header") {
    return (
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    );
  }

  // Footer navigation (active tabs)
  return (
    <nav className="bottom-nav">
      <Link href="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
        <span className="nav-icon">🛒</span>
        <span>POS</span>
      </Link>
      <Link
        href="/history"
        className={`nav-item ${pathname === "/history" ? "active" : ""}`}
      >
        <span className="nav-icon">📜</span>
        <span>History</span>
      </Link>
      <Link
        href="/reports"
        className={`nav-item ${pathname === "/reports" ? "active" : ""}`}
      >
        <span className="nav-icon">📈</span>
        <span>Reports</span>
      </Link>
    </nav>
  );
}
