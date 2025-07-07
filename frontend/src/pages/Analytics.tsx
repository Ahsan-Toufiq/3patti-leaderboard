import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  ChartBarIcon, 
  UserIcon, 
  ArrowPathIcon,
  TrophyIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { toast } from 'react-toastify';
import { analyticsApi, playersApi, getPositionsTimeline } from '../services/api';
import { Player, PlayerAnalytics, AnalyticsOverview, TrendsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Helper function to get readable timeframe label
const getTimeframeLabel = (timeframe: string): string => {
  switch (timeframe) {
    case '7days': return 'Last 7 Days';
    case '30days': return 'Last 30 Days';
    case '90days': return 'Last 90 Days';
    case '6months': return 'Last 6 Months';
    case '1year': return 'Last Year';
    case 'lifetime': return 'All Time';
    default: return 'All Time';
  }
};

// Helper function to get position emoji and color
const getPositionDisplay = (position: number) => {
  switch (position) {
    case 1: return { emoji: '🥇', color: 'text-yellow-600', bg: 'bg-yellow-100', label: '1st Place' };
    case 2: return { emoji: '🥈', color: 'text-gray-600', bg: 'bg-gray-100', label: '2nd Place' };
    case 3: return { emoji: '🥉', color: 'text-orange-600', bg: 'bg-orange-100', label: '3rd Place' };
    default: return { emoji: '📊', color: 'text-gray-500', bg: 'bg-gray-100', label: `${position}th Place` };
  }
};

// Helper function to calculate performance rating
const calculatePerformanceRating = (winRate: number, avgPosition: number, totalGames: number): string => {
  if (totalGames < 5) return 'Rookie';
  if (winRate >= 40 && avgPosition <= 2.0) return 'Elite';
  if (winRate >= 25 && avgPosition <= 2.5) return 'Pro';
  if (winRate >= 15 && avgPosition <= 3.0) return 'Competitive';
  if (winRate >= 10 && avgPosition <= 3.5) return 'Regular';
  return 'Casual';
};

const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendsData[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics | null>(null);
  const [playerScoreTrend, setPlayerScoreTrend] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [timeframe, setTimeframe] = useState<string>('lifetime');
  const [positionsTimeline, setPositionsTimeline] = useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getOverview(timeframe);
      setOverview(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  const fetchPlayers = async () => {
    try {
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  const fetchPlayerAnalytics = useCallback(async (playerId: number) => {
    try {
      setPlayerLoading(true);
      const [analyticsData, scoreTrendData] = await Promise.all([
        analyticsApi.getPlayerAnalytics(playerId, timeframe),
        analyticsApi.getPlayerScoreTrend(playerId)
      ]);
      setPlayerAnalytics(analyticsData);
      setPlayerScoreTrend(scoreTrendData);
    } catch (err: any) {
      console.error('Error fetching player analytics:', err);
      toast.error('Failed to load player analytics');
    } finally {
      setPlayerLoading(false);
    }
  }, [timeframe]);

  const fetchTrends = useCallback(async () => {
    try {
      const data = await analyticsApi.getTrends(timeRange, 12);
      setTrends(data);
    } catch (err) {
      console.error('Error fetching trends:', err);
    }
  }, [timeRange]);

  const fetchPositionsTimeline = useCallback(async () => {
    try {
      setPositionsLoading(true);
      const res = await getPositionsTimeline();
      setPositionsTimeline(res.data);
    } catch (err) {
      console.error('Error fetching positions timeline:', err);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerAnalytics(selectedPlayer.id);
    }
  }, [fetchPlayerAnalytics, selectedPlayer]);

  useEffect(() => {
    fetchPositionsTimeline();
  }, [fetchPositionsTimeline]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerAnalytics(null);
    setPlayerScoreTrend(null);
    fetchPlayerAnalytics(player.id);
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  // Chart data preparation
  const gamesPerMonthData = {
    labels: overview?.monthly_games?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Games Played',
        data: overview?.monthly_games?.map(item => item.games_count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  const trendsChartData = {
    labels: trends.map(item => item.period),
    datasets: [
      {
        label: 'Average Position',
        data: trends.map(item => item.avg_position),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
      },
      {
        label: 'Games Count',
        data: trends.map(item => item.games_count),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y1',
      },
    ],
  };

  const trendsChartOptions = {
    ...lineChartOptions,
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'Average Position' },
        reverse: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Games Count' },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const positionsChartData = {
    labels: positionsTimeline.map((_, index) => `Game ${index + 1}`),
    datasets: players.map((player, playerIndex) => ({
      label: player.name,
      data: positionsTimeline.map(game => {
        const playerResult = game.results?.find((p: any) => p.player_id === player.id);
        return playerResult ? playerResult.position : null;
      }).filter(pos => pos !== null),
      borderColor: `hsl(${playerIndex * 360 / players.length}, 70%, 50%)`,
      backgroundColor: `hsla(${playerIndex * 360 / players.length}, 70%, 50%, 0.1)`,
      tension: 0.4,
    })),
  };

  const positionsChartOptions = {
    ...lineChartOptions,
    scales: {
      y: {
        reverse: true,
        beginAtZero: false,
        min: 1,
        max: Math.max(...players.map(() => 6)),
        title: { display: true, text: 'Position (Lower is Better)' },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}${context.parsed.y === 1 ? 'st' : context.parsed.y === 2 ? 'nd' : context.parsed.y === 3 ? 'rd' : 'th'} place`;
          }
        }
      }
    }
  };

  const scoreTrendData = playerScoreTrend ? {
    labels: playerScoreTrend.score_progression.map((_: any, index: number) => index + 1),
    datasets: [
      {
        label: 'Cumulative Score',
        data: playerScoreTrend.score_progression.map((point: any) => point.cumulative_score),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointBackgroundColor: playerScoreTrend.score_progression.map((point: any) => {
          if (point.position_this_game === 1) return 'rgba(255, 215, 0, 1)'; // Gold
          if (point.position_this_game === 2) return 'rgba(192, 192, 192, 1)'; // Silver
          if (point.position_this_game === 3) return 'rgba(205, 127, 50, 1)'; // Bronze
          return 'rgba(59, 130, 246, 1)'; // Blue
        }),
        pointBorderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 6,
      },
    ],
  } : null;

  const playerPerformanceData = playerAnalytics?.performance_trends ? {
    labels: playerAnalytics.performance_trends.map(item => item.period),
    datasets: [
      {
        label: 'Average Position',
        data: playerAnalytics.performance_trends.map(item => item.avg_position),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const positionDistributionData = playerAnalytics?.position_distribution ? {
    labels: playerAnalytics.position_distribution.map(item => `${item.position}${item.position === 1 ? 'st' : item.position === 2 ? 'nd' : item.position === 3 ? 'rd' : 'th'} Place`),
    datasets: [
      {
        data: playerAnalytics.position_distribution.map(item => item.count),
        backgroundColor: [
          'rgba(255, 215, 0, 0.8)', // Gold
          'rgba(192, 192, 192, 0.8)', // Silver
          'rgba(205, 127, 50, 0.8)', // Bronze
          'rgba(128, 128, 128, 0.8)', // Gray
          'rgba(165, 42, 42, 0.8)', // Brown
        ],
        borderColor: [
          'rgba(255, 215, 0, 1)',
          'rgba(192, 192, 192, 1)',
          'rgba(205, 127, 50, 1)',
          'rgba(128, 128, 128, 1)',
          'rgba(165, 42, 42, 1)',
        ],
        borderWidth: 2,
      },
    ],
  } : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={fetchAnalyticsData}
          className="btn btn-primary"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="w-8 h-8 mr-3 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive position-based performance insights {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Timeframe:
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="form-select min-w-[120px]"
            >
              <option value="lifetime">All Time</option>
              <option value="1year">Last Year</option>
              <option value="6months">Last 6 Months</option>
              <option value="90days">Last 90 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>
          <button
            onClick={fetchAnalyticsData}
            className="btn btn-secondary"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats - Redesigned */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card card-body bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Players</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {overview?.total_stats.total_players || 0}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {(overview?.total_stats?.total_players || 0) > 0 ? 'Competing regularly' : 'No active players'}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Games</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {overview?.total_stats.total_games || 0}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {(overview?.total_stats?.total_games || 0) > 0 ? 'Games completed' : 'No games yet'}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <TagIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Avg Position</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {overview?.total_stats.avg_position ? Number(overview.total_stats.avg_position).toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                {overview?.total_stats.avg_position ? 
                  (Number(overview.total_stats.avg_position) <= 2.0 ? 'Excellent competition' :
                   Number(overview.total_stats.avg_position) <= 3.0 ? 'Good competition' : 'Casual play') : 
                  'No data'}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <FireIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg Players/Game</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {overview?.avg_players_per_game?.toFixed(1) || '0.0'}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {overview?.avg_players_per_game ? 
                  (overview.avg_players_per_game >= 6 ? 'High competition' :
                   overview.avg_players_per_game >= 4 ? 'Medium competition' : 'Small groups') : 
                  'No data'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <StarIcon className="w-5 h-5 mr-2 text-yellow-500" />
              Top Performers {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {overview?.top_performers?.slice(0, 5).map((player, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 dark:text-white">{player.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {player.wins} wins • {player.win_rate}% win rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {Number(player.avg_position).toFixed(1)} avg
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {player.games_played} games
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Active Players */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FireIcon className="w-5 h-5 mr-2 text-red-500" />
              Most Active Players {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {overview?.most_active_players?.slice(0, 5).map((player, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-red-500 text-white">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900 dark:text-white">{player.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {player.games_played} games played
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${Math.min((player.games_played / (overview?.most_active_players?.[0]?.games_played || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {Math.round((player.games_played / (overview?.most_active_players?.[0]?.games_played || 1)) * 100)}% of leader
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games Per Month Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Games Per Month {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <Bar data={gamesPerMonthData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Performance Trends Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Trends ({timeRange})
            </h3>
          </div>
          <div className="card-body">
            <div className="h-80">
              <Line data={trendsChartData} options={trendsChartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Player Positions Over Time Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Player Positions Over Time (All Players)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Each line shows a player's position in each game (lower is better)
          </p>
        </div>
        <div className="card-body">
          <div className="h-96">
            {positionsLoading ? (
              <LoadingSpinner />
            ) : (
              <Line data={positionsChartData} options={positionsChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Player-Specific Analytics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Individual Player Analytics
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a player to view their detailed position-based performance analytics {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
          </p>
        </div>
        <div className="card-body">
          {/* Player Selection */}
          <div className="mb-6">
            <label className="form-label">Select Player</label>
            <select
              value={selectedPlayer?.id || ''}
              onChange={(e) => {
                const player = players.find(p => p.id === parseInt(e.target.value));
                if (player) handlePlayerSelect(player);
              }}
              className="form-select max-w-md"
            >
              <option value="">Choose a player...</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {/* Player Analytics Content */}
          {selectedPlayer && (
            <div className="space-y-6">
              {playerLoading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : playerAnalytics ? (
                <div className="space-y-6">
                  {/* Player Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(() => {
                      const totalGames = playerAnalytics.position_distribution.reduce((sum, pos) => sum + pos.count, 0);
                      const wins = playerAnalytics.position_distribution.find(pos => pos.position === 1)?.count || 0;
                      const winRate = totalGames > 0 ? (wins / totalGames * 100).toFixed(1) : '0.0';
                      const avgPosition = playerAnalytics.position_distribution.reduce((sum, pos) => sum + (pos.position * pos.count), 0) / totalGames;
                      const performanceRating = calculatePerformanceRating(parseFloat(winRate), avgPosition, totalGames);
                      
                      return (
                        <>
                          <div className="card card-body bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                  <TrophyIcon className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Games</p>
                                <p className="text-xl font-bold text-green-900 dark:text-green-100">{totalGames}</p>
                              </div>
                            </div>
                          </div>

                          <div className="card card-body bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                                  <StarIcon className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Wins</p>
                                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{wins}</p>
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">{winRate}% win rate</p>
                              </div>
                            </div>
                          </div>

                          <div className="card card-body bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <TagIcon className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg Position</p>
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{avgPosition.toFixed(1)}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  {avgPosition <= 2.0 ? 'Excellent' : avgPosition <= 2.5 ? 'Good' : avgPosition <= 3.0 ? 'Average' : 'Needs improvement'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="card card-body bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                  <FireIcon className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Performance</p>
                                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">{performanceRating}</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                  {performanceRating === 'Elite' ? 'Top tier player' :
                                   performanceRating === 'Pro' ? 'Strong competitor' :
                                   performanceRating === 'Competitive' ? 'Good player' :
                                   performanceRating === 'Regular' ? 'Consistent player' : 'Casual player'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Score Trend Chart */}
                  <div className="card">
                    <div className="card-header">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        📈 Score Progression Over Time
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        How your cumulative score changed after each game (🏆 Gold = 1st, 🥈 Silver = 2nd, 🥉 Bronze = 3rd)
                      </p>
                    </div>
                    <div className="card-body">
                      <div className="h-80">
                        {scoreTrendData && (
                          <Line 
                            data={scoreTrendData} 
                            options={{
                              ...lineChartOptions,
                              plugins: {
                                ...lineChartOptions.plugins,
                                tooltip: {
                                  callbacks: {
                                    title: function(context: any) {
                                      const index = context[0].dataIndex;
                                      const point = playerScoreTrend.score_progression[index];
                                      return `Game ${point.game_number} - ${new Date(point.date).toLocaleDateString()}`;
                                    },
                                    label: function(context: any) {
                                      const index = context.dataIndex;
                                      const point = playerScoreTrend.score_progression[index];
                                      return [
                                        `Score: ${context.parsed.y.toFixed(1)} points`,
                                        `Position this game: ${point.position_this_game}${point.position_this_game === 1 ? 'st' : point.position_this_game === 2 ? 'nd' : point.position_this_game === 3 ? 'rd' : 'th'}`,
                                        `Location: ${point.location || 'Unknown'}`
                                      ];
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Cumulative Score'
                                  }
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Game Number'
                                  }
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Position Distribution */}
                    <div className="card">
                      <div className="card-header">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Position Distribution {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
                        </h4>
                      </div>
                      <div className="card-body">
                        <div className="h-80">
                          {positionDistributionData && (
                            <Doughnut 
                              data={positionDistributionData} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'bottom' as const,
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: function(context: any) {
                                        const data = playerAnalytics.position_distribution[context.dataIndex];
                                        return `${context.label}: ${data.count} games (${data.percentage}%)`;
                                      }
                                    }
                                  }
                                },
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance Trends */}
                    <div className="card">
                      <div className="card-header">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Performance Trends {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
                        </h4>
                      </div>
                      <div className="card-body">
                        <div className="h-80">
                          {playerPerformanceData && (
                            <Line data={playerPerformanceData} options={trendsChartOptions} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Performance Table */}
                  <div className="card">
                    <div className="card-header">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Performance (Last 20 Games{timeframe !== 'lifetime' ? ` - ${getTimeframeLabel(timeframe)}` : ''})
                      </h4>
                    </div>
                    <div className="card-body">
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead className="table-header">
                            <tr>
                              <th className="table-header-cell">Date</th>
                              <th className="table-header-cell">Position</th>
                              <th className="table-header-cell">Performance</th>
                              <th className="table-header-cell">Trend</th>
                            </tr>
                          </thead>
                          <tbody className="table-body">
                            {playerAnalytics?.recent_performance?.map((game, index) => {
                              const positionDisplay = getPositionDisplay(game.position);
                              const isImproving = index > 0 && game.position < playerAnalytics.recent_performance[index - 1].position;
                              const isDeclining = index > 0 && game.position > playerAnalytics.recent_performance[index - 1].position;
                              
                              return (
                                <tr key={index} className="table-row">
                                  <td className="table-cell">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                      {format(new Date(game.date), 'MMM dd, yyyy')}
                                    </div>
                                  </td>
                                  <td className="table-cell">
                                    <div className="flex items-center">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${positionDisplay.bg} ${positionDisplay.color}`}>
                                        {positionDisplay.emoji} {positionDisplay.label}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="table-cell">
                                    <div className={`text-sm font-medium ${
                                      game.position === 1 ? 'text-success-600 dark:text-success-400' : 
                                      game.position <= 3 ? 'text-warning-600 dark:text-warning-400' : 
                                      'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {game.position === 1 ? '🏆 Winner' : 
                                       game.position <= 3 ? '🥉 Podium' : 
                                       'Participated'}
                                    </div>
                                  </td>
                                  <td className="table-cell">
                                    <div className="flex items-center">
                                      {index > 0 && (
                                        <>
                                                                                {isImproving && <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />}
                                      {isDeclining && <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />}
                                          {!isImproving && !isDeclining && <div className="w-4 h-4" />}
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    No analytics data available for this player
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 