export interface GameState {
  state: 'IN_PROGRESS' | 'JOIN' | string;
  id: string;
  tid: string;
  pin: string;
  creator: string;
  smallBlind: number;
  bigBlind: number;
  minPlayers: number;
  maxPlayers: number;
  minBuyIn: number;
  maxBuyIn: number;
  gameMode: 'normal' | string;
  players: Player[];
  playersToRemove: Player[];
  playersToAdd: Player[];
  gameWinners: IGameWinner[];        // could be expanded if known
  actions: IAction[];            // could be expanded if known
  game: GameDetails | {};
  board: string[];           // community cards
  currentPlayer: number;
}

export interface IGameWinner {
  amount: number;
  chips: number;
  id: string
  playerName: string
}
export interface IAction {
  action: 'check' | 'fold' | 'bet' | 'call' | 'allin';
  amount?: number;
  id: string;
  playerName: string;

}

export interface Player {
  playerName: string;
  id: string;
  chips: number;
  folded: boolean;
  allIn: boolean;
  talked: boolean;
  cards: [string, string]; // two-card hand like ["QH", "AD"]
}

export interface GameDetails {
  smallBlind: number;
  bigBlind: number;
  pot: number;
  roundName: string;
  betName: string;
  bets: number[];
  roundBets: number[];
  board: string[];
  blinds: [number, number]; // positions of smallBlind and bigBlind
}
