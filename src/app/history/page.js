"use client";

import { useState, useEffect } from "react";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [search, setSearch] = useState("");
  const [seller, setSeller] = useState("All");
  const [dateType, setDateType] = useState("all"); // 'all', 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState("");

  // Editing state
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Load transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let dateParam = dateType;
      if (dateType === "custom") {
        dateParam = customDate;
      }

      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (seller !== "All") params.append("seller", seller);
      if (dateParam && dateParam !== "all") params.append("date", dateParam);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError("Error loading transactions. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const delayDebounce = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, seller, dateType, customDate]);

  // Handle Delete
  const handleDelete = async (id) => {
    setDeletingLoading(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTransactions(transactions.filter((tx) => tx.id !== id));
        setDeletingId(null);
      } else {
        alert("Failed to delete transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting transaction");
    } finally {
      setDeletingLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (tx) => {
    setEditingTransaction(tx);
    // Deep copy items
    setEditItems(
      tx.items.map((i) => ({
        id: i.id,
        seller: i.seller,
        quantity: i.quantity,
        amount: i.amount.toString(),
      }))
    );
    setEditNotes(tx.notes || "");
    setEditError("");
  };

  // Edit Modal Handlers
  const handleAddEditItem = () => {
    setEditItems([
      ...editItems,
      { id: Date.now(), seller: "Nadia", quantity: 1, amount: "" },
    ]);
  };

  const handleRemoveEditItem = (id) => {
    if (editItems.length > 1) {
      setEditItems(editItems.filter((i) => i.id !== id));
    }
  };

  const handleUpdateEditItem = (id, field, value) => {
    setEditItems(
      editItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handlePresetEditAmount = (id, presetValue) => {
    setEditItems(
      editItems.map((item) => {
        if (item.id === id) {
          const currentAmount = parseFloat(item.amount) || 0;
          return { ...item, amount: (currentAmount + presetValue).toString() };
        }
        return item;
      })
    );
  };

  const saveEditTransaction = async () => {
    setEditSaving(true);
    setEditError("");

    const formattedItems = [];
    for (const item of editItems) {
      const parsedQty = parseInt(item.quantity);
      const parsedAmt = parseFloat(item.amount);

      if (isNaN(parsedQty) || parsedQty <= 0) {
        setEditError("All items must have a quantity of 1 or more.");
        setEditSaving(false);
        return;
      }

      if (isNaN(parsedAmt) || parsedAmt <= 0) {
        setEditError("All items must have an amount greater than RM0.");
        setEditSaving(false);
        return;
      }

      formattedItems.push({
        seller: item.seller,
        quantity: parsedQty,
        amount: parsedAmt,
      });
    }

    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: formattedItems,
          notes: editNotes,
        }),
      });

      if (res.ok) {
        setEditingTransaction(null);
        fetchTransactions(); // reload list
      } else {
        const data = await res.json();
        setEditError(data.error || "Failed to update transaction");
      }
    } catch (err) {
      setEditError("An error occurred during save.");
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div>
      <h1>Transaction History</h1>

      {/* Filter panel */}
      <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Search */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Search notes/IDs</label>
          <input
            type="text"
            className="form-input"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {/* Seller Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Seller</label>
            <select
              className="form-input"
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              style={{ minHeight: "48px", background: "#0b0f19" }}
            >
              <option value="All">All Sellers</option>
              <option value="Nadia">Nadia</option>
              <option value="Ainina">Ainina</option>
              <option value="Afrina">Afrina</option>
            </select>
          </div>

          {/* Date Range Preset */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date Filter</label>
            <select
              className="form-input"
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              style={{ minHeight: "48px", background: "#0b0f19" }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom Date</option>
            </select>
          </div>
        </div>

        {/* Custom date input if selected */}
        {dateType === "custom" && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Choose Date</label>
            <input
              type="date"
              className="form-input"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Transaction List */}
      {error && (
        <div style={{ color: "var(--color-danger)", padding: "12px", textAlign: "center" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>Loading transactions...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>No transactions found.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {transactions.map((tx) => (
            <div key={tx.id} className="glass-card" style={{ margin: 0, padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: "8px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {new Date(tx.createdAt).toLocaleString("en-MY", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Kuala_Lumpur",
                    })}
                  </div>
                  <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                    ID: {tx.id.substring(0, 8)}...
                  </div>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-success)" }}>
                  RM {tx.totalAmount.toFixed(2)}
                </div>
              </div>

              {/* Items list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                {tx.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className={`badge badge-${item.seller.toLowerCase()}`}>{item.seller}</span>
                      <span style={{ color: "var(--text-muted)" }}>x{item.quantity}</span>
                    </span>
                    <span style={{ fontWeight: "600" }}>RM {item.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {tx.notes && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    backgroundColor: "rgba(0,0,0,0.15)",
                    padding: "8px 12px",
                    borderRadius: "var(--border-radius-sm)",
                    marginBottom: "12px",
                  }}
                >
                  📝 {tx.notes}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => openEditModal(tx)}
                  className="btn-secondary"
                  style={{ flex: 1, minHeight: "36px", fontSize: "0.85rem", padding: 0 }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setDeletingId(tx.id)}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    minHeight: "36px",
                    fontSize: "0.85rem",
                    color: "var(--color-danger)",
                    background: "rgba(244,63,94,0.05)",
                    borderColor: "rgba(244,63,94,0.15)",
                    padding: 0,
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: "center", maxWidth: "360px" }}>
            <span style={{ fontSize: "3rem" }}>⚠️</span>
            <h2 style={{ marginTop: "12px", marginBottom: "8px" }}>Are you sure?</h2>
            <p style={{ marginBottom: "20px" }}>
              This will permanently delete this transaction from records. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="btn-secondary"
                onClick={() => setDeletingId(null)}
                disabled={deletingLoading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => handleDelete(deletingId)}
                disabled={deletingLoading}
                style={{ flex: 1, backgroundColor: "var(--color-danger)", boxShadow: "none" }}
              >
                {deletingLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <h2>Edit Transaction</h2>

            {editError && (
              <div
                style={{
                  backgroundColor: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid var(--color-danger)",
                  color: "var(--color-danger)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "10px",
                  marginBottom: "12px",
                  fontWeight: "600",
                }}
              >
                ⚠️ {editError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
              {editItems.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.25)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--border-radius-sm)",
                    padding: "12px",
                    position: "relative",
                  }}
                >
                  {editItems.length > 1 && (
                    <button
                      onClick={() => handleRemoveEditItem(item.id)}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        color: "var(--color-danger)",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        width: "24px",
                        height: "24px",
                        minHeight: "auto",
                      }}
                    >
                      ✕
                    </button>
                  )}

                  <div style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "6px" }}>
                    Item #{idx + 1}
                  </div>

                  {/* Seller */}
                  <div className="form-group" style={{ marginBottom: "8px" }}>
                    <div className="segmented-control" style={{ marginBottom: 0 }}>
                      <div
                        onClick={() => handleUpdateEditItem(item.id, "seller", "Nadia")}
                        className={`segmented-btn ${item.seller === "Nadia" ? "active-nadia" : ""}`}
                        style={{ padding: "6px" }}
                      >
                        Nadia
                      </div>
                      <div
                        onClick={() => handleUpdateEditItem(item.id, "seller", "Ainina")}
                        className={`segmented-btn ${item.seller === "Ainina" ? "active-ainina" : ""}`}
                        style={{ padding: "6px" }}
                      >
                        Ainina
                      </div>
                      <div
                        onClick={() => handleUpdateEditItem(item.id, "seller", "Afrina")}
                        className={`segmented-btn ${item.seller === "Afrina" ? "active-afrina" : ""}`}
                        style={{ padding: "6px" }}
                      >
                        Afrina
                      </div>
                    </div>
                  </div>

                  {/* Qty & Price */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "2px" }}>
                        Qty
                      </label>
                      <div className="stepper" style={{ minHeight: "36px", maxWidth: "100%" }}>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() =>
                            handleUpdateEditItem(
                              item.id,
                              "quantity",
                              Math.max(1, (parseInt(item.quantity) || 1) - 1)
                            )
                          }
                          style={{ minHeight: "36px" }}
                        >
                          −
                        </button>
                        <div className="stepper-value" style={{ fontSize: "0.95rem" }}>
                          {item.quantity}
                        </div>
                        <button
                          type="button"
                          className="stepper-btn"
                          onClick={() =>
                            handleUpdateEditItem(
                              item.id,
                              "quantity",
                              (parseInt(item.quantity) || 0) + 1
                            )
                          }
                          style={{ minHeight: "36px" }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "2px" }}>
                        Amount (RM)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="0.00"
                        value={item.amount}
                        onChange={(e) => handleUpdateEditItem(item.id, "amount", e.target.value)}
                        style={{ minHeight: "36px", padding: "4px 8px", fontSize: "1rem" }}
                      />
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="preset-grid" style={{ marginTop: "6px" }}>
                    <button type="button" onClick={() => handlePresetEditAmount(item.id, 5)} className="preset-btn" style={{ minHeight: "26px" }}>+RM5</button>
                    <button type="button" onClick={() => handlePresetEditAmount(item.id, 10)} className="preset-btn" style={{ minHeight: "26px" }}>+RM10</button>
                    <button type="button" onClick={() => handlePresetEditAmount(item.id, 20)} className="preset-btn" style={{ minHeight: "26px" }}>+RM20</button>
                    <button type="button" onClick={() => handlePresetEditAmount(item.id, 50)} className="preset-btn" style={{ minHeight: "26px" }}>+RM50</button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddEditItem}
              className="btn-secondary"
              style={{ marginBottom: "16px", padding: "10px", minHeight: "40px" }}
            >
              ➕ Add Item
            </button>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Transaction notes"
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                className="btn-secondary"
                onClick={() => setEditingTransaction(null)}
                disabled={editSaving}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={saveEditTransaction}
                disabled={editSaving}
                style={{ flex: 1 }}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
