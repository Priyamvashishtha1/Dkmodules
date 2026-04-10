import {
  connectToDatabase,
  isDatabaseConfigured,
  isDatabaseUnavailableError
} from "@/lib/db";
import { comparePassword, hashPassword, signAdminToken } from "@/lib/auth";
import { createRecordId, readLocalStore, withLocalStore } from "@/lib/local-store";
import { calculatePoints } from "@/lib/points";
import { sendWhatsApp } from "@/lib/whatsapp";
import { Admin } from "@/models/Admin";
import { Customer } from "@/models/Customer";
import { Offer } from "@/models/Offer";
import { Purchase } from "@/models/Purchase";
import { Wallet } from "@/models/Wallet";

async function ensureDefaultAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  let admin = await Admin.findOne({ email });

  if (!admin) {
    admin = await Admin.create({
      name: "DK Admin",
      email,
      passwordHash: await hashPassword(password),
      role: "owner"
    });
  }

  return admin;
}

async function getOrCreateWallet(customerId) {
  let wallet = await Wallet.findOne({ customerId });

  if (!wallet) {
    wallet = await Wallet.create({
      customerId,
      totalPoints: 0,
      redeemedPoints: 0,
      remainingPoints: 0
    });
  }

  return wallet;
}

function normalizeMobile(mobile) {
  return String(mobile || "").replace(/\D/g, "");
}

function toSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

function createEmptyWallet(customerId) {
  return {
    id: createRecordId("wallet"),
    customerId,
    totalPoints: 0,
    redeemedPoints: 0,
    remainingPoints: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function registerCustomerLocally(payload) {
  const mobile = normalizeMobile(payload.mobile);

  if (!mobile) {
    throw new Error("Mobile number is required.");
  }

  return withLocalStore(async (store) => {
    const now = new Date().toISOString();
    let customer = store.customers.find((entry) => entry.mobile === mobile);

    if (!customer) {
      customer = {
        id: createRecordId("customer"),
        name: payload.name,
        age: payload.age ? Number(payload.age) : null,
        city: payload.city,
        mobile,
        dob: payload.dob || null,
        createdAt: now,
        updatedAt: now
      };

      store.customers.unshift(customer);
    } else {
      customer.name = payload.name || customer.name;
      customer.age = payload.age ? Number(payload.age) : customer.age;
      customer.city = payload.city || customer.city;
      customer.dob = payload.dob || customer.dob;
      customer.updatedAt = now;
    }

    let wallet = store.wallets.find((entry) => entry.customerId === customer.id);
    if (!wallet) {
      wallet = createEmptyWallet(customer.id);
      store.wallets.push(wallet);
    }

    let purchase = null;
    let earnedPoints = 0;

    if (payload.phoneModel && payload.purchaseAmount && payload.invoiceNumber && payload.purchaseDate) {
      const existingInvoice = store.purchases.find(
        (entry) => entry.invoiceNumber === payload.invoiceNumber
      );

      if (!existingInvoice) {
        earnedPoints = calculatePoints(payload.purchaseAmount);
        purchase = {
          id: createRecordId("purchase"),
          customerId: customer.id,
          mobileModel: payload.phoneModel,
          price: Number(payload.purchaseAmount),
          pointsEarned: earnedPoints,
          invoiceNumber: payload.invoiceNumber,
          purchaseDate: payload.purchaseDate,
          createdAt: now,
          updatedAt: now
        };

        store.purchases.unshift(purchase);
        wallet.totalPoints += earnedPoints;
        wallet.remainingPoints += earnedPoints;
        wallet.updatedAt = now;
      }
    }

    await sendWhatsApp(
      customer.mobile,
      [
        `Welcome to DK Enterprises Rewards, ${customer.name}!`,
        earnedPoints ? `You earned ${earnedPoints} points on your purchase.` : "Your rewards wallet is now ready.",
        `Total points: ${wallet.remainingPoints}`
      ].join("\n")
    );

    return {
      customer: toSerializable(customer),
      wallet: toSerializable(wallet),
      purchase: toSerializable(purchase)
    };
  });
}

async function getWalletByMobileLocally(mobile) {
  const cleaned = normalizeMobile(mobile);
  const store = await readLocalStore();
  const customer = store.customers.find((entry) => entry.mobile === cleaned);

  if (!customer) {
    return null;
  }

  const wallet = store.wallets.find((entry) => entry.customerId === customer.id) || createEmptyWallet(customer.id);
  const purchases = store.purchases.filter((entry) => entry.customerId === customer.id);

  return {
    customer: toSerializable(customer),
    wallet: toSerializable(wallet),
    purchases: toSerializable(purchases)
  };
}

async function listCustomersLocally() {
  const store = await readLocalStore();
  const walletMap = new Map(store.wallets.map((wallet) => [wallet.customerId, wallet]));

  return store.customers.map((customer) => ({
    ...customer,
    _id: customer.id,
    wallet: walletMap.get(customer.id) || createEmptyWallet(customer.id)
  }));
}

async function listPurchasesLocally() {
  const store = await readLocalStore();
  const customerMap = new Map(store.customers.map((customer) => [customer.id, customer]));

  return store.purchases.map((purchase) => ({
    ...purchase,
    _id: purchase.id,
    customerId: customerMap.get(purchase.customerId)
      ? {
          ...customerMap.get(purchase.customerId),
          _id: customerMap.get(purchase.customerId).id
        }
      : null
  }));
}

async function listOffersLocally() {
  const store = await readLocalStore();
  return store.offers.map((offer) => ({ ...offer, _id: offer.id }));
}

async function createOfferLocally(payload) {
  return withLocalStore(async (store) => {
    const now = new Date().toISOString();
    const offer = {
      id: createRecordId("offer"),
      title: payload.title,
      description: payload.description,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: payload.status || "active",
      createdAt: now,
      updatedAt: now
    };

    store.offers.unshift(offer);
    return { ...offer, _id: offer.id };
  });
}

async function sendOfferCampaignLocally(message) {
  const store = await readLocalStore();
  const results = [];

  for (const customer of store.customers) {
    const result = await sendWhatsApp(customer.mobile, message);
    results.push({ mobile: customer.mobile, ...result });
  }

  return {
    total: store.customers.length,
    results
  };
}

async function redeemCustomerPointsLocally(payload) {
  const mobile = normalizeMobile(payload.mobile);
  const points = Number(payload.points);

  if (points <= 0) {
    throw new Error("Redeem points must be greater than zero.");
  }

  return withLocalStore(async (store) => {
    const customer = store.customers.find((entry) => entry.mobile === mobile);

    if (!customer) {
      throw new Error("Customer not found.");
    }

    let wallet = store.wallets.find((entry) => entry.customerId === customer.id);
    if (!wallet) {
      wallet = createEmptyWallet(customer.id);
      store.wallets.push(wallet);
    }

    if (wallet.remainingPoints < points) {
      throw new Error("Customer does not have enough points.");
    }

    wallet.redeemedPoints += points;
    wallet.remainingPoints -= points;
    wallet.updatedAt = new Date().toISOString();

    await sendWhatsApp(
      customer.mobile,
      `You redeemed ${points} points successfully.\nRemaining points: ${wallet.remainingPoints}`
    );

    return {
      customer: toSerializable(customer),
      wallet: toSerializable(wallet)
    };
  });
}

async function recordPurchaseLocally(payload) {
  const mobile = normalizeMobile(payload.mobile);

  return withLocalStore(async (store) => {
    const customer = store.customers.find((entry) => entry.mobile === mobile);

    if (!customer) {
      throw new Error("Customer not found. Register the customer first.");
    }

    const existingInvoice = store.purchases.find(
      (entry) => entry.invoiceNumber === payload.invoiceNumber
    );

    if (existingInvoice) {
      throw new Error("This invoice number already exists.");
    }

    let wallet = store.wallets.find((entry) => entry.customerId === customer.id);
    if (!wallet) {
      wallet = createEmptyWallet(customer.id);
      store.wallets.push(wallet);
    }

    const pointsEarned = calculatePoints(payload.price);
    const now = new Date().toISOString();
    const purchase = {
      id: createRecordId("purchase"),
      customerId: customer.id,
      mobileModel: payload.mobileModel,
      price: Number(payload.price),
      pointsEarned,
      invoiceNumber: payload.invoiceNumber,
      purchaseDate: payload.purchaseDate,
      createdAt: now,
      updatedAt: now
    };

    store.purchases.unshift(purchase);
    wallet.totalPoints += pointsEarned;
    wallet.remainingPoints += pointsEarned;
    wallet.updatedAt = now;

    await sendWhatsApp(
      customer.mobile,
      `Hi ${customer.name}, thanks for purchasing ${payload.mobileModel}.\nYou earned ${pointsEarned} points.\nTotal points: ${wallet.remainingPoints}`
    );

    return {
      customer: toSerializable(customer),
      wallet: toSerializable(wallet),
      purchase: toSerializable(purchase)
    };
  });
}

async function getDashboardStatsLocally() {
  const store = await readLocalStore();
  const totalPoints = store.wallets.reduce((sum, wallet) => sum + Number(wallet.totalPoints || 0), 0);
  const redeemedPoints = store.wallets.reduce(
    (sum, wallet) => sum + Number(wallet.redeemedPoints || 0),
    0
  );
  const remainingPoints = store.wallets.reduce(
    (sum, wallet) => sum + Number(wallet.remainingPoints || 0),
    0
  );
  const totalSales = store.purchases.reduce((sum, purchase) => sum + Number(purchase.price || 0), 0);
  const purchaseCounts = new Map();

  for (const purchase of store.purchases) {
    purchaseCounts.set(
      purchase.customerId,
      (purchaseCounts.get(purchase.customerId) || 0) + 1
    );
  }

  const repeatCustomers = Array.from(purchaseCounts.values()).filter((count) => count > 1).length;

  return {
    customerCount: store.customers.length,
    purchaseCount: store.purchases.length,
    totalPoints,
    redeemedPoints,
    remainingPoints,
    totalSales,
    repeatCustomers
  };
}

export async function registerCustomer(payload) {
  if (!isDatabaseConfigured()) {
    return registerCustomerLocally(payload);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB is not running. Start MongoDB locally or add a MongoDB Atlas URI in .env.");
    }
    throw error;
  }

  const mobile = normalizeMobile(payload.mobile);
  if (!mobile) {
    throw new Error("Mobile number is required.");
  }

  let customer = await Customer.findOne({ mobile });

  if (!customer) {
    customer = await Customer.create({
      name: payload.name,
      age: payload.age || undefined,
      city: payload.city,
      mobile,
      dob: payload.dob || undefined
    });
  } else {
    customer.name = payload.name || customer.name;
    customer.age = payload.age || customer.age;
    customer.city = payload.city || customer.city;
    customer.dob = payload.dob || customer.dob;
    await customer.save();
  }

  const wallet = await getOrCreateWallet(customer._id);
  let purchase = null;
  let earnedPoints = 0;

  if (payload.phoneModel && payload.purchaseAmount && payload.invoiceNumber && payload.purchaseDate) {
    const existingInvoice = await Purchase.findOne({ invoiceNumber: payload.invoiceNumber });

    if (!existingInvoice) {
      earnedPoints = calculatePoints(payload.purchaseAmount);
      purchase = await Purchase.create({
        customerId: customer._id,
        mobileModel: payload.phoneModel,
        price: Number(payload.purchaseAmount),
        pointsEarned: earnedPoints,
        invoiceNumber: payload.invoiceNumber,
        purchaseDate: new Date(payload.purchaseDate)
      });

      wallet.totalPoints += earnedPoints;
      wallet.remainingPoints += earnedPoints;
      await wallet.save();
    }
  }

  await sendWhatsApp(
    customer.mobile,
    [
      `Welcome to DK Enterprises Rewards, ${customer.name}!`,
      earnedPoints ? `You earned ${earnedPoints} points on your purchase.` : "Your rewards wallet is now ready.",
      `Total points: ${wallet.remainingPoints}`
    ].join("\n")
  );

  return { customer, wallet, purchase };
}

export async function recordPurchase(payload) {
  if (!isDatabaseConfigured()) {
    return recordPurchaseLocally(payload);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB is not running. Start MongoDB locally or add a MongoDB Atlas URI in .env.");
    }
    throw error;
  }

  const customer = await Customer.findOne({ mobile: normalizeMobile(payload.mobile) });
  if (!customer) {
    throw new Error("Customer not found. Register the customer first.");
  }

  const existingInvoice = await Purchase.findOne({ invoiceNumber: payload.invoiceNumber });
  if (existingInvoice) {
    throw new Error("This invoice number already exists.");
  }

  const pointsEarned = calculatePoints(payload.price);
  const purchase = await Purchase.create({
    customerId: customer._id,
    mobileModel: payload.mobileModel,
    price: Number(payload.price),
    pointsEarned,
    invoiceNumber: payload.invoiceNumber,
    purchaseDate: new Date(payload.purchaseDate)
  });

  const wallet = await getOrCreateWallet(customer._id);
  wallet.totalPoints += pointsEarned;
  wallet.remainingPoints += pointsEarned;
  await wallet.save();

  await sendWhatsApp(
    customer.mobile,
    `Hi ${customer.name}, thanks for purchasing ${payload.mobileModel}.\nYou earned ${pointsEarned} points.\nTotal points: ${wallet.remainingPoints}`
  );

  return { customer, wallet, purchase };
}

export async function redeemCustomerPoints(payload) {
  if (!isDatabaseConfigured()) {
    return redeemCustomerPointsLocally(payload);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB is not running. Start MongoDB locally or add a MongoDB Atlas URI in .env.");
    }
    throw error;
  }

  const customer = await Customer.findOne({ mobile: normalizeMobile(payload.mobile) });
  if (!customer) {
    throw new Error("Customer not found.");
  }

  const wallet = await getOrCreateWallet(customer._id);
  const points = Number(payload.points);

  if (points <= 0) {
    throw new Error("Redeem points must be greater than zero.");
  }

  if (wallet.remainingPoints < points) {
    throw new Error("Customer does not have enough points.");
  }

  wallet.redeemedPoints += points;
  wallet.remainingPoints -= points;
  await wallet.save();

  await sendWhatsApp(
    customer.mobile,
    `You redeemed ${points} points successfully.\nRemaining points: ${wallet.remainingPoints}`
  );

  return { customer, wallet };
}

export async function getWalletByMobile(mobile) {
  if (!isDatabaseConfigured()) {
    return getWalletByMobileLocally(mobile);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return null;
    }
    throw error;
  }

  const customer = await Customer.findOne({ mobile: normalizeMobile(mobile) });
  if (!customer) {
    return null;
  }

  const [wallet, purchases] = await Promise.all([
    getOrCreateWallet(customer._id),
    Purchase.find({ customerId: customer._id }).sort({ purchaseDate: -1 }).lean()
  ]);

  return {
    customer: customer.toObject(),
    wallet: wallet.toObject(),
    purchases
  };
}

export async function createOffer(payload) {
  if (!isDatabaseConfigured()) {
    return createOfferLocally(payload);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB is not running. Start MongoDB locally or add a MongoDB Atlas URI in .env.");
    }
    throw error;
  }

  return Offer.create({
    title: payload.title,
    description: payload.description,
    startDate: new Date(payload.startDate),
    endDate: new Date(payload.endDate),
    status: payload.status || "active"
  });
}

export async function listOffers() {
  if (!isDatabaseConfigured()) {
    return listOffersLocally();
  }

  try {
    await connectToDatabase();
    return Offer.find().sort({ createdAt: -1 }).lean();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function listCustomers() {
  if (!isDatabaseConfigured()) {
    return listCustomersLocally();
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return [];
    }
    throw error;
  }

  const customers = await Customer.find().sort({ createdAt: -1 }).lean();
  const wallets = await Wallet.find().lean();
  const walletMap = new Map(wallets.map((wallet) => [wallet.customerId.toString(), wallet]));

  return customers.map((customer) => ({
    ...customer,
    wallet: walletMap.get(customer._id.toString()) || {
      totalPoints: 0,
      redeemedPoints: 0,
      remainingPoints: 0
    }
  }));
}

export async function listPurchases() {
  if (!isDatabaseConfigured()) {
    return listPurchasesLocally();
  }

  try {
    await connectToDatabase();
    return Purchase.find().populate("customerId").sort({ purchaseDate: -1 }).lean();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return [];
    }
    throw error;
  }
}

export async function sendOfferCampaign(message) {
  if (!isDatabaseConfigured()) {
    return sendOfferCampaignLocally(message);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB is not running. Start MongoDB locally or add a MongoDB Atlas URI in .env.");
    }
    throw error;
  }

  const customers = await Customer.find().lean();
  const results = [];

  for (const customer of customers) {
    const result = await sendWhatsApp(customer.mobile, message);
    results.push({ mobile: customer.mobile, ...result });
  }

  return {
    total: customers.length,
    results
  };
}

export async function loginAdmin(email, password) {
  if (!isDatabaseConfigured()) {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const admin = {
        id: "env-admin",
        email,
        role: "owner",
        name: "DK Admin"
      };

      return {
        admin,
        token: signAdminToken(admin)
      };
    }

    throw new Error("Set MONGODB_URI or use the default admin credentials from .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        const admin = {
          id: "env-admin",
          email,
          role: "owner",
          name: "DK Admin"
        };

        return {
          admin,
          token: signAdminToken(admin)
        };
      }

      throw new Error("MongoDB is not running. Use the default admin credentials for now or connect a database.");
    }
    throw error;
  }
  await ensureDefaultAdmin();

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new Error("Invalid email or password.");
  }

  const valid = await comparePassword(password, admin.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password.");
  }

  return {
    admin,
    token: signAdminToken(admin)
  };
}

export async function getDashboardStats() {
  if (!isDatabaseConfigured()) {
    return getDashboardStatsLocally();
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        customerCount: 0,
        purchaseCount: 0,
        totalPoints: 0,
        redeemedPoints: 0,
        remainingPoints: 0,
        totalSales: 0,
        repeatCustomers: 0
      };
    }
    throw error;
  }

  const [customerCount, purchaseCount, walletTotals, salesTotals, repeatAggregate] = await Promise.all([
    Customer.countDocuments(),
    Purchase.countDocuments(),
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: "$totalPoints" },
          redeemedPoints: { $sum: "$redeemedPoints" },
          remainingPoints: { $sum: "$remainingPoints" }
        }
      }
    ]),
    Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$price" }
        }
      }
    ]),
    Purchase.aggregate([
      {
        $group: {
          _id: "$customerId",
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $count: "repeatCustomers"
      }
    ])
  ]);

  return {
    customerCount,
    purchaseCount,
    totalPoints: walletTotals[0]?.totalPoints || 0,
    redeemedPoints: walletTotals[0]?.redeemedPoints || 0,
    remainingPoints: walletTotals[0]?.remainingPoints || 0,
    totalSales: salesTotals[0]?.totalSales || 0,
    repeatCustomers: repeatAggregate[0]?.repeatCustomers || 0
  };
}
