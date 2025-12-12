import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import TransactionHistoryModal from "./TransactionHistoryModal";
import RoomActionsModal from "./RoomActionsModal";

interface ActionBarProps {
  roomId: string | null;
  currentPlayerId?: string | null;
  onRoomExit?: () => void;
}

export default function ActionBar({ roomId, currentPlayerId, onRoomExit }: ActionBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showRoomActions, setShowRoomActions] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <div className="action-bar">
        <button
          onClick={isClient && roomId ? () => setShowHistory(true) : undefined}
          className="action-button"
          title="Ver historial"
          disabled={!isClient || !roomId}
        >
          📜
        </button>
        <ThemeToggle />
        <button
          onClick={isClient && roomId ? () => setShowRoomActions(true) : undefined}
          className="action-button"
          title="Acciones de sala"
          disabled={!isClient || !roomId}
        >
          🚪
        </button>
      </div>

      {showHistory && roomId && (
        <TransactionHistoryModal roomId={roomId} onClose={() => setShowHistory(false)} />
      )}

      {showRoomActions && roomId && (
        <RoomActionsModal 
          roomId={roomId}
          currentPlayerId={currentPlayerId}
          onClose={() => setShowRoomActions(false)}
          onRoomExit={onRoomExit}
        />
      )}
    </>
  );
}

