import { useState } from "react";
import { deleteAllData, verifySuperAdminPassword } from "../lib/firebase";
import "../styles/global.css";

export default function SuperAdminPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const isValid = await verifySuperAdminPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setError("Contraseña incorrecta");
      }
    } catch (err) {
      setError("Error al verificar la contraseña");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Verificar contraseña nuevamente antes de eliminar
      const isValid = await verifySuperAdminPassword(deletePassword);
      if (!isValid) {
        setError("Contraseña incorrecta. Operación cancelada.");
        setConfirmDelete(false);
        setDeletePassword("");
        setLoading(false);
        return;
      }

      await deleteAllData();
      alert("✅ Todos los datos han sido eliminados exitosamente.");
      setConfirmDelete(false);
      setDeletePassword("");
      setIsAuthenticated(false);
    } catch (err) {
      setError("Error al eliminar los datos: " + (err instanceof Error ? err.message : "Error desconocido"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmDelete(false);
    setDeletePassword("");
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
          <h2 style={{ marginBottom: "var(--spacing-md)", textAlign: "center" }}>Super Administrador</h2>
          <p style={{ marginBottom: "var(--spacing-lg)", color: "var(--text-secondary)", textAlign: "center", fontSize: "0.875rem" }}>
            Ingresa la contraseña de super administrador para continuar
          </p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña"
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="error-message" style={{ marginBottom: "var(--spacing-md)" }}>
                {error}
              </div>
            )}
            <div className="form-actions">
              <button type="submit" disabled={loading} className="button-danger" style={{ width: "100%" }}>
                {loading ? "Verificando..." : "Ingresar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ minHeight: "100vh", padding: "var(--spacing-lg)" }}>
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "var(--spacing-md)", textAlign: "center", color: "var(--danger-color)" }}>
          ⚠️ Super Administrador
        </h2>
        <p style={{ marginBottom: "var(--spacing-lg)", color: "var(--text-secondary)", textAlign: "center" }}>
          Esta acción eliminará <strong>TODOS</strong> los datos de Firestore:
        </p>
        <ul style={{ marginBottom: "var(--spacing-lg)", paddingLeft: "var(--spacing-lg)", color: "var(--text-secondary)" }}>
          <li>Todas las salas</li>
          <li>Todos los jugadores</li>
          <li>Todas las transacciones</li>
          <li>Todas las configuraciones</li>
          <li>Todas las solicitudes de banco</li>
        </ul>
        <p style={{ marginBottom: "var(--spacing-lg)", color: "var(--danger-color)", textAlign: "center", fontWeight: "600" }}>
          ⚠️ Esta acción NO se puede deshacer
        </p>

        {!confirmDelete ? (
          <>
            <div className="form-actions">
              <button
                onClick={handleDeleteAll}
                className="button-danger"
                style={{ width: "100%" }}
              >
                Eliminar Todos los Datos
              </button>
              <button
                onClick={() => {
                  setIsAuthenticated(false);
                  setError(null);
                }}
                className="button-secondary"
                style={{ width: "100%" }}
              >
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="delete-password">Confirma tu contraseña para eliminar</label>
              <input
                type="password"
                id="delete-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Ingresa la contraseña nuevamente"
                required
                autoFocus
              />
            </div>
            {error && (
              <div className="error-message" style={{ marginBottom: "var(--spacing-md)" }}>
                {error}
              </div>
            )}
            <div className="form-actions">
              <button
                onClick={handleDeleteAll}
                disabled={loading || !deletePassword}
                className="button-danger"
                style={{ width: "100%" }}
              >
                {loading ? "Eliminando..." : "⚠️ Confirmar Eliminación"}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="button-secondary"
                style={{ width: "100%" }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

