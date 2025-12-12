import { useState, useEffect } from "react";
import { resetGame, getGameConfig } from "../lib/firebase";
import { DEFAULT_INITIAL_BALANCE } from "../lib/gameConfig";

const RESET_PASSWORD = "jash101293";

interface AdminModalProps {
  onClose: () => void;
}

export default function AdminModal({ onClose }: AdminModalProps) {
  const [password, setPassword] = useState("");
  const [initialBalance, setInitialBalance] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el monto inicial actual
  useEffect(() => {
    getGameConfig().then((config) => {
      setInitialBalance(config.initialBalance.toString());
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== RESET_PASSWORD) {
      setError("Contraseña incorrecta");
      return;
    }

    const balanceNum = initialBalance ? parseFloat(initialBalance) : undefined;
    if (balanceNum !== undefined && (isNaN(balanceNum) || balanceNum <= 0)) {
      setError("El monto inicial debe ser mayor a 0");
      return;
    }

    const balanceText = balanceNum ? ` con monto inicial de $${balanceNum.toLocaleString()}` : "";
    if (
      !confirm(
        `¿Estás seguro de que quieres resetear todo el juego${balanceText}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await resetGame(balanceNum);
      // Limpiar localStorage del jugador actual
      localStorage.removeItem("playerId");
      // Recargar la página
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resetear el juego");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Administración</h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-password">Contraseña para resetear:</label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                disabled={loading}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="initial-balance">
                Monto inicial para nuevos jugadores (opcional):
              </label>
              <input
                id="initial-balance"
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder={DEFAULT_INITIAL_BALANCE.toString()}
                min="1"
                step="1"
                disabled={loading}
              />
              <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-light)", fontSize: "0.875rem" }}>
                Si no se especifica, se usará el monto actual configurado ({DEFAULT_INITIAL_BALANCE} por defecto)
              </small>
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading || !password} className="button-danger">
                {loading ? "Reseteando..." : "Resetear Todo"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="button-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

