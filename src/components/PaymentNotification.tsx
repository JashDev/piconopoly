import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db, getPlayer } from "../lib/firebase";
import type { Transaction } from "../lib/types";

interface PaymentNotificationProps {
  currentPlayerId: string;
}

interface Notification {
  id: string;
  fromName: string;
  amount: number;
}

export default function PaymentNotification({ currentPlayerId }: PaymentNotificationProps) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const seenTransactionIdsRef = useRef<Set<string>>(new Set());
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!currentPlayerId) return;

    // Resetear las transacciones vistas cuando cambia el jugador
    seenTransactionIdsRef.current = new Set();

    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef, orderBy("timestamp", "desc"), limit(10));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const docSnap of snapshot.docs) {
        const transactionId = docSnap.id;
        
        // Si ya vimos esta transacción, saltarla
        if (seenTransactionIdsRef.current.has(transactionId)) {
          continue;
        }

        const data = docSnap.data();
        const transaction: Transaction = {
          id: transactionId,
          fromPlayerId: data.fromPlayerId,
          toPlayerId: data.toPlayerId,
          amount: data.amount,
          type: data.type,
          timestamp: data.timestamp?.toDate() || new Date(),
        };

        // Solo mostrar notificación si el jugador actual es el destinatario
        // y no es del banco (ya que el banco tiene su propio flujo)
        if (
          transaction.toPlayerId === currentPlayerId &&
          transaction.fromPlayerId !== "BANK" &&
          transaction.type === "player-to-player"
        ) {
          // Obtener nombre del jugador que envió
          const fromPlayer = await getPlayer(transaction.fromPlayerId);
          const fromName = fromPlayer?.name || "Jugador desconocido";

          setNotification({
            id: transactionId,
            fromName,
            amount: transaction.amount,
          });

          // Marcar como vista
          seenTransactionIdsRef.current.add(transactionId);

          // Lanzar confetti
          triggerConfetti();

          // Auto-cerrar después de 5 segundos
          setTimeout(() => {
            setNotification(null);
          }, 5000);
        } else {
          // Marcar como vista aunque no sea para este jugador
          seenTransactionIdsRef.current.add(transactionId);
        }
      }
    });

    return () => unsubscribe();
  }, [currentPlayerId]);

  const triggerConfetti = () => {
    // Limpiar canvas anterior si existe
    if (confettiCanvasRef.current && confettiCanvasRef.current.parentNode) {
      confettiCanvasRef.current.parentNode.removeChild(confettiCanvasRef.current);
      confettiCanvasRef.current = null;
    }

    // Crear nuevo canvas para confetti
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);
    confettiCanvasRef.current = canvas;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ajustar tamaño del canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#48bb78", "#4299e1", "#ed8936", "#f56565", "#9f7aea", "#fbbf24"];
    const confetti: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    // Crear partículas de confetti desde el centro superior
    const centerX = canvas.width / 2;
    for (let i = 0; i < 150; i++) {
      confetti.push({
        x: centerX + (Math.random() - 0.5) * 200,
        y: -10,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = confetti.length - 1; i >= 0; i--) {
        const particle = confetti[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.15; // gravedad
        particle.rotation += particle.rotationSpeed;

        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.rect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.fill();
        ctx.restore();

        if (particle.y > canvas.height + 50) {
          confetti.splice(i, 1);
        }
      }

      if (confetti.length > 0) {
        animationId = requestAnimationFrame(animate);
      } else {
        // Limpiar canvas cuando termine
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (confettiCanvasRef.current && confettiCanvasRef.current.parentNode) {
          confettiCanvasRef.current.parentNode.removeChild(confettiCanvasRef.current);
          confettiCanvasRef.current = null;
        }
      }
    };

    animate();
  };

  if (!notification) return null;

  return (
    <div className="payment-notification">
      <div className="payment-notification-content">
        <div className="payment-notification-icon">💰</div>
        <div className="payment-notification-text">
          <div className="payment-notification-title">¡Recibiste un pago!</div>
          <div className="payment-notification-message">
            <strong>{notification.fromName}</strong> te pagó{" "}
            <strong className="payment-amount">${notification.amount.toLocaleString()}</strong>
          </div>
        </div>
        <button
          className="payment-notification-close"
          onClick={() => setNotification(null)}
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

