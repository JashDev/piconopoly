import { useEffect, useState } from "react";
import ActionBar from "./ActionBar";
import TourGuide from "./TourGuide";

// Datos simulados para la demo
const DEMO_PLAYER = {
  id: "demo-player-1",
  name: "Tú (Demo)",
  balance: 2500,
};

const DEMO_PLAYERS: Array<{ id: string; name: string; balance: number; isSpecial?: boolean }> = [
  { id: "demo-player-2", name: "Jugador 1", balance: 3200 },
  { id: "demo-player-3", name: "Jugador 2", balance: 1800 },
  { id: "demo-player-4", name: "Jugador 3", balance: 4500 },
  { id: "BANK", name: "Banco", balance: 0 },
];

const DEMO_FREE_PARKING = {
  id: "demo-freeparking",
  name: "Parada Libre",
  balance: 500,
  isSpecial: true,
};

interface DemoRoomProps {
  onClose: () => void;
}

export default function DemoRoom({ onClose }: DemoRoomProps) {
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string | "BANK"; name: string } | null>(null);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Activar el tour automáticamente después de un pequeño delay
    const timer = setTimeout(() => {
      setShowTour(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleSelectRecipient = (recipient: { id: string | "BANK"; name: string }) => {
    setSelectedRecipient(recipient);
    setShowTransactionModal(true);
  };

  const handleCloseTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedRecipient(null);
  };

  // Combinar jugadores normales con Parada Libre
  const allPlayers = [...DEMO_PLAYERS, DEMO_FREE_PARKING];

  return (
    <div className="app-container">
      <ActionBar 
        roomId="demo-room" 
        currentPlayerId={DEMO_PLAYER.id}
        onRoomExit={onClose}
        isDemo={true}
        tourSteps={gameTourSteps}
      />
      <div className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: "var(--spacing-sm)" }}>
          <h1 style={{ margin: 0 }}>PICONOPOLY</h1>
          <button
            type="button"
            onClick={onClose}
            className="button-secondary"
            style={{ padding: "var(--spacing-xs) var(--spacing-sm)", fontSize: "0.875rem" }}
            title="Volver al inicio"
          >
            ← Volver
          </button>
        </div>
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-sm)", fontSize: "0.875rem", padding: "var(--spacing-xs)", backgroundColor: "var(--accent-color)", borderRadius: "var(--border-radius)", color: "white" }}>
          🎮 Modo Demo - Esta es una sala simulada para aprender cómo funciona
        </div>
        <div className="current-player-info">
          <div className="player-name-display">{DEMO_PLAYER.name}</div>
          <div className="header-balance-section">
            <div className="player-balance-display" data-tour="balance">
              ${DEMO_PLAYER.balance.toLocaleString()}
            </div>
            <div 
              className="bank-pass-card"
              style={{ 
                padding: "var(--spacing-sm)", 
                backgroundColor: "var(--card-bg)", 
                borderRadius: "var(--border-radius)",
                border: "2px solid var(--accent-color)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-xs)",
                minWidth: "60px",
                justifyContent: "center"
              }}
              onClick={() => alert("🎮 En una sala real, aquí podrías cobrar dinero del banco.")}
            >
              🏦
            </div>
            <div 
              className="free-parking-card-button"
              style={{ 
                padding: "var(--spacing-sm)", 
                backgroundColor: "var(--card-bg)", 
                borderRadius: "var(--border-radius)",
                border: "2px solid var(--secondary-color)",
                cursor: DEMO_FREE_PARKING.balance > 0 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-xs)",
                minWidth: "60px",
                justifyContent: "center",
                opacity: DEMO_FREE_PARKING.balance > 0 ? 1 : 0.5
              }}
              onClick={() => {
                if (DEMO_FREE_PARKING.balance > 0) {
                  alert(`🎮 En una sala real, aquí podrías cobrar $${DEMO_FREE_PARKING.balance.toLocaleString()} de Parada Libre.`);
                }
              }}
            >
              🅿️
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <section className="section">
          <div className="player-list">
            {allPlayers.map((player) => {
              if (player.id === DEMO_PLAYER.id) return null;
              
              const isFreeParking = player.isSpecial;
              const isBank = player.id === "BANK";
              
              // Calcular estado del saldo (simulado - usando 2500 como inicial)
              const initialBalance = 2500;
              const balanceRatio = player.balance / initialBalance;
              let statusClass = "";
              if (balanceRatio >= 0.5) {
                statusClass = "status-ok";
              } else if (balanceRatio >= 0.25) {
                statusClass = "status-warning";
              } else {
                statusClass = "status-alert";
              }

              if (isFreeParking) {
                return (
                  <div key={player.id} className={`player-card free-parking-card ${statusClass}`}>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-balance">${player.balance.toLocaleString()}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={player.id}
                  className={`player-card ${statusClass}`}
                  onClick={() => !isBank && handleSelectRecipient({ id: player.id, name: player.name })}
                  style={{ cursor: isBank ? "default" : "pointer" }}
                >
                  <div className="player-info">
                    <div className="player-name">{player.name}</div>
                    {!isBank && <div className="player-balance">Saldo: ${player.balance.toLocaleString()}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showTransactionModal && selectedRecipient && (
        <div className="modal-overlay" onClick={handleCloseTransactionModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pagar a {selectedRecipient.name}</h2>
              <button onClick={handleCloseTransactionModal} className="modal-close" aria-label="Cerrar">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--spacing-lg)" }}>
                🎮 Esta es una demostración. En una sala real, aquí podrías ingresar el monto y realizar el pago.
              </p>
              <div className="modal-actions">
                <button
                  onClick={handleCloseTransactionModal}
                  className="button-secondary"
                  style={{ width: "100%" }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TourGuide
        steps={gameTourSteps}
        isActive={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}

