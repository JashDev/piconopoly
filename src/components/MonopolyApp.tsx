import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, getPlayer, deletePlayer } from "../lib/firebase";
import type { Player } from "../lib/types";
import ActionBar from "./ActionBar";
import BankPassButton from "./BankPassButton";
import FreeParkingButton from "./FreeParkingButton";
import PaymentNotification from "./PaymentNotification";
import PlayerList from "./PlayerList";
import RegisterForm from "./RegisterForm";
import RoomSelector from "./RoomSelector";
import TransactionModal from "./TransactionModal";
import { getRoom } from "../lib/firebase";

export default function MonopolyApp() {
  const [roomId, setRoomId] = useState<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem("roomId") : null
  );
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem("playerId") : null
  );
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string | "BANK"; name: string } | null>(null);

  // Cargar nombre de la sala
  useEffect(() => {
    if (roomId) {
      getRoom(roomId).then((room) => {
        if (room) {
          setRoomName(room.name);
        }
      });
    }
  }, [roomId]);

  const handleRoomSelected = (selectedRoomId: string) => {
    setRoomId(selectedRoomId);
      // Si hay un jugador pero de otra sala, limpiarlo
      if (currentPlayerId) {
        sessionStorage.removeItem("playerId");
        setCurrentPlayerId(null);
        setCurrentPlayer(null);
      }
  };

  // Cargar información del jugador actual
  useEffect(() => {
    if (currentPlayerId && roomId) {
      setLoading(true);
      getPlayer(currentPlayerId)
        .then((player) => {
          if (player) {
            // Verificar que el jugador pertenece a la sala actual
            if (player.roomId === roomId) {
              setCurrentPlayer(player);
            } else {
              // Jugador de otra sala, limpiar
              sessionStorage.removeItem("playerId");
              setCurrentPlayerId(null);
              setCurrentPlayer(null);
            }
          } else {
            // Jugador no existe, limpiar sessionStorage
            sessionStorage.removeItem("playerId");
            setCurrentPlayerId(null);
          }
        })
        .catch(() => {
          sessionStorage.removeItem("playerId");
          setCurrentPlayerId(null);
        })
        .finally(() => setLoading(false));
    }
  }, [currentPlayerId, roomId]);

  // Suscribirse a cambios del jugador actual en tiempo real
  useEffect(() => {
    if (!currentPlayerId || !roomId) return;

    const playerRef = doc(db, "players", currentPlayerId);
    const unsubscribe = onSnapshot(playerRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Verificar que pertenece a la sala actual
        if (data.roomId === roomId) {
          setCurrentPlayer({
            id: snapshot.id,
            name: data.name,
            balance: data.balance,
            roomId: data.roomId,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        } else {
          // Jugador de otra sala
          sessionStorage.removeItem("playerId");
          setCurrentPlayerId(null);
          setCurrentPlayer(null);
        }
      } else {
        // Jugador fue eliminado (sala reseteada)
        sessionStorage.removeItem("playerId");
        setCurrentPlayerId(null);
        setCurrentPlayer(null);
      }
    });

    return () => unsubscribe();
  }, [currentPlayerId, roomId]);

  // Monitorear si la sala existe y si fue reseteada
  useEffect(() => {
    if (!roomId) return;

    // Verificar que la sala existe en tiempo real
    const roomRef = doc(db, "rooms", roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        // La sala fue eliminada
        sessionStorage.removeItem("roomId");
        sessionStorage.removeItem("playerId");
        setRoomId(null);
        setCurrentPlayerId(null);
        setCurrentPlayer(null);
        return;
      }
    });

    // Verificar si la sala fue reseteada (no hay jugadores) usando listener en tiempo real
    const playersRef = collection(db, "players");
    const playersQuery = query(playersRef, where("roomId", "==", roomId));
    const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
      // Si no hay jugadores y había un jugador actual, la sala fue reseteada
      if (snapshot.empty && currentPlayerId) {
        sessionStorage.removeItem("playerId");
        setCurrentPlayerId(null);
        setCurrentPlayer(null);
      }
    });

    return () => {
      unsubscribeRoom();
      unsubscribePlayers();
    };
  }, [roomId, currentPlayerId]);

  const handleRegister = (playerId: string) => {
    sessionStorage.setItem("playerId", playerId);
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

  const handleRoomExit = async () => {
    // Eliminar el jugador de Firestore si existe
    if (currentPlayerId) {
      try {
        await deletePlayer(currentPlayerId);
      } catch (error) {
        console.error("Error al eliminar jugador:", error);
        // Continuar con la limpieza local aunque falle la eliminación en Firestore
      }
    }
    
    sessionStorage.removeItem("roomId");
    sessionStorage.removeItem("playerId");
    setRoomId(null);
    setCurrentPlayerId(null);
    setCurrentPlayer(null);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  // Si no hay sala seleccionada, mostrar selector de salas
  if (!roomId) {
    return (
      <div className="app-container">
        <ActionBar roomId={null} currentPlayerId={currentPlayerId} onRoomExit={handleRoomExit} />
        <div className="app-header">
          <h1>PICONOPOLY</h1>
        </div>
        <RoomSelector onRoomSelected={handleRoomSelected} />
      </div>
    );
  }

  // Si hay sala pero no hay jugador, mostrar formulario de registro
  if (!currentPlayerId || !currentPlayer) {
    return (
      <div className="app-container">
        <ActionBar roomId={roomId} currentPlayerId={currentPlayerId} onRoomExit={handleRoomExit} />
        <div className="app-header">
          <h1>PICONOPOLY</h1>
        </div>
        <RegisterForm roomId={roomId} onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <PaymentNotification currentPlayerId={currentPlayerId} roomId={roomId} />
      <ActionBar roomId={roomId} onRoomExit={handleRoomExit} />
      <div className="app-header">
        <h1>PICONOPOLY</h1>
        {roomName && (
          <div style={{ textAlign: "center", marginBottom: "var(--spacing-sm)", fontSize: "0.875rem", color: "var(--text-light)" }}>
            Sala: {roomName}
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("room", roomId);
                navigator.clipboard.writeText(url.toString());
                alert("URL de la sala copiada. Compártela para que otros se unan.");
              }}
              style={{
                marginLeft: "var(--spacing-xs)",
                background: "transparent",
                border: "none",
                color: "var(--accent-color)",
                cursor: "pointer",
                fontSize: "0.875rem",
                textDecoration: "underline",
              }}
              title="Copiar URL de la sala"
            >
              📋 Compartir
            </button>
          </div>
        )}
        <div className="current-player-info">
          <div className="player-name-display">{currentPlayer.name}</div>
          <div className="header-balance-section">
            <div className="player-balance-display">
              ${currentPlayer.balance.toLocaleString()}
            </div>
            <BankPassButton currentPlayerId={currentPlayerId} roomId={roomId} />
            <FreeParkingButton currentPlayerId={currentPlayerId} roomId={roomId} />
          </div>
        </div>
      </div>

      <div className="main-content">
        <section className="section">
          <PlayerList 
            currentPlayerId={currentPlayerId}
            roomId={roomId}
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
          roomId={roomId}
          onClose={handleCloseTransactionModal}
        />
      )}
    </div>
  );
}

