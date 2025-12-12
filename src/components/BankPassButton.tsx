import { useState } from "react";
import { processBankPass } from "../lib/firebase";

interface BankPassButtonProps {
  currentPlayerId: string;
  roomId: string;
}

export default function BankPassButton({
  currentPlayerId,
  roomId,
}: BankPassButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setLoading(true);
    try {
      await processBankPass(currentPlayerId, amountNum, roomId);
      setAmount("");
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
      setAmount("");
      setError(null);
    }
  };

  return (
    <>
      <div
        className="bank-pass-card"
        onClick={() => setShowModal(true)}
        title="Cobrar del Banco"
      >
        <div className="bank-icon">🏦</div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cobrar del Banco</h2>
              <button onClick={handleClose} className="modal-close" aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="bank-pass-amount">Monto a cobrar:</label>
                  <input
                    id="bank-pass-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    disabled={loading}
                    required
                    autoFocus
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="modal-actions">
                  <button type="submit" disabled={loading || !amount}>
                    {loading ? "Procesando..." : "Cobrar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
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
      )}
    </>
  );
}

