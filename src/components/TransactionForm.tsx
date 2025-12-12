import { useState } from "react";
import { createTransaction } from "../lib/firebase";

interface TransactionFormProps {
  currentPlayerId: string;
  currentPlayerBalance: number;
  selectedRecipient: string | "BANK" | null;
}

export default function TransactionForm({
  currentPlayerId,
  currentPlayerBalance,
  selectedRecipient,
}: TransactionFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRecipient) {
      setError("Selecciona un destinatario");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    if (amountNum > currentPlayerBalance) {
      setError("No tienes suficiente balance");
      return;
    }

    setLoading(true);
    try {
      await createTransaction(currentPlayerId, selectedRecipient, amountNum);
      setAmount("");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al realizar la transacción");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transaction-form">
      <h2>Realizar Transacción</h2>
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

        <button
          type="submit"
          disabled={loading || !amount || !selectedRecipient}
        >
          {loading ? "Enviando..." : "Enviar Dinero"}
        </button>
      </form>
    </div>
  );
}

