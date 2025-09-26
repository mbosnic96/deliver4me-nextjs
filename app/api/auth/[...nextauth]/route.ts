import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import UserModel, { IUserLean } from '@/lib/models/User';
import { dbConnect } from '@/lib/db/db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          await dbConnect();
          
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Missing credentials');
          }

          const user = await UserModel.findOne({ 
            email: credentials.email.toLowerCase().trim() 
          })
          .select('+password')
          .lean();

          if (!user || Array.isArray(user)) {
            throw new Error('No user found');
          }

          const userData = user as IUserLean;

          if (userData.isDeleted) {
            throw new Error('Account disabled');
          }

          const isMatch = await bcrypt.compare(credentials.password, userData.password);
          if (!isMatch) {
            throw new Error('Incorrect password');
          }

          return {
            id: userData._id.toString(),
            email: userData.email,
            name: userData.name,
            role: userData.role,
          };
        } catch (error) {
          console.error('Auth error:', error instanceof Error ? error.message : 'Unknown error');
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).id = user.id;
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = (token as any).id;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };