import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes

// Approve a report to a comment/poll/thread, hiding it
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
        
        
        const { rid } = await request.json();

        if (!rid) {
            return NextResponse.json({error: "Report Invalid"}, {status: 400});
        }

        const report = await prisma.reports.findUnique({
            where: {
                "rid": Number(rid),
            },
        });

        
        // Parameter Checks
        if (!report) {
            return NextResponse.json({error: "Report not found"}, {status: 404});
        }
        

        try {
            // Approve report, hide comment/poll/thread
            let updatedPost = {};
            if (report.threadId) {
                updatedPost = await prisma.threads.update({
                    where: {
                        "tid": Number(report.threadId),
                    },
                    data: {
                        "isHidden": true,
                    },
                });
            } else if (report.commentId) {
                updatedPost = await prisma.comment.update({
                    where: {
                        "cid": Number(report.commentId),
                    },
                    data: {
                        "isHidden": true,
                    },
                });
            }

            // delete the report now that it is complete
            const deleted = await prisma.reports.delete({
                where: {
                    "rid": Number(rid),
                },
            });
            


            return NextResponse.json(updatedPost);
        } catch (error: any) {
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }
    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});
    }
}