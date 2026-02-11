// Seed Database Script - Populates Firestore with sample data
// Run with: npx ts-node scripts/seed-database.ts
// Or add to package.json: "seed": "ts-node scripts/seed-database.ts"

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  deleteDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';

// Firebase config - same as in lib/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCBoOtQVAWoXBy0ZZXlaPfRJb-8U9TYVK0",
  authDomain: "milletchain-fd497.firebaseapp.com",
  projectId: "milletchain-fd497",
  storageBucket: "milletchain-fd497.firebasestorage.app",
  messagingSenderId: "422293415618",
  appId: "1:422293415618:web:7aa85d423e94e07e3f8f26",
  measurementId: "G-GGP4R42EZL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// SEED DATA
// ============================================

// Users
const usersData = [
  { id: "admin-1", name: "Admin User", email: "admin@milletchain.com", phone: "9000000001", role: "admin", verified: true, createdAt: Timestamp.now() },
  { id: "farmer-1", name: "Ramesh Kumar", email: "ramesh@example.com", phone: "9876543210", role: "farmer", location: "Bengaluru Rural", verified: true, createdAt: Timestamp.now() },
  { id: "farmer-2", name: "Suresh Patil", email: "suresh@example.com", phone: "9876543211", role: "farmer", location: "Tumkur", verified: true, createdAt: Timestamp.now() },
  { id: "farmer-3", name: "Lakshmi Devi", email: "lakshmi@example.com", phone: "9876543212", role: "farmer", location: "Mysuru", verified: true, createdAt: Timestamp.now() },
  { id: "farmer-4", name: "Mahesh Gowda", email: "mahesh@example.com", phone: "9876543213", role: "farmer", location: "Hassan", verified: true, createdAt: Timestamp.now() },
  { id: "farmer-5", name: "Anita Sharma", email: "anita@example.com", phone: "9876543214", role: "farmer", location: "Mandya", verified: true, createdAt: Timestamp.now() },
  { id: "farmer-6", name: "Venkatesh Rao", email: "venkatesh@example.com", phone: "9876543215", role: "farmer", location: "Chitradurga", verified: false, createdAt: Timestamp.now() },
  { id: "shg-1", name: "Mahila SHG", email: "mahila@shg.com", phone: "9876543220", role: "shg", location: "Bengaluru", verified: true, createdAt: Timestamp.now() },
  { id: "shg-2", name: "Green Valley SHG", email: "greenvalley@shg.com", phone: "9876543221", role: "shg", location: "Mysuru", verified: true, createdAt: Timestamp.now() },
  { id: "shg-3", name: "Sunrise SHG", email: "sunrise@shg.com", phone: "9876543222", role: "shg", location: "Tumkur", verified: true, createdAt: Timestamp.now() },
  { id: "consumer-1", name: "Priya Singh", email: "priya@example.com", phone: "9876543230", role: "consumer", location: "Bengaluru", verified: true, createdAt: Timestamp.now() },
  { id: "consumer-2", name: "Amit Verma", email: "amit@example.com", phone: "9876543231", role: "consumer", location: "Mysuru", verified: true, createdAt: Timestamp.now() },
];

// Farmers
const farmersData = [
  { id: "farmer-1", name: "Ramesh Kumar", phone: "9876543210", email: "ramesh@example.com", location: "Bengaluru Rural", district: "Bengaluru Rural", state: "Karnataka", verified: true, totalListings: 5, totalEarnings: 125000, createdAt: Timestamp.now() },
  { id: "farmer-2", name: "Suresh Patil", phone: "9876543211", email: "suresh@example.com", location: "Tumkur", district: "Tumkur", state: "Karnataka", verified: true, totalListings: 3, totalEarnings: 85000, createdAt: Timestamp.now() },
  { id: "farmer-3", name: "Lakshmi Devi", phone: "9876543212", email: "lakshmi@example.com", location: "Mysuru", district: "Mysuru", state: "Karnataka", verified: true, totalListings: 4, totalEarnings: 95000, createdAt: Timestamp.now() },
  { id: "farmer-4", name: "Mahesh Gowda", phone: "9876543213", email: "mahesh@example.com", location: "Hassan", district: "Hassan", state: "Karnataka", verified: true, totalListings: 6, totalEarnings: 150000, createdAt: Timestamp.now() },
  { id: "farmer-5", name: "Anita Sharma", phone: "9876543214", email: "anita@example.com", location: "Mandya", district: "Mandya", state: "Karnataka", verified: true, totalListings: 2, totalEarnings: 45000, createdAt: Timestamp.now() },
  { id: "farmer-6", name: "Venkatesh Rao", phone: "9876543215", email: "venkatesh@example.com", location: "Chitradurga", district: "Chitradurga", state: "Karnataka", verified: false, totalListings: 1, totalEarnings: 20000, createdAt: Timestamp.now() },
];

// SHGs
const shgsData = [
  { id: "shg-1", name: "Mahila SHG", location: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", members: 15, farmerConnections: 24, verified: true, createdAt: Timestamp.now() },
  { id: "shg-2", name: "Green Valley SHG", location: "Mysuru", district: "Mysuru", state: "Karnataka", members: 12, farmerConnections: 18, verified: true, createdAt: Timestamp.now() },
  { id: "shg-3", name: "Sunrise SHG", location: "Tumkur", district: "Tumkur", state: "Karnataka", members: 10, farmerConnections: 15, verified: true, createdAt: Timestamp.now() },
  { id: "shg-4", name: "Krishi Mahila Group", location: "Hassan", district: "Hassan", state: "Karnataka", members: 8, farmerConnections: 12, verified: true, createdAt: Timestamp.now() },
];

// Listings (Farmer crop listings)
const listingsData = [
  { farmerId: "farmer-1", farmerName: "Ramesh Kumar", milletType: "Finger Millet (Ragi)", quantity: 200, unit: "kg", location: "Bengaluru Rural", pricePerKg: 45, status: "active", quality: "Grade A", harvestDate: "2024-01-10", createdAt: Timestamp.now() },
  { farmerId: "farmer-2", farmerName: "Suresh Patil", milletType: "Pearl Millet (Bajra)", quantity: 150, unit: "kg", location: "Tumkur", pricePerKg: 38, status: "active", quality: "Grade A", harvestDate: "2024-01-08", createdAt: Timestamp.now() },
  { farmerId: "farmer-3", farmerName: "Lakshmi Devi", milletType: "Foxtail Millet", quantity: 100, unit: "kg", location: "Mysuru", pricePerKg: 52, status: "active", quality: "Grade B", harvestDate: "2024-01-12", createdAt: Timestamp.now() },
  { farmerId: "farmer-4", farmerName: "Mahesh Gowda", milletType: "Sorghum (Jowar)", quantity: 300, unit: "kg", location: "Hassan", pricePerKg: 35, status: "active", quality: "Grade A", harvestDate: "2024-01-05", createdAt: Timestamp.now() },
  { farmerId: "farmer-5", farmerName: "Anita Sharma", milletType: "Little Millet", quantity: 80, unit: "kg", location: "Mandya", pricePerKg: 60, status: "active", quality: "Grade A", harvestDate: "2024-01-11", createdAt: Timestamp.now() },
  { farmerId: "farmer-6", farmerName: "Venkatesh Rao", milletType: "Kodo Millet", quantity: 120, unit: "kg", location: "Chitradurga", pricePerKg: 55, status: "active", quality: "Grade B", harvestDate: "2024-01-09", createdAt: Timestamp.now() },
];

// Products (SHG processed products for consumers)
const productsData = [
  { name: "Organic Ragi Flour", description: "Stone-ground organic finger millet flour, perfect for making healthy rotis and dosas", shgId: "shg-1", shgName: "Mahila SHG", farmerId: "farmer-1", farmerName: "Ramesh Kumar", batchId: "BATCH001", category: "Flour", pricePerKg: 85, stock: 50, rating: 4.5, location: "Bengaluru", harvestDate: "2024-01-10", createdAt: Timestamp.now() },
  { name: "Bajra Atta Premium", description: "Fine pearl millet flour for rotis, rich in iron and fiber", shgId: "shg-1", shgName: "Mahila SHG", farmerId: "farmer-2", farmerName: "Suresh Patil", batchId: "BATCH002", category: "Flour", pricePerKg: 75, stock: 40, rating: 4.3, location: "Tumkur", harvestDate: "2024-01-08", createdAt: Timestamp.now() },
  { name: "Foxtail Millet Rice", description: "Polished foxtail millet ready to cook, great for diabetes management", shgId: "shg-2", shgName: "Green Valley SHG", farmerId: "farmer-3", farmerName: "Lakshmi Devi", batchId: "BATCH003", category: "Grain", pricePerKg: 120, stock: 30, rating: 4.7, location: "Mysuru", harvestDate: "2024-01-12", createdAt: Timestamp.now() },
  { name: "Millet Mix Pack", description: "Assorted millets combo pack - 5 varieties for complete nutrition", shgId: "shg-2", shgName: "Green Valley SHG", farmerId: "farmer-4", farmerName: "Mahesh Gowda", batchId: "BATCH004", category: "Mixed", pricePerKg: 150, stock: 25, rating: 4.6, location: "Hassan", harvestDate: "2024-01-05", createdAt: Timestamp.now() },
  { name: "Jowar Flakes", description: "Crispy sorghum flakes for breakfast, healthy alternative to corn flakes", shgId: "shg-3", shgName: "Sunrise SHG", farmerId: "farmer-4", farmerName: "Mahesh Gowda", batchId: "BATCH005", category: "Ready to Eat", pricePerKg: 95, stock: 60, rating: 4.4, location: "Tumkur", harvestDate: "2024-01-05", createdAt: Timestamp.now() },
  { name: "Little Millet Grain", description: "Premium quality little millet, perfect for rice replacement", shgId: "shg-3", shgName: "Sunrise SHG", farmerId: "farmer-5", farmerName: "Anita Sharma", batchId: "BATCH006", category: "Grain", pricePerKg: 110, stock: 35, rating: 4.2, location: "Mandya", harvestDate: "2024-01-11", createdAt: Timestamp.now() },
];

// Orders
const ordersData = [
  // Consumer orders
  { productId: "prod-1", productName: "Organic Ragi Flour", buyerId: "consumer-1", buyerName: "Priya Singh", sellerId: "shg-1", sellerName: "Mahila SHG", sellerType: "shg", quantity: 5, unit: "kg", totalPrice: 425, status: "delivered", orderDate: Timestamp.fromDate(new Date("2024-01-10")), deliveryDate: Timestamp.fromDate(new Date("2024-01-14")) },
  { productId: "prod-2", productName: "Bajra Atta Premium", buyerId: "consumer-1", buyerName: "Priya Singh", sellerId: "shg-1", sellerName: "Mahila SHG", sellerType: "shg", quantity: 3, unit: "kg", totalPrice: 225, status: "shipped", orderDate: Timestamp.fromDate(new Date("2024-01-12")) },
  { productId: "prod-3", productName: "Foxtail Millet Rice", buyerId: "consumer-2", buyerName: "Amit Verma", sellerId: "shg-2", sellerName: "Green Valley SHG", sellerType: "shg", quantity: 2, unit: "kg", totalPrice: 240, status: "processing", orderDate: Timestamp.fromDate(new Date("2024-01-14")) },
  { productId: "prod-4", productName: "Millet Mix Pack", buyerId: "consumer-2", buyerName: "Amit Verma", sellerId: "shg-2", sellerName: "Green Valley SHG", sellerType: "shg", quantity: 1, unit: "pack", totalPrice: 150, status: "placed", orderDate: Timestamp.fromDate(new Date("2024-01-15")) },
  // SHG procurement orders from farmers
  { productId: "listing-1", productName: "Finger Millet (Ragi)", buyerId: "shg-1", buyerName: "Mahila SHG", sellerId: "farmer-1", sellerName: "Ramesh Kumar", sellerType: "farmer", quantity: 100, unit: "kg", totalPrice: 4500, status: "delivered", orderDate: Timestamp.fromDate(new Date("2024-01-08")), deliveryDate: Timestamp.fromDate(new Date("2024-01-10")) },
  { productId: "listing-2", productName: "Pearl Millet (Bajra)", buyerId: "shg-1", buyerName: "Mahila SHG", sellerId: "farmer-2", sellerName: "Suresh Patil", sellerType: "farmer", quantity: 75, unit: "kg", totalPrice: 2850, status: "confirmed", orderDate: Timestamp.fromDate(new Date("2024-01-12")) },
  { productId: "listing-3", productName: "Foxtail Millet", buyerId: "shg-2", buyerName: "Green Valley SHG", sellerId: "farmer-3", sellerName: "Lakshmi Devi", sellerType: "farmer", quantity: 50, unit: "kg", totalPrice: 2600, status: "shipped", orderDate: Timestamp.fromDate(new Date("2024-01-11")) },
  { productId: "listing-4", productName: "Sorghum (Jowar)", buyerId: "shg-3", buyerName: "Sunrise SHG", sellerId: "farmer-4", sellerName: "Mahesh Gowda", sellerType: "farmer", quantity: 80, unit: "kg", totalPrice: 2800, status: "processing", orderDate: Timestamp.fromDate(new Date("2024-01-13")) },
];

// Batches (SHG processing batches)
const batchesData = [
  { id: "BATCH001", shgId: "shg-1", milletType: "Finger Millet", quantity: 100, stage: "packaging", completion: 85, farmerId: "farmer-1", farmerName: "Ramesh Kumar", productName: "Ragi Flour", outputQty: 85, qualityApproved: true, qualityScore: 92, createdAt: Timestamp.fromDate(new Date("2024-01-12")) },
  { id: "BATCH002", shgId: "shg-1", milletType: "Pearl Millet", quantity: 75, stage: "processing", completion: 40, farmerId: "farmer-2", farmerName: "Suresh Patil", productName: "Bajra Atta", outputQty: 60, qualityApproved: false, createdAt: Timestamp.fromDate(new Date("2024-01-14")) },
  { id: "BATCH003", shgId: "shg-2", milletType: "Foxtail Millet", quantity: 50, stage: "quality_check", completion: 60, farmerId: "farmer-3", farmerName: "Lakshmi Devi", productName: "Foxtail Rice", outputQty: 45, qualityApproved: false, createdAt: Timestamp.fromDate(new Date("2024-01-15")) },
  { id: "BATCH004", shgId: "shg-2", milletType: "Sorghum", quantity: 80, stage: "ready", completion: 100, farmerId: "farmer-4", farmerName: "Mahesh Gowda", productName: "Jowar Flakes", outputQty: 70, qualityApproved: true, qualityScore: 88, createdAt: Timestamp.fromDate(new Date("2024-01-10")) },
  { id: "BATCH005", shgId: "shg-3", milletType: "Little Millet", quantity: 60, stage: "received", completion: 10, farmerId: "farmer-5", farmerName: "Anita Sharma", productName: "Little Millet Grain", outputQty: 0, qualityApproved: false, createdAt: Timestamp.fromDate(new Date("2024-01-16")) },
];

// Requests (SHG purchase requests to farmers)
const requestsData = [
  { shgId: "shg-1", shgName: "Mahila SHG", farmerId: "farmer-1", farmerName: "Ramesh Kumar", milletType: "Finger Millet (Ragi)", quantity: 50, status: "pending", createdAt: Timestamp.fromDate(new Date("2024-01-15")) },
  { shgId: "shg-2", shgName: "Green Valley SHG", farmerId: "farmer-1", farmerName: "Ramesh Kumar", milletType: "Pearl Millet (Bajra)", quantity: 100, status: "pending", createdAt: Timestamp.fromDate(new Date("2024-01-14")) },
  { shgId: "shg-3", shgName: "Sunrise SHG", farmerId: "farmer-1", farmerName: "Ramesh Kumar", milletType: "Foxtail Millet", quantity: 30, status: "accepted", createdAt: Timestamp.fromDate(new Date("2024-01-13")) },
  { shgId: "shg-4", shgName: "Krishi Mahila Group", farmerId: "farmer-1", farmerName: "Ramesh Kumar", milletType: "Sorghum (Jowar)", quantity: 80, status: "rejected", createdAt: Timestamp.fromDate(new Date("2024-01-12")) },
];

// Quality Checks (Admin quality reviews)
const qualityChecksData = [
  { batchId: "BATCH001", shgId: "shg-1", shgName: "Mahila SHG", productName: "Ragi Flour", milletType: "Finger Millet", status: "approved", score: 92, reviewedBy: "admin-1", reviewedAt: Timestamp.fromDate(new Date("2024-01-14")), notes: "Excellent quality, meets all standards", createdAt: Timestamp.fromDate(new Date("2024-01-13")) },
  { batchId: "BATCH004", shgId: "shg-2", shgName: "Green Valley SHG", productName: "Jowar Flakes", milletType: "Sorghum", status: "approved", score: 88, reviewedBy: "admin-1", reviewedAt: Timestamp.fromDate(new Date("2024-01-12")), notes: "Good quality, minor improvements possible", createdAt: Timestamp.fromDate(new Date("2024-01-11")) },
  { batchId: "BATCH002", shgId: "shg-1", shgName: "Mahila SHG", productName: "Bajra Atta", milletType: "Pearl Millet", status: "pending", score: 0, createdAt: Timestamp.fromDate(new Date("2024-01-15")) },
  { batchId: "BATCH003", shgId: "shg-2", shgName: "Green Valley SHG", productName: "Foxtail Rice", milletType: "Foxtail Millet", status: "pending", score: 0, createdAt: Timestamp.fromDate(new Date("2024-01-16")) },
];

// Payments (Farmer payment records)
const paymentsData = [
  { farmerId: "farmer-1", farmerName: "Ramesh Kumar", orderId: "order-1", shgId: "shg-1", shgName: "Mahila SHG", amount: 4500, method: "Bank Transfer", status: "completed", date: "2024-01-12", createdAt: Timestamp.now() },
  { farmerId: "farmer-1", farmerName: "Ramesh Kumar", orderId: "order-2", shgId: "shg-2", shgName: "Green Valley SHG", amount: 3200, method: "UPI", status: "completed", date: "2024-01-10", createdAt: Timestamp.now() },
  { farmerId: "farmer-1", farmerName: "Ramesh Kumar", orderId: "order-3", shgId: "shg-3", shgName: "Sunrise SHG", amount: 2800, method: "Bank Transfer", status: "pending", date: "2024-01-15", createdAt: Timestamp.now() },
  { farmerId: "farmer-2", farmerName: "Suresh Patil", orderId: "order-4", shgId: "shg-1", shgName: "Mahila SHG", amount: 2850, method: "UPI", status: "completed", date: "2024-01-13", createdAt: Timestamp.now() },
];

// Price History (for analytics)
const priceHistoryData = [
  { milletType: "Finger Millet (Ragi)", price: 45, date: "2024-01-01", createdAt: Timestamp.now() },
  { milletType: "Finger Millet (Ragi)", price: 46, date: "2024-01-08", createdAt: Timestamp.now() },
  { milletType: "Finger Millet (Ragi)", price: 47, date: "2024-01-15", createdAt: Timestamp.now() },
  { milletType: "Pearl Millet (Bajra)", price: 38, date: "2024-01-01", createdAt: Timestamp.now() },
  { milletType: "Pearl Millet (Bajra)", price: 39, date: "2024-01-08", createdAt: Timestamp.now() },
  { milletType: "Foxtail Millet", price: 52, date: "2024-01-01", createdAt: Timestamp.now() },
  { milletType: "Sorghum (Jowar)", price: 35, date: "2024-01-01", createdAt: Timestamp.now() },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function clearCollection(collectionName: string) {
  console.log(`Clearing ${collectionName}...`);
  const snapshot = await getDocs(collection(db, collectionName));
  const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
  console.log(`  Cleared ${snapshot.size} documents`);
}

async function seedCollection(collectionName: string, data: any[]) {
  console.log(`Seeding ${collectionName}...`);
  for (const item of data) {
    await addDoc(collection(db, collectionName), item);
  }
  console.log(`  Added ${data.length} documents`);
}

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    // Clear existing data
    console.log('📦 Clearing existing data...');
    await clearCollection('users');
    await clearCollection('farmers');
    await clearCollection('shgs');
    await clearCollection('listings');
    await clearCollection('products');
    await clearCollection('orders');
    await clearCollection('batches');
    await clearCollection('requests');
    await clearCollection('qualityChecks');
    await clearCollection('payments');
    await clearCollection('priceHistory');
    
    console.log('\n📝 Seeding new data...');
    
    // Seed all collections
    await seedCollection('users', usersData);
    await seedCollection('farmers', farmersData);
    await seedCollection('shgs', shgsData);
    await seedCollection('listings', listingsData);
    await seedCollection('products', productsData);
    await seedCollection('orders', ordersData);
    await seedCollection('batches', batchesData);
    await seedCollection('requests', requestsData);
    await seedCollection('qualityChecks', qualityChecksData);
    await seedCollection('payments', paymentsData);
    await seedCollection('priceHistory', priceHistoryData);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`  - Users: ${usersData.length}`);
    console.log(`  - Farmers: ${farmersData.length}`);
    console.log(`  - SHGs: ${shgsData.length}`);
    console.log(`  - Listings: ${listingsData.length}`);
    console.log(`  - Products: ${productsData.length}`);
    console.log(`  - Orders: ${ordersData.length}`);
    console.log(`  - Batches: ${batchesData.length}`);
    console.log(`  - Requests: ${requestsData.length}`);
    console.log(`  - Quality Checks: ${qualityChecksData.length}`);
    console.log(`  - Payments: ${paymentsData.length}`);
    console.log(`  - Price History: ${priceHistoryData.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed
seedDatabase()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
