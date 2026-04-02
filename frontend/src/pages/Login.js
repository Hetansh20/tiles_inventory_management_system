import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }
    if (username !== "admin" || password !== "admin123") {
      setError("Invalid credentials. Try admin / admin123");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 800);
  };

  return (
    <div style={styles.page}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.brandMark}>⬡</div>
        <h1 style={styles.heroTitle}>TileERP</h1>
        <p style={styles.heroSub}>
          Professional Inventory Management<br />for the Tiles Industry
        </p>
        <div style={styles.featureList}>
          {["Real-time Stock Tracking", "Category Management", "Low Stock Alerts", "Full MERN Integration"].map((f) => (
            <div key={f} style={styles.featureItem}>
              <span style={styles.featureDot}>✦</span> {f}
            </div>
          ))}
        </div>
        <div style={styles.academicTag}>Advanced Web Technologies — MERN Stack Project</div>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <div style={styles.formLogo}>⬡</div>
            <h2 style={styles.formTitle}>Welcome Back</h2>
            <p style={styles.formSub}>Sign in to your inventory dashboard</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={styles.input}
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" style={styles.loginBtn} disabled={loading}>
              {loading ? "Signing in..." : "Sign In →"}
            </button>

            <div style={styles.hint}>
              Demo credentials: <strong>admin</strong> / <strong>admin123</strong>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
  },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(160deg, #0F172A 0%, #1E293B 60%, #312E81 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px",
    color: "#fff",
  },
  brandMark: {
    fontSize: "40px",
    color: "#818CF8",
    marginBottom: "12px",
  },
  heroTitle: {
    fontSize: "52px",
    fontWeight: "900",
    margin: "0 0 12px",
    background: "linear-gradient(90deg, #fff, #A5B4FC)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-1px",
  },
  heroSub: {
    fontSize: "16px",
    color: "#94A3B8",
    lineHeight: "1.7",
    marginBottom: "36px",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "48px",
  },
  featureItem: {
    fontSize: "14px",
    color: "#CBD5E1",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  featureDot: {
    color: "#6366F1",
    fontSize: "12px",
  },
  academicTag: {
    display: "inline-block",
    background: "rgba(99,102,241,0.2)",
    border: "1px solid rgba(99,102,241,0.4)",
    borderRadius: "100px",
    padding: "6px 16px",
    fontSize: "11px",
    color: "#A5B4FC",
    letterSpacing: "0.5px",
  },
  rightPanel: {
    width: "480px",
    background: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  formCard: {
    width: "100%",
    background: "#fff",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
    border: "1px solid #E2E8F0",
  },
  formHeader: {
    textAlign: "center",
    marginBottom: "32px",
  },
  formLogo: {
    fontSize: "28px",
    color: "#6366F1",
    marginBottom: "8px",
  },
  formTitle: {
    margin: "0 0 6px",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0F172A",
  },
  formSub: {
    margin: 0,
    fontSize: "13px",
    color: "#94A3B8",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1.5px solid #E2E8F0",
    fontSize: "14px",
    outline: "none",
    color: "#0F172A",
    background: "#F8FAFC",
    fontFamily: "inherit",
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#DC2626",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
  },
  loginBtn: {
    padding: "13px",
    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.3px",
  },
  hint: {
    textAlign: "center",
    fontSize: "12px",
    color: "#94A3B8",
  },
};
