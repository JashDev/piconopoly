import { useState } from "react";
import { createTransaction } from "../lib/firebase";

interface TransactionModalProps {
  currentPlayerId: string;
  currentPlayerBalance: number;
  recipientId: string | "BANK";
  recipientName: string;
  roomId: string;
  onClose: () => void;
}

export default function TransactionModal({
  currentPlayerId,
  currentPlayerBalance,
  recipientId,
  recipientName,
  roomId,
  onClose,
}: TransactionModalProps) {
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

    if (recipientId !== "BANK" && amountNum > currentPlayerBalance) {
      setError("No tienes suficiente balance");
      return;
    }

    setLoading(true);
    try {
      await createTransaction(currentPlayerId, recipientId, amountNum, roomId);
      setAmount("");
      setError(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al realizar la transacción");
    } finally {
      setLoading(false);
    }
  };

  const isBank = recipientId === "BANK";
  const actionText = isBank ? "Pagar al" : "Enviar a";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{actionText} {recipientName}</h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="amount">Monto:</label>
              <input
                id="amount"
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
              <button
                type="submit"
                disabled={loading || !amount}
              >
                {loading ? "Procesando..." : isBank ? "Pagar" : "Enviar Dinero"}
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

