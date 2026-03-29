import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
  updateUserGoogleId,
} from '@/db/user-repository';
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    Google,
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const googleId = account.providerAccountId;
        const email = profile?.email;
        const name = (profile?.name ?? email ?? '') as string;

        if (!email) return false;

        // Try find by googleId
        let dbUser = await findUserByGoogleId(googleId);
        if (dbUser) {
          user.id = dbUser.id;
          user.name = dbUser.name;
          user.email = dbUser.email;
          return true;
        }

        // Try find by email (link accounts)
        dbUser = await findUserByEmail(email);
        if (dbUser) {
          await updateUserGoogleId(dbUser.id, googleId);
          user.id = dbUser.id;
          user.name = dbUser.name;
          user.email = dbUser.email;
          return true;
        }

        // Create new user
        dbUser = await createUser({ email, name, googleId });
        user.id = dbUser.id;
        user.name = dbUser.name;
        user.email = dbUser.email;
        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        email: token.email!,
        name: token.name!,
      };
      return session;
    },
  },
});
