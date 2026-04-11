import {
  connectToDatabase,
  isDatabaseConfigured,
  isDatabaseUnavailableError
} from "@/lib/db";
import { comparePassword, hashPassword, signAdminToken } from "@/lib/auth";
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

export async function registerCustomer(payload) {
  if (!isDatabaseConfigured()) {
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
    return Offer.find().sort({ createdAt: -1 }).lean();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
    }
    throw error;
  }
}

export async function listCustomers() {
  if (!isDatabaseConfigured()) {
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
    return Purchase.find().populate("customerId").sort({ purchaseDate: -1 }).lean();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
    }
    throw error;
  }
}

export async function sendOfferCampaign(message) {
  if (!isDatabaseConfigured()) {
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
    throw new Error("MongoDB Atlas is not configured. Add a valid MONGODB_URI in .env.");
  }

  try {
    await connectToDatabase();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      throw new Error("MongoDB Atlas is unavailable. Check your cluster, IP access list, and connection string.");
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
