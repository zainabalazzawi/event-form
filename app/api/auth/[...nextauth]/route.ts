import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
              username: { label: "Username", type: "text", placeholder: "username" },
              password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
              const res = await fetch("/api/attendees", {
                method: 'POST',
                body: JSON.stringify(credentials),
                headers: { "Content-Type": "application/json" }
              })
              const user = await res.json()
        
              if (res.ok && user) {
                return user
              }
              return null
            }
          })
      ],
      callbacks: {

        // async session({ session, user, token }) {
        //   return session
        // },
        // async jwt({ token, user, account, profile }) {
        //     return token
        //   }
   },
      
})

export { handler as GET, handler as POST }