import React from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function Layout({ children, onLogout }) {
  return (
    <div style={styles.wrapper}>
      <Sidebar onLogout={onLogout} />
      <div style={styles.main}>
        <Topbar />
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#F0F2F8",
    fontFamily: "'Outfit', 'Segoe UI', sans-serif",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  content: {
    flex: 1,
    padding: "28px 32px",
    overflowY: "auto",
  },
};
