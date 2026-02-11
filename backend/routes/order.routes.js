/**
 * Order Routes - Handles order workflow logic
 * 
 * Endpoints:
 * 1. POST /api/orders/update-status - Update order status with business logic
 */

import express from 'express';
import { updateOrderStatus } from '../services/order.service.js';

const router = express.Router();

/**
 * POST /api/orders/update-status
 * Update order status with validation and business logic
 * 
 * Body: {
 *   orderId: string
 *   newStatus: string ("placed", "confirmed", "processing", "shipped", "delivered", "cancelled")
 *   userId: string (user making the change)
 *   userRole: string ("farmer", "shg", "consumer", "admin")
 *   reason: string (optional, for cancellations)
 * }
 */
router.post('/update-status', async (req, res) => {
  try {
    const { orderId, newStatus, userId, userRole, reason } = req.body;

    // Validate input
    if (!orderId || !newStatus || !userId || !userRole) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['orderId', 'newStatus', 'userId', 'userRole']
      });
    }

    // Validate status value
    const validStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Update order status with business logic validation
    const result = await updateOrderStatus({
      orderId,
      newStatus,
      userId,
      userRole,
      reason
    });

    res.json(result);
  } catch (error) {
    console.error('Order update error:', error);
    
    // Handle specific business logic errors
    if (error.message.includes('not allowed') || error.message.includes('Invalid')) {
      return res.status(403).json({
        error: 'Status update not allowed',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to update order status',
      message: error.message
    });
  }
});

export default router;
