import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import Navigation from "./navigation";
import "./globals.css";

export const metadata = {
  title: "Booth POS System",
  description: "Simple multi-seller popup booth Point of Sale system",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  const sessionToken = sessionCookie ? sessionCookie.value : null;
  const session = await verifySession(sessionToken);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="h-full flex flex-col">
        {session ? (
          <>
            <header className="nav-header">
              <div className="nav-content">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <img
                    src="/logo.jpg"
                    alt="Powerpuff Gels Logo"
                    style={{
                      height: "36px",
                      width: "36px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                    }}
                  />
                  <span className="nav-title">Booth POS</span>
                </div>
                <Navigation type="header" />
              </div>
            </header>
            <main className="app-container" style={{ flex: 1 }}>
              {children}
            </main>
            <Navigation type="footer" />
          </>
        ) : (
          <main style={{ flex: 1 }}>
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
