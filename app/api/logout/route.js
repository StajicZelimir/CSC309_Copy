import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { verifyToken1 } from "@/utils/auth";

import { verifyToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";

// refresh the access token given a refresh token
export async function POST(request) {
  try {
    // used Gemini for the following. Prompt: How do i clear my cookies
    const response = NextResponse.json({ message: "Logged out" });

    // Clear the accessToken
    response.cookies.set("accessToken", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
    });

    response.cookies.set("refreshToken", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/api/refresh",
    });
  
    return response;
  } catch (error) {
    return NextResponse.json({error: "Server Error"}, {status: 500})
  }
}