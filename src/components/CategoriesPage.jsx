import React, { useState } from "react";
import { Link } from "react-router-dom";

function CategoriesPage({ categories, addCategory, editCategory, deleteCategory, bulkDeleteCategories, searchQuery = "" }) {
  const [newCat, setNewCat] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

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

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCategories.map(c => c.id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} categories? \nAll sub-items will also be deleted.`)) {
      bulkDeleteCategories(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Stock Categories</h2>
          <p>Manage your stock categories. Click a category name to view its items.</p>
        </div>
        {selectedIds.length > 0 && (
          <button className="btn btn-danger" onClick={handleBulkDelete}>
            🗑️ Delete Selected ({selectedIds.length})
          </button>
        )}
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
                <th style={{ width: "40px" }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredCategories.length && filteredCategories.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>#</th>
                <th>Category Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat, index) => {
                const isEditing = editingId === cat.id;
                const isSelected = selectedIds.includes(cat.id);
                return (
                  <tr key={cat.id} className={isSelected ? "row-selected" : ""}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(cat.id)}
                      />
                    </td>
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
                        <Link
                          to={`/inventory/${cat.name.toLowerCase()}`}
                          style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
                        >
                          {cat.name}
                        </Link>
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
                                if (window.confirm(`Are you sure you want to delete "${cat.name}"? \nits sub categories will also delete`)) {
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
