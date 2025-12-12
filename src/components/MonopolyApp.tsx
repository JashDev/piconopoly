import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, getPlayer } from "../lib/firebase";
import type { Player } from "../lib/types";
import ActionBar from "./ActionBar";
import BankPassButton from "./BankPassButton";
import PaymentNotification from "./PaymentNotification";
import PlayerList from "./PlayerList";
import RegisterForm from "./RegisterForm";
import TransactionModal from "./TransactionModal";

export default function MonopolyApp() {
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("playerId") : null
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string | "BANK"; name: string } | null>(null);

  // Cargar información del jugador actual
  useEffect(() => {
    if (currentPlayerId) {
      setLoading(true);
      getPlayer(currentPlayerId)
        .then((player) => {
          if (player) {
            setCurrentPlayer(player);
          } else {
            // Jugador no existe, limpiar localStorage
            localStorage.removeItem("playerId");
            setCurrentPlayerId(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("playerId");
          setCurrentPlayerId(null);
        })
        .finally(() => setLoading(false));
    }
  }, [currentPlayerId]);

  // Suscribirse a cambios del jugador actual en tiempo real
  useEffect(() => {
    if (!currentPlayerId) return;

    const playerRef = doc(db, "players", currentPlayerId);
    const unsubscribe = onSnapshot(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCurrentPlayer({
          id: snapshot.id,
          name: data.name,
          balance: data.balance,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      }
    });

    return () => unsubscribe();
  }, [currentPlayerId]);

  const handleRegister = (playerId: string) => {
    localStorage.setItem("playerId", playerId);
    setCurrentPlayerId(playerId);
  };

  const handleSelectRecipient = (recipientId: string | "BANK", recipientName: string) => {
    setSelectedRecipient({ id: recipientId, name: recipientName });
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedRecipient(null);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (!currentPlayerId || !currentPlayer) {
    return (
      <div className="app-container">
        <ActionBar />
        <div className="app-header">
          <h1>PICONOPOLY</h1>
        </div>
        <RegisterForm onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <PaymentNotification currentPlayerId={currentPlayerId} />
      <ActionBar />
      <div className="app-header">
        <h1>PICONOPOLY</h1>
        <div className="current-player-info">
          <div className="player-name-display">{currentPlayer.name}</div>
          <div className="header-balance-section">
            <div className="player-balance-display">
              ${currentPlayer.balance.toLocaleString()}
            </div>
            <BankPassButton currentPlayerId={currentPlayerId} />
          </div>
        </div>
      </div>

      <div className="main-content">
        <section className="section">
          <PlayerList 
            currentPlayerId={currentPlayerId}
            onSelectRecipient={handleSelectRecipient}
          />
        </section>
      </div>

      {showTransactionModal && selectedRecipient && (
        <TransactionModal
          currentPlayerId={currentPlayerId}
          currentPlayerBalance={currentPlayer.balance}
          recipientId={selectedRecipient.id}
          recipientName={selectedRecipient.name}
          onClose={handleCloseTransactionModal}
        />
      )}
    </div>
  );
}

