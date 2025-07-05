// Player types
export interface Player {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePlayerRequest {
  name: string;
  email?: string;
  avatar_url?: string;
}

export interface UpdatePlayerRequest {
  name?: string;
  email?: string;
  avatar_url?: string;
}

// Game types
export interface Game {
  id: number;
  date: Date;
  location?: string;
  game_type: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGameRequest {
  date?: string;
  location?: string;
  game_type?: string;
  notes?: string;
  results: GameResult[];
}

export interface GameResult {
  player_id: number;
  position: number;
}

// Player game result types
export interface PlayerGameResult {
  id: number;
  player_id: number;
  game_id: number;
  position: number;
  created_at: Date;
}

// Leaderboard types
export interface LeaderboardEntry {
  id: number;
  name: string;
  avatar_url?: string;
  total_games: number;
  games_won: number;
  win_rate: number;
  avg_position: number;
  best_position: number;
  worst_position: number;
  last_game_date?: Date;
  ranking_score: number;
}

// Analytics types
export interface PlayerAnalytics {
  player_id: number;
  player_name: string;
  monthly_stats: MonthlyStats[];
  position_distribution: PositionDistribution[];
  recent_performance: RecentPerformance[];
  performance_trends: PerformanceTrend[];
}

export interface MonthlyStats {
  month: string;
  games_played: number;
  games_won: number;
  avg_position: number;
  best_position: number;
}

export interface PositionDistribution {
  position: number;
  count: number;
  percentage: number;
}

export interface RecentPerformance {
  date: Date;
  position: number;
  game_id: number;
}

export interface PerformanceTrend {
  period: string;
  avg_position: number;
  games_count: number;
  wins_count: number;
}

// Game with results
export interface GameWithResults {
  id: number;
  date: Date;
  location?: string;
  game_type: string;
  notes?: string;
  results: Array<{
    player_id: number;
    player_name: string;
    position: number;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} 