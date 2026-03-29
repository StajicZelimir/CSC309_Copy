import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes


// get all reports
// @ts-ignore
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
        return NextResponse.json({ error: "Expired Access token, please refresh" }, { status: 401 });
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


        const reports = await prisma.reports.findMany({
            where: {
                "userId": {
                    not: 0, // none ai reports
                }
            },
            orderBy: {
                comment: {
                    "toxic": `desc`
                },
            },
                // {
                //     "userId": `desc`
                // },
                
            
            include: {
                "comment": {
                    include: {
                        "owner": true,
                    }
                },
                "thread": {
                    include: {
                        "owner": true,
                    }
                },
                "user": true,
            },
        });
        const aireports = await prisma.reports.findMany({
            where: {
                "userId": 0 // get all ai reports
            },
            orderBy: {
                comment: {
                    "toxic": `desc`
                },
            },
            // orderBy: [
            //     // {
            //     //     "userId": `desc`
            //     // },
            //     {
            //         "toxic": `desc`
            //     }
            // ],
            include: {
                "comment": {
                    include: {
                        "owner": true,
                    }
                },
                "thread": {
                    include: {
                        "owner": true,
                    }
                },
                "user": true,
            },
        });


        return NextResponse.json({"UserReports": reports, "AIReports": aireports});

    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});

    }

}