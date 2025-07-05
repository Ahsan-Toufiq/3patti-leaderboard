import axios from 'axios';
import {
  Player,
  CreatePlayerRequest,
  UpdatePlayerRequest,
  GameWithResults,
  CreateGameRequest,
  LeaderboardEntry,
  PlayerAnalytics,
  AnalyticsOverview,
  TrendsData,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access');
    } else if (error.response?.status === 500) {
      // Handle server errors
      console.error('Server error');
    }
    return Promise.reject(error);
  }
);

// Players API
export const playersApi = {
  // Get all players
  getAll: async (): Promise<Player[]> => {
    const response = await api.get<ApiResponse<Player[]>>('/api/players');
    return response.data.data || [];
  },

  // Get player by ID
  getById: async (id: number): Promise<Player> => {
    const response = await api.get<ApiResponse<Player>>(`/api/players/${id}`);
    if (!response.data.data) {
      throw new Error('Player not found');
    }
    return response.data.data;
  },

  // Create new player
  create: async (player: CreatePlayerRequest): Promise<Player> => {
    const response = await api.post<ApiResponse<Player>>('/api/players', player);
    if (!response.data.data) {
      throw new Error('Failed to create player');
    }
    return response.data.data;
  },

  // Update player
  update: async (id: number, player: UpdatePlayerRequest): Promise<Player> => {
    const response = await api.put<ApiResponse<Player>>(`/api/players/${id}`, player);
    if (!response.data.data) {
      throw new Error('Failed to update player');
    }
    return response.data.data;
  },

  // Delete player
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/players/${id}`);
  },
};

// Games API
export const gamesApi = {
  // Get all games with pagination
  getAll: async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<GameWithResults>> => {
    const response = await api.get<PaginatedResponse<GameWithResults>>('/api/games', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get game by ID
  getById: async (id: number): Promise<GameWithResults> => {
    const response = await api.get<ApiResponse<GameWithResults>>(`/api/games/${id}`);
    if (!response.data.data) {
      throw new Error('Game not found');
    }
    return response.data.data;
  },

  // Create new game
  create: async (game: CreateGameRequest): Promise<GameWithResults> => {
    const response = await api.post<ApiResponse<GameWithResults>>('/api/games', game);
    if (!response.data.data) {
      throw new Error('Failed to create game');
    }
    return response.data.data;
  },

  // Update game
  update: async (id: number, game: CreateGameRequest): Promise<GameWithResults> => {
    const response = await api.put<ApiResponse<GameWithResults>>(`/api/games/${id}`, game);
    if (!response.data.data) {
      throw new Error('Failed to update game');
    }
    return response.data.data;
  },

  // Delete game
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/games/${id}`);
  },
};

// Analytics API
export const analyticsApi = {
  // Get leaderboard
  getLeaderboard: async (
    limit: number = 50,
    sortBy: string = 'total_profit_loss',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<LeaderboardEntry[]> => {
    const response = await api.get<ApiResponse<LeaderboardEntry[]>>('/api/analytics/leaderboard', {
      params: { limit, sortBy, sortOrder },
    });
    return response.data.data || [];
  },

  // Get player analytics
  getPlayerAnalytics: async (playerId: number, timeframe?: string): Promise<PlayerAnalytics> => {
    const response = await api.get<ApiResponse<PlayerAnalytics>>(`/api/analytics/player/${playerId}`, {
      params: timeframe ? { timeframe } : {},
    });
    if (!response.data.data) {
      throw new Error('Player analytics not found');
    }
    return response.data.data;
  },

  // Get analytics overview
  getOverview: async (timeframe?: string): Promise<AnalyticsOverview> => {
    const response = await api.get<ApiResponse<AnalyticsOverview>>('/api/analytics/overview', {
      params: timeframe ? { timeframe } : {},
    });
    if (!response.data.data) {
      throw new Error('Analytics overview not found');
    }
    return response.data.data;
  },

  // Get trends data
  getTrends: async (
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    limit: number = 12
  ): Promise<TrendsData[]> => {
    const response = await api.get<ApiResponse<TrendsData[]>>('/api/analytics/trends', {
      params: { period, limit },
    });
    return response.data.data || [];
  },

  // Get recent games
  getRecentGames: async (limit: number = 5): Promise<GameWithResults[]> => {
    const response = await gamesApi.getAll(1, limit);
    return response.data;
  },
};

// Health check API
export const healthApi = {
  check: async (): Promise<any> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Export the axios instance for custom requests
export default api; 