import React, { useState } from "react";

function CategoriesPage({ categories, addCategory, editCategory, deleteCategory, setActiveTab, searchQuery = "" }) {
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const filteredCategories = categories.filter((cat) =>
    (cat.name || "").toLowerCase().includes((searchQuery || "").toLowerCase())
  );

  const isSearching = searchQuery.length > 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newCat.trim()) {
      addCategory(newCat.trim());
      setNewCat("");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Stock Categories</h2>
        <p>Manage your stock categories. Click a category name to view its items.</p>
      </div>

      <div className="form-section">
        <h3>Add New Category</h3>
        <form className="form-grid" onSubmit={handleAdd}>
          <div className="form-group">
            <label>Category Name</label>
            <input
              className="form-input"
              placeholder="e.g. Mangoes"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: "0 0 auto" }}>
            <label>&nbsp;</label>
            <button type="submit" className="btn btn-primary">➕ Add Category</button>
          </div>
        </form>
      </div>

      <h3 className="section-title">Current Categories</h3>

      {filteredCategories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{isSearching ? "🔍" : "📁"}</div>
          <p>
            {isSearching 
              ? `No categories matching "${searchQuery}" found.`
              : `No categories yet. Add your first stock category above.`
            }
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Category Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat, index) => {
                const isEditing = editingId === cat.id;
                return (
                  <tr key={cat.id}>
                    <td style={{ color: "var(--text-muted)" }}>{index + 1}</td>

                    {/* Category Name */}
                    <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                      {isEditing ? (
                        <input
                          className="form-input"
                          style={{ padding: "4px 8px", width: "100%" }}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                      ) : (
                        <span
                          style={{ cursor: "pointer" }}
                          onClick={() => setActiveTab(`inventory-${cat.name.toLowerCase()}`)}
                        >
                          {cat.name}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isEditing ? (
                          <>
                            <button
                              className="btn btn-success"
                              style={{ padding: "6px 10px" }}
                              onClick={() => {
                                editCategory(cat.id, editName);
                                setEditingId(null);
                              }}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "6px 10px" }}
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn"
                              style={{ padding: "6px 10px", background: "var(--info-bg)", color: "var(--info)" }}
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditName(cat.name);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: "6px 10px" }}
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${cat.name}"? Its items will be moved to General.`)) {
                                  deleteCategory(cat.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;
