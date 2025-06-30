export interface UserProfile {
  id: string;
  username: string;
  email: string;
  chips: number;
  wins: number;
  largestWin: number;
  created: number; // Unix timestamp (в миллисекундах)
}
