import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes


// get all reports for the user with id "uid"
// @ts-ignore
export async function GET(request: any, { params }) {
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


        const { uid } = await params;


        const user = await prisma.user.findUnique({
            where: {
                "uid": Number(uid),
            },
            include: {
                "reports": true,
            },

        });

        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        return NextResponse.json(user);

    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});

    }

}