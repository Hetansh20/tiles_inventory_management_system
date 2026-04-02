import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global reset styles
const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', 'Segoe UI', sans-serif; background: #F0F2F8; }
  input:focus, select:focus, button:focus { outline: 2px solid #6366F1; outline-offset: 2px; }
  a { text-decoration: none; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #F1F5F9; }
  ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 100px; }
  tr:hover { background: #FAFAFA; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
