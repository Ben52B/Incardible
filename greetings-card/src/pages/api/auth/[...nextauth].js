import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Keep Google's ID token in the (encrypted) next-auth JWT so the server
    // can hand it to the API, which verifies it with Google.
    async jwt({ token, account }) {
      if (account?.id_token) {
        token.idToken = account.id_token;
        token.idTokenIssuedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      session.idToken = token.idToken || null;
      session.idTokenIssuedAt = token.idTokenIssuedAt || null;
      return session;
    }
  }
};

export default NextAuth(authOptions);
