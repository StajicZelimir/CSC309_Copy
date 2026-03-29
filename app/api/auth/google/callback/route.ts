import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/db";
import { generateToken, generateToken2 } from "@/utils/auth";
import crypto from "crypto";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleIdTokenPayload = {
  iss: string;
  azp?: string;
  aud: string;
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat?: number;
  exp?: number;
};

function parseJwtPayload(token: string): GoogleIdTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  const json = Buffer.from(padded, "base64").toString("utf-8");
  return JSON.parse(json);
}

function buildGoogleInternalPassword(googleSub: string) {
  const secret = process.env.GOOGLE_PASSWORD_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) {
    throw new Error("Missing GOOGLE_PASSWORD_SECRET or GOOGLE_CLIENT_SECRET");
  }

  return crypto
    .createHash("sha256")
    .update(`${googleSub}:${secret}`)
    .digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code || !returnedState) {
      return NextResponse.redirect(
        new URL("/login?error=missing_google_params", req.url)
      );
    }

    const savedState = req.cookies.get("google_oauth_state")?.value;

    if (!savedState || savedState !== returnedState) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", req.url)
      );
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(
        new URL("/login?error=token_exchange_failed", req.url)
      );
    }

    const googleUser = parseJwtPayload(tokenData.id_token);

    if (!googleUser.email) {
      return NextResponse.redirect(
        new URL("/login?error=no_email_from_google", req.url)
      );
    }

    if (!googleUser.email_verified) {
      return NextResponse.redirect(
        new URL("/login?error=email_not_verified", req.url)
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    // login workflow
    if (existingUser) {
        const response = NextResponse.redirect(
            new URL(`/main?username=${encodeURIComponent(existingUser.username)}`, req.url)
            );

        const token = generateToken({
            userId: existingUser.uid,
            username: existingUser.username,
            userEmail: existingUser.email,
        });

        const token2 = generateToken2({
            userId: existingUser.uid,
            username: existingUser.username,
            userEmail: existingUser.email,
        });

        //clear CSRF state cookie
        response.cookies.set("google_oauth_state", "", {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 0,
            path: "/",
        });

        response.cookies.set("accessToken", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 60 * 60,
            path: "/",
        });

        response.cookies.set("refreshToken", token2, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 60 * 60 * 4,
            path: "/api/refresh",
        });

        return response;
    }

    // signup workflow - redirect to user preferences to complete signup
    const internalPassword = buildGoogleInternalPassword(googleUser.sub);

    const response = NextResponse.redirect(
    new URL(
        `/preferences?email=${encodeURIComponent(
        googleUser.email
        )}&password=${encodeURIComponent(internalPassword)}`,
        req.url
    )
    );

    // clear state cookie (keep this)
    response.cookies.set("google_oauth_state", "", {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
    });

    return response;
    

    return response;
  } catch (err) {
    console.error("Google callback error:", err);

    return NextResponse.redirect(
      new URL("/login?error=google_callback_failed", req.url)
    );
  }
}