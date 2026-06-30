import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not configured in production environment!');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'dsa_master_secret_key_change_me_in_production_12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (payload: { id: string }): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): { id: string } => {
  return jwt.verify(token, JWT_SECRET) as { id: string };
};
export default { signToken, verifyToken };
