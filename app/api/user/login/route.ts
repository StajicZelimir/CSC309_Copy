import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";



// logins in an returns a access token
export async function POST(request: any) {
    try {
        // const auth = await request.headers.get("authorization");
        

        const {email, password} = await request.json();

        // Parameter Checks
        if (!email) {
            return NextResponse.json({error: "Email is required."}, {status: 400});
        }

        if (!password) {
            return NextResponse.json({error: "Password is required."}, {status: 400});
        }



        try {
            const user = await prisma.user.findUnique({
                where: {
                    "email": email,
                },

            });

            if (!user || !(await comparePassword(password, user.password))) {
                return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 },
                );
            }
            // console.log({userId: user.uid, username: user.username, userEmail: user.email});
            const token = generateToken({userId: user.uid, username: user.username, userEmail: user.email});
            const token2 = generateToken2({userId: user.uid, username: user.username, userEmail: user.email});

            const response = NextResponse.json(user);

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
            // return NextResponse.json({accessToken: token, refreshToken: token2 });
        } catch (error: any) {
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }
    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});
    }
}
