import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // OneLogin OIDC Provider - Custom OAuth Configuration
    {
      id: "onelogin",
      name: "SMCCD OneLogin",
      type: "oauth",
      clientId: process.env.ONELOGIN_CLIENT_ID!,
      clientSecret: process.env.ONELOGIN_CLIENT_SECRET!,
      
      authorization: {
        url: "https://smccd.onelogin.com/oidc/2/auth",
        params: {
          scope: "openid profile email",
          response_type: "code",
        },
      },
      token: {
        url: "https://smccd.onelogin.com/oidc/2/token",
        async request(context) {
          const { client, params, checks, provider } = context;
          
          // Get client credentials from the provider config
          const clientId = process.env.ONELOGIN_CLIENT_ID!;
          const clientSecret = process.env.ONELOGIN_CLIENT_SECRET!;
          
          // Try Basic Authentication (common OIDC method)
          const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/onelogin`;
          const tokenParams = new URLSearchParams({
            grant_type: "authorization_code",
            code: params.code,
            redirect_uri: redirectUri,
          });
          
          const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
          
          console.log("Token request params (Basic Auth):", {
            grant_type: "authorization_code",
            code: params.code?.substring(0, 10) + "...",
            redirect_uri: redirectUri,
            auth_method: "Basic",
            client_id: clientId,
          });
          
          const response = await fetch(provider.token.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${basicAuth}`,
            },
            body: tokenParams,
          });
          
          const tokens = await response.json();
          console.log("Token response:", response.status, tokens);
          
          if (!response.ok) {
            throw new Error(`Token request failed: ${response.status} ${JSON.stringify(tokens)}`);
          }
          
          return { tokens };
        },
      },
      userinfo: {
        url: "https://smccd.onelogin.com/oidc/2/me",
        async request({ tokens, provider }) {
          console.log("UserInfo request with token:", tokens.access_token?.substring(0, 20) + "...");
          
          const response = await fetch(provider.userinfo.url, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });
          
          const userInfo = await response.json();
          console.log("UserInfo response:", response.status, userInfo);
          
          if (!response.ok) {
            throw new Error(`UserInfo request failed: ${response.status} ${JSON.stringify(userInfo)}`);
          }
          
          return userInfo;
        },
      },
      
      profile(profile) {
        console.log("Profile data received:", profile);
        
        // Ensure we have required fields
        if (!profile.sub && !profile.id) {
          throw new Error("Profile is missing required 'sub' or 'id' field");
        }
        
        return {
          id: profile.sub || profile.id, // OneLogin might use 'id' instead of 'sub'
          name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || profile.email,
          email: profile.email,
          image: profile.picture,
          // Map OneLogin attributes to our user model
          role: profile.role || "FACULTY", // Default role
          college: profile.college || profile.department,
        };
      },
    },
    
    // Credentials Provider (Development/Fallback)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours for production
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Skip database operations in test environment to avoid timeouts
      if (process.env.NODE_ENV === "test" || process.env.CYPRESS) {
        return true;
      }

      // Allow OneLogin account linking to existing users
      if (account?.provider === "onelogin") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { accounts: true }
          });

          if (existingUser) {
            // Check if OneLogin account is already linked
            const linkedAccount = existingUser.accounts.find(
              acc => acc.provider === "onelogin"
            );

            if (!linkedAccount) {
              // Link OneLogin account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                },
              });

              // Update user with OneLogin profile data if needed
              await prisma.user.update({
                where: { email: user.email! },
                data: {
                  name: user.name || `${profile?.given_name} ${profile?.family_name}`,
                  firstName: profile?.given_name,
                  lastName: profile?.family_name,
                },
              });
            }
          }
        } catch (error) {
          console.error("Error linking OneLogin account:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.college = user.college;
      }

      // Skip database queries in test environment to avoid timeouts
      if (process.env.NODE_ENV === "test" || process.env.CYPRESS) {
        // Use default values for test users
        token.role = token.role || "FACULTY";
        token.college = token.college || "SKYLINE";
        return token;
      }

      // Fetch user details if not in token
      if (token.id && !token.role) {
        try {
          const userDetails = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, college: true }
          });
          if (userDetails) {
            token.role = userDetails.role;
            token.college = userDetails.college;
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.college = token.college as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        console.log(
          `🎉 New user signed in: ${user.email} via ${account?.provider}`
        );
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};
