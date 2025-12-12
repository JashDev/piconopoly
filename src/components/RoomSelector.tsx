import { useState, useEffect } from "react";
import { createRoom, verifyRoomPassword, getRoom } from "../lib/firebase";
import { DEFAULT_INITIAL_BALANCE } from "../lib/gameConfig";
import SuperAdminModal from "./SuperAdminModal";

interface RoomSelectorProps {
  onRoomSelected: (roomId: string) => void;
}

export default function RoomSelector({ onRoomSelected }: RoomSelectorProps) {
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [initialBalance, setInitialBalance] = useState<string>(DEFAULT_INITIAL_BALANCE.toString());
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);

  // Detectar si hay un ID de sala en la URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const roomIdFromUrl = urlParams.get("room");
      if (roomIdFromUrl) {
        setRoomId(roomIdFromUrl);
        setMode("join");
        // Limpiar el parámetro de la URL sin recargar
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("room");
        window.history.replaceState({}, "", newUrl.toString());
      }
    }
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roomName.trim()) {
      setError("El nombre de la sala es requerido");
      return;
    }

    if (!password.trim()) {
      setError("La contraseña es requerida");
      return;
    }

    if (!adminPassword.trim()) {
      setError("La contraseña de administración es requerida");
      return;
    }

    const balanceNum = parseFloat(initialBalance);
    if (isNaN(balanceNum) || balanceNum <= 0) {
      setError("El monto inicial debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      // Usar un ID temporal para createdBy (podría mejorarse con autenticación)
      const newRoomId = await createRoom(roomName.trim(), password.trim(), adminPassword.trim(), "system", balanceNum);
      sessionStorage.setItem("roomId", newRoomId);
      onRoomSelected(newRoomId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la sala");
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!roomId.trim()) {
      setError("El ID de la sala es requerido");
      return;
    }

    if (!password.trim()) {
      setError("La contraseña es requerida");
      return;
    }

    setLoading(true);
    try {
      // Verificar que la sala existe
      const room = await getRoom(roomId.trim());
      if (!room) {
        setError("La sala no existe");
        setLoading(false);
        return;
      }

      // Verificar contraseña
      const isValid = await verifyRoomPassword(roomId.trim(), password.trim());
      if (!isValid) {
        setError("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("roomId", roomId.trim());
      onRoomSelected(roomId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al unirse a la sala");
      setLoading(false);
    }
  };

  if (mode === "create") {
    return (
      <div className="room-selector">
        <h2>Crear Nueva Sala</h2>
        <form onSubmit={handleCreateRoom}>
          <div className="form-group">
            <label htmlFor="room-name">Nombre de la sala:</label>
            <input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Ej: Partida de Jueves"
              disabled={loading}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="create-password">Contraseña para ingresar:</label>
            <input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña para ingresar a la sala"
              disabled={loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="admin-password">Contraseña de administración:</label>
            <input
              id="admin-password"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Para resetear o eliminar la sala"
              disabled={loading}
              required
            />
            <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-light)", fontSize: "0.875rem" }}>
              Esta contraseña se usará para resetear o eliminar la sala
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="initial-balance">Monto inicial para jugadores:</label>
            <input
              id="initial-balance"
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder={DEFAULT_INITIAL_BALANCE.toString()}
              min="1"
              step="1"
              disabled={loading}
              required
            />
            <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-light)", fontSize: "0.875rem" }}>
              Monto que recibirán los jugadores al registrarse ({DEFAULT_INITIAL_BALANCE} por defecto)
            </small>
          </div>
          {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="submit" disabled={loading || !roomName || !password || !adminPassword || !initialBalance}>
                {loading ? "Creando..." : "Crear Sala"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("select");
                  setRoomName("");
                  setPassword("");
                  setAdminPassword("");
                  setInitialBalance(DEFAULT_INITIAL_BALANCE.toString());
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

  if (mode === "join") {
    return (
      <div className="room-selector">
        <h2>Unirse a una Sala</h2>
        <form onSubmit={handleJoinRoom}>
          <div className="form-group">
            <label htmlFor="room-id">ID de la sala:</label>
            <input
              id="room-id"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Pega el ID de la sala aquí"
              disabled={loading}
              required
              autoFocus
            />
            <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-light)", fontSize: "0.875rem" }}>
              El ID se genera al crear la sala
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="join-password">Contraseña:</label>
            <input
              id="join-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña de la sala"
              disabled={loading}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="submit" disabled={loading || !roomId || !password}>
              {loading ? "Uniéndose..." : "Unirse"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("select");
                setRoomId("");
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
    <div className="room-selector">
      <h2>Seleccionar Sala</h2>
      <p style={{ marginBottom: "var(--spacing-lg)", color: "var(--text-secondary)", textAlign: "center" }}>
        Crea una nueva sala o únete a una existente
      </p>
      <div className="form-actions" style={{ flexDirection: "column", gap: "var(--spacing-md)" }}>
        <button
          type="button"
          onClick={() => setMode("create")}
          style={{ width: "100%" }}
        >
          Crear Nueva Sala
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className="button-secondary"
          style={{ width: "100%" }}
        >
          Unirse a una Sala
        </button>
        <button
          type="button"
          onClick={() => setShowSuperAdmin(true)}
          className="button-danger"
          style={{ width: "100%", marginTop: "var(--spacing-lg)" }}
          title="Super Admin - Eliminar todos los datos"
        >
          🔴 Super Admin
        </button>
      </div>
      
      {showSuperAdmin && (
        <SuperAdminModal onClose={() => setShowSuperAdmin(false)} />
      )}
    </div>
  );
}

