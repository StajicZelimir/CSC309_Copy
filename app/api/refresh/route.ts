import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";


import { verifyToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// refresh the access token given a refresh token
export async function POST() {
  try {

  
    const cookie = await cookies();
    // access token verification
    // const auth = request.headers.get("Authorization");
    const auth = cookie.get("refreshToken");


    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Expired Refresh Token, please login again" }, { status: 401 });
    }

    const authPayload = verifyToken2(auth.value);

    if (!authPayload) {
      return NextResponse.json({ error: "Expired Refresh Token, please login again" }, { status: 401 });
    }

    const token = generateToken({userId: authPayload.userId, username: authPayload.username, userEmail: authPayload.userEmail});

    const response = NextResponse.json({});
    
    response.cookies.set("accessToken", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 60 * 60,
        path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({error: "Server Error"}, {status: 500})
  }
}