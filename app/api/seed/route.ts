import { NextResponse } from 'next/server';
import { collection, addDoc, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const usersData = [
  { name: 'Admin User', phone: '9000000001', role: 'admin', address: 'MilletChain HQ, MG Road', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001', email: 'admin@milletchain.com', password: 'admin123', verified: true, createdAt: Timestamp.now() },
  { name: 'Ramesh Kumar', phone: '9876543210', role: 'farmer', address: 'Village Kote, Devanahalli Taluk', district: 'Bengaluru Rural', state: 'Karnataka', pincode: '562110', email: 'ramesh@example.com', password: 'farmer123', verified: true, taluk: 'Devanahalli', createdAt: Timestamp.now() },
  { name: 'Suresh Patil', phone: '9876543211', role: 'farmer', address: 'Gubbi Hobli, Near Bus Stand', district: 'Tumkur', state: 'Karnataka', pincode: '572216', email: 'suresh@example.com', password: 'farmer123', verified: true, taluk: 'Gubbi', createdAt: Timestamp.now() },
  { name: 'Lakshmi Devi', phone: '9876543212', role: 'farmer', address: 'Nanjangud Road, T Narasipura', district: 'Mysuru', state: 'Karnataka', pincode: '571124', email: 'lakshmi@example.com', password: 'farmer123', verified: true, taluk: 'T Narasipura', createdAt: Timestamp.now() },
  { name: 'Mahesh Gowda', phone: '9876543213', role: 'farmer', address: 'Sakleshpur Main Road', district: 'Hassan', state: 'Karnataka', pincode: '573134', email: 'mahesh@example.com', password: 'farmer123', verified: true, taluk: 'Sakleshpur', createdAt: Timestamp.now() },
  { name: 'Anita Sharma', phone: '9876543214', role: 'farmer', address: 'KR Pet Taluk, Near Temple', district: 'Mandya', state: 'Karnataka', pincode: '571426', email: 'anita@example.com', password: 'farmer123', verified: true, taluk: 'KR Pet', createdAt: Timestamp.now() },
  { name: 'Venkatesh Rao', phone: '9876543215', role: 'farmer', address: 'Challakere Road, Hosadurga', district: 'Chitradurga', state: 'Karnataka', pincode: '577527', email: '', password: 'farmer123', verified: false, taluk: 'Hosadurga', createdAt: Timestamp.now() },
  { name: 'Mahila SHG', phone: '9876543220', role: 'shg', address: 'Jayanagar 4th Block', district: 'Bengaluru Rural', state: 'Karnataka', pincode: '560041', email: 'mahila@shg.com', password: 'shg123', verified: true, taluk: 'Devanahalli', assignedTaluks: ['Devanahalli'], createdAt: Timestamp.now() },
  { name: 'Green Valley SHG', phone: '9876543221', role: 'shg', address: 'Vijayanagar 2nd Stage', district: 'Mysuru', state: 'Karnataka', pincode: '570017', email: 'greenvalley@shg.com', password: 'shg123', verified: true, taluk: 'T Narasipura', assignedTaluks: ['T Narasipura', 'Nanjangud'], createdAt: Timestamp.now() },
  { name: 'Sunrise SHG', phone: '9876543222', role: 'shg', address: 'SS Puram, Near Market', district: 'Tumkur', state: 'Karnataka', pincode: '572102', email: 'sunrise@shg.com', password: 'shg123', verified: true, taluk: 'Gubbi', assignedTaluks: ['Gubbi', 'Tumkur'], createdAt: Timestamp.now() },
  { name: 'Priya Singh', phone: '9876543230', role: 'consumer', address: 'Indiranagar, 100 Feet Road', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560038', email: 'priya@example.com', password: 'consumer123', verified: true, createdAt: Timestamp.now() },
  { name: 'Amit Verma', phone: '9876543231', role: 'consumer', address: 'Gokulam 3rd Stage', district: 'Mysuru', state: 'Karnataka', pincode: '570002', email: 'amit@example.com', password: 'consumer123', verified: true, createdAt: Timestamp.now() },
];

const listingsData = [
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', farmerPhone: '9876543210', milletType: 'Finger Millet (Ragi)', quantity: 200, unit: 'kg', location: 'Bengaluru Rural', taluk: 'Devanahalli', pricePerKg: 45, status: 'active', quality: 'Grade A', harvestDate: '2024-01-10', verificationStatus: 'verified', verifiedBy: 'shg-1', verifiedByName: 'Mahila SHG', verifiedImage: '/placeholder.jpg', verificationDate: Timestamp.fromDate(new Date('2024-01-11')), verificationNotes: 'Fresh harvest, excellent quality.', createdAt: Timestamp.fromDate(new Date('2024-01-10')) },
  { farmerId: 'farmer-2', farmerName: 'Suresh Patil', farmerPhone: '9876543211', milletType: 'Pearl Millet (Bajra)', quantity: 150, unit: 'kg', location: 'Tumkur', taluk: 'Gubbi', pricePerKg: 38, status: 'active', quality: 'Grade A', harvestDate: '2024-01-08', verificationStatus: 'verified', verifiedBy: 'shg-3', verifiedByName: 'Sunrise SHG', verifiedImage: '/placeholder.jpg', verificationDate: Timestamp.fromDate(new Date('2024-01-09')), verificationNotes: 'Good quality bajra, properly dried.', createdAt: Timestamp.fromDate(new Date('2024-01-08')) },
  { farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', farmerPhone: '9876543212', milletType: 'Foxtail Millet', quantity: 100, unit: 'kg', location: 'Mysuru', taluk: 'T Narasipura', pricePerKg: 52, status: 'active', quality: 'Grade A', harvestDate: '2024-01-12', verificationStatus: 'verified', verifiedBy: 'shg-2', verifiedByName: 'Green Valley SHG', verifiedImage: '/placeholder.jpg', verificationDate: Timestamp.fromDate(new Date('2024-01-13')), verificationNotes: 'Premium foxtail millet.', createdAt: Timestamp.fromDate(new Date('2024-01-12')) },
  { farmerId: 'farmer-4', farmerName: 'Mahesh Gowda', farmerPhone: '9876543213', milletType: 'Sorghum (Jowar)', quantity: 300, unit: 'kg', location: 'Hassan', taluk: 'Sakleshpur', pricePerKg: 35, status: 'active', quality: 'Grade A', harvestDate: '2024-01-05', verificationStatus: 'pending', verifiedBy: '', verifiedByName: '', verifiedImage: '', verificationDate: null, verificationNotes: '', createdAt: Timestamp.fromDate(new Date('2024-01-05')) },
  { farmerId: 'farmer-5', farmerName: 'Anita Sharma', farmerPhone: '9876543214', milletType: 'Little Millet', quantity: 80, unit: 'kg', location: 'Mandya', taluk: 'KR Pet', pricePerKg: 60, status: 'active', quality: 'Grade A', harvestDate: '2024-01-11', verificationStatus: 'pending', verifiedBy: '', verifiedByName: '', verifiedImage: '', verificationDate: null, verificationNotes: '', createdAt: Timestamp.fromDate(new Date('2024-01-11')) },
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', farmerPhone: '9876543210', milletType: 'Kodo Millet', quantity: 120, unit: 'kg', location: 'Bengaluru Rural', taluk: 'Devanahalli', pricePerKg: 55, status: 'active', quality: 'Grade B', harvestDate: '2024-01-14', verificationStatus: 'pending', verifiedBy: '', verifiedByName: '', verifiedImage: '', verificationDate: null, verificationNotes: '', createdAt: Timestamp.fromDate(new Date('2024-01-14')) },
  { farmerId: 'farmer-6', farmerName: 'Venkatesh Rao', farmerPhone: '9876543215', milletType: 'Kodo Millet', quantity: 120, unit: 'kg', location: 'Chitradurga', taluk: 'Hosadurga', pricePerKg: 55, status: 'active', quality: 'Grade B', harvestDate: '2024-01-09', verificationStatus: 'rejected', verifiedBy: 'shg-3', verifiedByName: 'Sunrise SHG', verifiedImage: '/placeholder.jpg', verificationDate: Timestamp.fromDate(new Date('2024-01-10')), verificationNotes: 'High moisture content. Needs re-drying.', createdAt: Timestamp.fromDate(new Date('2024-01-09')) },
];

const ordersData = [
  { listingId: 'listing-1', productName: 'Finger Millet (Ragi)', buyerId: 'consumer-1', buyerName: 'Priya Singh', buyerPhone: '9876543230', sellerId: 'farmer-1', sellerName: 'Ramesh Kumar', sellerPhone: '9876543210', quantity: 10, unit: 'kg', pricePerKg: 45, totalPrice: 450, status: 'delivered', orderDate: Timestamp.fromDate(new Date('2024-01-12')), deliveryDate: Timestamp.fromDate(new Date('2024-01-14')), deliveryAddress: 'Indiranagar, Bengaluru' },
  { listingId: 'listing-1', productName: 'Finger Millet (Ragi)', buyerId: 'consumer-2', buyerName: 'Amit Verma', buyerPhone: '9876543231', sellerId: 'farmer-1', sellerName: 'Ramesh Kumar', sellerPhone: '9876543210', quantity: 5, unit: 'kg', pricePerKg: 45, totalPrice: 225, status: 'shipped', orderDate: Timestamp.fromDate(new Date('2024-01-13')), deliveryAddress: 'Gokulam, Mysuru' },
  { listingId: 'listing-2', productName: 'Pearl Millet (Bajra)', buyerId: 'consumer-1', buyerName: 'Priya Singh', buyerPhone: '9876543230', sellerId: 'farmer-2', sellerName: 'Suresh Patil', sellerPhone: '9876543211', quantity: 8, unit: 'kg', pricePerKg: 38, totalPrice: 304, status: 'processing', orderDate: Timestamp.fromDate(new Date('2024-01-14')), deliveryAddress: 'Indiranagar, Bengaluru' },
  { listingId: 'listing-3', productName: 'Foxtail Millet', buyerId: 'consumer-2', buyerName: 'Amit Verma', buyerPhone: '9876543231', sellerId: 'farmer-3', sellerName: 'Lakshmi Devi', sellerPhone: '9876543212', quantity: 3, unit: 'kg', pricePerKg: 52, totalPrice: 156, status: 'placed', orderDate: Timestamp.fromDate(new Date('2024-01-15')), deliveryAddress: 'Gokulam, Mysuru' },
];

const paymentsData = [
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', orderId: 'order-1', consumerId: 'consumer-1', consumerName: 'Priya Singh', amount: 450, method: 'UPI', status: 'completed', date: '2024-01-12', createdAt: Timestamp.now() },
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', orderId: 'order-2', consumerId: 'consumer-2', consumerName: 'Amit Verma', amount: 225, method: 'Bank Transfer', status: 'completed', date: '2024-01-13', createdAt: Timestamp.now() },
  { farmerId: 'farmer-2', farmerName: 'Suresh Patil', orderId: 'order-3', consumerId: 'consumer-1', consumerName: 'Priya Singh', amount: 304, method: 'UPI', status: 'pending', date: '2024-01-14', createdAt: Timestamp.now() },
  { farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', orderId: 'order-4', consumerId: 'consumer-2', consumerName: 'Amit Verma', amount: 156, method: 'Bank Transfer', status: 'pending', date: '2024-01-15', createdAt: Timestamp.now() },
];

const verificationsData = [
  { listingId: 'listing-1', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', milletType: 'Finger Millet (Ragi)', quantity: 200, shgId: 'shg-1', shgName: 'Mahila SHG', taluk: 'Devanahalli', status: 'verified', verifiedImage: '/placeholder.jpg', notes: 'Fresh harvest, excellent quality.', verifiedAt: Timestamp.fromDate(new Date('2024-01-11')), createdAt: Timestamp.fromDate(new Date('2024-01-10')) },
  { listingId: 'listing-2', farmerId: 'farmer-2', farmerName: 'Suresh Patil', milletType: 'Pearl Millet (Bajra)', quantity: 150, shgId: 'shg-3', shgName: 'Sunrise SHG', taluk: 'Gubbi', status: 'verified', verifiedImage: '/placeholder.jpg', notes: 'Good quality bajra, properly dried.', verifiedAt: Timestamp.fromDate(new Date('2024-01-09')), createdAt: Timestamp.fromDate(new Date('2024-01-08')) },
  { listingId: 'listing-3', farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', milletType: 'Foxtail Millet', quantity: 100, shgId: 'shg-2', shgName: 'Green Valley SHG', taluk: 'T Narasipura', status: 'verified', verifiedImage: '/placeholder.jpg', notes: 'Premium foxtail millet.', verifiedAt: Timestamp.fromDate(new Date('2024-01-13')), createdAt: Timestamp.fromDate(new Date('2024-01-12')) },
  { listingId: 'listing-7', farmerId: 'farmer-6', farmerName: 'Venkatesh Rao', milletType: 'Kodo Millet', quantity: 120, shgId: 'shg-3', shgName: 'Sunrise SHG', taluk: 'Hosadurga', status: 'rejected', verifiedImage: '/placeholder.jpg', notes: 'High moisture content. Needs re-drying.', verifiedAt: Timestamp.fromDate(new Date('2024-01-10')), createdAt: Timestamp.fromDate(new Date('2024-01-09')) },
];

const disputesData = [
  { orderId: 'order-1', consumerId: 'consumer-1', consumerName: 'Priya Singh', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', productName: 'Finger Millet (Ragi)', reason: 'Received less quantity', description: 'Ordered 10 kg but received only 9 kg.', status: 'open', priority: 'medium', createdAt: Timestamp.fromDate(new Date('2024-01-16')), resolvedAt: null, resolution: '' },
  { orderId: 'order-2', consumerId: 'consumer-2', consumerName: 'Amit Verma', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', productName: 'Finger Millet (Ragi)', reason: 'Quality mismatch', description: 'Quality does not match verified image.', status: 'resolved', priority: 'high', createdAt: Timestamp.fromDate(new Date('2024-01-15')), resolvedAt: Timestamp.fromDate(new Date('2024-01-16')), resolution: 'Farmer agreed to send replacement.' },
];

const priceHistoryData = [
  { milletType: 'Finger Millet (Ragi)', price: 45, date: '2024-01-01', createdAt: Timestamp.now() },
  { milletType: 'Finger Millet (Ragi)', price: 46, date: '2024-01-08', createdAt: Timestamp.now() },
  { milletType: 'Finger Millet (Ragi)', price: 47, date: '2024-01-15', createdAt: Timestamp.now() },
  { milletType: 'Pearl Millet (Bajra)', price: 38, date: '2024-01-01', createdAt: Timestamp.now() },
  { milletType: 'Pearl Millet (Bajra)', price: 39, date: '2024-01-08', createdAt: Timestamp.now() },
  { milletType: 'Foxtail Millet', price: 52, date: '2024-01-01', createdAt: Timestamp.now() },
  { milletType: 'Sorghum (Jowar)', price: 35, date: '2024-01-01', createdAt: Timestamp.now() },
];

async function clearCol(n: string) {
  const s = await getDocs(collection(db, n));
  await Promise.all(s.docs.map(d => deleteDoc(d.ref)));
  return s.size;
}

async function seedCol(n: string, data: any[]) {
  for (const item of data) { await addDoc(collection(db, n), item); }
  return data.length;
}

export async function GET() {
  try {
    const r: any = { cleared: {}, seeded: {} };
    for (const c of ['users','listings','orders','payments','verifications','disputes','priceHistory','farmers','shgs','products','batches','requests','qualityChecks','notifications','qualityReviews']) {
      try { r.cleared[c] = await clearCol(c); } catch { r.cleared[c] = 0; }
    }
    r.seeded.users = await seedCol('users', usersData);
    r.seeded.listings = await seedCol('listings', listingsData);
    r.seeded.orders = await seedCol('orders', ordersData);
    r.seeded.payments = await seedCol('payments', paymentsData);
    r.seeded.verifications = await seedCol('verifications', verificationsData);
    r.seeded.disputes = await seedCol('disputes', disputesData);
    r.seeded.priceHistory = await seedCol('priceHistory', priceHistoryData);
    return NextResponse.json({ success: true, message: 'Seeded! Farmer > SHG verifies > Consumer buys from farmer', results: r });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
