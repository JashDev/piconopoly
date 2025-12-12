import { useState, useEffect } from "react";
import { deleteRoom, verifyRoomAdminPassword, resetGame, getGameConfig, deletePlayer } from "../lib/firebase";
import { DEFAULT_INITIAL_BALANCE } from "../lib/gameConfig";

interface RoomActionsModalProps {
  roomId: string;
  currentPlayerId?: string | null;
  onClose: () => void;
  onRoomExit?: () => void;
}

export default function RoomActionsModal({ roomId, currentPlayerId, onClose, onRoomExit }: RoomActionsModalProps) {
  const [password, setPassword] = useState("");
  const [initialBalance, setInitialBalance] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Cargar el monto inicial actual
  useEffect(() => {
    if (roomId && showResetConfirm) {
      getGameConfig(roomId).then((config) => {
        setInitialBalance(config.initialBalance.toString());
      });
    }
  }, [roomId, showResetConfirm]);

  const handleExitRoom = async () => {
    // Eliminar el jugador de Firestore si existe
    if (currentPlayerId) {
      try {
        await deletePlayer(currentPlayerId);
      } catch (error) {
        console.error("Error al eliminar jugador:", error);
        // Continuar con la limpieza local aunque falle la eliminación en Firestore
      }
    }
    
    // Limpiar sessionStorage
    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("playerId");
    
    // Llamar callback si existe
    if (onRoomExit) {
      onRoomExit();
    } else {
      // Recargar página si no hay callback
      window.location.reload();
    }
  };

  const handleDeleteRoom = async () => {
    setError(null);
    
    if (!password.trim()) {
      setError("La contraseña de administración es requerida");
      return;
    }

    setLoading(true);
    
    try {
      // Verificar contraseña de administración
      const isValid = await verifyRoomAdminPassword(roomId, password.trim());
      if (!isValid) {
        setError("Contraseña de administración incorrecta");
        setLoading(false);
        return;
      }

      await deleteRoom(roomId);
      // Limpiar sessionStorage
      sessionStorage.removeItem("roomId");
      sessionStorage.removeItem("playerId");
      // Recargar página
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la sala");
      setLoading(false);
    }
  };

  const handleResetRoom = async () => {
    setError(null);

    if (!password.trim()) {
      setError("La contraseña de administración es requerida");
      return;
    }

    setLoading(true);
    try {
      // Verificar contraseña de administración
      const isValid = await verifyRoomAdminPassword(roomId, password.trim());
      if (!isValid) {
        setError("Contraseña de administración incorrecta");
        setLoading(false);
        return;
      }

      const balanceNum = initialBalance ? parseFloat(initialBalance) : undefined;
      if (balanceNum !== undefined && (isNaN(balanceNum) || balanceNum <= 0)) {
        setError("El monto inicial debe ser mayor a 0");
        setLoading(false);
        return;
      }

      const balanceText = balanceNum ? ` con monto inicial de $${balanceNum.toLocaleString()}` : "";
      if (
        !confirm(
          `¿Estás seguro de que quieres resetear todo el juego${balanceText}? Esta acción no se puede deshacer.`
        )
      ) {
        setLoading(false);
        return;
      }

      await resetGame(roomId, balanceNum);
      // Limpiar sessionStorage del jugador actual
      sessionStorage.removeItem("playerId");
      // Recargar la página
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resetear el juego");
      setLoading(false);
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Eliminar Sala</h2>
            <button onClick={onClose} className="modal-close" aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: "var(--spacing-md)", color: "var(--text-color)" }}>
              ¿Estás seguro de que quieres eliminar esta sala? Esta acción eliminará:
            </p>
            <ul style={{ marginBottom: "var(--spacing-md)", paddingLeft: "var(--spacing-lg)", color: "var(--text-color)" }}>
              <li>Todos los jugadores</li>
              <li>Todas las transacciones</li>
              <li>La configuración del juego</li>
              <li>La sala misma</li>
            </ul>
            <p style={{ marginBottom: "var(--spacing-md)", color: "var(--danger-color)", fontWeight: "600" }}>
              Esta acción no se puede deshacer.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); handleDeleteRoom(); }}>
              <div className="form-group">
                <label htmlFor="delete-password">Contraseña de administración:</label>
                <input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de administración"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="button-danger"
                >
                  {loading ? "Eliminando..." : "Sí, Eliminar Sala"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setError(null);
                    setPassword("");
                  }}
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

  if (showResetConfirm) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Resetear Sala</h2>
            <button onClick={onClose} className="modal-close" aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => { e.preventDefault(); handleResetRoom(); }}>
              <div className="form-group">
                <label htmlFor="reset-password">Contraseña de administración:</label>
                <input
                  id="reset-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña de administración de la sala"
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
                  onClick={() => {
                    setShowResetConfirm(false);
                    setError(null);
                    setPassword("");
                    setInitialBalance("");
                  }}
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Acciones de Sala</h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="modal-actions" style={{ flexDirection: "column", gap: "var(--spacing-md)" }}>
            <button
              type="button"
              onClick={handleExitRoom}
              className="button-secondary"
              style={{ width: "100%" }}
            >
              Salir de la Sala
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="button-danger"
              style={{ width: "100%" }}
            >
              Resetear Sala
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="button-danger"
              style={{ width: "100%" }}
            >
              Eliminar Sala
            </button>
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
              style={{ width: "100%" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

