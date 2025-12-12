import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db, getPlayer } from "../lib/firebase";
import type { Transaction, Player } from "../lib/types";

interface TransactionWithNames extends Omit<Transaction, "fromPlayerId" | "toPlayerId"> {
  fromPlayerId: string | "BANK";
  toPlayerId: string | "BANK";
  fromName: string;
  toName: string;
}

interface TransactionHistoryModalProps {
  onClose: () => void;
}

export default function TransactionHistoryModal({ onClose }: TransactionHistoryModalProps) {
  const [transactions, setTransactions] = useState<TransactionWithNames[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef, orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const transactionsData: TransactionWithNames[] = [];
      const playerCache: Map<string, Player | null> = new Map();

      // Función helper para obtener nombre del jugador
      const getPlayerName = async (playerId: string | "BANK"): Promise<string> => {
        if (playerId === "BANK") return "Banco";
        if (playerCache.has(playerId)) {
          const player = playerCache.get(playerId);
          return player?.name || "Jugador desconocido";
        }
        const player = await getPlayer(playerId);
        playerCache.set(playerId, player);
        return player?.name || "Jugador desconocido";
      };

      // Procesar transacciones
      const processTransactions = async () => {
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const fromName = await getPlayerName(data.fromPlayerId);
          const toName = await getPlayerName(data.toPlayerId);
          
          transactionsData.push({
            id: doc.id,
            fromPlayerId: data.fromPlayerId,
            toPlayerId: data.toPlayerId,
            amount: data.amount,
            type: data.type,
            timestamp: data.timestamp?.toDate() || new Date(),
            fromName,
            toName,
          });
        }
        setTransactions(transactionsData);
        setLoading(false);
      };

      processTransactions();
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Historial de Transacciones</h2>
          <button onClick={onClose} className="modal-close" aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : transactions.length === 0 ? (
            <div className="no-transactions">No hay transacciones aún</div>
          ) : (
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-header">
                    <div className="transaction-from">{transaction.fromName}</div>
                    <div className="transaction-arrow">→</div>
                    <div className="transaction-to">{transaction.toName}</div>
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-amount">${transaction.amount.toLocaleString()}</div>
                    <div className="transaction-time">{formatDate(transaction.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

