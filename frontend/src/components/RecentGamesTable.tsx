import React from 'react';
import { format } from 'date-fns';
import { GameWithResults } from '../types';

interface RecentGamesTableProps {
  games: GameWithResults[];
}

const RecentGamesTable: React.FC<RecentGamesTableProps> = ({ games }) => {
  if (games.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No recent games found</p>
      </div>
    );
  }

  const getPositionDisplay = (position: number) => {
    switch (position) {
      case 1:
        return { text: '🏆 Winner', class: 'text-yellow-600 dark:text-yellow-400' };
      case 2:
        return { text: '🥈 2nd Place', class: 'text-gray-600 dark:text-gray-400' };
      case 3:
        return { text: '🥉 3rd Place', class: 'text-orange-600 dark:text-orange-400' };
      default:
        return { text: `${position}th Place`, class: 'text-gray-600 dark:text-gray-400' };
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead className="table-header">
          <tr>
            <th className="table-header-cell">Date</th>
            <th className="table-header-cell">Winner</th>
            <th className="table-header-cell">Players</th>
            <th className="table-header-cell">Game Type</th>
            <th className="table-header-cell">Results</th>
          </tr>
        </thead>
        <tbody className="table-body">
          {games.map((game) => {
            const winner = game.results.find(r => r.position === 1);
            
            return (
              <tr key={game.id} className="table-row">
                <td className="table-cell">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {format(new Date(game.date), 'MMM dd, yyyy')}
                  </div>
                  {game.location && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {game.location}
                    </div>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      🏆
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {winner?.player_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        First to finish
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {game.results.length} players
                  </div>
                </td>
                <td className="table-cell">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {game.game_type || '3 Patti'}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1">
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
                          #{result.position}
                        </span>
                      );
                    })}
                    {game.results.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        +{game.results.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecentGamesTable; 