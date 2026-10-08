"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error?: string; email?: string };

function safeCallback(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  // Only same-origin paths; reject protocol-relative ("//evil.com") URLs.
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const email = typeof raw.email === "string" ? raw.email : "";
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Enter your email address and password.", email };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallback(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "rate_limited") {
      return {
        error: "Too many failed attempts. Wait 15 minutes and try again.",
        email,
      };
    }
    if (error instanceof AuthError) {
      return { error: "That email and password don't match an active account.", email };
    }
    throw error; // the success redirect is thrown as a control-flow error
  }
  return {};
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
