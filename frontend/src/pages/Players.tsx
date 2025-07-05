import React, { useState, useEffect } from 'react';
import { 
  UserPlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChartBarIcon,
  TrophyIcon,
  StarIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { playersApi, analyticsApi } from '../services/api';
import { Player, CreatePlayerRequest, PlayerAnalytics } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import DeletionPasswordModal from '../components/DeletionPasswordModal';
import useProtectedDeletion from '../hooks/useProtectedDeletion';

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerAnalytics, setPlayerAnalytics] = useState<PlayerAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePlayerRequest>({
    name: '',
    email: '',
  });
  const [playerToDelete, setPlayerToDelete] = useState<number | null>(null);

  // Protected deletion hook
  const deletion = useProtectedDeletion(
    async () => {
      if (playerToDelete) {
        await handleDeletePlayer(playerToDelete);
        setPlayerToDelete(null);
      }
    },
    {
      onSuccess: () => {
        // Success message already handled in handleDeletePlayer
      },
      onError: (error) => {
        toast.error(error);
      }
    }
  );

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError('Failed to load players');
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerAnalytics = async (playerId: number) => {
    try {
      setAnalyticsLoading(true);
      const data = await analyticsApi.getPlayerAnalytics(playerId);
      setPlayerAnalytics(data);
    } catch (err) {
      console.error('Error fetching player analytics:', err);
      toast.error('Failed to load player analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerAnalytics(null);
    fetchPlayerAnalytics(player.id);
  };

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Player name is required');
      return;
    }

    // Validate email format only if provided
    if (formData.email && formData.email.trim() && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(formData.email.trim())) {
      toast.error('Please enter a valid email address or leave it empty');
      return;
    }

    try {
      const playerData = {
        name: formData.name.trim(),
        email: formData.email && formData.email.trim() ? formData.email.trim() : undefined, // Send undefined instead of empty string
      };
      const newPlayer = await playersApi.create(playerData);
      setPlayers([...players, newPlayer]);
      setFormData({ name: '', email: '' });
      setModalOpen(false);
      toast.success('Player created successfully!');
    } catch (error: any) {
      console.error('Error creating player:', error);
      toast.error(error.response?.data?.message || 'Failed to create player');
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPlayer || !formData.name.trim()) {
      toast.error('Player name is required');
      return;
    }

    // Validate email format only if provided
    if (formData.email && formData.email.trim() && !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(formData.email.trim())) {
      toast.error('Please enter a valid email address or leave it empty');
      return;
    }

    try {
      const playerData = {
        name: formData.name.trim(),
        email: formData.email && formData.email.trim() ? formData.email.trim() : undefined, // Send undefined instead of empty string
      };
      const updatedPlayer = await playersApi.update(editingPlayer.id, playerData);
      setPlayers(players.map(p => p.id === editingPlayer.id ? updatedPlayer : p));
      setFormData({ name: '', email: '' });
      setEditingPlayer(null);
      setModalOpen(false);
      toast.success('Player updated successfully!');
    } catch (error: any) {
      console.error('Error updating player:', error);
      toast.error(error.response?.data?.message || 'Failed to update player');
    }
  };

  const handleDeletePlayer = async (id: number) => {
    try {
      await playersApi.delete(id);
      setPlayers(players.filter(p => p.id !== id));
      toast.success('Player deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting player:', error);
      toast.error(error.response?.data?.message || 'Failed to delete player');
    }
  };

  const initiatePlayerDeletion = (id: number) => {
    const player = players.find(p => p.id === id);
    setPlayerToDelete(id);
    deletion.openDeletionModal({
      title: 'Delete Player',
      description: `Are you sure you want to delete ${player?.name}? This will also delete all their game results. This action cannot be undone.`
    });
  };

  const openCreateModal = () => {
    setFormData({ name: '', email: '' });
    setEditingPlayer(null);
    setModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setFormData({
      name: player.name,
      email: player.email || '',
    });
    setEditingPlayer(player);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPlayer(null);
    setFormData({ name: '', email: '' });
  };

  const closeAnalytics = () => {
    setSelectedPlayer(null);
    setPlayerAnalytics(null);
  };

  // Chart data for player analytics
  const getPlayerPerformanceData = () => {
    if (!playerAnalytics) return null;

    return {
      labels: playerAnalytics.monthly_stats.map(stat => {
        const [year, month] = stat.month.split('-');
        return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy');
      }).reverse(),
      datasets: [
        {
          label: 'Average Position',
          data: playerAnalytics.monthly_stats.map(stat => Number(stat.avg_position)).reverse(),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: true,
        },
        {
          label: 'Games Won',
          data: playerAnalytics.monthly_stats.map(stat => Number(stat.games_won)).reverse(),
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 2,
          fill: true,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const getPositionDistributionData = () => {
    if (!playerAnalytics) return null;

    return {
      labels: playerAnalytics.position_distribution.map(pos => `Position ${pos.position}`),
      datasets: [
        {
          data: playerAnalytics.position_distribution.map(pos => pos.count),
          backgroundColor: [
            '#FFD700', '#C0C0C0', '#CD7F32', '#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          ],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    };
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
          onClick={fetchPlayers}
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
            Players
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage players and view their performance analytics
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <UserPlusIcon className="w-5 h-5 mr-2" />
            Add Player
          </button>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {players.map((player) => (
          <div key={player.id} className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {player.name}
                  </h3>
                  {player.email && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {player.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Joined {format(new Date(player.created_at), 'MMM yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handlePlayerSelect(player)}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <ChartBarIcon className="w-4 h-4 mr-1" />
                  Analytics
                </button>
                <button
                  onClick={() => openEditModal(player)}
                  className="btn btn-secondary btn-sm"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => initiatePlayerDeletion(player.id)}
                  className="btn btn-danger btn-sm"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Player Analytics Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedPlayer.name}'s Analytics
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed performance statistics and trends
                  </p>
                </div>
                <button
                  onClick={closeAnalytics}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {analyticsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <LoadingSpinner />
                </div>
              ) : playerAnalytics ? (
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <TrophyIcon className="w-8 h-8 text-blue-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Games</p>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                            {playerAnalytics.monthly_stats.reduce((sum, stat) => sum + Number(stat.games_played), 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <StarIcon className="w-8 h-8 text-green-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">Games Won</p>
                          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {playerAnalytics.monthly_stats.reduce((sum, stat) => sum + Number(stat.games_won), 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <CalendarIcon className="w-8 h-8 text-yellow-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Best Position</p>
                          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                            {playerAnalytics.monthly_stats.length > 0 ? 
                              Math.min(...playerAnalytics.monthly_stats.map(stat => Number(stat.best_position))) : 
                              'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-8 h-8 text-purple-500 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Win Rate</p>
                          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                            {playerAnalytics.monthly_stats.reduce((sum, stat) => sum + Number(stat.games_played), 0) > 0
                              ? ((playerAnalytics.monthly_stats.reduce((sum, stat) => sum + Number(stat.games_won), 0) / 
                                 playerAnalytics.monthly_stats.reduce((sum, stat) => sum + Number(stat.games_played), 0)) * 100).toFixed(1)
                              : '0.0'}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Performance */}
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Monthly Performance
                        </h3>
                      </div>
                      <div className="card-body">
                        <div className="h-80">
                          {getPlayerPerformanceData() && (
                            <Line 
                              data={getPlayerPerformanceData()!}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'top' as const,
                                  },
                                },
                                scales: {
                                  y: {
                                    type: 'linear' as const,
                                    display: true,
                                    position: 'left' as const,
                                    beginAtZero: true,
                                  },
                                  y1: {
                                    type: 'linear' as const,
                                    display: true,
                                    position: 'right' as const,
                                    beginAtZero: true,
                                    grid: {
                                      drawOnChartArea: false,
                                    },
                                  },
                                },
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Position Distribution */}
                    <div className="card">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Position Distribution
                        </h3>
                      </div>
                      <div className="card-body">
                        <div className="h-80">
                          {getPositionDistributionData() && (
                            <Doughnut 
                              data={getPositionDistributionData()!}
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
                  </div>

                  {/* Recent Games */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Games
                      </h3>
                    </div>
                    <div className="card-body">
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead className="table-header">
                            <tr>
                              <th className="table-header-cell">Date</th>
                              <th className="table-header-cell">Position</th>
                              <th className="table-header-cell">Result</th>
                            </tr>
                          </thead>
                          <tbody className="table-body">
                            {playerAnalytics.recent_performance.slice(0, 10).map((game, index) => (
                              <tr key={index} className="table-row">
                                <td className="table-cell">
                                  {format(new Date(game.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="table-cell">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    game.position === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                                    game.position === 2 ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                                    game.position === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    #{game.position}
                                  </span>
                                </td>
                                <td className="table-cell">
                                  <span className={`text-sm font-medium ${
                                    game.position === 1 ? 'text-success-600 dark:text-success-400' : 
                                    game.position <= 3 ? 'text-warning-600 dark:text-warning-400' : 
                                    'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {game.position === 1 ? '🏆 Winner' : 
                                     game.position <= 3 ? '🥉 Podium' : 
                                     'Participation'}
                                  </span>
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
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No analytics data available for this player
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Player Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingPlayer ? 'Edit Player' : 'Add New Player'}
      >
        <form onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                Player Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                required
                placeholder="Enter player name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="form-label">
                Email (Optional)
              </label>
              <input
                type="text"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                placeholder="Enter email address (optional)"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingPlayer ? 'Update Player' : 'Create Player'}
            </button>
          </div>
        </form>
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

export default Players; 