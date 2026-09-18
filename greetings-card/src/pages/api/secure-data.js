// pages/api/secure-data.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.status(200).json({
    message: 'Authenticated request success!',
    user: session.user, // name, email, image
    idToken: session.idToken || null
  });
}
