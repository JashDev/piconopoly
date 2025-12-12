import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, getGameConfig } from "../lib/firebase";
import { DEFAULT_INITIAL_BALANCE } from "../lib/gameConfig";

interface Player {
  id: string;
  name: string;
  balance: number;
}

interface PlayerListProps {
  currentPlayerId: string | null;
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
  onSelectRecipient 
}: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(DEFAULT_INITIAL_BALANCE);

  // Cargar configuración del juego
  useEffect(() => {
    getGameConfig().then((config) => {
      setInitialBalance(config.initialBalance);
    });
  }, []);

  useEffect(() => {
    // Suscribirse a cambios en tiempo real de jugadores (con balances para calcular estado)
    const playersRef = collection(db, "players");
    const q = query(playersRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersData: Player[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Excluir al jugador actual de la lista
        if (doc.id !== currentPlayerId) {
          playersData.push({
            id: doc.id,
            name: data.name,
            balance: data.balance || 0,
          });
        }
      });
      setPlayers(playersData);
    });

    return () => unsubscribe();
  }, [currentPlayerId]);

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
      </div>
    </div>
  );
}

