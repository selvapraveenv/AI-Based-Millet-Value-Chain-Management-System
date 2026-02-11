// Seed Data Script - Add this data to Firestore for testing
// Run this once to populate your database with sample data

import { 
  collection, 
  addDoc, 
  serverTimestamp,
  writeBatch,
  doc
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================
// SAMPLE DATA
// ============================================

export const sampleFarmers = [
  { name: "Ramesh Kumar", phone: "9876543210", email: "ramesh@example.com", location: "Bengaluru Rural", district: "Bengaluru Rural", state: "Karnataka", verified: true, totalListings: 5, totalEarnings: 45000 },
  { name: "Suresh Patil", phone: "9876543211", email: "suresh@example.com", location: "Tumkur", district: "Tumkur", state: "Karnataka", verified: true, totalListings: 3, totalEarnings: 32000 },
  { name: "Lakshmi Devi", phone: "9876543212", email: "lakshmi@example.com", location: "Mysuru", district: "Mysuru", state: "Karnataka", verified: true, totalListings: 4, totalEarnings: 28000 },
  { name: "Mahesh Gowda", phone: "9876543213", email: "mahesh@example.com", location: "Hassan", district: "Hassan", state: "Karnataka", verified: true, totalListings: 2, totalEarnings: 18000 },
  { name: "Anita Sharma", phone: "9876543214", email: "anita@example.com", location: "Mandya", district: "Mandya", state: "Karnataka", verified: true, totalListings: 6, totalEarnings: 52000 },
  { name: "Venkatesh Rao", phone: "9876543215", email: "venkatesh@example.com", location: "Davangere", district: "Davangere", state: "Karnataka", verified: false, totalListings: 0, totalEarnings: 0 },
  { name: "Raju Gowda", phone: "9876543216", email: "raju@example.com", location: "Davangere", district: "Davangere", state: "Karnataka", verified: false, totalListings: 0, totalEarnings: 0 },
];

export const sampleSHGs = [
  { name: "Mahila SHG", location: "Bengaluru Rural", district: "Bengaluru Rural", state: "Karnataka", members: 15, farmerConnections: 12, verified: true },
  { name: "Green Valley SHG", location: "Tumkur", district: "Tumkur", state: "Karnataka", members: 12, farmerConnections: 8, verified: true },
  { name: "Sunrise SHG", location: "Mysuru", district: "Mysuru", state: "Karnataka", members: 18, farmerConnections: 15, verified: true },
  { name: "Nari Shakti SHG", location: "Hassan", district: "Hassan", state: "Karnataka", members: 10, farmerConnections: 6, verified: true },
  { name: "Krishi Mahila Group", location: "Mandya", district: "Mandya", state: "Karnataka", members: 14, farmerConnections: 10, verified: true },
  { name: "Namma Mahila Group", location: "Bellary", district: "Bellary", state: "Karnataka", members: 8, farmerConnections: 0, verified: false },
];

export const sampleListings = [
  { farmerId: "", farmerName: "Ramesh Kumar", milletType: "Finger Millet (Ragi)", quantity: 200, unit: "kg", location: "Bengaluru Rural", pricePerKg: 45, status: "active", quality: "Premium", harvestDate: "2024-01-10" },
  { farmerId: "", farmerName: "Suresh Patil", milletType: "Pearl Millet (Bajra)", quantity: 150, unit: "kg", location: "Tumkur", pricePerKg: 38, status: "active", quality: "Standard", harvestDate: "2024-01-08" },
  { farmerId: "", farmerName: "Lakshmi Devi", milletType: "Foxtail Millet", quantity: 100, unit: "kg", location: "Mysuru", pricePerKg: 52, status: "sold", quality: "Premium", harvestDate: "2024-01-05" },
  { farmerId: "", farmerName: "Mahesh Gowda", milletType: "Sorghum (Jowar)", quantity: 300, unit: "kg", location: "Hassan", pricePerKg: 35, status: "active", quality: "Standard", harvestDate: "2024-01-12" },
  { farmerId: "", farmerName: "Anita Sharma", milletType: "Little Millet", quantity: 80, unit: "kg", location: "Mandya", pricePerKg: 48, status: "active", quality: "Premium", harvestDate: "2024-01-15" },
];

export const sampleProducts = [
  { name: "Organic Ragi Flour", description: "Stone-ground organic finger millet flour, perfect for rotis and porridge.", shgId: "", shgName: "Mahila SHG", farmerId: "", farmerName: "Ramesh Kumar", batchId: "BATCH001", category: "Flour", pricePerKg: 85, stock: 50, rating: 4.8, location: "Bengaluru Rural", harvestDate: "Dec 2023" },
  { name: "Pearl Millet Atta Premium", description: "Fine pearl millet flour ideal for traditional rotis and bhakri.", shgId: "", shgName: "Green Valley SHG", farmerId: "", farmerName: "Suresh Patil", batchId: "BATCH002", category: "Flour", pricePerKg: 75, stock: 40, rating: 4.6, location: "Tumkur", harvestDate: "Nov 2023" },
  { name: "Foxtail Millet Rice", description: "Polished foxtail millet ready to cook, low glycemic index.", shgId: "", shgName: "Sunrise SHG", farmerId: "", farmerName: "Lakshmi Devi", batchId: "BATCH003", category: "Grain", pricePerKg: 120, stock: 30, rating: 4.9, location: "Mysuru", harvestDate: "Jan 2024" },
  { name: "Millet Mix Pack", description: "Assorted millets combo - includes ragi, bajra, jowar, foxtail, and little millet.", shgId: "", shgName: "Nari Shakti SHG", farmerId: "", farmerName: "Multiple Farmers", batchId: "BATCH004", category: "Mixed", pricePerKg: 150, stock: 25, rating: 4.7, location: "Various", harvestDate: "Dec 2023" },
  { name: "Jowar Flakes", description: "Crispy sorghum flakes for a healthy breakfast.", shgId: "", shgName: "Krishi Mahila Group", farmerId: "", farmerName: "Mahesh Gowda", batchId: "BATCH005", category: "Ready to Eat", pricePerKg: 95, stock: 60, rating: 4.5, location: "Hassan", harvestDate: "Jan 2024" },
  { name: "Little Millet Rice", description: "Nutritious little millet, great for pulao and kheer.", shgId: "", shgName: "Mahila SHG", farmerId: "", farmerName: "Anita Sharma", batchId: "BATCH006", category: "Grain", pricePerKg: 110, stock: 35, rating: 4.8, location: "Mandya", harvestDate: "Dec 2023" },
];

export const sampleOrders = [
  { productId: "", productName: "Organic Ragi Flour", buyerId: "consumer1", buyerName: "Priya Singh", sellerId: "", sellerName: "Mahila SHG", sellerType: "shg" as const, quantity: 2, unit: "kg", totalPrice: 170, status: "delivered" as const, orderDate: new Date("2024-01-10"), deliveryDate: new Date("2024-01-14") },
  { productId: "", productName: "Jowar Flakes", buyerId: "consumer1", buyerName: "Priya Singh", sellerId: "", sellerName: "Krishi Mahila Group", sellerType: "shg" as const, quantity: 1, unit: "kg", totalPrice: 95, status: "shipped" as const, orderDate: new Date("2024-01-13") },
  { productId: "", productName: "Millet Mix Pack", buyerId: "consumer1", buyerName: "Priya Singh", sellerId: "", sellerName: "Nari Shakti SHG", sellerType: "shg" as const, quantity: 1, unit: "pack", totalPrice: 150, status: "processing" as const, orderDate: new Date("2024-01-15") },
  { productId: "", productName: "Pearl Millet Atta", buyerId: "consumer2", buyerName: "Rahul Verma", sellerId: "", sellerName: "Green Valley SHG", sellerType: "shg" as const, quantity: 3, unit: "kg", totalPrice: 225, status: "delivered" as const, orderDate: new Date("2024-01-05"), deliveryDate: new Date("2024-01-09") },
  { productId: "", productName: "Foxtail Millet Rice", buyerId: "consumer2", buyerName: "Rahul Verma", sellerId: "", sellerName: "Sunrise SHG", sellerType: "shg" as const, quantity: 2, unit: "kg", totalPrice: 240, status: "delivered" as const, orderDate: new Date("2024-01-01"), deliveryDate: new Date("2024-01-05") },
];

export const sampleRequests = [
  { shgId: "", shgName: "Mahila SHG", farmerId: "", farmerName: "Ramesh Kumar", milletType: "Finger Millet", quantity: 50, status: "pending" as const },
  { shgId: "", shgName: "Green Valley SHG", farmerId: "", farmerName: "Suresh Patil", milletType: "Pearl Millet", quantity: 100, status: "accepted" as const },
  { shgId: "", shgName: "Sunrise SHG", farmerId: "", farmerName: "Lakshmi Devi", milletType: "Foxtail Millet", quantity: 30, status: "pending" as const },
];

export const sampleBatches = [
  { shgId: "", milletType: "Ragi Flour", quantity: 80, stage: "packaging" as const, completion: 85, farmerId: "", farmerName: "Ramesh Kumar" },
  { shgId: "", milletType: "Bajra Atta", quantity: 60, stage: "processing" as const, completion: 60, farmerId: "", farmerName: "Suresh Patil" },
  { shgId: "", milletType: "Foxtail Rice", quantity: 40, stage: "quality_check" as const, completion: 95, farmerId: "", farmerName: "Lakshmi Devi" },
];

// ============================================
// SEED FUNCTION
// ============================================

export async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  
  try {
    // Add Farmers
    console.log("Adding farmers...");
    const farmerIds: string[] = [];
    for (const farmer of sampleFarmers) {
      const docRef = await addDoc(collection(db, 'farmers'), {
        ...farmer,
        createdAt: serverTimestamp(),
      });
      farmerIds.push(docRef.id);
    }
    console.log(`✅ Added ${farmerIds.length} farmers`);

    // Add SHGs
    console.log("Adding SHGs...");
    const shgIds: string[] = [];
    for (const shg of sampleSHGs) {
      const docRef = await addDoc(collection(db, 'shgs'), {
        ...shg,
        createdAt: serverTimestamp(),
      });
      shgIds.push(docRef.id);
    }
    console.log(`✅ Added ${shgIds.length} SHGs`);

    // Add Listings (with farmer IDs)
    console.log("Adding listings...");
    for (let i = 0; i < sampleListings.length; i++) {
      const listing = {
        ...sampleListings[i],
        farmerId: farmerIds[i % farmerIds.length],
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'listings'), listing);
    }
    console.log(`✅ Added ${sampleListings.length} listings`);

    // Add Products (with SHG and farmer IDs)
    console.log("Adding products...");
    const productIds: string[] = [];
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = {
        ...sampleProducts[i],
        shgId: shgIds[i % shgIds.length],
        farmerId: farmerIds[i % farmerIds.length],
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'products'), product);
      productIds.push(docRef.id);
    }
    console.log(`✅ Added ${productIds.length} products`);

    // Add Orders
    console.log("Adding orders...");
    for (let i = 0; i < sampleOrders.length; i++) {
      const order = {
        ...sampleOrders[i],
        productId: productIds[i % productIds.length],
        sellerId: shgIds[i % shgIds.length],
      };
      await addDoc(collection(db, 'orders'), order);
    }
    console.log(`✅ Added ${sampleOrders.length} orders`);

    // Add Requests
    console.log("Adding requests...");
    for (let i = 0; i < sampleRequests.length; i++) {
      const request = {
        ...sampleRequests[i],
        shgId: shgIds[i % shgIds.length],
        farmerId: farmerIds[i % farmerIds.length],
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'requests'), request);
    }
    console.log(`✅ Added ${sampleRequests.length} requests`);

    // Add Batches
    console.log("Adding batches...");
    for (let i = 0; i < sampleBatches.length; i++) {
      const batch = {
        ...sampleBatches[i],
        shgId: shgIds[i % shgIds.length],
        farmerId: farmerIds[i % farmerIds.length],
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'batches'), batch);
    }
    console.log(`✅ Added ${sampleBatches.length} batches`);

    console.log("🎉 Database seeding completed successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    return { success: false, error };
  }
}
