import bcrypt from "bcryptjs";

// Kept separate from auth.ts so middleware (Edge runtime) never has to
// bundle bcryptjs — it only needs the jose-based session helpers.
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
