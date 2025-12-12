export interface Player {
  id: string;
  name: string;
  balance: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  fromPlayerId: string | "BANK";
  toPlayerId: string | "BANK";
  amount: number;
  type: "player-to-player" | "player-to-bank" | "bank-to-player";
  timestamp: Date;
}

export interface GameConfig {
  initialBalance: number;
}

export interface BankPassRequest {
  id: string;
  requestedBy: string; // ID del jugador que solicita
  requestedByName: string; // Nombre del jugador que solicita
  amount: number;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  confirmations: string[]; // IDs de jugadores que confirmaron
  rejections: string[]; // IDs de jugadores que rechazaron
  createdAt: Date;
  resolvedAt?: Date;
}

