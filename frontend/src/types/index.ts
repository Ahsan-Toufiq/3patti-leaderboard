// Player types
export interface Player {
  id: number;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
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
  date: string;
  location?: string;
  game_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  created_at: string;
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
  last_game_date?: string;
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
  date: string;
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
  date: string;
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

// UI State types
export interface Theme {
  isDark: boolean;
  toggle: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

// Form types
export interface FormErrors {
  [key: string]: string;
}

export interface GameFormData {
  date: string;
  location: string;
  game_type: string;
  notes: string;
  results: Array<{
    player_id: number;
    position: number;
  }>;
}

// Analytics overview
export interface AnalyticsOverview {
  total_stats: {
    total_players: number;
    total_games: number;
    avg_position: number;
    first_game_date?: string;
    last_game_date?: string;
  };
  monthly_games: Array<{
    month: string;
    games_count: number;
  }>;
  avg_players_per_game: number;
  most_active_players: Array<{
    name: string;
    games_played: number;
  }>;
  top_performers: Array<{
    name: string;
    games_played: number;
    wins: number;
    avg_position: number;
    win_rate: number;
  }>;
}

// Trends data
export interface TrendsData {
  period: string;
  games_count: number;
  total_results: number;
  avg_position: number;
  unique_players: number;
  total_wins: number;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Table types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

// Sort types
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Filter types
export interface FilterConfig {
  [key: string]: any;
}

// Notification types
export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
} 