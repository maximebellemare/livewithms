import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import env from "../../lib/env";
import { supabase } from "../../lib/supabase/client";
import type { AuthResult, SignUpResult } from "./types";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);
    }),
  ]);
}

export const authApi = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await withTimeout(supabase.auth.getSession(), 8000, "Supabase session restore");
    if (error) {
      throw error;
    }

    return data.session;
  },
  async getCurrentSession(): Promise<Session | null> {
    const { data, error } = await withTimeout(supabase.auth.getSession(), 8000, "Supabase current session");
    if (error) {
      throw error;
    }

    return data.session;
  },
  onAuthStateChange(callback: (session: Session | null, event: AuthChangeEvent) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session, event);
    });
  },
  async signIn(email: string, password: string): Promise<AuthResult> {
    console.log("[auth] signin start", {
      email,
    });

    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      12000,
      "Supabase sign in",
    );

    if (error) {
      console.error("[auth] signin failure", {
        email,
        message: error.message,
        code: "code" in error ? error.code : undefined,
        status: "status" in error ? error.status : undefined,
      });
    } else {
      console.log("[auth] signin success", {
        email,
      });
    }

    return { error };
  },
  async signUp(email: string, password: string): Promise<SignUpResult> {
    console.log("[auth] signup start", {
      email,
    });

    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
      }),
      15000,
      "Supabase sign up",
    );

    if (error) {
      console.error("[auth] signup failure", {
        email,
        message: error.message,
        code: "code" in error ? error.code : undefined,
        status: "status" in error ? error.status : undefined,
      });
    } else {
      console.log("[auth] signup success", {
        email,
        hasSession: Boolean(data.session),
        userId: data.user?.id ?? null,
      });
    }

    return {
      error,
      session: data.session,
    };
  },
  async sendPasswordReset(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: env.resetPasswordRedirectUrl,
    });

    return { error };
  },
  async updatePassword(password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    return { error };
  },
  async signOut() {
    await supabase.auth.signOut();
  },
};
