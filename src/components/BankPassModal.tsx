import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db, confirmBankPassRequest, rejectBankPassRequest } from "../lib/firebase";
import type { BankPassRequest } from "../lib/types";

interface BankPassModalProps {
  currentPlayerId: string;
}

export default function BankPassModal({ currentPlayerId }: BankPassModalProps) {
  const [pendingRequest, setPendingRequest] = useState<BankPassRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Suscribirse a solicitudes pendientes
    const requestsRef = collection(db, "bankPassRequests");
    const q = query(
      requestsRef,
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Buscar la solicitud más reciente que no sea del jugador actual
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.requestedBy !== currentPlayerId) {
          // Verificar que el jugador actual no haya respondido ya
          const confirmations = data.confirmations || [];
          const rejections = data.rejections || [];
          if (
            !confirmations.includes(currentPlayerId) &&
            !rejections.includes(currentPlayerId)
          ) {
            setPendingRequest({
              id: doc.id,
              requestedBy: data.requestedBy,
              requestedByName: data.requestedByName,
              amount: data.amount,
              status: data.status,
              confirmations: confirmations,
              rejections: rejections,
              createdAt: data.createdAt?.toDate() || new Date(),
            });
            return;
          }
        }
      }
      // Si no hay solicitudes pendientes para este jugador, limpiar
      setPendingRequest(null);
    });

    return () => unsubscribe();
  }, [currentPlayerId]);

  const handleConfirm = async () => {
    if (!pendingRequest) return;
    setLoading(true);
    try {
      await confirmBankPassRequest(pendingRequest.id, currentPlayerId);
    } catch (err) {
      console.error("Error al confirmar:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!pendingRequest) return;
    setLoading(true);
    try {
      await rejectBankPassRequest(pendingRequest.id, currentPlayerId);
    } catch (err) {
      console.error("Error al rechazar:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!pendingRequest) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmar Cobro de Banco</h2>
        <div className="modal-body">
          <p>
            <strong>{pendingRequest.requestedByName}</strong> solicita que todos los
            jugadores (excepto él/ella) cobren <strong>${pendingRequest.amount.toLocaleString()}</strong> del banco.
          </p>
          <p className="modal-question">
            ¿Debes cobrar realmente este monto del banco?
          </p>
        </div>
        <div className="modal-actions">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="button-confirm"
          >
            {loading ? "Procesando..." : "Sí, debo cobrar"}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="button-reject"
          >
            {loading ? "Procesando..." : "No, no debo cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

