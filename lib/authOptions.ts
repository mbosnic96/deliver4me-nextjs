import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import UserModel, { IUserLean } from "@/lib/models/User"
import { dbConnect } from "@/lib/db/db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect()
        
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Unesite podatke")
        }


        const user = await UserModel.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).select("+password +failedLoginAttempts +lockUntil +lastFailedLogin")

        if (!user) {
          throw new Error("Korisnik nije pronađen")
        }


        if (user.isDeleted) {
          throw new Error("Račun deaktiviran. Kontaktirajte podršku.")
        }

        const failedLoginAttempts = user.failedLoginAttempts || 0;
        const lockUntil = user.lockUntil || null;
        const now = new Date();

        if (lockUntil && lockUntil > now) {
          const minutesLeft = Math.ceil((lockUntil.getTime() - now.getTime()) / 60000)
          console.log(`Account is locked, minutes left: ${minutesLeft}`);
          throw new Error(`Račun privremeno zaključan zbog više neuspjelih pokušaja prijave. Pokušajte ponovo za ${minutesLeft} minuta`)
        }

        if (lockUntil && lockUntil <= now) {
          await UserModel.updateOne(
            { _id: user._id },
            { 
              failedLoginAttempts: 0,
              lockUntil: null,
              lastFailedLogin: null
            }
          );
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password)

        if (!isMatch) {
          const updatedUser = await UserModel.findOneAndUpdate(
            { _id: user._id },
            {
              $inc: { failedLoginAttempts: 1 },
              $set: { lastFailedLogin: new Date() }
            },
            { new: true, select: '+failedLoginAttempts' }
          );

          const newAttempts = updatedUser?.failedLoginAttempts || failedLoginAttempts + 1;
          
          if (newAttempts >= 5) {
            const lockUntilDate = new Date(Date.now() + 30 * 60 * 1000);
            
            await UserModel.updateOne(
              { _id: user._id },
              {
                $set: { lockUntil: lockUntilDate }
              }
            );
            
            throw new Error("Račun je privremeno zaključan. Pokušajte ponovo za 30 minuta.");
          }
          
          throw new Error("Netačna lozinka ili email");
        }


        await UserModel.updateOne(
          { _id: user._id },
          {
            $set: {
              failedLoginAttempts: 0,
              lockUntil: null,
              lastFailedLogin: null
            }
          }
        );

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        ;(session.user as any).id = (token as any).id
        ;(session.user as any).role = (token as any).role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
}