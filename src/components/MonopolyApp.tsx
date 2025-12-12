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
import TourGuide from "./TourGuide";
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

  const gameTourSteps = [
    {
      id: "balance",
      target: ".player-balance-display",
      title: "Tu Balance",
      content: "Aquí puedes ver tu saldo actual en tiempo real. Se actualiza automáticamente cuando recibes o envías dinero.",
      position: "bottom" as const,
    },
    {
      id: "bank-button",
      target: ".bank-pass-card",
      title: "Cobrar del Banco",
      content: "Haz clic aquí para cobrar dinero directamente del banco. El banco tiene dinero infinito, así que puedes cobrar cualquier cantidad.",
      position: "bottom" as const,
    },
    {
      id: "free-parking-button",
      target: ".free-parking-card-button",
      title: "Cobrar de Parada Libre",
      content: "Este botón te permite cobrar el dinero acumulado en Parada Libre. Solo puedes cobrar si hay saldo disponible.",
      position: "bottom" as const,
    },
    {
      id: "player-list",
      target: ".player-list",
      title: "Lista de Jugadores",
      content: "Aquí puedes ver todos los jugadores y el banco. Los colores del borde indican el estado de su saldo: verde=OK, amarillo=warning, rojo=alert.",
      position: "top" as const,
    },
    {
      id: "how-to-pay",
      target: ".player-list",
      title: "Cómo Hacer un Pago",
      content: "Para pagar a otro jugador o al banco: 1) Haz clic en el jugador de la lista, 2) Se abrirá un modal, 3) Ingresa el monto, 4) Confirma el pago. ¡Es así de simple!",
      position: "top" as const,
    },
    {
      id: "free-parking-player",
      target: ".free-parking-card",
      title: "Parada Libre",
      content: "Parada Libre es un jugador especial que acumula dinero. Puedes pagarle y otros jugadores pueden cobrar de él. Su saldo siempre es visible.",
      position: "top" as const,
    },
    {
      id: "history-button",
      target: "[data-tour='history-button']",
      title: "Historial de Transacciones",
      content: "Haz clic en este botón (📜) para ver el historial completo de todas las transacciones de la sala. Verás quién pagó a quién, cuánto y cuándo ocurrió cada transacción.",
      position: "bottom" as const,
    },
    {
      id: "action-bar",
      target: ".action-bar",
      title: "Barra de Acciones",
      content: "Aquí encontrarás: historial (📜), cambio de tema (🌙/☀️), acciones de sala (🚪), y el tour guiado (📖).",
      position: "bottom" as const,
    },
  ];

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
        <ActionBar 
          roomId={null} 
          currentPlayerId={currentPlayerId} 
          onRoomExit={handleRoomExit}
          tourSteps={[
            {
              id: "welcome",
              target: ".room-selector h2",
              title: "¡Bienvenido a PICONOPOLY!",
              content: "Este es el sistema de pagos en tiempo real para Monopoly. Aquí puedes crear o unirte a salas de juego.",
              position: "bottom" as const,
            },
            {
              id: "create-room",
              target: "[data-tour='create-room']",
              title: "Crear Nueva Sala",
              content: "Haz clic aquí para crear una nueva sala de juego. Podrás configurar el nombre, contraseñas y el monto inicial para los jugadores.",
              position: "bottom" as const,
            },
            {
              id: "join-room",
              target: "[data-tour='join-room']",
              title: "Unirse a una Sala",
              content: "Si alguien te compartió una URL o ID de sala, haz clic aquí para unirte. Necesitarás el ID y la contraseña de la sala.",
              position: "bottom" as const,
            },
          ]}
        />
        <div className="app-header">
          <h1>PICONOPOLY</h1>
        </div>
        <RoomSelector 
          onRoomSelected={handleRoomSelected}
          tourSteps={[
            {
              id: "welcome",
              target: ".room-selector h2",
              title: "¡Bienvenido a PICONOPOLY!",
              content: "Este es el sistema de pagos en tiempo real para Monopoly. Aquí puedes crear o unirte a salas de juego.",
              position: "bottom" as const,
            },
            {
              id: "create-room",
              target: "[data-tour='create-room']",
              title: "Crear Nueva Sala",
              content: "Haz clic aquí para crear una nueva sala de juego. Podrás configurar el nombre, contraseñas y el monto inicial para los jugadores.",
              position: "bottom" as const,
            },
            {
              id: "join-room",
              target: "[data-tour='join-room']",
              title: "Unirse a una Sala",
              content: "Si alguien te compartió una URL o ID de sala, haz clic aquí para unirte. Necesitarás el ID y la contraseña de la sala.",
              position: "bottom" as const,
            },
          ]}
        />
      </div>
    );
  }

  // Si hay sala pero no hay jugador, mostrar formulario de registro
  if (!currentPlayerId || !currentPlayer) {
    return (
      <div className="app-container">
        <ActionBar 
          roomId={roomId} 
          currentPlayerId={currentPlayerId} 
          onRoomExit={handleRoomExit}
          tourSteps={gameTourSteps}
        />
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
      <ActionBar 
        roomId={roomId} 
        currentPlayerId={currentPlayerId}
        onRoomExit={handleRoomExit}
        tourSteps={gameTourSteps}
      />
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
            <div className="player-balance-display" data-tour="balance">
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

