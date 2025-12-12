import { useState, useEffect, useRef } from "react";

interface WelcomeTourProps {
  onClose: () => void;
}

export default function WelcomeTour({ onClose }: WelcomeTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tourButtonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Verificar si ya se mostró el tour de bienvenida
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcomeTour");
    
    if (!hasSeenWelcome) {
      let attempts = 0;
      const maxAttempts = 20; // Máximo 2 segundos de intentos
      
      const findTourButton = () => {
        const tourButton = document.querySelector('[data-tour="tour-button"]') as HTMLElement;
        if (tourButton) {
          tourButtonRef.current = tourButton;
          setIsVisible(true);
          // Scroll al botón si es necesario
          setTimeout(() => {
            tourButton.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(findTourButton, 100);
          }
        }
      };
      
      // Iniciar búsqueda después de un pequeño delay
      const timer = setTimeout(findTourButton, 300);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGotIt = () => {
    sessionStorage.setItem("hasSeenWelcomeTour", "true");
    setIsVisible(false);
    onClose();
  };

  if (!isVisible || !tourButtonRef.current) {
    return null;
  }

  const buttonRect = tourButtonRef.current.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    top: `${buttonRect.top + scrollTop + buttonRect.height + 10}px`,
    left: `${buttonRect.left + scrollLeft + buttonRect.width / 2}px`,
    transform: "translateX(-50%)",
    zIndex: 10001,
    maxWidth: window.innerWidth < 480 ? "90vw" : "320px",
  };

  return (
    <>
      {/* Overlay sutil */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 10000,
          animation: "fadeIn 0.3s ease",
        }}
        onClick={handleGotIt}
      >
        {/* Highlight del botón del tour */}
        {tourButtonRef.current && (
          <div
            style={{
              position: "absolute",
              top: `${buttonRect.top}px`,
              left: `${buttonRect.left}px`,
              width: `${buttonRect.width}px`,
              height: `${buttonRect.height}px`,
              border: "3px solid var(--accent-color)",
              borderRadius: "8px",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px rgba(74, 144, 226, 0.6)",
              pointerEvents: "none",
              zIndex: 10001,
              transition: "all 0.3s ease",
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        style={{
          ...tooltipStyle,
          backgroundColor: "var(--card-bg)",
          border: "2px solid var(--accent-color)",
          borderRadius: "12px",
          padding: window.innerWidth < 480 ? "var(--spacing-md) var(--spacing-sm)" : "var(--spacing-md)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          color: "var(--text-color)",
          animation: "slideIn 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "var(--spacing-sm)" }}>
          <h3 style={{ 
            margin: 0, 
            marginBottom: "var(--spacing-xs)", 
            fontSize: window.innerWidth < 480 ? "1rem" : "1.125rem", 
            fontWeight: "600",
            lineHeight: "1.3"
          }}>
            👋 ¡Bienvenido a PICONOPOLY!
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: window.innerWidth < 480 ? "0.8125rem" : "0.875rem", 
            color: "var(--text-secondary)", 
            lineHeight: "1.5" 
          }}>
            Haz clic en el botón <strong>📖 Tour</strong> para aprender cómo usar la aplicación paso a paso.
          </p>
        </div>
        <div style={{ 
          display: "flex", 
          justifyContent: "flex-end",
          marginTop: "var(--spacing-md)"
        }}>
          <button
            onClick={handleGotIt}
            style={{ 
              fontSize: "0.875rem", 
              padding: window.innerWidth < 480 ? "var(--spacing-sm) var(--spacing-md)" : "var(--spacing-xs) var(--spacing-sm)",
              minHeight: window.innerWidth < 480 ? "44px" : "auto",
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </>
  );
}

