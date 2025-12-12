import { useState, useEffect, useRef } from "react";

interface TourStep {
  id: string;
  target: string; // selector CSS del elemento a destacar
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface TourGuideProps {
  steps: TourStep[];
  isActive: boolean;
  onClose: () => void;
}

export default function TourGuide({ steps, isActive, onClose }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || steps.length === 0) {
      setHighlightedElement(null);
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // Máximo 5 segundos de intentos
    let timeoutId: NodeJS.Timeout;

    const updateHighlight = () => {
      const step = steps[currentStep];
      if (!step) return;

      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        // Pequeño delay para asegurar que el elemento esté renderizado
        timeoutId = setTimeout(() => {
          scrollToElement(element);
        }, 100);
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          // Si no se encuentra el elemento, intentar después de un delay
          timeoutId = setTimeout(updateHighlight, 100);
        } else {
          // Si después de varios intentos no se encuentra, avanzar al siguiente paso
          console.warn(`Elemento no encontrado: ${step.target}`);
          if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
          } else {
            onClose();
          }
        }
      }
    };

    updateHighlight();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, currentStep, steps.length]);

  const scrollToElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;
    const offset = 100; // Espacio adicional arriba

    window.scrollTo({
      top: elementTop - offset,
      behavior: "smooth",
    });
  };

  const getElementPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + scrollLeft + rect.width / 2,
      centerY: rect.top + scrollTop + rect.height / 2,
    };
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    setCurrentStep(0);
    setHighlightedElement(null);
    onClose();
  };

  const handleSkip = () => {
    handleFinish();
  };

  // Reset cuando se cierra
  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setHighlightedElement(null);
    }
  }, [isActive]);

  if (!isActive || steps.length === 0 || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const element = highlightedElement;

  // Calcular posición del tooltip
  let tooltipStyle: React.CSSProperties = {};
  if (element && overlayRef.current) {
    const pos = getElementPosition(element);
    const position = step.position || "bottom";

    const isMobile = window.innerWidth < 480;
    
    switch (position) {
      case "top":
        tooltipStyle = {
          top: `${pos.top - 10}px`,
          left: `${pos.left + pos.width / 2}px`,
          transform: "translate(-50%, -100%)",
          maxWidth: isMobile ? "90vw" : "320px",
        };
        break;
      case "bottom":
        tooltipStyle = {
          top: `${pos.top + pos.height + 10}px`,
          left: `${pos.left + pos.width / 2}px`,
          transform: "translateX(-50%)",
          maxWidth: isMobile ? "90vw" : "320px",
        };
        break;
      case "left":
        tooltipStyle = {
          top: `${pos.top + pos.height / 2}px`,
          left: `${pos.left - 10}px`,
          transform: "translate(-100%, -50%)",
          maxWidth: isMobile ? "90vw" : "280px",
        };
        break;
      case "right":
        tooltipStyle = {
          top: `${pos.top + pos.height / 2}px`,
          left: `${pos.left + pos.width + 10}px`,
          transform: "translateY(-50%)",
          maxWidth: isMobile ? "90vw" : "280px",
        };
        break;
      case "center":
        tooltipStyle = {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          maxWidth: isMobile ? "90vw" : "320px",
        };
        break;
    }

    // Ajustar para móviles - forzar posición bottom o top
    if (isMobile && position !== "center") {
      if (position === "left" || position === "right") {
        tooltipStyle.top = `${pos.top + pos.height + 10}px`;
        tooltipStyle.left = `${pos.left + pos.width / 2}px`;
        tooltipStyle.transform = "translateX(-50%)";
      }
    }
  }

  return (
    <>
      {/* Overlay oscuro */}
      <div
        ref={overlayRef}
        className="tour-overlay"
        onClick={handleNext}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 9998,
          cursor: "pointer",
        }}
      >
        {/* Highlight del elemento */}
        {element && (() => {
          const pos = getElementPosition(element);
          return (
            <div
              style={{
                position: "absolute",
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                width: `${pos.width}px`,
                height: `${pos.height}px`,
                border: "3px solid var(--accent-color)",
                borderRadius: "8px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 20px rgba(74, 144, 226, 0.5)",
                pointerEvents: "none",
                zIndex: 9999,
                transition: "all 0.3s ease",
              }}
            />
          );
        })()}
      </div>

      {/* Tooltip */}
      {element && (
        <div
          ref={tooltipRef}
          className="tour-tooltip"
          style={{
            ...tooltipStyle,
            position: "fixed",
            backgroundColor: "var(--card-bg)",
            border: "2px solid var(--accent-color)",
            borderRadius: "12px",
            padding: "var(--spacing-md)",
            zIndex: 10000,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            color: "var(--text-color)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: "var(--spacing-sm)" }}>
            <h3 style={{ margin: 0, marginBottom: "var(--spacing-xs)", fontSize: "1.125rem", fontWeight: "600" }}>
              {step.title}
            </h3>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {step.content}
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--spacing-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>
              {currentStep + 1} / {steps.length}
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-xs)" }}>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="button-secondary"
                  style={{ fontSize: "0.875rem", padding: "var(--spacing-xs) var(--spacing-sm)" }}
                >
                  ← Anterior
                </button>
              )}
              <button
                onClick={handleSkip}
                className="button-secondary"
                style={{ fontSize: "0.875rem", padding: "var(--spacing-xs) var(--spacing-sm)" }}
              >
                Saltar
              </button>
              <button
                onClick={handleNext}
                style={{ fontSize: "0.875rem", padding: "var(--spacing-xs) var(--spacing-sm)" }}
              >
                {currentStep === steps.length - 1 ? "Finalizar" : "Siguiente →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

