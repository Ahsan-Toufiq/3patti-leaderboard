import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  UserIcon, 
  ChartBarIcon, 
  CalendarIcon, 
  TrophyIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { analyticsApi } from '../services/api';
import { AnalyticsOverview, GameWithResults } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCard from '../components/StatsCard';

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentGames, setRecentGames] = useState<GameWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, gamesData] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getRecentGames(5)
      ]);
      
      setOverview(overviewData);
      setRecentGames(gamesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getPositionDisplay = (position: number) => {
    switch (position) {
      case 1:
        return { text: '🏆 1st', color: 'text-yellow-600 dark:text-yellow-400' };
      case 2:
        return { text: '🥈 2nd', color: 'text-gray-600 dark:text-gray-400' };
      case 3:
        return { text: '🥉 3rd', color: 'text-orange-600 dark:text-orange-400' };
      default:
        return { text: `${position}th`, color: 'text-gray-600 dark:text-gray-400' };
    }
  };

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
          onClick={fetchDashboardData}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome to your 3 Patti leaderboard overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Players"
          value={overview?.total_stats.total_players || 0}
          icon={UserIcon}
          color="primary"
        />
        <StatsCard
          title="Total Games"
          value={overview?.total_stats.total_games || 0}
          icon={ChartBarIcon}
          color="success"
        />
        <StatsCard
          title="Average Position"
          value={overview?.total_stats.avg_position ? Number(overview.total_stats.avg_position).toFixed(1) : '0.0'}
          icon={TrophyIcon}
          color="warning"
        />
        <StatsCard
          title="Avg Players/Game"
          value={overview?.avg_players_per_game ? overview.avg_players_per_game.toFixed(1) : '0.0'}
          icon={CalendarIcon}
          color="secondary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Games */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Games
              </h2>
              <Link
                to="/games"
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                View all
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentGames.length === 0 ? (
              <div className="text-center py-8">
                <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No games recorded yet</p>
                <Link
                  to="/add-game"
                  className="btn btn-primary mt-4"
                >
                  Add First Game
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentGames.map((game) => (
                  <div key={game.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(game.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {game.location || 'Location not specified'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {game.results.slice(0, 3).map((result, index) => {
                        const positionDisplay = getPositionDisplay(result.position);
                        return (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              result.position === 1 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                : result.position === 2 
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  : result.position === 3 
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {positionDisplay.text} {result.player_name}
                          </span>
                        );
                      })}
                      {game.results.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          +{game.results.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performers
              </h2>
              <Link
                to="/leaderboard"
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
              >
                View leaderboard
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          <div className="card-body">
                         {!overview?.top_performers || overview.top_performers.length === 0 ? (
               <div className="text-center py-8">
                 <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                 <p className="text-gray-500 dark:text-gray-400">No performance data yet</p>
                 <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                   Play more games to see top performers
                 </p>
               </div>
            ) : (
              <div className="space-y-4">
                {overview.top_performers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                          : index === 1 
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            : index === 2 
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {performer.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {performer.games_played} games played
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {Number(performer.win_rate).toFixed(1)}% win rate
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {performer.wins} wins • Avg: {Number(performer.avg_position).toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/add-game"
          className="group card card-body hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Add New Game
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Record latest game results
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/analytics"
          className="group card card-body hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                View Analytics
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Detailed performance insights
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/players"
          className="group card card-body hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Manage Players
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Add or edit player profiles
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 