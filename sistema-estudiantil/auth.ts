import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = String(credentials.email).trim().toLowerCase()
        const user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role
        token.id = user.id as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { role: Role }).role = token.role as Role
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login"
  }
})
