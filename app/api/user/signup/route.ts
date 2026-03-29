import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";
import { cookies } from 'next/headers';
import { strict } from "assert";
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;


const emailVerify = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password too short"),
    username: z.string().max(20, "Username too long"),

});
// singup a new user
export async function POST(request: any) {
    try {
        const {email, password, username, fav } = await request.json();

        // Parameter Checks
        if (!email) {
            return NextResponse.json({error: "Email is required."}, {status: 400});
        }

        if (!password) {
            return NextResponse.json({error: "Password is required."}, {status: 400});
        }

        if (!username) {
            return NextResponse.json({error: "Username is required."}, {status: 400});
        }

        if (!fav) {
            return NextResponse.json({error: "Favorite Team is required."}, {status: 400});
        }

        // check if email is valid
        const zVal = emailVerify.safeParse({"email": email, "password": password, "username": username});
        if (!zVal.success) {
            return NextResponse.json({error: z.treeifyError(zVal.error)}, {status: 400})
        }

        try {
            const userCheck = await prisma.user.findUnique({
                where: {
                    "username": username,

                },

            });
            const userCheck2 = await prisma.user.findUnique({
                where: {
                    "email": email,

                },

            });

            if (userCheck) { // if user with username exists, reject
                return NextResponse.json({error: "Username already in use, please choose another Username."}, {status: 403});
            }
            if (userCheck2) { // if user with username exists, reject
                return NextResponse.json({error: "Email already in use, please login instead."}, {status: 403});
            }

            const user = await prisma.user.create({
                data: {
                    "email":    email,
                    "password": await hashPassword(password),
                    "username": username,
                    "favId": fav,
                },

            });


            // return NextResponse.json(user);
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
        } catch (error: any) {
            
            return NextResponse.json({error: error}, {status: 500});
        }
    } catch (error: any) {
        return NextResponse.json({error: error}, {status: 500});
    }
}