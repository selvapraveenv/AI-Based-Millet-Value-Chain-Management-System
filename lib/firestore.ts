import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, Timestamp, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// TYPES
// ============================================
export interface Listing {
  id?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  milletType: string;
  quantity: number;
  unit: string;
  location: string;
  taluk: string;
  pricePerKg: number;
  status: 'active' | 'sold' | 'expired';
  quality: string;
  harvestDate: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedBy: string;
  verifiedByName: string;
  verifiedImage: string;
  verificationDate: any;
  verificationNotes: string;
  createdAt: any;
}

export interface Order {
  id?: string;
  listingId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  quantity: number;
  unit: string;
  pricePerKg: number;
  totalPrice: number;
  status: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: any;
  deliveryDate?: any;
  deliveryAddress: string;
}

export interface Verification {
  id?: string;
  listingId: string;
  farmerId: string;
  farmerName: string;
  milletType: string;
  quantity: number;
  shgId: string;
  shgName: string;
  taluk: string;
  status: 'verified' | 'rejected';
  verifiedImage: string;
  notes: string;
  verifiedAt: any;
  createdAt: any;
}

export interface Dispute {
  id?: string;
  orderId: string;
  consumerId: string;
  consumerName: string;
  farmerId: string;
  farmerName: string;
  productName: string;
  reason: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: any;
  resolvedAt: any;
  resolution: string;
}

export interface UserDoc {
  id?: string;
  name: string;
  phone: string;
  role: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  email: string;
  password: string;
  verified: boolean;
  taluk?: string;
  assignedTaluks?: string[];
  status?: string;
  createdAt: any;
}

// ============================================
// FARMER FUNCTIONS
// ============================================

export async function getListingsByFarmer(farmerId: string): Promise<Listing[]> {
  try {
    const q = query(collection(db, 'listings'), where('farmerId', '==', farmerId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
  } catch {
    const snap = await getDocs(collection(db, 'listings'));
    return snap.docs.filter(d => d.data().farmerId === farmerId).map(d => ({ id: d.id, ...d.data() } as Listing));
  }
}

export async function createListing(data: Omit<Listing, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'listings'), { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function deleteListing(id: string): Promise<void> {
  await deleteDoc(doc(db, 'listings', id));
}

export async function updateListing(id: string, data: Partial<Listing>): Promise<void> {
  await updateDoc(doc(db, 'listings', id), data as any);
}

export async function getFarmerDashboardStats(farmerId: string) {
  try {
    const listingsSnap = await getDocs(query(collection(db, 'listings'), where('farmerId', '==', farmerId)));
    const ordersSnap = await getDocs(query(collection(db, 'orders'), where('sellerId', '==', farmerId)));
    const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('farmerId', '==', farmerId)));
    const listings = listingsSnap.docs.map(d => d.data());
    const orders = ordersSnap.docs.map(d => d.data());
    const payments = paymentsSnap.docs.map(d => d.data());
    return {
      activeListings: listings.filter(l => l.status === 'active').length,
      verifiedListings: listings.filter(l => l.verificationStatus === 'verified').length,
      pendingVerification: listings.filter(l => l.verificationStatus === 'pending').length,
      activeOrders: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
      totalEarnings: payments.filter(p => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
    };
  } catch {
    return { activeListings: 0, verifiedListings: 0, pendingVerification: 0, activeOrders: 0, totalEarnings: 0 };
  }
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch {
    return [];
  }
}

export async function getFarmerPayments(farmerId: string) {
  try {
    const snap = await getDocs(query(collection(db, 'payments'), where('farmerId', '==', farmerId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

export async function getFarmerPaymentStats(farmerId: string) {
  try {
    const snap = await getDocs(query(collection(db, 'payments'), where('farmerId', '==', farmerId)));
    const payments = snap.docs.map(d => d.data());
    const completed = payments.filter(p => p.status === 'completed');
    const pending = payments.filter(p => p.status === 'pending');
    return {
      totalEarnings: completed.reduce((s: number, p: any) => s + (p.amount || 0), 0),
      pendingPayments: pending.reduce((s: number, p: any) => s + (p.amount || 0), 0),
      thisMonth: completed.reduce((s: number, p: any) => s + (p.amount || 0), 0),
    };
  } catch {
    return { totalEarnings: 0, pendingPayments: 0, thisMonth: 0 };
  }
}

// ============================================
// SHG FUNCTIONS (Quality Verifier)
// ============================================

export async function getPendingVerifications(taluks: string[]): Promise<Listing[]> {
  try {
    const snap = await getDocs(collection(db, 'listings'));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Listing))
      .filter(l => l.verificationStatus === 'pending' && taluks.includes(l.taluk));
  } catch {
    return [];
  }
}

export async function getVerifiedByShg(shgId: string): Promise<Listing[]> {
  try {
    const snap = await getDocs(query(collection(db, 'listings'), where('verifiedBy', '==', shgId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
  } catch {
    return [];
  }
}

export async function verifyListing(
  listingId: string, shgId: string, shgName: string,
  status: 'verified' | 'rejected', notes: string, imageUrl: string,
  farmerName: string, milletType: string, quantity: number, taluk: string, farmerId: string
): Promise<void> {
  await updateDoc(doc(db, 'listings', listingId), {
    verificationStatus: status,
    verifiedBy: shgId,
    verifiedByName: shgName,
    verifiedImage: imageUrl || '/placeholder.jpg',
    verificationDate: serverTimestamp(),
    verificationNotes: notes,
  });
  await addDoc(collection(db, 'verifications'), {
    listingId, farmerId, farmerName, milletType, quantity,
    shgId, shgName, taluk, status, verifiedImage: imageUrl || '/placeholder.jpg',
    notes, verifiedAt: serverTimestamp(), createdAt: serverTimestamp(),
  });
}

export async function getVerificationHistory(shgId: string): Promise<Verification[]> {
  try {
    const snap = await getDocs(query(collection(db, 'verifications'), where('shgId', '==', shgId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Verification));
  } catch {
    return [];
  }
}

export async function getSHGDashboardStats(shgId: string, taluks: string[]) {
  try {
    const allListings = await getDocs(collection(db, 'listings'));
    const listings = allListings.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[];
    const pending = listings.filter(l => l.verificationStatus === 'pending' && taluks.includes(l.taluk));
    const verified = listings.filter(l => l.verifiedBy === shgId && l.verificationStatus === 'verified');
    const rejected = listings.filter(l => l.verifiedBy === shgId && l.verificationStatus === 'rejected');
    return {
      pendingCount: pending.length,
      verifiedCount: verified.length,
      rejectedCount: rejected.length,
      totalReviewed: verified.length + rejected.length,
    };
  } catch {
    return { pendingCount: 0, verifiedCount: 0, rejectedCount: 0, totalReviewed: 0 };
  }
}

// ============================================
// CONSUMER FUNCTIONS
// ============================================

export async function getVerifiedListings(): Promise<Listing[]> {
  try {
    const snap = await getDocs(query(collection(db, 'listings'), where('verificationStatus', '==', 'verified'), where('status', '==', 'active')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing));
  } catch {
    const snap = await getDocs(collection(db, 'listings'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)).filter(l => l.verificationStatus === 'verified' && l.status === 'active');
  }
}

export async function createOrder(data: Omit<Order, 'id' | 'orderDate'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'orders'), { ...data, orderDate: serverTimestamp(), status: 'placed' });
  return docRef.id;
}

export async function getOrdersByBuyer(buyerId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
  } catch {
    return [];
  }
}

export async function getConsumerDashboardStats(consumerId: string) {
  try {
    const verifiedSnap = await getDocs(query(collection(db, 'listings'), where('verificationStatus', '==', 'verified'), where('status', '==', 'active')));
    const ordersSnap = await getDocs(query(collection(db, 'orders'), where('buyerId', '==', consumerId)));
    const orders = ordersSnap.docs.map(d => d.data());
    return {
      cropsAvailable: verifiedSnap.size,
      yourOrders: orders.length,
      activeDeliveries: orders.filter(o => ['processing', 'shipped'].includes(o.status)).length,
    };
  } catch {
    return { cropsAvailable: 0, yourOrders: 0, activeDeliveries: 0 };
  }
}

export async function getOrdersForTracking(consumerId: string) {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), where('buyerId', '==', consumerId)));
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    return orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).map(o => ({
      id: o.id,
      product: o.productName,
      farmer: o.sellerName,
      quantity: o.quantity + ' ' + o.unit,
      price: o.totalPrice,
      currentStatus: o.status,
      estimatedDelivery: '3-5 days',
      timeline: [
        { status: 'Order Placed', completed: true, date: 'Confirmed', time: '' },
        { status: 'Processing', completed: ['processing', 'shipped', 'delivered'].includes(o.status), date: o.status === 'placed' ? 'Pending' : 'Done', time: '' },
        { status: 'Shipped', completed: ['shipped', 'delivered'].includes(o.status), date: ['shipped', 'delivered'].includes(o.status) ? 'Done' : 'Pending', time: '' },
        { status: 'Delivered', completed: o.status === 'delivered', date: o.status === 'delivered' ? 'Done' : 'Pending', time: '' },
      ],
    }));
  } catch {
    return [];
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export async function getAllUsers(): Promise<UserDoc[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserDoc));
}

export async function updateUser(id: string, data: Partial<UserDoc>): Promise<void> {
  await updateDoc(doc(db, 'users', id), data as any);
}

export async function deleteUserDoc(id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', id));
}

export async function getAllDisputes(): Promise<Dispute[]> {
  const snap = await getDocs(collection(db, 'disputes'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Dispute));
}

export async function updateDispute(id: string, data: Partial<Dispute>): Promise<void> {
  await updateDoc(doc(db, 'disputes', id), data as any);
}

export async function getAdminDashboardStats() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const listingsSnap = await getDocs(collection(db, 'listings'));
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const disputesSnap = await getDocs(collection(db, 'disputes'));
    const users = usersSnap.docs.map(d => d.data());
    const listings = listingsSnap.docs.map(d => d.data());
    const orders = ordersSnap.docs.map(d => d.data());
    const disputes = disputesSnap.docs.map(d => d.data());
    return {
      totalFarmers: users.filter(u => u.role === 'farmer').length,
      totalSHGs: users.filter(u => u.role === 'shg').length,
      totalConsumers: users.filter(u => u.role === 'consumer').length,
      totalListings: listings.length,
      verifiedListings: listings.filter(l => l.verificationStatus === 'verified').length,
      pendingVerifications: listings.filter(l => l.verificationStatus === 'pending').length,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0),
      openDisputes: disputes.filter(d => d.status === 'open').length,
      resolvedDisputes: disputes.filter(d => d.status === 'resolved').length,
    };
  } catch {
    return { totalFarmers: 0, totalSHGs: 0, totalConsumers: 0, totalListings: 0, verifiedListings: 0, pendingVerifications: 0, totalOrders: 0, totalRevenue: 0, openDisputes: 0, resolvedDisputes: 0 };
  }
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(collection(db, 'orders'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const updateData: any = { status };
  if (status === 'delivered') updateData.deliveryDate = serverTimestamp();
  await updateDoc(doc(db, 'orders', id), updateData);
}

export async function getAnalyticsData() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const listingsSnap = await getDocs(collection(db, 'listings'));
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const users = usersSnap.docs.map(d => d.data());
    const listings = listingsSnap.docs.map(d => d.data());
    const orders = ordersSnap.docs.map(d => d.data());
    const totalRevenue = orders.reduce((s: number, o: any) => s + (o.totalPrice || 0), 0);
    const milletCounts: Record<string, number> = {};
    listings.forEach(l => { milletCounts[l.milletType] = (milletCounts[l.milletType] || 0) + 1; });
    const total = Object.values(milletCounts).reduce((a, b) => a + b, 0) || 1;
    const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
    const milletDistribution = Object.entries(milletCounts).map(([name, value], i) => ({
      name, value: Math.round((value / total) * 100),
      color: colors[i % 5],
    }));
    return {
      totalRevenue, revenueGrowth: 18,
      activeUsers: users.length, userGrowth: 12,
      verifiedCrops: listings.filter(l => l.verificationStatus === 'verified').length, cropGrowth: 22,
      totalOrders: orders.length, orderGrowth: 15,
      monthlyData: [
        { month: 'Jul', farmers: 10, orders: 5 }, { month: 'Aug', farmers: 15, orders: 8 },
        { month: 'Sep', farmers: 20, orders: 12 }, { month: 'Oct', farmers: 25, orders: 18 },
        { month: 'Nov', farmers: 30, orders: 22 }, { month: 'Dec', farmers: users.filter(u => u.role === 'farmer').length, orders: orders.length },
      ],
      milletDistribution,
      revenueData: [
        { month: 'Jul', revenue: 5000 }, { month: 'Aug', revenue: 8000 },
        { month: 'Sep', revenue: 12000 }, { month: 'Oct', revenue: 15000 },
        { month: 'Nov', revenue: 20000 }, { month: 'Dec', revenue: totalRevenue },
      ],
      regionData: [
        { region: 'Bengaluru Rural', farmers: users.filter(u => u.role === 'farmer' && u.district === 'Bengaluru Rural').length },
        { region: 'Tumkur', farmers: users.filter(u => u.role === 'farmer' && u.district === 'Tumkur').length },
        { region: 'Mysuru', farmers: users.filter(u => u.role === 'farmer' && u.district === 'Mysuru').length },
        { region: 'Hassan', farmers: users.filter(u => u.role === 'farmer' && u.district === 'Hassan').length },
        { region: 'Mandya', farmers: users.filter(u => u.role === 'farmer' && u.district === 'Mandya').length },
      ],
    };
  } catch {
    return {
      totalRevenue: 0, revenueGrowth: 0, activeUsers: 0, userGrowth: 0,
      verifiedCrops: 0, cropGrowth: 0, totalOrders: 0, orderGrowth: 0,
      monthlyData: [], milletDistribution: [], revenueData: [], regionData: [],
    };
  }
}
