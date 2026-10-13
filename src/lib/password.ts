import argon2 from "argon2";

export const hashPassword = (plain: string) =>
  argon2.hash(plain, { type: argon2.argon2id });

export const verifyPassword = async (hash: string, plain: string) => {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed stored hash must read as "wrong password", not a 500.
    return false;
  }
};
