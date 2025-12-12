import { useState } from "react";
import { resetGame } from "../lib/firebase";

const RESET_PASSWORD = "jash101293";

export default function ResetGameButton() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== RESET_PASSWORD) {
      setError("Contraseña incorrecta");
      return;
    }

    if (
      !confirm(
        "¿Estás seguro de que quieres resetear todo el juego? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await resetGame();
      // Limpiar sessionStorage del jugador actual
      sessionStorage.removeItem("playerId");
      // Recargar la página
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al resetear el juego");
      setLoading(false);
    }
  };

  if (showPasswordForm) {
    return (
      <div className="reset-game-form">
        <h3>Resetear Juego</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-password">Contraseña:</label>
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
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="submit" disabled={loading || !password} className="button-danger">
              {loading ? "Reseteando..." : "Resetear Todo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(false);
                setPassword("");
                setError(null);
              }}
              disabled={loading}
              className="button-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPasswordForm(true)}
      className="reset-game-button"
    >
      Resetear Juego
    </button>
  );
}

