import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes

// User submits an appeal to unban
// @ts-ignore
export async function PUT(request: any, { params }) {
    try {

        const cookie = await cookies();
        // access token verification
        // const auth = request.headers.get("Authorization");
        const auth = cookie.get("accessToken");
        
        
        if (!auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    
        const authPayload = verifyToken(auth.value);
    
        if (!authPayload) {
        return NextResponse.json({ error: "Expired Refresh Token, please login again" }, { status: 401 });
        }
        // 
        
        const { username } = await params;
        const { appeal } = await request.json();

        const user = await prisma.user.findUnique({
            where: {
                "username": username,
            },

        });

        
        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        if (!appeal) {
            return NextResponse.json({error: "Appeal not valid"}, {status: 400});
        }

        if (!user.isBan) {
            return NextResponse.json({error: "Only banned users may make appeals"}, {status: 400});
        }
        

        try {

            const updatedUser = await prisma.user.update({
                where: {
                    "username": username,
                },
                data: {
                    "appeal": String(appeal),
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