import crypto from "crypto";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}
