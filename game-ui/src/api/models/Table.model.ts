export interface PokerTable {
  id: string;
  pin: string;
  state: 'JOIN' | 'IN_PROGRESS' | string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  minPlayers: number;
  maxPlayers: number;
  gameMode: 'normal' | string; // можно указать другие варианты если есть
  players: number;
  members: number;
}

export interface TableListResponse {
  tables: PokerTable[];
  totalMembers: number;
  totalPlayers: number;
}
