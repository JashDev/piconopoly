import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import TransactionHistoryModal from "./TransactionHistoryModal";
import RoomActionsModal from "./RoomActionsModal";
import TourGuide from "./TourGuide";

interface ActionBarProps {
  roomId: string | null;
  currentPlayerId?: string | null;
  onRoomExit?: () => void;
  isDemo?: boolean;
  tourSteps?: Array<{
    id: string;
    target: string;
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
  }>;
}

export default function ActionBar({ roomId, currentPlayerId, onRoomExit, isDemo = false, tourSteps }: ActionBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showRoomActions, setShowRoomActions] = useState(false);
  const [showTour, setShowTour] = useState(false);
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
          data-tour="history-button"
        >
          📜
        </button>
        <ThemeToggle />
        {isClient && roomId && (
          <button
            onClick={() => setShowRoomActions(true)}
            className="action-button"
            title="Acciones de sala"
            data-tour="room-actions-button"
          >
            🚪
          </button>
        )}
        {tourSteps && tourSteps.length > 0 && (
          <button
            onClick={() => setShowTour(true)}
            className="action-button"
            title="Ver tour guiado"
            data-tour="tour-button"
          >
            📖
          </button>
        )}
      </div>

      {showHistory && roomId && (
        <TransactionHistoryModal roomId={roomId} onClose={() => setShowHistory(false)} isDemo={isDemo} />
      )}

      {showRoomActions && roomId && (
        <RoomActionsModal 
          roomId={roomId}
          currentPlayerId={currentPlayerId}
          onClose={() => setShowRoomActions(false)}
          onRoomExit={onRoomExit}
        />
      )}

      {tourSteps && tourSteps.length > 0 && (
        <TourGuide
          steps={tourSteps}
          isActive={showTour}
          onClose={() => setShowTour(false)}
        />
      )}
    </>
  );
}

