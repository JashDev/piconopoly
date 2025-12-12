import { useState } from "react";
import { createPlayer } from "../lib/firebase";

interface RegisterFormProps {
  onRegister: (playerId: string) => void;
}

export default function RegisterForm({ onRegister }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Por favor ingresa un nombre");
      return;
    }

    setLoading(true);
    try {
      const playerId = await createPlayer(name.trim());
      onRegister(playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar jugador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-form">
      <h2>Registrarse</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ingresa tu nombre"
            disabled={loading}
            autoFocus
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading || !name.trim()}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}

