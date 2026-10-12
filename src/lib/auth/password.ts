import crypto from 'crypto';

const HASH_PREFIX = 'pbkdf2-sha256-v1:';
const ITERATIONS = 600000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]).{8,}$/;

export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long.',
    };
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    return {
      valid: false,
      message:
        'Password must include at least one letter, one number, and one special character.',
    };
  }
  return { valid: true };
}

export async function hashPassword(
  plaintext: string
): Promise<{ salt: string; hash: string }> {
  const salt = crypto.randomBytes(32).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(plaintext, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

  return {
    salt,
    hash: `${HASH_PREFIX}${derived.toString('hex')}`,
  };
}

export function verifyPassword(
  plaintext: string,
  salt: string,
  storedHash: string
): boolean {
  try {
    const rawExpectedHex = storedHash.startsWith(HASH_PREFIX)
      ? storedHash.slice(HASH_PREFIX.length)
      : storedHash;

    const iterations = storedHash.startsWith(HASH_PREFIX) ? ITERATIONS : 25000;
    const keyLength = storedHash.startsWith(HASH_PREFIX) ? KEY_LENGTH : 512;

    const derived = crypto.pbkdf2Sync(
      plaintext,
      salt,
      iterations,
      keyLength,
      DIGEST
    );

    const derivedHex = derived.toString('hex');
    const expectedBuf = Buffer.from(rawExpectedHex, 'hex');
    const derivedBuf = Buffer.from(derivedHex, 'hex');

    if (expectedBuf.length !== derivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, derivedBuf);
  } catch (err) {
    console.error('Error during password verification:', err);
    return false;
  }
}
