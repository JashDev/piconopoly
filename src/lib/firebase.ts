import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { DEFAULT_INITIAL_BALANCE } from "./gameConfig";
import type { GameConfig, Player } from "./types";

// Configuración de Firebase - se obtiene de variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

// Validar que todas las variables de entorno estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Error: Las variables de entorno de Firebase no están configuradas.");
  console.error("Por favor, crea un archivo .env con las credenciales de Firebase.");
  console.error("Puedes usar env.example como referencia.");
}

// Inicializar Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db: Firestore = getFirestore(app);

// Helpers para jugadores
export async function createPlayer(name: string): Promise<string> {
  const { collection, addDoc, serverTimestamp, query, where, getDocs } = await import("firebase/firestore");
  
  // Verificar que el nombre no exista
  const playersRef = collection(db, "players");
  const q = query(playersRef, where("name", "==", name.trim()));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error("Este nombre ya está en uso");
  }
  
  // Obtener el balance inicial desde Firestore
  const config = await getGameConfig();
  
  // Crear jugador con balance inicial
  const docRef = await addDoc(playersRef, {
    name: name.trim(),
    balance: config.initialBalance,
    createdAt: serverTimestamp(),
  });
  
  return docRef.id;
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  const { doc, getDoc } = await import("firebase/firestore");
  const playerRef = doc(db, "players", playerId);
  const playerSnap = await getDoc(playerRef);
  
  if (!playerSnap.exists()) {
    return null;
  }
  
  const data = playerSnap.data();
  return {
    id: playerSnap.id,
    name: data.name,
    balance: data.balance,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function updatePlayerBalance(playerId: string, newBalance: number): Promise<void> {
  const { doc, updateDoc } = await import("firebase/firestore");
  const playerRef = doc(db, "players", playerId);
  await updateDoc(playerRef, {
    balance: newBalance,
  });
}

// Helpers para transacciones
export async function createTransaction(
  fromPlayerId: string | "BANK",
  toPlayerId: string | "BANK",
  amount: number
): Promise<string> {
  const { collection, addDoc, serverTimestamp, runTransaction } = await import("firebase/firestore");
  
  // Determinar tipo de transacción
  let type: "player-to-player" | "player-to-bank" | "bank-to-player";
  if (fromPlayerId === "BANK") {
    type = "bank-to-player";
  } else if (toPlayerId === "BANK") {
    type = "player-to-bank";
  } else {
    type = "player-to-player";
  }
  
  // Usar transacción para asegurar consistencia
  return await runTransaction(db, async (transaction) => {
    const { doc } = await import("firebase/firestore");
    
    // PRIMERO: Hacer todas las lecturas
    let fromPlayerBalance: number | null = null;
    let toPlayerBalance: number | null = null;
    
    if (fromPlayerId !== "BANK") {
      const fromPlayerRef = doc(db, "players", fromPlayerId);
      const fromPlayerSnap = await transaction.get(fromPlayerRef);
      if (!fromPlayerSnap.exists()) {
        throw new Error("Jugador origen no encontrado");
      }
      const balance = fromPlayerSnap.data().balance;
      if (balance < amount) {
        throw new Error("Balance insuficiente");
      }
      fromPlayerBalance = balance;
    }
    
    if (toPlayerId !== "BANK") {
      const toPlayerRef = doc(db, "players", toPlayerId);
      const toPlayerSnap = await transaction.get(toPlayerRef);
      if (!toPlayerSnap.exists()) {
        throw new Error("Jugador destino no encontrado");
      }
      toPlayerBalance = toPlayerSnap.data().balance;
    }
    
    // SEGUNDO: Hacer todas las escrituras
    if (fromPlayerId !== "BANK") {
      if (fromPlayerBalance === null) {
        throw new Error("No se pudo obtener el balance del jugador origen");
      }
      const fromPlayerRef = doc(db, "players", fromPlayerId);
      transaction.update(fromPlayerRef, {
        balance: fromPlayerBalance - amount,
      });
    }
    
    if (toPlayerId !== "BANK") {
      if (toPlayerBalance === null) {
        throw new Error("No se pudo obtener el balance del jugador destino");
      }
      const toPlayerRef = doc(db, "players", toPlayerId);
      transaction.update(toPlayerRef, {
        balance: toPlayerBalance + amount,
      });
    }
    
    // Crear documento de transacción
    const transactionsRef = collection(db, "transactions");
    const transactionDocRef = doc(transactionsRef);
    transaction.set(transactionDocRef, {
      fromPlayerId,
      toPlayerId,
      amount,
      type,
      timestamp: serverTimestamp(),
    });
    
    return transactionDocRef.id;
  });
}

// Helper para obtener configuración del juego
export async function getGameConfig(): Promise<GameConfig> {
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const configRef = doc(db, "gameConfig", "main");
  const configSnap = await getDoc(configRef);
  
  if (!configSnap.exists()) {
    // Crear configuración inicial si no existe con el valor por defecto
    await setDoc(configRef, {
      initialBalance: DEFAULT_INITIAL_BALANCE,
    });
    return {
      initialBalance: DEFAULT_INITIAL_BALANCE,
    };
  }
  
  const data = configSnap.data();
  return {
    initialBalance: data.initialBalance || DEFAULT_INITIAL_BALANCE,
  };
}

// Helper para "Cobrar Vuelta de Banco" - ejecuta directamente sin confirmación
export async function processBankPass(
  requestedBy: string,
  amount: number
): Promise<void> {
  const { collection, runTransaction, serverTimestamp, doc, getDoc } = await import("firebase/firestore");
  
  // Verificar que el jugador que solicita existe
  const requestedPlayerRef = doc(db, "players", requestedBy);
  const requestedPlayerDoc = await getDoc(requestedPlayerRef);
  if (!requestedPlayerDoc.exists()) {
    throw new Error("El jugador que solicita no existe");
  }
  
  // Procesar pago directamente dentro de una transacción
  // El jugador que solicita es el único que recibe el dinero
  await runTransaction(db, async (transaction) => {
    // PRIMERO: Hacer todas las lecturas
    // Leer el balance del jugador que solicita (el que recibirá el dinero)
    const requestedPlayerSnap = await transaction.get(requestedPlayerRef);
    if (!requestedPlayerSnap.exists()) {
      throw new Error("El jugador que solicita no existe");
    }
    
    const currentBalance = requestedPlayerSnap.data().balance;
    
    // SEGUNDO: Hacer todas las escrituras
    // Dar dinero solo al jugador que solicitó
    const newBalance = currentBalance + amount;
    transaction.update(requestedPlayerRef, {
      balance: newBalance,
    });
    
    // Crear transacción
    const transactionsRef = collection(db, "transactions");
    const transactionDocRef = doc(transactionsRef);
    transaction.set(transactionDocRef, {
      fromPlayerId: "BANK",
      toPlayerId: requestedBy,
      amount: amount,
      type: "bank-to-player",
      timestamp: serverTimestamp(),
    });
  });
}

// Helper para resetear el juego
export async function resetGame(initialBalance?: number): Promise<void> {
  const { collection, getDocs, doc, deleteDoc, writeBatch, setDoc } = await import("firebase/firestore");
  
  const batch = writeBatch(db);
  
  // Eliminar todos los jugadores
  const playersRef = collection(db, "players");
  const playersSnap = await getDocs(playersRef);
  playersSnap.forEach((playerDoc) => {
    batch.delete(playerDoc.ref);
  });
  
  // Eliminar todas las transacciones
  const transactionsRef = collection(db, "transactions");
  const transactionsSnap = await getDocs(transactionsRef);
  transactionsSnap.forEach((transactionDoc) => {
    batch.delete(transactionDoc.ref);
  });
  
  // Eliminar todas las solicitudes de bank pass
  const bankPassRequestsRef = collection(db, "bankPassRequests");
  const bankPassRequestsSnap = await getDocs(bankPassRequestsRef);
  bankPassRequestsSnap.forEach((requestDoc) => {
    batch.delete(requestDoc.ref);
  });
  
  await batch.commit();
  
  // Si se proporciona un monto inicial, actualizar la configuración
  if (initialBalance !== undefined && initialBalance > 0) {
    const configRef = doc(db, "gameConfig", "main");
    await setDoc(configRef, {
      initialBalance: initialBalance,
    });
  }
}

