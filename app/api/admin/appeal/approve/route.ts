import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes

// Approve user's appeal to be unbanned
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
        return NextResponse.json({ error: "Expired Refresh Token, please login again" }, { status: 401 });
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

        const appeal = user?.appeal;

        
        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        if (!appeal) {
            return NextResponse.json({error: "User's Appeal not valid"}, {status: 400});
        }

        if (!user.isBan) {
            return NextResponse.json({error: "Only banned users may make appeals"}, {status: 400});
        }
        

        try {
            // Approve appeal
            const updatedUser = await prisma.user.update({
                where: {
                    "username": username,
                },
                data: {
                    "appeal": null,
                    "isBan": false,

                },

            });


            return NextResponse.json(updatedUser);
        } catch (error: any) {
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }
    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});
    }
}