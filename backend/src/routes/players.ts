import express, { Request, Response } from 'express';
import pool from '../db/connection';
import { Player, CreatePlayerRequest, UpdatePlayerRequest, ApiResponse } from '../types';
import { z } from 'zod';

const router = express.Router();

// Helper function to handle optional strings (convert empty strings to undefined)
const optionalString = (validator: z.ZodString) => 
  z.preprocess((val) => val === '' ? undefined : val, validator.optional());

// Validation schemas
const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: optionalString(z.string().email('Invalid email')),
  avatar_url: optionalString(z.string().url('Invalid URL')),
});

const updatePlayerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  email: optionalString(z.string().email('Invalid email')),
  avatar_url: optionalString(z.string().url('Invalid URL')),
});

// GET /api/players - Get all players
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM players ORDER BY name ASC'
    );
    
    const response: ApiResponse<Player[]> = {
      success: true,
      data: result.rows,
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch players',
    });
  }
});

// GET /api/players/:id - Get player by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }
    
    const response: ApiResponse<Player> = {
      success: true,
      data: result.rows[0],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player',
    });
  }
});

// POST /api/players - Create new player
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createPlayerSchema.parse(req.body);
    
    const result = await pool.query(
      'INSERT INTO players (name, email, avatar_url) VALUES ($1, $2, $3) RETURNING *',
      [validatedData.name, validatedData.email, validatedData.avatar_url]
    );
    
    const response: ApiResponse<Player> = {
      success: true,
      data: result.rows[0],
      message: 'Player created successfully',
    };
    
    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create player error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'Player with this name already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create player',
    });
  }
});

// PUT /api/players/:id - Update player
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updatePlayerSchema.parse(req.body);
    
    // Check if player exists
    const existingPlayer = await pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    );
    
    if (existingPlayer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    if (validatedData.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(validatedData.name);
    }
    
    if (validatedData.email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      updateValues.push(validatedData.email);
    }
    
    if (validatedData.avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      updateValues.push(validatedData.avatar_url);
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id);
    
    const query = `UPDATE players SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, updateValues);
    
    const response: ApiResponse<Player> = {
      success: true,
      data: result.rows[0],
      message: 'Player updated successfully',
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Update player error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: 'Player with this name already exists',
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update player',
    });
  }
});

// DELETE /api/players/:id - Delete player
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM players WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Player not found',
      });
    }
    
    const response: ApiResponse<null> = {
      success: true,
      message: 'Player deleted successfully',
    };
    
    res.json(response);
  } catch (error) {
    console.error('Delete player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete player',
    });
  }
});

export default router; 