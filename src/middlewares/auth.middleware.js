import jwt from 'jsonwebtoken';

export function jwtGuard(req, res, next) {
  const raw = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
  if (!raw) return res.status(401).json({ message: 'Unauthorized' });
  try {
    req.user = jwt.verify(raw, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
