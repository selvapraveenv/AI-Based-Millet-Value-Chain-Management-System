/**
 * Traceability Routes - Handles supply chain traceability
 * 
 * Endpoints:
 * 1. GET /api/traceability/:batchId - Get complete traceability info for a batch
 */

import express from 'express';
import { getTraceabilityData } from '../services/traceability.service.js';

const router = express.Router();

/**
 * GET /api/traceability/:batchId
 * Get complete farm-to-table traceability information
 * 
 * Params:
 *   batchId: string (batch/product identifier)
 */
router.get('/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({
        error: 'Batch ID is required'
      });
    }

    // Get traceability data aggregated from multiple collections
    const traceability = await getTraceabilityData(batchId);

    res.json(traceability);
  } catch (error) {
    console.error('Traceability error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Batch not found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to retrieve traceability data',
      message: error.message
    });
  }
});

export default router;
