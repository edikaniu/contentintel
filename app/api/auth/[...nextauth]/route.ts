import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/config";

const nextAuth = NextAuth(authOptions);

async function handler(
  req: Request,
  ctx: { params: Promise<{ nextauth: string[] }> }
) {
  const params = await ctx.params;
  return nextAuth(req, { params });
}

export { handler as GET, handler as POST };
