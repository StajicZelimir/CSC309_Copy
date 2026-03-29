import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes


// get all user info for all users, including their threads, posts, comments, following/followers, and reports
export async function GET(request: any) {
    try {

        try {

            const userInfo = await prisma.user.findMany({

                include: {
                    threads: true,
                    posts: true,
                    
                    followed: {
                        include: {
                            follow: true,
                        },
                        orderBy: {
                            followTime: 'desc', // Sort by most recently followed
                        },

                    },
                    followers: {
                        include: {
                            user: true, 
                        },
                        orderBy: {
                            followTime: 'desc', // Sort by most recent followers
                        },
                    },

                    reports: true,
                }
            })


            return NextResponse.json(userInfo);
        } catch (error: any) {
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }

    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});

    }

}