import { useState } from "react";
import { deleteAllData, verifySuperAdminPassword } from "../lib/firebase";

interface SuperAdminModalProps {
  onClose: () => void;
}

export default function SuperAdminModal({ onClose }: SuperAdminModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError("La contraseña es requerida");
      return;
    }

    setLoading(true);
    try {
      // Verificar contraseña
      const isValid = await verifySuperAdminPassword(password.trim());
      if (!isValid) {
        setError("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      // Mostrar confirmación
      setShowConfirm(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al verificar contraseña");
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setError(null);
    setLoading(true);
    
    try {
      await deleteAllData();
      // Limpiar sessionStorage
      sessionStorage.clear();
      // Recargar página
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar todos los datos");
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>⚠️ Confirmar Eliminación Total</h2>
            <button onClick={onClose} className="modal-close" aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: "var(--spacing-md)", color: "var(--text-color)", fontWeight: "600" }}>
              ¿Estás ABSOLUTAMENTE SEGURO de que quieres eliminar TODOS los datos?
            </p>
            <ul style={{ marginBottom: "var(--spacing-md)", paddingLeft: "var(--spacing-lg)", color: "var(--text-color)" }}>
              <li>Todas las salas</li>
              <li>Todos los jugadores</li>
              <li>Todas las transacciones</li>
              <li>Todas las configuraciones</li>
              <li>Todas las solicitudes de bank pass</li>
            </ul>
            <p style={{ marginBottom: "var(--spacing-md)", color: "var(--danger-color)", fontWeight: "700", fontSize: "1.1rem" }}>
              ⚠️ Esta acción NO SE PUEDE DESHACER ⚠️
            </p>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="button-danger"
                style={{ flex: 1 }}
              >
                {loading ? "Eliminando..." : "Sí, Eliminar TODO"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setError(null);
                }}
                disabled={loading}
                className="button-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔴 Super Administrador</h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: "var(--spacing-md)", color: "var(--text-color)" }}>
            Esta función eliminará <strong>TODOS</strong> los datos de Firestore:
          </p>
          <ul style={{ marginBottom: "var(--spacing-md)", paddingLeft: "var(--spacing-lg)", color: "var(--text-color)" }}>
            <li>Todas las salas</li>
            <li>Todos los jugadores</li>
            <li>Todas las transacciones</li>
            <li>Todas las configuraciones</li>
            <li>Todas las solicitudes</li>
          </ul>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="super-admin-password">Contraseña de Super Admin:</label>
              <input
                id="super-admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña de super admin"
                disabled={loading}
                autoFocus
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button type="submit" disabled={loading || !password} className="button-danger">
                {loading ? "Verificando..." : "Continuar"}
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

