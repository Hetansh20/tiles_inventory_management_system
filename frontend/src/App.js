import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddTile from "./pages/AddTile";
import ViewTiles from "./pages/ViewTiles";
import Stock from "./pages/Stock";
import Layout from "./layout/Layout";

const initialTiles = [
  { id: 1, name: "Marble White", size: "60x60", category: "Marble", quantity: 240, price: 85 },
  { id: 2, name: "Rustic Oak", size: "30x60", category: "Wood", quantity: 12, price: 120 },
  { id: 3, name: "Granite Grey", size: "80x80", category: "Granite", quantity: 180, price: 95 },
  { id: 4, name: "Terracotta Classic", size: "20x20", category: "Terracotta", quantity: 8, price: 45 },
  { id: 5, name: "Slate Black", size: "60x60", category: "Slate", quantity: 310, price: 110 },
  { id: 6, name: "Porcelain Ivory", size: "45x45", category: "Porcelain", quantity: 5, price: 75 },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tiles, setTiles] = useState(initialTiles);

  const addTile = (tile) => {
    setTiles((prev) => [...prev, { ...tile, id: Date.now() }]);
  };

  const updateTile = (id, updated) => {
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const deleteTile = (id) => {
    setTiles((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLogin={() => setIsLoggedIn(true)} />
            )
          }
        />
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <Layout onLogout={() => setIsLoggedIn(false)}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard tiles={tiles} />} />
                  <Route path="/add-tile" element={<AddTile onAdd={addTile} />} />
                  <Route
                    path="/view-tiles"
                    element={
                      <ViewTiles
                        tiles={tiles}
                        onUpdate={updateTile}
                        onDelete={deleteTile}
                      />
                    }
                  />
                  <Route path="/stock" element={<Stock tiles={tiles} />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
