import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes

// Unban user with user id "uid"
// @ts-ignore
export async function PUT(request: any) {
    try {

        const cookie = await cookies();
        // access token verification
        // const auth = request.headers.get("Authorization");
        const auth = cookie.get("accessToken");
        
        
        if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const authPayload = await verifyToken(auth.value);
    
        if (!authPayload) {
        return NextResponse.json({ error: "Expired Access Token, please use refresh token" }, { status: 401 });
        }
        // 

        // ensure admin is actually an Admin
        const admin = await prisma.user.findUnique({
            where: {
                "uid": authPayload.userId,
            },

        });
        

        if (!admin) {
            return NextResponse.json({error: "Admin not found."}, {status: 404});
        }

        if (admin.role !== "admin") {
            return NextResponse.json({error: "Invalid Admin Rights"}, {status: 403});
        }
        //
        
        
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({error: "User ID Invalid"}, {status: 400});
        }

        const user = await prisma.user.findUnique({
            where: {
                "username": username,
            },

        });

        
        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        

        try {
            // Unban User
            const unbannedUser = await prisma.user.update({
                where: {
                    "username": username,
                },
                data: {
                    "isBan": false,

                },

            });


            return NextResponse.json(unbannedUser);
        } catch (error: any) {
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }
    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});
    }
}