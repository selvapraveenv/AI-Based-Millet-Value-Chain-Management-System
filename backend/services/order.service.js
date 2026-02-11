/**
 * Order Service - Business logic for order workflow
 * 
 * Handles order status transitions with role-based permissions
 */

import { getFirestore, Collections } from '../config/firebase.js';

/**
 * ORDER STATUS FLOW:
 * placed -> confirmed -> processing -> shipped -> delivered
 *                  |
 *                  └---> cancelled
 */

/**
 * ROLE-BASED PERMISSIONS
 * Defines which roles can transition to which statuses
 */
const STATUS_PERMISSIONS = {
  'placed': {
    allowedRoles: ['consumer'], // Only consumers create orders
    nextStatuses: ['confirmed', 'cancelled']
  },
  'confirmed': {
    allowedRoles: ['farmer', 'shg', 'admin'], // Sellers confirm orders
    nextStatuses: ['processing', 'cancelled']
  },
  'processing': {
    allowedRoles: ['shg', 'admin'], // SHG processes the batch
    nextStatuses: ['shipped', 'cancelled']
  },
  'shipped': {
    allowedRoles: ['shg', 'admin'], // Shipping initiated
    nextStatuses: ['delivered']
  },
  'delivered': {
    allowedRoles: ['consumer', 'admin'], // Consumer confirms delivery
    nextStatuses: [] // Final status
  },
  'cancelled': {
    allowedRoles: ['consumer', 'farmer', 'shg', 'admin'],
    nextStatuses: [] // Final status
  }
};

/**
 * Update order status with business logic validation
 * 
 * @param {Object} params - Order update parameters
 * @returns {Object} Update result
 */
export async function updateOrderStatus({ orderId, newStatus, userId, userRole, reason }) {
  const db = getFirestore();

  try {
    // Step 1: Get current order data
    const orderRef = db.collection(Collections.ORDERS).doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    // Step 2: Validate if status transition is allowed
    const currentStatusConfig = STATUS_PERMISSIONS[currentStatus];
    
    if (!currentStatusConfig) {
      throw new Error('Invalid current order status');
    }

    // Check if new status is a valid next status
    if (!currentStatusConfig.nextStatuses.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: Cannot change from '${currentStatus}' to '${newStatus}'. ` +
        `Allowed next statuses: ${currentStatusConfig.nextStatuses.join(', ')}`
      );
    }

    // Step 3: Check role permissions for the new status
    const newStatusConfig = STATUS_PERMISSIONS[newStatus];
    
    if (!newStatusConfig.allowedRoles.includes(userRole)) {
      throw new Error(
        `User role '${userRole}' is not allowed to set status to '${newStatus}'. ` +
        `Allowed roles: ${newStatusConfig.allowedRoles.join(', ')}`
      );
    }

    // Step 4: Additional business logic validations

    // For cancellations, require a reason
    if (newStatus === 'cancelled' && !reason) {
      throw new Error('Cancellation reason is required');
    }

    // For delivered status, ensure it was shipped first
    if (newStatus === 'delivered' && currentStatus !== 'shipped') {
      throw new Error('Order must be shipped before marking as delivered');
    }

    // Step 5: Update the order in Firestore
    const updateData = {
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: userId,
      lastStatusChange: {
        from: currentStatus,
        to: newStatus,
        timestamp: new Date(),
        userId,
        userRole,
        reason: reason || null
      }
    };

    // Add to status history
    const statusHistory = orderData.statusHistory || [];
    statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      userId,
      userRole,
      reason: reason || null
    });
    updateData.statusHistory = statusHistory;

    // Special handling for different statuses
    if (newStatus === 'confirmed') {
      updateData.confirmedAt = new Date();
    } else if (newStatus === 'shipped') {
      updateData.shippedAt = new Date();
    } else if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date();
      updateData.completedAt = new Date();
    } else if (newStatus === 'cancelled') {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = reason;
    }

    await orderRef.update(updateData);

    // Step 6: Create notification (could be expanded to actually send notifications)
    await createOrderNotification({
      orderId,
      userId: orderData.userId,
      status: newStatus,
      message: `Your order #${orderId} is now ${newStatus}`
    });

    return {
      success: true,
      orderId,
      previousStatus: currentStatus,
      newStatus,
      updatedAt: updateData.updatedAt.toISOString(),
      message: `Order status successfully updated from '${currentStatus}' to '${newStatus}'`,
      order: {
        ...orderData,
        ...updateData
      }
    };

  } catch (error) {
    console.error('Order status update error:', error);
    throw error;
  }
}

/**
 * Create a notification for order status change
 * (Simplified - stores in Firestore, could integrate with push notifications)
 */
async function createOrderNotification({ orderId, userId, status, message }) {
  const db = getFirestore();
  
  try {
    await db.collection('notifications').add({
      type: 'order_update',
      orderId,
      userId,
      status,
      message,
      read: false,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't throw - notification is not critical
  }
}
