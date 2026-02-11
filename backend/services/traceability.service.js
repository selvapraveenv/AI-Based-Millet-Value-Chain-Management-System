/**
 * Traceability Service - Farm-to-table tracking
 * 
 * Aggregates data from multiple Firestore collections to provide
 * complete supply chain traceability
 */

import { getFirestore, Collections } from '../config/firebase.js';

/**
 * Get complete traceability information for a batch/product
 * 
 * Traces the journey:
 * Farmer -> Listing -> Order -> SHG -> Batch -> Processing -> Product -> Consumer
 * 
 * @param {string} batchId - Batch or product identifier
 * @returns {Object} Complete traceability data
 */
export async function getTraceabilityData(batchId) {
  const db = getFirestore();

  try {
    // Step 1: Get batch/product information
    const batchDoc = await db.collection(Collections.BATCHES).doc(batchId).get();
    
    if (!batchDoc.exists) {
      // Try looking in products collection
      const productDoc = await db.collection(Collections.PRODUCTS).doc(batchId).get();
      
      if (!productDoc.exists) {
        throw new Error('Batch or product not found');
      }
      
      return await traceProduct(batchId, productDoc.data());
    }

    return await traceBatch(batchId, batchDoc.data());

  } catch (error) {
    console.error('Traceability error:', error);
    throw error;
  }
}

/**
 * Trace a processing batch back to source
 */
async function traceBatch(batchId, batchData) {
  const db = getFirestore();
  const timeline = [];

  // Get source orders for this batch
  const ordersSnapshot = await db.collection(Collections.ORDERS)
    .where('batchId', '==', batchId)
    .get();

  const farmerDetails = [];
  const listingDetails = [];

  // Trace each order back to farmer
  for (const orderDoc of ordersSnapshot.docs) {
    const order = orderDoc.data();
    
    timeline.push({
      stage: 'Order Placed',
      timestamp: order.createdAt?.toDate() || new Date(),
      details: {
        orderId: orderDoc.id,
        quantity: order.quantity,
        milletType: order.milletType
      }
    });

    // Get listing details
    if (order.listingId) {
      const listingDoc = await db.collection(Collections.LISTINGS).doc(order.listingId).get();
      if (listingDoc.exists) {
        const listing = listingDoc.data();
        listingDetails.push(listing);

        timeline.push({
          stage: 'Source Listing',
          timestamp: listing.createdAt?.toDate() || new Date(),
          details: {
            listingId: order.listingId,
            farmLocation: listing.location,
            harvestDate: listing.harvestDate
          }
        });

        // Get farmer details
        if (listing.farmerId) {
          const farmerDoc = await db.collection(Collections.FARMERS).doc(listing.farmerId).get();
          if (farmerDoc.exists) {
            farmerDetails.push({
              ...farmerDoc.data(),
              farmerId: listing.farmerId
            });

            timeline.push({
              stage: 'Farm Origin',
              timestamp: listing.harvestDate?.toDate() || listing.createdAt?.toDate() || new Date(),
              details: {
                farmerId: listing.farmerId,
                farmerName: farmerDoc.data().name,
                location: listing.location
              }
            });
          }
        }
      }
    }
  }

  // Add batch processing stages
  timeline.push({
    stage: 'Batch Created',
    timestamp: batchData.createdAt?.toDate() || new Date(),
    details: {
      batchId,
      shgId: batchData.shgId,
      totalQuantity: batchData.quantity
    }
  });

  if (batchData.processingStarted) {
    timeline.push({
      stage: 'Processing Started',
      timestamp: batchData.processingStartedAt?.toDate() || new Date(),
      details: {
        processType: batchData.processType
      }
    });
  }

  if (batchData.qualityChecked) {
    timeline.push({
      stage: 'Quality Check',
      timestamp: batchData.qualityCheckedAt?.toDate() || new Date(),
      details: {
        status: batchData.qualityStatus,
        score: batchData.qualityScore
      }
    });
  }

  if (batchData.packaged) {
    timeline.push({
      stage: 'Packaging Complete',
      timestamp: batchData.packagedAt?.toDate() || new Date(),
      details: {
        packageType: batchData.packageType,
        units: batchData.units
      }
    });
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => a.timestamp - b.timestamp);

  // Get SHG details
  let shgDetails = null;
  if (batchData.shgId) {
    const shgDoc = await db.collection(Collections.SHGS).doc(batchData.shgId).get();
    if (shgDoc.exists) {
      shgDetails = {
        ...shgDoc.data(),
        shgId: batchData.shgId
      };
    }
  }

  return {
    success: true,
    batchId,
    type: 'batch',
    milletType: batchData.milletType,
    currentStatus: batchData.status,
    
    // Farm origin
    farmers: farmerDetails.map(f => ({
      id: f.farmerId,
      name: f.name,
      location: f.location,
      contactVerified: f.verified || false
    })),

    // Source listings
    sourceMaterial: listingDetails.map(l => ({
      quantity: l.quantity,
      quality: l.quality,
      harvestDate: l.harvestDate?.toDate() || null
    })),

    // Processing unit
    processor: shgDetails ? {
      id: shgDetails.shgId,
      name: shgDetails.name,
      location: shgDetails.location,
      certified: shgDetails.certified || false
    } : null,

    // Processing details
    processing: {
      batchSize: batchData.quantity,
      processType: batchData.processType,
      qualityScore: batchData.qualityScore,
      certifications: batchData.certifications || []
    },

    // Complete timeline
    timeline: timeline.map(t => ({
      ...t,
      timestamp: t.timestamp.toISOString()
    })),

    // Verification
    verification: {
      dataPoints: timeline.length,
      verified: timeline.length >= 3, // At least farm, processing, quality check
      lastUpdated: new Date().toISOString()
    }
  };
}

/**
 * Trace a finished product
 */
async function traceProduct(productId, productData) {
  const db = getFirestore();

  // Products are derived from batches, so trace the batch
  if (productData.batchId) {
    const batchDoc = await db.collection(Collections.BATCHES).doc(productData.batchId).get();
    
    if (batchDoc.exists) {
      const batchTrace = await traceBatch(productData.batchId, batchDoc.data());
      
      // Add product-specific information
      return {
        ...batchTrace,
        type: 'product',
        productId,
        productName: productData.name,
        productDetails: {
          price: productData.price,
          packaging: productData.packaging,
          weight: productData.weight,
          certifications: productData.certifications || []
        }
      };
    }
  }

  // If no batch link, return basic product info
  return {
    success: true,
    productId,
    type: 'product',
    productName: productData.name,
    milletType: productData.milletType,
    warning: 'Complete traceability data not available - batch information missing',
    productDetails: {
      price: productData.price,
      packaging: productData.packaging,
      weight: productData.weight
    }
  };
}
