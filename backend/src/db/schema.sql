-- 3 Patti Leaderboard Database Schema (Position-Based Card Game)

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    location VARCHAR(255),
    game_type VARCHAR(100) DEFAULT '3 Patti',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Player game results table - Position-based only
CREATE TABLE IF NOT EXISTS player_game_results (
    id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- 1st, 2nd, 3rd, etc. (1 = winner, 2 = second, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, game_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_player_game_results_player_id ON player_game_results(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_results_game_id ON player_game_results(game_id);
CREATE INDEX IF NOT EXISTS idx_player_game_results_position ON player_game_results(position);

-- Create view for leaderboard statistics (position-based)
CREATE OR REPLACE VIEW leaderboard_stats AS
SELECT 
    p.id,
    p.name,
    p.avatar_url,
    COUNT(pgr.id) as total_games,
    SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END) as games_won,
    ROUND(
        (SUM(CASE WHEN pgr.position = 1 THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(pgr.id), 0) * 100), 2
    ) as win_rate,
    ROUND(AVG(pgr.position), 2) as avg_position,
    MIN(pgr.position) as best_position,
    MAX(pgr.position) as worst_position,
    MAX(g.date) as last_game_date,
    -- Calculate ranking score based on wins and consistency
    -- Lower average position is better (1 is best)
    (
        SUM(CASE WHEN pgr.position = 1 THEN 10 ELSE 0 END) + 
        SUM(CASE WHEN pgr.position = 2 THEN 5 ELSE 0 END) + 
        SUM(CASE WHEN pgr.position = 3 THEN 3 ELSE 0 END) + 
        SUM(CASE WHEN pgr.position = 4 THEN 1 ELSE 0 END) +
        -- Consistency bonus: lower average position gets bonus
        (10 - GREATEST(AVG(pgr.position), 1)) * COUNT(pgr.id) / 10.0
    ) as ranking_score
FROM players p
LEFT JOIN player_game_results pgr ON p.id = pgr.player_id
LEFT JOIN games g ON pgr.game_id = g.id
GROUP BY p.id, p.name, p.avatar_url
ORDER BY ranking_score DESC, games_won DESC, win_rate DESC, avg_position ASC;

-- Create view for recent games
CREATE OR REPLACE VIEW recent_games AS
SELECT 
    g.id,
    g.date,
    g.location,
    g.game_type,
    g.notes,
    json_agg(
        json_build_object(
            'player_id', p.id,
            'player_name', p.name,
            'position', pgr.position
        ) ORDER BY pgr.position
    ) as results
FROM games g
LEFT JOIN player_game_results pgr ON g.id = pgr.game_id
LEFT JOIN players p ON pgr.player_id = p.id
GROUP BY g.id, g.date, g.location, g.game_type, g.notes
ORDER BY g.date DESC, g.id DESC; 