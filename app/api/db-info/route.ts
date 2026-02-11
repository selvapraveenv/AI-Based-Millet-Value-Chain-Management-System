// API Route to check database collections
// Access via: http://localhost:3000/api/db-info

import { NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COLLECTIONS = [
  'users',
  'farmers',
  'shgs',
  'listings',
  'products',
  'orders',
  'batches',
  'requests',
  'notifications',
  'priceHistory',
  'qualityChecks',
  'qualityReviews',
  'payments',
];

export async function GET() {
  try {
    const results: Record<string, { count: number; sampleIds: string[] }> = {};

    for (const col of COLLECTIONS) {
      const snapshot = await getDocs(collection(db, col));
      results[col] = {
        count: snapshot.size,
        sampleIds: snapshot.docs.slice(0, 3).map(d => d.id),
      };
    }

    const totalDocs = Object.values(results).reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      status: 'connected',
      totalCollections: Object.keys(results).filter(k => results[k].count > 0).length,
      totalDocuments: totalDocs,
      collections: results,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error', 
      message: error.message 
    }, { status: 500 });
  }
}
