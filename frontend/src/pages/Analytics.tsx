import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  ChartBarIcon, 
  UserIcon, 
  CalendarIcon, 
  ArrowPathIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { toast } from 'react-toastify';
import { analyticsApi, playersApi } from '../services/api';
import { Player, PlayerAnalytics, AnalyticsOverview, TrendsData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

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

const Analytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<TrendsData[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [timeframe, setTimeframe] = useState<string>('lifetime');

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
      const data = await analyticsApi.getPlayerAnalytics(playerId, timeframe);
      setPlayerAnalytics(data);
    } catch (err) {
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

  useEffect(() => {
    fetchAnalyticsData();
    fetchPlayers();
  }, []);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerAnalytics(selectedPlayer.id);
    }
  }, [fetchPlayerAnalytics, selectedPlayer]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerAnalytics(null);
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
    fill: true,
  };

  // Games per month chart data
  const gamesPerMonthData = {
    labels: overview?.monthly_games?.map(item => {
      const [year, month] = item.month.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy');
    }).reverse() || [],
    datasets: [
      {
        label: 'Games Played',
        data: overview?.monthly_games?.map(item => Number(item.games_count)).reverse() || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Trends chart data
  const trendsChartData = {
    labels: trends.map(item => item.period).reverse(),
    datasets: [
      {
        label: 'Average Position',
        data: trends.map(item => Number(item.avg_position)).reverse(),
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Unique Players',
        data: trends.map(item => Number(item.unique_players)).reverse(),
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
        fill: true,
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
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Position',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Unique Players',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Player performance chart data
  const playerPerformanceData = playerAnalytics ? {
    labels: playerAnalytics.monthly_stats.map(stat => {
      const [year, month] = stat.month.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy');
    }).reverse(),
    datasets: [
      {
        label: 'Average Position',
        data: playerAnalytics.monthly_stats.map(stat => Number(stat.avg_position)).reverse(),
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Games Won',
        data: playerAnalytics.monthly_stats.map(stat => Number(stat.games_won)).reverse(),
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  } : null;

  // Position distribution chart data
  const positionDistributionData = playerAnalytics ? {
    labels: playerAnalytics.position_distribution.map(pos => `${pos.position === 1 ? '🏆 1st Place' : pos.position === 2 ? '🥈 2nd Place' : pos.position === 3 ? '🥉 3rd Place' : `${pos.position}th Place`}`),
    datasets: [
      {
        data: playerAnalytics.position_distribution.map(pos => pos.count),
        backgroundColor: [
          '#FFD700', // Gold for 1st
          '#C0C0C0', // Silver for 2nd
          '#CD7F32', // Bronze for 3rd
          '#4F46E5', // Purple for 4th
          '#EF4444', // Red for 5th
          '#10B981', // Green for 6th
          '#F59E0B', // Yellow for 7th
          '#8B5CF6', // Violet for 8th
        ],
        borderWidth: 2,
        borderColor: '#fff',
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
            Position-based performance insights and trends {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
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
              <option value="lifetime">Lifetime</option>
              <option value="1year">Last Year</option>
              <option value="6months">Last 6 Months</option>
              <option value="90days">Last 90 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Trends:
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="form-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Players</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.total_stats.total_players || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Games</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.total_stats.total_games || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Position</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.total_stats.avg_position ? Number(overview.total_stats.avg_position).toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Players/Game</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview?.avg_players_per_game?.toFixed(1) || '0.0'}
              </p>
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

        {/* Trends Chart */}
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

      {/* Player-Specific Analytics */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Player-Specific Analytics
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
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedPlayer.name}'s Performance
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Detailed position-based analytics and performance trends {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
                </p>
              </div>

              {playerLoading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : playerAnalytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Performance */}
                  <div className="card">
                    <div className="card-header">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Monthly Performance {timeframe !== 'lifetime' && `(${getTimeframeLabel(timeframe)})`}
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
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Performance */}
                  <div className="card lg:col-span-2">
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
                            </tr>
                          </thead>
                          <tbody className="table-body">
                            {playerAnalytics.recent_performance.map((game, index) => (
                              <tr key={index} className="table-row">
                                <td className="table-cell">
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {format(new Date(game.date), 'MMM dd, yyyy')}
                                  </div>
                                </td>
                                <td className="table-cell">
                                  <div className="flex items-center">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      game.position === 1 
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                        : game.position === 2 
                                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                          : game.position === 3 
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                      #{game.position}
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
                              </tr>
                            ))}
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