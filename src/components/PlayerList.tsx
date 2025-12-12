import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, getGameConfig } from "../lib/firebase";
import { DEFAULT_INITIAL_BALANCE } from "../lib/gameConfig";

interface Player {
  id: string;
  name: string;
  balance: number;
}

interface PlayerListProps {
  currentPlayerId: string | null;
  roomId: string;
  onSelectRecipient: (recipientId: string | "BANK", recipientName: string) => void;
}

type BalanceStatus = "ok" | "warning" | "alert";

function getBalanceStatus(balance: number, initialBalance: number): BalanceStatus {
  const half = initialBalance / 2;
  const quarter = initialBalance / 4;
  
  if (balance >= half) return "ok";
  if (balance >= quarter) return "warning";
  return "alert";
}

export default function PlayerList({ 
  currentPlayerId,
  roomId,
  onSelectRecipient 
}: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [freeParkingPlayer, setFreeParkingPlayer] = useState<Player | null>(null);
  const [initialBalance, setInitialBalance] = useState<number>(DEFAULT_INITIAL_BALANCE);

  // Cargar configuración del juego
  useEffect(() => {
    if (roomId) {
      getGameConfig(roomId).then((config) => {
        setInitialBalance(config.initialBalance);
      });
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    
    // Suscribirse a cambios en tiempo real de jugadores (con balances para calcular estado)
    const playersRef = collection(db, "players");
    // Query sin orderBy para evitar problemas de índices, ordenamos en memoria
    const q = query(playersRef, where("roomId", "==", roomId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersData: Player[] = [];
      let freeParking: Player | null = null;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Separar Parada Libre de los demás jugadores
        if (data.name === "Parada Libre") {
          freeParking = {
            id: doc.id,
            name: data.name,
            balance: data.balance || 0,
          };
        } else if (doc.id !== currentPlayerId) {
          // Excluir al jugador actual de la lista
          playersData.push({
            id: doc.id,
            name: data.name,
            balance: data.balance || 0,
          });
        }
      });
      
      // Ordenar jugadores por fecha de creación en memoria
      playersData.sort((a, b) => {
        // Ordenar alfabéticamente si no hay fecha
        return a.name.localeCompare(b.name);
      });
      
      setPlayers(playersData);
      setFreeParkingPlayer(freeParking);
    }, (error) => {
      console.error("Error en PlayerList query:", error);
    });

    return () => unsubscribe();
  }, [currentPlayerId, roomId]);

  return (
    <div className="player-list">
      <h2>Jugadores</h2>
      <div className="players-grid">
        {/* Opción Banco */}
        <div
          className="player-card recipient-card"
          onClick={() => onSelectRecipient("BANK", "Banco")}
        >
          <div className="player-name">🏦 Banco</div>
        </div>
        
        {/* Lista de jugadores */}
        {players.map((player) => {
          const status = getBalanceStatus(player.balance, initialBalance);
          
          return (
            <div
              key={player.id}
              className={`player-card recipient-card status-${status}`}
              onClick={() => onSelectRecipient(player.id, player.name)}
            >
              <div className="player-name">{player.name}</div>
            </div>
          );
        })}
        
        {/* Parada Libre - con saldo visible, siempre al final */}
        {freeParkingPlayer && (
          <div
            className="player-card recipient-card free-parking-card"
            onClick={() => onSelectRecipient(freeParkingPlayer.id, freeParkingPlayer.name)}
          >
            <div className="player-name">🅿️ Parada Libre</div>
            <div className="player-balance" style={{ display: "block", marginTop: "var(--spacing-xs)" }}>
              ${freeParkingPlayer.balance.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

