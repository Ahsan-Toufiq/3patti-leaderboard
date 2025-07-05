import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { playersApi, gamesApi } from '../services/api';
import { Player, GameFormData } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const AddGame: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<GameFormData>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    game_type: '3 Patti',
    notes: '',
    results: [
      { player_id: 0, position: 1 },
      { player_id: 0, position: 2 },
    ],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = await playersApi.getAll();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    setFormData({
      ...formData,
      results: [
        ...formData.results,
        {
          player_id: 0,
          position: formData.results.length + 1,
        },
      ],
    });
  };

  const removePlayer = (index: number) => {
    if (formData.results.length <= 2) {
      toast.error('You need at least 2 players');
      return;
    }

    const newResults = formData.results.filter((_, i) => i !== index);
    // Update positions to be sequential
    const updatedResults = newResults.map((result, i) => ({
      ...result,
      position: i + 1,
    }));

    setFormData({
      ...formData,
      results: updatedResults,
    });
  };

  const updateResult = (index: number, field: keyof typeof formData.results[0], value: any) => {
    const newResults = [...formData.results];
    newResults[index] = { ...newResults[index], [field]: value };
    setFormData({ ...formData, results: newResults });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate results
    formData.results.forEach((result, index) => {
      if (!result.player_id) {
        newErrors[`result_${index}_player`] = 'Player is required';
      }
    });

    // Check for duplicate players
    const playerIds = formData.results.map(r => r.player_id).filter(id => id > 0);
    const uniquePlayerIds = Array.from(new Set(playerIds));
    if (playerIds.length !== uniquePlayerIds.length) {
      newErrors.duplicate_players = 'Each player can only be selected once';
    }

    // Ensure positions are sequential starting from 1
    const positions = formData.results.map(r => r.position).sort((a, b) => a - b);
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        newErrors.positions = 'Positions must be sequential starting from 1st place';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);

      const gameData = {
        date: formData.date,
        location: formData.location || undefined,
        game_type: formData.game_type || '3 Patti',
        notes: formData.notes || undefined,
        results: formData.results,
      };

      await gamesApi.create(gameData);
      toast.success('Game added successfully!');
      navigate('/games');
    } catch (error: any) {
      console.error('Error creating game:', error);
      toast.error(error.response?.data?.message || 'Failed to add game');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Add New Game
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Record the finishing positions from your latest 3 Patti game
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Game Details
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="form-label">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                  required
                />
                {errors.date && <p className="form-error">{errors.date}</p>}
              </div>

              <div>
                <label htmlFor="location" className="form-label">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Home, Club, Community Center"
                />
              </div>

              <div>
                <label htmlFor="game_type" className="form-label">
                  Game Type
                </label>
                <select
                  id="game_type"
                  value={formData.game_type}
                  onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}
                  className="form-select"
                >
                  <option value="3 Patti">3 Patti</option>
                  <option value="Teen Patti">Teen Patti</option>
                  <option value="Flash">Flash</option>
                  <option value="Tournament">Tournament</option>
                </select>
              </div>

              <div>
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Any additional notes about the game"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Players and Results */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Finishing Positions
              </h2>
              <button
                type="button"
                onClick={addPlayer}
                className="btn btn-primary btn-sm"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Add Player
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Enter players in order of when they finished (emptied their hand)
            </p>
          </div>
          <div className="card-body">
            {errors.duplicate_players && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.duplicate_players}
                </p>
              </div>
            )}

            {errors.positions && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.positions}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {formData.results.map((result, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {result.position === 1 ? '🏆 1st Place - Winner!' : 
                       result.position === 2 ? '🥈 2nd Place' : 
                       result.position === 3 ? '🥉 3rd Place' : 
                       `${result.position}${result.position === 4 ? 'th' : result.position === 5 ? 'th' : result.position === 6 ? 'th' : 'th'} Place`}
                    </h3>
                    {formData.results.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        className="btn btn-danger btn-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Player *</label>
                    <select
                      value={result.player_id}
                      onChange={(e) => updateResult(index, 'player_id', Number(e.target.value))}
                      className="form-select"
                      required
                    >
                      <option value="">Select a player</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                    {errors[`result_${index}_player`] && (
                      <p className="form-error">{errors[`result_${index}_player`]}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {result.position === 1 ? 'First player to empty their hand' :
                       result.position === 2 ? 'Second player to finish' :
                       result.position === 3 ? 'Third player to finish' :
                       `${result.position}th player to finish`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                How 3 Patti Works
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  In 3 Patti, players are ranked by the order they finish (empty their hand). 
                  The first player to finish gets 1st place, the second gets 2nd place, and so on. 
                  There are no points or scores - only finishing positions matter.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/games')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Adding Game...
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Game
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGame; 
 