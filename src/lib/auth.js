import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signAdminToken(admin) {
  const secret = process.env.JWT_SECRET || "change-this-secret";

  return jwt.sign(
    {
      sub: admin._id?.toString?.() || admin.id || "admin",
      email: admin.email,
      role: admin.role || "owner"
    },
    secret,
    { expiresIn: "7d" }
  );
}
