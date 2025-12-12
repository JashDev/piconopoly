export interface Room {
  id: string;
  name: string;
  passwordHash: string;
  adminPasswordHash: string;
  createdAt: Date;
  createdBy: string;
}

export interface Player {
  id: string;
  name: string;
  balance: number;
  roomId: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  fromPlayerId: string | "BANK";
  toPlayerId: string | "BANK";
  amount: number;
  type: "player-to-player" | "player-to-bank" | "bank-to-player";
  roomId: string;
  timestamp: Date;
}

export interface GameConfig {
  initialBalance: number;
  roomId: string;
}

export interface BankPassRequest {
  id: string;
  requestedBy: string; // ID del jugador que solicita
  requestedByName: string; // Nombre del jugador que solicita
  amount: number;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  confirmations: string[]; // IDs de jugadores que confirmaron
  rejections: string[]; // IDs de jugadores que rechazaron
  roomId: string;
  createdAt: Date;
  resolvedAt?: Date;
}

