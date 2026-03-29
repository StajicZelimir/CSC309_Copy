import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes


// get all appeals from banned users
export async function GET(request: any) {
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
        return NextResponse.json({ error: "Expired Access Token, please refresh" }, { status: 401 });
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


        const appeals = await prisma.user.findMany({
            where: {
                "appeal": {
                    not: null,
                },
            },
            select: {
                uid: true,
                appeal: true,
                username: true,
                email: true,
                avatar: true,
                
            }
        })


        return NextResponse.json(appeals);

    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});

    }

}