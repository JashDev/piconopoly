import { useState, useEffect } from "react";
import { processFreeParkingPass, getFreeParkingPlayer } from "../lib/firebase";

interface FreeParkingButtonProps {
  currentPlayerId: string;
  roomId: string;
}

export default function FreeParkingButton({
  currentPlayerId,
  roomId,
}: FreeParkingButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [freeParkingBalance, setFreeParkingBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar el saldo de Parada Libre cuando se abre el modal
  useEffect(() => {
    if (showModal && roomId) {
      getFreeParkingPlayer(roomId).then((player) => {
        if (player) {
          setFreeParkingBalance(player.balance);
        } else {
          setFreeParkingBalance(0);
        }
      });
    }
  }, [showModal, roomId]);

  const handleConfirm = async () => {
    if (freeParkingBalance <= 0) {
      setError("Parada Libre no tiene saldo disponible");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await processFreeParkingPass(currentPlayerId, freeParkingBalance, roomId);
      setShowModal(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el cobro");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setShowModal(false);
      setError(null);
    }
  };

  return (
    <>
      <div
        className="bank-pass-card free-parking-card-button"
        onClick={() => setShowModal(true)}
        title="Cobrar de Parada Libre"
      >
        <div className="bank-icon">🅿️</div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cobrar de Parada Libre</h2>
              <button onClick={handleClose} className="modal-close" aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: "center", marginBottom: "var(--spacing-md)" }}>
                <p style={{ fontSize: "1rem", color: "var(--text-color)", marginBottom: "var(--spacing-sm)" }}>
                  Saldo acumulado en Parada Libre:
                </p>
                <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--success-color)", marginBottom: "var(--spacing-md)" }}>
                  ${freeParkingBalance.toLocaleString()}
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-light)" }}>
                  ¿Estás seguro de que deseas cobrar el total?
                </p>
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={handleConfirm} 
                  disabled={loading || freeParkingBalance <= 0}
                  style={{ flex: 1 }}
                >
                  {loading ? "Procesando..." : "Sí, cobrar total"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
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
      )}
    </>
  );
}

