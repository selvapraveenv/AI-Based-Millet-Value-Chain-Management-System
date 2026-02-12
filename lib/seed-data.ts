// Seed Data Script for MilletChain - NEW FLOW
// Collections: users, listings, orders, verifications, disputes, payments

import {
  collection, doc, setDoc, addDoc, serverTimestamp, deleteDoc, getDocs
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// USERS - Fixed IDs so all references match
// ============================================
const users = [
  // Farmers
  { id: 'farmer-1', name: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh@example.com', password: 'pass123', role: 'farmer', address: 'Village Road, Bengaluru Rural', district: 'Bengaluru Rural', state: 'Karnataka', pincode: '560001', taluk: 'Devanahalli', verified: true, status: 'active' },
  { id: 'farmer-2', name: 'Suresh Patil', phone: '9876543211', email: 'suresh@example.com', password: 'pass123', role: 'farmer', address: 'Farm House, Tumkur', district: 'Tumkur', state: 'Karnataka', pincode: '572101', taluk: 'Tumkur', verified: true, status: 'active' },
  { id: 'farmer-3', name: 'Lakshmi Devi', phone: '9876543212', email: 'lakshmi@example.com', password: 'pass123', role: 'farmer', address: 'Green Lane, Mysuru', district: 'Mysuru', state: 'Karnataka', pincode: '570001', taluk: 'Mysuru', verified: true, status: 'active' },
  { id: 'farmer-4', name: 'Mahesh Gowda', phone: '9876543213', email: 'mahesh@example.com', password: 'pass123', role: 'farmer', address: 'Rice Mill Road, Hassan', district: 'Hassan', state: 'Karnataka', pincode: '573201', taluk: 'Hassan', verified: true, status: 'active' },
  { id: 'farmer-5', name: 'Anita Sharma', phone: '9876543214', email: 'anita@example.com', password: 'pass123', role: 'farmer', address: 'Temple Street, Mandya', district: 'Mandya', state: 'Karnataka', pincode: '571401', taluk: 'Mandya', verified: true, status: 'active' },
  { id: 'farmer-6', name: 'Venkatesh Rao', phone: '9876543215', email: 'venkatesh@example.com', password: 'pass123', role: 'farmer', address: 'Market Road, Davangere', district: 'Davangere', state: 'Karnataka', pincode: '577001', taluk: 'Davangere', verified: false, status: 'active' },

  // SHGs
  { id: 'shg-1', name: 'Mahila SHG', phone: '9876543220', email: 'mahila.shg@example.com', password: 'pass123', role: 'shg', address: 'SHG Office, Bengaluru Rural', district: 'Bengaluru Rural', state: 'Karnataka', pincode: '560001', assignedTaluks: ['Devanahalli', 'Hosakote', 'Erode', 'Perundurai', 'Gobi', 'Sathyamangalam', 'Bhavani', 'Anthiyur', 'Kodumudi', 'Modakurichi', 'Nambiyur', 'Thalavadi', 'Avinashi', 'Palladam', 'Udumalaipettai', 'Dharapuram', 'Kangeyam', 'Madathukulam', 'Uthukuli'], verified: true, status: 'active' },
  { id: 'shg-2', name: 'Green Valley SHG', phone: '9876543221', email: 'greenvalley@example.com', password: 'pass123', role: 'shg', address: 'SHG Center, Tumkur', district: 'Tumkur', state: 'Karnataka', pincode: '572101', assignedTaluks: ['Tumkur', 'Gubbi', 'Erode', 'Perundurai', 'Gobi', 'Sathyamangalam', 'Bhavani', 'Anthiyur', 'Kodumudi', 'Modakurichi', 'Nambiyur', 'Thalavadi', 'Avinashi', 'Palladam', 'Udumalaipettai', 'Dharapuram', 'Kangeyam', 'Madathukulam', 'Uthukuli'], verified: true, status: 'active' },
  { id: 'shg-3', name: 'Sunrise SHG', phone: '9876543222', email: 'sunrise@example.com', password: 'pass123', role: 'shg', address: 'SHG Hall, Mysuru', district: 'Mysuru', state: 'Karnataka', pincode: '570001', assignedTaluks: ['Mysuru', 'Nanjangud', 'Erode', 'Perundurai', 'Gobi', 'Sathyamangalam', 'Bhavani', 'Anthiyur', 'Kodumudi', 'Modakurichi', 'Nambiyur', 'Thalavadi', 'Avinashi', 'Palladam', 'Udumalaipettai', 'Dharapuram', 'Kangeyam', 'Madathukulam', 'Uthukuli'], verified: true, status: 'active' },

  // Consumers
  { id: 'consumer-1', name: 'Priya Singh', phone: '9876543230', email: 'priya@example.com', password: 'pass123', role: 'consumer', address: '123 MG Road, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001', verified: true, status: 'active' },
  { id: 'consumer-2', name: 'Rahul Verma', phone: '9876543231', email: 'rahul@example.com', password: 'pass123', role: 'consumer', address: '456 Brigade Road, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560002', verified: true, status: 'active' },

  // Admin
  { id: 'admin-1', name: 'Admin User', phone: '9876543200', email: 'admin@milletchain.com', password: 'admin123', role: 'admin', address: 'MilletChain HQ, Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', pincode: '560001', verified: true, status: 'active' },
];

// ============================================
// LISTINGS - Farmer crop uploads
// ============================================
const listings = [
  // Farmer 1 listings (Devanahalli taluk)
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', farmerPhone: '9876543210', milletType: 'Finger Millet (Ragi)', quantity: 200, unit: 'kg', location: 'Bengaluru Rural', taluk: 'Devanahalli', pricePerKg: 45, status: 'active', quality: 'Premium', harvestDate: '2024-01-10', verificationStatus: 'verified', verifiedBy: 'shg-1', verifiedByName: 'Mahila SHG', verifiedImage: '', verificationDate: null, verificationNotes: 'Good quality, fresh harvest' },
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', farmerPhone: '9876543210', milletType: 'Little Millet', quantity: 100, unit: 'kg', location: 'Bengaluru Rural', taluk: 'Devanahalli', pricePerKg: 55, status: 'active', quality: 'Premium', harvestDate: '2024-01-15', verificationStatus: 'pending', verifiedBy: '', verifiedByName: '', verifiedImage: '', verificationDate: null, verificationNotes: '' },

  // Farmer 2 listings (Tumkur taluk)
  { farmerId: 'farmer-2', farmerName: 'Suresh Patil', farmerPhone: '9876543211', milletType: 'Pearl Millet (Bajra)', quantity: 150, unit: 'kg', location: 'Tumkur', taluk: 'Tumkur', pricePerKg: 38, status: 'active', quality: 'Standard', harvestDate: '2024-01-08', verificationStatus: 'verified', verifiedBy: 'shg-2', verifiedByName: 'Green Valley SHG', verifiedImage: '', verificationDate: null, verificationNotes: 'Verified, standard quality' },

  // Farmer 3 listings (Mysuru taluk)
  { farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', farmerPhone: '9876543212', milletType: 'Foxtail Millet', quantity: 100, unit: 'kg', location: 'Mysuru', taluk: 'Mysuru', pricePerKg: 52, status: 'sold', quality: 'Premium', harvestDate: '2024-01-05', verificationStatus: 'verified', verifiedBy: 'shg-3', verifiedByName: 'Sunrise SHG', verifiedImage: '', verificationDate: null, verificationNotes: 'Excellent quality crop' },

  // Farmer 4 listings (Hassan taluk - no SHG assigned here, stays pending)
  { farmerId: 'farmer-4', farmerName: 'Mahesh Gowda', farmerPhone: '9876543213', milletType: 'Sorghum (Jowar)', quantity: 300, unit: 'kg', location: 'Hassan', taluk: 'Hassan', pricePerKg: 35, status: 'active', quality: 'Standard', harvestDate: '2024-01-12', verificationStatus: 'pending', verifiedBy: '', verifiedByName: '', verifiedImage: '', verificationDate: null, verificationNotes: '' },

  // Farmer 5 listings (Mandya taluk - no SHG assigned, stays pending)
  { farmerId: 'farmer-5', farmerName: 'Anita Sharma', farmerPhone: '9876543214', milletType: 'Little Millet', quantity: 80, unit: 'kg', location: 'Mandya', taluk: 'Mandya', pricePerKg: 48, status: 'active', quality: 'Premium', harvestDate: '2024-01-15', verificationStatus: 'pending', verifiedBy: '', verifiedByName: '', verifiedImage: '', verificationDate: null, verificationNotes: '' },

  // Farmer 1 rejected listing
  { farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', farmerPhone: '9876543210', milletType: 'Barnyard Millet', quantity: 50, unit: 'kg', location: 'Bengaluru Rural', taluk: 'Devanahalli', pricePerKg: 40, status: 'active', quality: 'Standard', harvestDate: '2024-01-02', verificationStatus: 'rejected', verifiedBy: 'shg-1', verifiedByName: 'Mahila SHG', verifiedImage: '', verificationDate: null, verificationNotes: 'Quality below standard, moisture content too high' },
];

// ============================================
// ORDERS - Consumer buys directly from farmer (only verified listings)
// ============================================
const orders = [
  { listingId: '', productName: 'Finger Millet (Ragi)', buyerId: 'consumer-1', buyerName: 'Priya Singh', buyerPhone: '9876543230', sellerId: 'farmer-1', sellerName: 'Ramesh Kumar', sellerPhone: '9876543210', quantity: 10, unit: 'kg', pricePerKg: 45, totalPrice: 450, status: 'delivered' as const, orderDate: new Date('2024-01-12'), deliveryDate: new Date('2024-01-16'), deliveryAddress: '123 MG Road, Bengaluru' },
  { listingId: '', productName: 'Pearl Millet (Bajra)', buyerId: 'consumer-1', buyerName: 'Priya Singh', buyerPhone: '9876543230', sellerId: 'farmer-2', sellerName: 'Suresh Patil', sellerPhone: '9876543211', quantity: 5, unit: 'kg', pricePerKg: 38, totalPrice: 190, status: 'shipped' as const, orderDate: new Date('2024-01-14'), deliveryAddress: '123 MG Road, Bengaluru' },
  { listingId: '', productName: 'Foxtail Millet', buyerId: 'consumer-2', buyerName: 'Rahul Verma', buyerPhone: '9876543231', sellerId: 'farmer-3', sellerName: 'Lakshmi Devi', sellerPhone: '9876543212', quantity: 8, unit: 'kg', pricePerKg: 52, totalPrice: 416, status: 'delivered' as const, orderDate: new Date('2024-01-06'), deliveryDate: new Date('2024-01-10'), deliveryAddress: '456 Brigade Road, Bengaluru' },
  { listingId: '', productName: 'Finger Millet (Ragi)', buyerId: 'consumer-2', buyerName: 'Rahul Verma', buyerPhone: '9876543231', sellerId: 'farmer-1', sellerName: 'Ramesh Kumar', sellerPhone: '9876543210', quantity: 20, unit: 'kg', pricePerKg: 45, totalPrice: 900, status: 'placed' as const, orderDate: new Date('2024-01-16'), deliveryAddress: '456 Brigade Road, Bengaluru' },
  { listingId: '', productName: 'Pearl Millet (Bajra)', buyerId: 'consumer-1', buyerName: 'Priya Singh', buyerPhone: '9876543230', sellerId: 'farmer-2', sellerName: 'Suresh Patil', sellerPhone: '9876543211', quantity: 3, unit: 'kg', pricePerKg: 38, totalPrice: 114, status: 'confirmed' as const, orderDate: new Date('2024-01-15'), deliveryAddress: '123 MG Road, Bengaluru' },
];

// ============================================
// VERIFICATIONS - SHG verification history
// ============================================
const verifications = [
  { listingId: '', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', milletType: 'Finger Millet (Ragi)', quantity: 200, shgId: 'shg-1', shgName: 'Mahila SHG', taluk: 'Devanahalli', status: 'verified' as const, verifiedImage: '', notes: 'Good quality, fresh harvest', verifiedAt: new Date('2024-01-11') },
  { listingId: '', farmerId: 'farmer-2', farmerName: 'Suresh Patil', milletType: 'Pearl Millet (Bajra)', quantity: 150, shgId: 'shg-2', shgName: 'Green Valley SHG', taluk: 'Tumkur', status: 'verified' as const, verifiedImage: '', notes: 'Verified, standard quality', verifiedAt: new Date('2024-01-09') },
  { listingId: '', farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', milletType: 'Foxtail Millet', quantity: 100, shgId: 'shg-3', shgName: 'Sunrise SHG', taluk: 'Mysuru', status: 'verified' as const, verifiedImage: '', notes: 'Excellent quality crop', verifiedAt: new Date('2024-01-06') },
  { listingId: '', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', milletType: 'Barnyard Millet', quantity: 50, shgId: 'shg-1', shgName: 'Mahila SHG', taluk: 'Devanahalli', status: 'rejected' as const, verifiedImage: '', notes: 'Quality below standard, moisture content too high', verifiedAt: new Date('2024-01-03') },
];

// ============================================
// DISPUTES - Consumer complaints
// ============================================
const disputes = [
  { orderId: '', consumerId: 'consumer-2', consumerName: 'Rahul Verma', farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', productName: 'Foxtail Millet', reason: 'Quality Issue', description: 'Received slightly different grain size than expected', status: 'open' as const, priority: 'medium' as const, resolvedAt: null, resolution: '' },
  { orderId: '', consumerId: 'consumer-1', consumerName: 'Priya Singh', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', productName: 'Finger Millet (Ragi)', reason: 'Late Delivery', description: 'Order was delivered 3 days late', status: 'resolved' as const, priority: 'low' as const, resolvedAt: new Date('2024-01-18'), resolution: 'Partial refund issued, farmer warned' },
];

// ============================================
// PAYMENTS - Farmer payment records
// ============================================
const payments = [
  { orderId: '', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', amount: 450, status: 'completed' as const, method: 'UPI', paidAt: new Date('2024-01-17'), buyerName: 'Priya Singh', productName: 'Finger Millet (Ragi)' },
  { orderId: '', farmerId: 'farmer-3', farmerName: 'Lakshmi Devi', amount: 416, status: 'completed' as const, method: 'Bank Transfer', paidAt: new Date('2024-01-11'), buyerName: 'Rahul Verma', productName: 'Foxtail Millet' },
  { orderId: '', farmerId: 'farmer-2', farmerName: 'Suresh Patil', amount: 190, status: 'pending' as const, method: 'UPI', paidAt: null, buyerName: 'Priya Singh', productName: 'Pearl Millet (Bajra)' },
  { orderId: '', farmerId: 'farmer-1', farmerName: 'Ramesh Kumar', amount: 900, status: 'pending' as const, method: 'UPI', paidAt: null, buyerName: 'Rahul Verma', productName: 'Finger Millet (Ragi)' },
];

// ============================================
// CLEAR + SEED FUNCTION
// ============================================

async function clearCollection(name: string) {
  const snap = await getDocs(collection(db, name));
  const promises = snap.docs.map(d => deleteDoc(doc(db, name, d.id)));
  await Promise.all(promises);
  console.log(` Cleared ${snap.size} docs from ${name}`);
}

export async function seedDatabase() {
  console.log(' Starting database seeding...');

  try {
    // 1. Clear old data
    console.log('Clearing old data...');
    const collectionsToClean = ['users', 'listings', 'orders', 'verifications', 'disputes', 'payments'];
    for (const c of collectionsToClean) {
      await clearCollection(c);
    }

    // 2. Seed users with FIXED IDs (setDoc)
    console.log('Adding users...');
    for (const u of users) {
      const { id, ...data } = u;
      await setDoc(doc(db, 'users', id), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
    console.log(` Added ${users.length} users`);

    // 3. Seed listings (addDoc, store IDs for cross-references)
    console.log('Adding listings...');
    const listingIds: string[] = [];
    for (const l of listings) {
      const ref = await addDoc(collection(db, 'listings'), {
        ...l,
        createdAt: serverTimestamp(),
      });
      listingIds.push(ref.id);
    }
    console.log(` Added ${listings.length} listings`);

    // 4. Seed verifications (link to listing IDs)
    // listing[0] = farmer-1 ragi verified, listing[2] = farmer-2 bajra verified,
    // listing[3] = farmer-3 foxtail verified, listing[6] = farmer-1 barnyard rejected
    const verificationListingMap = [0, 2, 3, 6]; // indices into listingIds
    console.log('Adding verifications...');
    for (let i = 0; i < verifications.length; i++) {
      const v = verifications[i];
      await addDoc(collection(db, 'verifications'), {
        ...v,
        listingId: listingIds[verificationListingMap[i]] || '',
        createdAt: serverTimestamp(),
      });
    }
    console.log(` Added ${verifications.length} verifications`);

    // 5. Seed orders (link to listing IDs for verified listings)
    // order[0] = ragi from farmer-1 (listing 0), order[1] = bajra from farmer-2 (listing 2),
    // order[2] = foxtail from farmer-3 (listing 3), order[3] = ragi from farmer-1 (listing 0),
    // order[4] = bajra from farmer-2 (listing 2)
    const orderListingMap = [0, 2, 3, 0, 2];
    console.log('Adding orders...');
    const orderIds: string[] = [];
    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];
      const ref = await addDoc(collection(db, 'orders'), {
        ...o,
        listingId: listingIds[orderListingMap[i]] || '',
      });
      orderIds.push(ref.id);
    }
    console.log(` Added ${orders.length} orders`);

    // 6. Seed disputes (link to order IDs)
    // dispute[0]  order[2] (foxtail delivered), dispute[1]  order[0] (ragi delivered)
    const disputeOrderMap = [2, 0];
    console.log('Adding disputes...');
    for (let i = 0; i < disputes.length; i++) {
      const d = disputes[i];
      await addDoc(collection(db, 'disputes'), {
        ...d,
        orderId: orderIds[disputeOrderMap[i]] || '',
        createdAt: serverTimestamp(),
      });
    }
    console.log(` Added ${disputes.length} disputes`);

    // 7. Seed payments (link to order IDs)
    // payment[0]  order[0] (ragi delivered), payment[1]  order[2] (foxtail delivered),
    // payment[2]  order[1] (bajra shipped), payment[3]  order[3] (ragi placed)
    const paymentOrderMap = [0, 2, 1, 3];
    console.log('Adding payments...');
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      await addDoc(collection(db, 'payments'), {
        ...p,
        orderId: orderIds[paymentOrderMap[i]] || '',
        createdAt: serverTimestamp(),
      });
    }
    console.log(` Added ${payments.length} payments`);

    console.log(' Database seeding completed successfully!');
    return { success: true };
  } catch (error) {
    console.error(' Error seeding database:', error);
    return { success: false, error };
  }
}
