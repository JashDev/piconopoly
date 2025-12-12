import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import TransactionHistoryModal from "./TransactionHistoryModal";
import AdminModal from "./AdminModal";

export default function ActionBar() {
  const [showHistory, setShowHistory] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <>
      <div className="action-bar">
        <button
          onClick={() => setShowHistory(true)}
          className="action-button"
          title="Ver historial"
        >
          📜
        </button>
        <ThemeToggle />
        <button
          onClick={() => setShowAdmin(true)}
          className="action-button"
          title="Administración"
        >
          ⚙️
        </button>
      </div>

      {showHistory && (
        <TransactionHistoryModal onClose={() => setShowHistory(false)} />
      )}

      {showAdmin && (
        <AdminModal onClose={() => setShowAdmin(false)} />
      )}
    </>
  );
}

