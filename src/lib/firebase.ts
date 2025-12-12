import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { DEFAULT_INITIAL_BALANCE } from "./gameConfig";
import type { GameConfig, Player, Room } from "./types";

// Función simple para hashear contraseñas (en producción usar algo más seguro)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
if (typeof window !== "undefined" && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
  console.error("❌ Error: Las variables de entorno de Firebase no están configuradas.");
  console.error("Por favor, configura las variables de entorno en Vercel o crea un archivo .env");
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

// Helpers para salas
export async function createRoom(
  name: string, 
  password: string,
  adminPassword: string,
  createdBy: string,
  initialBalance: number = DEFAULT_INITIAL_BALANCE
): Promise<string> {
  const { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } = await import("firebase/firestore");
  
  // Verificar que el nombre no exista
  const roomsRef = collection(db, "rooms");
  const q = query(roomsRef, where("name", "==", name.trim()));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error("Este nombre de sala ya está en uso");
  }
  
  // Validar monto inicial
  if (initialBalance <= 0) {
    throw new Error("El monto inicial debe ser mayor a 0");
  }
  
  // Hashear las contraseñas
  const passwordHash = await hashPassword(password);
  const adminPasswordHash = await hashPassword(adminPassword);
  
  // Crear sala
  const docRef = await addDoc(roomsRef, {
    name: name.trim(),
    passwordHash,
    adminPasswordHash,
    createdBy,
    createdAt: serverTimestamp(),
  });
  
  const roomId = docRef.id;
  
  // Crear configuración del juego para esta sala con el monto inicial
  const configRef = doc(db, "gameConfig", roomId);
  await setDoc(configRef, {
    initialBalance: initialBalance,
    roomId,
  });
  
  // Crear jugador especial "Parada Libre" para esta sala
  const playersRef = collection(db, "players");
  await addDoc(playersRef, {
    name: "Parada Libre",
    balance: 0,
    roomId,
    createdAt: serverTimestamp(),
    isSpecial: true, // Marcar como jugador especial
  });
  
  return roomId;
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const { doc, getDoc } = await import("firebase/firestore");
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) {
    return null;
  }
  
  const data = roomSnap.data();
  return {
    id: roomSnap.id,
    name: data.name,
    passwordHash: data.passwordHash,
    adminPasswordHash: data.adminPasswordHash,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

export async function verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room) {
    return false;
  }
  
  const passwordHash = await hashPassword(password);
  return room.passwordHash === passwordHash;
}

export async function verifyRoomAdminPassword(roomId: string, adminPassword: string): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room) {
    return false;
  }
  
  const adminPasswordHash = await hashPassword(adminPassword);
  return room.adminPasswordHash === adminPasswordHash;
}

// Helpers para jugadores
export async function createPlayer(name: string, roomId: string): Promise<string> {
  const { collection, addDoc, serverTimestamp, query, where, getDocs } = await import("firebase/firestore");
  
  // Verificar que el nombre no exista en la sala
  const playersRef = collection(db, "players");
  const q = query(playersRef, where("name", "==", name.trim()), where("roomId", "==", roomId));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error("Este nombre ya está en uso en esta sala");
  }
  
  // Obtener el balance inicial desde Firestore
  const config = await getGameConfig(roomId);
  
  // Crear jugador con balance inicial
  const docRef = await addDoc(playersRef, {
    name: name.trim(),
    balance: config.initialBalance,
    roomId,
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
    roomId: data.roomId,
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

export async function deletePlayer(playerId: string): Promise<void> {
  const { doc, deleteDoc } = await import("firebase/firestore");
  const playerRef = doc(db, "players", playerId);
  await deleteDoc(playerRef);
}

// Helpers para transacciones
export async function createTransaction(
  fromPlayerId: string | "BANK",
  toPlayerId: string | "BANK",
  amount: number,
  roomId: string
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
      roomId,
      timestamp: serverTimestamp(),
    });
    
    return transactionDocRef.id;
  });
}

// Helper para obtener configuración del juego
export async function getGameConfig(roomId: string): Promise<GameConfig> {
  const { doc, getDoc, setDoc } = await import("firebase/firestore");
  const configRef = doc(db, "gameConfig", roomId);
  const configSnap = await getDoc(configRef);
  
  if (!configSnap.exists()) {
    // Crear configuración inicial si no existe con el valor por defecto
    await setDoc(configRef, {
      initialBalance: DEFAULT_INITIAL_BALANCE,
      roomId,
    });
    return {
      initialBalance: DEFAULT_INITIAL_BALANCE,
      roomId,
    };
  }
  
  const data = configSnap.data();
  return {
    initialBalance: data.initialBalance || DEFAULT_INITIAL_BALANCE,
    roomId: data.roomId || roomId,
  };
}

// Helper para obtener el jugador "Parada Libre" de una sala
export async function getFreeParkingPlayer(roomId: string): Promise<Player | null> {
  const { collection, query, where, getDocs } = await import("firebase/firestore");
  
  const playersRef = collection(db, "players");
  const q = query(playersRef, where("roomId", "==", roomId), where("name", "==", "Parada Libre"));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    balance: data.balance || 0,
    roomId: data.roomId,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}

// Helper para "Cobrar Vuelta de Banco" - ejecuta directamente sin confirmación
export async function processBankPass(
  requestedBy: string,
  amount: number,
  roomId: string
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
      roomId,
      timestamp: serverTimestamp(),
    });
  });
}

// Helper para "Cobrar de Parada Libre" - cobra del saldo acumulado en Parada Libre
export async function processFreeParkingPass(
  requestedBy: string,
  amount: number,
  roomId: string
): Promise<void> {
  const { collection, runTransaction, serverTimestamp, doc, getDoc, query, where, getDocs } = await import("firebase/firestore");
  
  // Obtener el jugador Parada Libre
  const freeParkingPlayer = await getFreeParkingPlayer(roomId);
  if (!freeParkingPlayer) {
    throw new Error("Parada Libre no encontrada en esta sala");
  }
  
  // Verificar que el jugador que solicita existe
  const requestedPlayerRef = doc(db, "players", requestedBy);
  const requestedPlayerDoc = await getDoc(requestedPlayerRef);
  if (!requestedPlayerDoc.exists()) {
    throw new Error("El jugador que solicita no existe");
  }
  
  // Verificar que Parada Libre tiene suficiente saldo
  if (freeParkingPlayer.balance < amount) {
    throw new Error("Parada Libre no tiene suficiente saldo");
  }
  
  // Procesar pago dentro de una transacción
  await runTransaction(db, async (transaction) => {
    // PRIMERO: Hacer todas las lecturas
    const requestedPlayerSnap = await transaction.get(requestedPlayerRef);
    if (!requestedPlayerSnap.exists()) {
      throw new Error("El jugador que solicita no existe");
    }
    
    const freeParkingRef = doc(db, "players", freeParkingPlayer.id);
    const freeParkingSnap = await transaction.get(freeParkingRef);
    if (!freeParkingSnap.exists()) {
      throw new Error("Parada Libre no encontrada");
    }
    
    const currentFreeParkingBalance = freeParkingSnap.data().balance;
    if (currentFreeParkingBalance < amount) {
      throw new Error("Parada Libre no tiene suficiente saldo");
    }
    
    const currentPlayerBalance = requestedPlayerSnap.data().balance;
    
    // SEGUNDO: Hacer todas las escrituras
    // Restar de Parada Libre
    transaction.update(freeParkingRef, {
      balance: currentFreeParkingBalance - amount,
    });
    
    // Sumar al jugador que solicita
    transaction.update(requestedPlayerRef, {
      balance: currentPlayerBalance + amount,
    });
    
    // Crear transacción
    const transactionsRef = collection(db, "transactions");
    const transactionDocRef = doc(transactionsRef);
    transaction.set(transactionDocRef, {
      fromPlayerId: freeParkingPlayer.id,
      toPlayerId: requestedBy,
      amount: amount,
      type: "player-to-player",
      roomId,
      timestamp: serverTimestamp(),
    });
  });
}

// Helper para resetear el juego
export async function resetGame(roomId: string, initialBalance?: number): Promise<void> {
  const { collection, getDocs, doc, writeBatch, setDoc, query, where, serverTimestamp } = await import("firebase/firestore");
  
  const batch = writeBatch(db);
  
  // Eliminar todos los jugadores de la sala EXCEPTO Parada Libre
  const playersRef = collection(db, "players");
  const playersQuery = query(playersRef, where("roomId", "==", roomId));
  const playersSnap = await getDocs(playersQuery);
  let freeParkingRef: any = null;
  
  playersSnap.forEach((playerDoc) => {
    const data = playerDoc.data();
    if (data.name === "Parada Libre") {
      // Resetear saldo de Parada Libre a 0 en lugar de eliminarlo
      freeParkingRef = playerDoc.ref;
      batch.update(playerDoc.ref, { balance: 0 });
    } else {
      batch.delete(playerDoc.ref);
    }
  });
  
  // Si no existe Parada Libre, crearla
  if (!freeParkingRef) {
    const newFreeParkingRef = doc(playersRef);
    batch.set(newFreeParkingRef, {
      name: "Parada Libre",
      balance: 0,
      roomId,
      createdAt: serverTimestamp(),
      isSpecial: true,
    });
  }
  
  // Eliminar todas las transacciones de la sala
  const transactionsRef = collection(db, "transactions");
  const transactionsQuery = query(transactionsRef, where("roomId", "==", roomId));
  const transactionsSnap = await getDocs(transactionsQuery);
  transactionsSnap.forEach((transactionDoc) => {
    batch.delete(transactionDoc.ref);
  });
  
  // Eliminar todas las solicitudes de bank pass de la sala
  const bankPassRequestsRef = collection(db, "bankPassRequests");
  const bankPassQuery = query(bankPassRequestsRef, where("roomId", "==", roomId));
  const bankPassRequestsSnap = await getDocs(bankPassQuery);
  bankPassRequestsSnap.forEach((requestDoc) => {
    batch.delete(requestDoc.ref);
  });
  
  await batch.commit();
  
  // Si se proporciona un monto inicial, actualizar la configuración de la sala
  if (initialBalance !== undefined && initialBalance > 0) {
    const configRef = doc(db, "gameConfig", roomId);
    await setDoc(configRef, {
      initialBalance: initialBalance,
      roomId,
    });
  }
}

// Helper para eliminar una sala completamente (incluye toda la data)
export async function deleteRoom(roomId: string): Promise<void> {
  const { collection, getDocs, doc, writeBatch, deleteDoc, query, where } = await import("firebase/firestore");
  
  const batch = writeBatch(db);
  
  // Eliminar todos los jugadores de la sala
  const playersRef = collection(db, "players");
  const playersQuery = query(playersRef, where("roomId", "==", roomId));
  const playersSnap = await getDocs(playersQuery);
  playersSnap.forEach((playerDoc) => {
    batch.delete(playerDoc.ref);
  });
  
  // Eliminar todas las transacciones de la sala
  const transactionsRef = collection(db, "transactions");
  const transactionsQuery = query(transactionsRef, where("roomId", "==", roomId));
  const transactionsSnap = await getDocs(transactionsQuery);
  transactionsSnap.forEach((transactionDoc) => {
    batch.delete(transactionDoc.ref);
  });
  
  // Eliminar todas las solicitudes de bank pass de la sala
  const bankPassRequestsRef = collection(db, "bankPassRequests");
  const bankPassQuery = query(bankPassRequestsRef, where("roomId", "==", roomId));
  const bankPassRequestsSnap = await getDocs(bankPassQuery);
  bankPassRequestsSnap.forEach((requestDoc) => {
    batch.delete(requestDoc.ref);
  });
  
  // Eliminar la configuración del juego de la sala
  const configRef = doc(db, "gameConfig", roomId);
  batch.delete(configRef);
  
  // Eliminar la sala misma
  const roomRef = doc(db, "rooms", roomId);
  batch.delete(roomRef);
  
  await batch.commit();
}

// Helper para verificar contraseña de super admin
export async function verifySuperAdminPassword(password: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  // Hash correcto de "superadmin2024"
  const correctHash = "4f5fca796a06be2adb9a956395b26954d2c5c8126776f50e1a0f08ac09d4cf30";
  return passwordHash === correctHash;
}

// Helper para eliminar TODOS los datos de Firestore (super admin)
export async function deleteAllData(): Promise<void> {
  const { collection, getDocs, doc, writeBatch, deleteDoc } = await import("firebase/firestore");
  
  // Obtener todas las colecciones
  const collections = ["rooms", "players", "transactions", "gameConfig", "bankPassRequests"];
  
  for (const collectionName of collections) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    // Firestore tiene un límite de 500 operaciones por batch
    // Necesitamos procesar en lotes
    const batchSize = 500;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      
      await batch.commit();
    }
  }
}

