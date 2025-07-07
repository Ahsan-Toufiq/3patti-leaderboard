import React, { useState, useEffect, useCallback } from 'react';
import { TrophyIcon, UserIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { analyticsApi } from '../services/api';
import { LeaderboardEntry } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalUniqueGames, setTotalUniqueGames] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('ranking_score');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsApi.getLeaderboard(100, sortBy, sortOrder);
      setLeaderboard(response.data);
      setTotalUniqueGames(response.meta?.total_unique_games || 0);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'ASC' ? 
      <ArrowUpIcon className="w-4 h-4 ml-1" /> : 
      <ArrowDownIcon className="w-4 h-4 ml-1" />;
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return { emoji: '🥇', class: 'text-yellow-600 dark:text-yellow-400 font-bold' };
      case 2:
        return { emoji: '🥈', class: 'text-gray-600 dark:text-gray-400 font-bold' };
      case 3:
        return { emoji: '🥉', class: 'text-orange-600 dark:text-orange-400 font-bold' };
      default:
        return { emoji: '', class: 'text-gray-700 dark:text-gray-300' };
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
          onClick={fetchLeaderboard}
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <TrophyIcon className="w-8 h-8 mr-3 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Rankings based on wins, consistency, and overall performance
        </p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 text-center">
              <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-lg p-4 mb-4 transform md:scale-95 md:mt-8">
                <div className="text-4xl mb-2">🥈</div>
                <div className="text-white font-bold text-lg">{leaderboard[1].name}</div>
                <div className="text-gray-100 text-sm">
                  {leaderboard[1].games_won} wins • {Number(leaderboard[1].win_rate).toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Position: {Number(leaderboard[1].avg_position).toFixed(1)}
              </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2 text-center">
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-lg p-6 mb-4 transform md:scale-105 shadow-lg">
                <div className="text-6xl mb-2">🏆</div>
                <div className="text-white font-bold text-xl">{leaderboard[0].name}</div>
                <div className="text-yellow-100 text-sm">
                  {leaderboard[0].games_won} wins • {Number(leaderboard[0].win_rate).toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Position: {Number(leaderboard[0].avg_position).toFixed(1)}
              </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 text-center">
              <div className="bg-gradient-to-b from-orange-400 to-orange-500 rounded-lg p-4 mb-4 transform md:scale-95 md:mt-8">
                <div className="text-4xl mb-2">🥉</div>
                <div className="text-white font-bold text-lg">{leaderboard[2].name}</div>
                <div className="text-orange-100 text-sm">
                  {leaderboard[2].games_won} wins • {Number(leaderboard[2].win_rate).toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avg Position: {Number(leaderboard[2].avg_position).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Complete Rankings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click column headers to sort
          </p>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Rank</th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Player {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('total_games')}
                  >
                    <div className="flex items-center">
                      <ChartBarIcon className="w-4 h-4 mr-2" />
                      Games {getSortIcon('total_games')}
                    </div>
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('games_won')}
                  >
                    <div className="flex items-center">
                      <TrophyIcon className="w-4 h-4 mr-2" />
                      Wins {getSortIcon('games_won')}
                    </div>
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('win_rate')}
                  >
                    Win Rate {getSortIcon('win_rate')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('avg_position')}
                  >
                    Avg Position {getSortIcon('avg_position')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('best_position')}
                  >
                    Best Position {getSortIcon('best_position')}
                  </th>
                  <th 
                    className="table-header-cell cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleSort('ranking_score')}
                  >
                    Score {getSortIcon('ranking_score')}
                  </th>
                </tr>
              </thead>
              <tbody className="table-body">
                {leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const rankDisplay = getRankDisplay(rank);
                  
                  return (
                    <tr key={entry.id} className="table-row">
                      <td className="table-cell">
                        <div className={`flex items-center ${rankDisplay.class}`}>
                          <span className="text-lg mr-2">{rankDisplay.emoji}</span>
                          <span className="font-semibold">{rank}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          {entry.avatar_url ? (
                            <img
                              src={entry.avatar_url}
                              alt={entry.name}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                              <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {entry.name}
                            </div>
                            {entry.last_game_date && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Last played: {new Date(entry.last_game_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {entry.total_games}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {entry.games_won}
                          </span>
                          {entry.games_won > 0 && (
                            <span className="ml-2 text-yellow-500">
                              {'🏆'.repeat(Math.min(entry.games_won, 3))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            entry.win_rate >= 50 ? 'text-green-600 dark:text-green-400' : 
                            entry.win_rate >= 25 ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {Number(entry.win_rate).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${
                            entry.avg_position <= 2 ? 'text-green-600 dark:text-green-400' : 
                            entry.avg_position <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {Number(entry.avg_position).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            entry.best_position === 1 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                              : entry.best_position === 2 
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                : entry.best_position === 3 
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {entry.best_position === 1 ? '🏆 1st' : 
                             entry.best_position === 2 ? '🥈 2nd' : 
                             entry.best_position === 3 ? '🥉 3rd' : 
                             `${entry.best_position}th`}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {Number(entry.ranking_score).toFixed(1)}
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

      {/* Scoring System Explanation */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <TrophyIcon className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-medium text-amber-800 dark:text-amber-200 mb-4">
            🏆 How Ranking Scores Work
          </h3>
          <div className="text-sm text-amber-700 dark:text-amber-300 max-w-4xl mx-auto">
            <p className="mb-4">Players earn points based on their finishing positions in each game:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold">🏆</div>
                <div className="font-semibold">1st Place</div>
                <div className="text-yellow-800 dark:text-yellow-200 font-bold">10 points</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold">🥈</div>
                <div className="font-semibold">2nd Place</div>
                <div className="text-gray-800 dark:text-gray-200 font-bold">5 points</div>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold">🥉</div>
                <div className="font-semibold">3rd Place</div>
                <div className="text-orange-800 dark:text-orange-200 font-bold">3 points</div>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                <div className="text-lg font-bold">4️⃣</div>
                <div className="font-semibold">4th Place</div>
                <div className="text-blue-800 dark:text-blue-200 font-bold">1 point</div>
              </div>
            </div>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-4 space-y-3">
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">🎯 Consistency Bonus Formula:</p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 font-mono text-sm">
                  <p className="text-center"><strong>Consistency Bonus = (10 - Average Position) × Games Played ÷ 10</strong></p>
                </div>
              </div>
              <div className="text-sm space-y-2">
                <p><strong>How it works:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>If your average position is 1.5 and you played 20 games: (10 - 1.5) × 20 ÷ 10 = <strong>17 bonus points</strong></li>
                  <li>If your average position is 3.0 and you played 10 games: (10 - 3.0) × 10 ÷ 10 = <strong>7 bonus points</strong></li>
                </ul>
                <p className="text-amber-700 dark:text-amber-300"><strong>💡 Key insight:</strong> Lower average position + more games = higher consistency bonus!</p>
              </div>
              <div className="border-t border-amber-200 dark:border-amber-700 pt-2">
                <p><strong>📊 Final Score:</strong> Position Points + Consistency Bonus = Your Ranking Score</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leaderboard.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Players
          </div>
        </div>
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalUniqueGames}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Games
          </div>
        </div>
        <div className="card card-body text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leaderboard.length > 0 ? (
              leaderboard.reduce((sum, entry) => sum + entry.avg_position, 0) / leaderboard.length
            ).toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Overall Avg Position
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 