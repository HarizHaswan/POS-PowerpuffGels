"use client";

import { useState } from "react";

export default function POSPage() {
  const [items, setItems] = useState([
    { id: 1, seller: "Nadia", quantity: 1, amount: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  // Add a new line item for mixed purchases
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now(), seller: "Nadia", quantity: 1, amount: "" },
    ]);
  };

  // Remove a line item
  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  // Update a field inside a specific line item
  const handleUpdateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Quick preset button to add to amount
  const handlePresetAmount = (id, presetValue) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const currentAmount = parseFloat(item.amount) || 0;
          return { ...item, amount: (currentAmount + presetValue).toString() };
        }
        return item;
      })
    );
  };

  // Calculate cart totals
  const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  // Form submission
  const handleCompleteSale = async () => {
    setError("");
    setLoading(true);

    // Form validation
    const formattedItems = [];
    for (const item of items) {
      const parsedQty = parseInt(item.quantity);
      const parsedAmt = parseFloat(item.amount);

      if (isNaN(parsedQty) || parsedQty <= 0) {
        setError("All items must have a quantity of 1 or more.");
        setLoading(false);
        return;
      }

      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        setError("All items must have an amount greater than RM0.");
        setLoading(false);
        return;
      }

      formattedItems.push({
        seller: item.seller,
        quantity: parsedQty,
        amount: parsedAmt,
      });
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: formattedItems,
          notes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Show success modal with breakdown
        setSuccessData(data);
        // Reset form
        setItems([{ id: Date.now(), seller: "Nadia", quantity: 1, amount: "" }]);
        setNotes("");
      } else {
        setError(data.error || "Failed to complete sale.");
      }
    } catch (err) {
      setError("An error occurred during submission.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Point of Sale</h1>
        <button className="btn-secondary" onClick={() => {
          setItems([{ id: Date.now(), seller: "Nadia", quantity: 1, amount: "" }]);
          setNotes("");
          setError("");
        }} style={{ width: "auto", padding: "0 16px", minHeight: "38px" }}>
          Reset Cart
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(244, 63, 94, 0.15)",
            border: "1px solid var(--color-danger)",
            color: "var(--color-danger)",
            borderRadius: "var(--border-radius-sm)",
            padding: "12px",
            marginBottom: "16px",
            fontWeight: "600",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Cart Items Form */}
      {items.map((item, index) => (
        <div key={item.id} className="glass-card" style={{ position: "relative", paddingBottom: "16px" }}>
          {items.length > 1 && (
            <button
              onClick={() => handleRemoveItem(item.id)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                color: "var(--color-danger)",
                background: "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.2)",
                width: "32px",
                height: "32px",
                minHeight: "auto",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
              title="Remove Item"
            >
              ✕
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.85rem",
                fontWeight: "700",
              }}
            >
              {index + 1}
            </span>
            <span style={{ fontWeight: "700", fontSize: "0.95rem", textTransform: "uppercase" }}>Line Item</span>
          </div>

          {/* Seller Selection */}
          <div className="form-group">
            <label className="form-label">Seller</label>
            <div className="segmented-control">
              <div
                onClick={() => handleUpdateItem(item.id, "seller", "Nadia")}
                className={`segmented-btn ${item.seller === "Nadia" ? "active-nadia" : ""}`}
              >
                Nadia
              </div>
              <div
                onClick={() => handleUpdateItem(item.id, "seller", "Ainina")}
                className={`segmented-btn ${item.seller === "Ainina" ? "active-ainina" : ""}`}
              >
                Ainina
              </div>
              <div
                onClick={() => handleUpdateItem(item.id, "seller", "Afrina")}
                className={`segmented-btn ${item.seller === "Afrina" ? "active-afrina" : ""}`}
              >
                Afrina
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Quantity Stepper */}
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() =>
                    handleUpdateItem(
                      item.id,
                      "quantity",
                      Math.max(1, (parseInt(item.quantity) || 1) - 1)
                    )
                  }
                >
                  −
                </button>
                <div className="stepper-value">{item.quantity}</div>
                <button
                  type="button"
                  className="stepper-btn"
                  onClick={() =>
                    handleUpdateItem(
                      item.id,
                      "quantity",
                      (parseInt(item.quantity) || 0) + 1
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Input */}
            <div className="form-group">
              <label className="form-label">Amount (RM)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={item.amount}
                onChange={(e) => handleUpdateItem(item.id, "amount", e.target.value)}
                style={{ fontSize: "1.2rem", fontWeight: "700" }}
              />
            </div>
          </div>

          {/* Quick presets */}
          <div style={{ marginTop: "4px" }}>
            <label className="form-label" style={{ fontSize: "0.75rem" }}>Add Quick Preset</label>
            <div className="preset-grid">
              <button type="button" onClick={() => handlePresetAmount(item.id, 5)} className="preset-btn">+RM5</button>
              <button type="button" onClick={() => handlePresetAmount(item.id, 10)} className="preset-btn">+RM10</button>
              <button type="button" onClick={() => handlePresetAmount(item.id, 20)} className="preset-btn">+RM20</button>
              <button type="button" onClick={() => handlePresetAmount(item.id, 50)} className="preset-btn">+RM50</button>
            </div>
          </div>
        </div>
      ))}

      {/* Add Item Button */}
      <button
        onClick={handleAddItem}
        className="btn-secondary"
        style={{
          marginBottom: "20px",
          borderStyle: "dashed",
          borderWidth: "2px",
          borderColor: "rgba(255, 255, 255, 0.2)",
          padding: "14px",
        }}
      >
        ➕ Add Another Item (Mixed Seller Purchase)
      </button>

      {/* Transaction Notes */}
      <div className="glass-card">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Transaction Notes (Optional)</label>
          <input
            type="text"
            className="form-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Vintage dress, jacket, paid cash..."
          />
        </div>
      </div>

      {/* Checkout Section */}
      <div
        className="glass-card"
        style={{
          borderTop: "2px solid var(--color-success)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>TOTAL ITEMS</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "800" }}>{totalQuantity}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>TOTAL PRICE</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-success)" }}>
              RM {totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <button
          onClick={handleCompleteSale}
          className="btn-primary"
          disabled={loading}
          style={{ padding: "16px" }}
        >
          {loading ? "Recording Sale..." : "Complete Sale"}
        </button>
      </div>

      {/* Success Modal */}
      {successData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: "center" }}>
            <span style={{ fontSize: "3.5rem" }}>✅</span>
            <h2 style={{ color: "var(--color-success)", marginTop: "12px", marginBottom: "8px" }}>
              Sale Completed!
            </h2>
            <p style={{ marginBottom: "20px" }}>Transaction has been recorded successfully.</p>

            <div
              style={{
                backgroundColor: "rgba(0,0,0,0.3)",
                borderRadius: "var(--border-radius-sm)",
                padding: "16px",
                marginBottom: "24px",
                textAlign: "left",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "700",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "8px",
                  marginBottom: "8px",
                }}
              >
                <span>Total Received</span>
                <span style={{ color: "var(--color-success)" }}>
                  RM {successData.totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Seller Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {successData.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.95rem",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className={`badge badge-${item.seller.toLowerCase()}`}>
                        {item.seller}
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>x{item.quantity}</span>
                    </span>
                    <span style={{ fontWeight: "600" }}>RM {item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {successData.notes && (
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border-color)",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  Notes: {successData.notes}
                </div>
              )}
            </div>

            <button
              onClick={() => setSuccessData(null)}
              className="btn-primary"
              style={{ padding: "12px" }}
            >
              Start New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
