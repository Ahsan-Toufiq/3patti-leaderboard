import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  MapPinIcon, 
  EyeIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { gamesApi } from '../services/api';
import { GameWithResults } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import DeletionPasswordModal from '../components/DeletionPasswordModal';
import useProtectedDeletion from '../hooks/useProtectedDeletion';

const Games: React.FC = () => {
  const [games, setGames] = useState<GameWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  const gamesPerPage = 10;

  // Protected deletion hook
  const deletion = useProtectedDeletion(
    async () => {
      if (gameToDelete) {
        await handleDeleteGame(gameToDelete);
        setGameToDelete(null);
      }
    },
    {
      onSuccess: () => {
        // Success message already handled in handleDeleteGame
      },
      onError: (error) => {
        toast.error(error);
      }
    }
  );

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await gamesApi.getAll(currentPage, gamesPerPage);
      setGames(response.data);
      setTotalGames(response.pagination.total);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games');
      toast.error('Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const viewGameDetails = async (game: GameWithResults) => {
    setSelectedGame(game);
    setShowGameModal(true);
    setGameScores(null);
    
    // Fetch cumulative scores for this game
    try {
      setScoresLoading(true);
      const { analyticsApi } = await import('../services/api');
      const scores = await analyticsApi.getGameScores(game.id);
      setGameScores(scores);
    } catch (error) {
      console.error('Error fetching game scores:', error);
      toast.error('Failed to load cumulative scores');
    } finally {
      setScoresLoading(false);
    }
  };

  const handleDeleteGame = async (id: number) => {
    try {
      await gamesApi.delete(id);
      toast.success('Game deleted successfully');
      fetchGames(); // Refresh the games list
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game');
    }
  };

  const initiateGameDeletion = (id: number) => {
    const game = games.find(g => g.id === id);
    if (game) {
      setGameToDelete(id);
      deletion.openDeletionModal({
        title: 'Delete Game',
        description: `Are you sure you want to delete the game from ${format(new Date(game.date), 'MMM dd, yyyy')} at ${game.location || 'Unknown location'}? This will also delete all player results for this game. This action cannot be undone.`
      });
    }
  };

  const [selectedGame, setSelectedGame] = useState<GameWithResults | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameScores, setGameScores] = useState<any | null>(null);
  const [scoresLoading, setScoresLoading] = useState(false);

  const totalPages = Math.ceil(totalGames / gamesPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPositionDisplay = (position: number) => {
    switch (position) {
      case 1:
        return { text: '🏆 1st', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
      case 2:
        return { text: '🥈 2nd', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' };
      case 3:
        return { text: '🥉 3rd', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' };
      default:
        return { text: `${position}th`, class: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' };
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
          onClick={fetchGames}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Games
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            History of all 3 Patti games with finishing positions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/add-game"
            className="btn btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Game
          </Link>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {games.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No games recorded yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Start by adding your first 3 Patti game
              </p>
              <Link
                to="/add-game"
                className="btn btn-primary"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add First Game
              </Link>
            </div>
          </div>
        ) : (
          games.map((game) => (
            <div key={game.id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                          {format(new Date(game.date), 'EEEE, MMM dd, yyyy')}
                        </span>
                      </div>
                      {game.location && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          <span className="text-sm">{game.location}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <TrophyIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">{game.game_type}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Finishing Positions
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {game.results.map((result, index) => {
                          const positionDisplay = getPositionDisplay(result.position);
                          return (
                            <span
                              key={index}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${positionDisplay.class}`}
                            >
                              {positionDisplay.text} {result.player_name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {game.notes && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Notes:</span> {game.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewGameDetails(game)}
                        className="btn btn-secondary btn-sm"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      <button
                        onClick={() => initiateGameDeletion(game.id)}
                        className="btn btn-danger btn-sm"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((currentPage - 1) * gamesPerPage) + 1} to {Math.min(currentPage * gamesPerPage, totalGames)} of {totalGames} games
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`btn btn-sm ${
                      currentPage === page 
                        ? 'btn-primary' 
                        : 'btn-secondary'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Game Details Modal */}
      <Modal
        isOpen={showGameModal}
        onClose={() => setShowGameModal(false)}
        title="Game Details"
      >
        {selectedGame && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(selectedGame.date), 'EEEE, MMMM dd, yyyy')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedGame.location || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Game Type
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedGame.game_type}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Players
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {selectedGame.results.length}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Final Standings
              </label>
              <div className="space-y-3">
                {selectedGame.results.map((result, index) => {
                  const positionDisplay = getPositionDisplay(result.position);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium mr-3 ${positionDisplay.class}`}>
                          {result.position}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {result.player_name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${positionDisplay.class}`}>
                          {positionDisplay.text}
                        </span>
                        {result.position === 1 && (
                          <span className="ml-2 text-lg">🎉</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedGame.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {selectedGame.notes}
                </p>
              </div>
            )}

            {/* Cumulative Scores Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Cumulative Scores (After This Game)
              </label>
              {scoresLoading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading cumulative scores...</span>
                </div>
              ) : gameScores ? (
                <div className="space-y-3">
                  {gameScores.player_scores.map((player: any, index: number) => (
                    <div key={player.player_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-500 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {player.player_name}
                            </span>
                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              player.current_position === 1 
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                : player.current_position === 2 
                                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  : player.current_position === 3 
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              #{player.current_position} this game
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {player.cumulative_score.toFixed(1)} pts
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {player.total_games} games • {player.games_won} wins
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
                        <div>Avg Position: {player.avg_position.toFixed(1)}</div>
                        <div>Score Details:</div>
                        <div className="col-span-2 bg-gray-100 dark:bg-gray-600 rounded p-2 space-y-1">
                          <div>🏆 1st place: {player.score_breakdown.first_place_points} × 10 = {player.score_breakdown.first_place_points * 10} pts</div>
                          <div>🥈 2nd place: {player.score_breakdown.second_place_points} × 5 = {player.score_breakdown.second_place_points * 5} pts</div>
                          <div>🥉 3rd place: {player.score_breakdown.third_place_points} × 3 = {player.score_breakdown.third_place_points * 3} pts</div>
                          <div>4th place: {player.score_breakdown.fourth_place_points} × 1 = {player.score_breakdown.fourth_place_points} pts</div>
                          <div>Consistency bonus: {player.score_breakdown.consistency_bonus.toFixed(1)} pts</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Unable to load cumulative scores
                </div>
              )}
            </div>

            {/* Scoring System Explanation */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TrophyIcon className="h-5 w-5 text-amber-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    How Scoring Works
                  </h3>
                  <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                    <p className="mb-2">Players earn points based on their finishing positions:</p>
                    <ul className="list-disc list-inside space-y-1 mb-2">
                      <li><strong>🏆 1st place:</strong> 10 points</li>
                      <li><strong>🥈 2nd place:</strong> 5 points</li>
                      <li><strong>🥉 3rd place:</strong> 3 points</li>
                      <li><strong>4th place:</strong> 1 point</li>
                    </ul>
                    <p><strong>Consistency Bonus:</strong> Additional points based on average position - better consistency = more bonus points!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <TrophyIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Game Summary
                  </h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p>
                      <strong>{selectedGame.results.find(r => r.position === 1)?.player_name}</strong> won this game by finishing first. 
                      {selectedGame.results.length} players participated in this round of {selectedGame.game_type}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Deletion Password Modal */}
      <DeletionPasswordModal
        isOpen={deletion.isModalOpen}
        onClose={deletion.closeDeletionModal}
        onSuccess={deletion.executeProtectedDeletion}
        title={deletion.modalConfig.title}
        description={deletion.modalConfig.description}
      />
    </div>
  );
};

export default Games; 