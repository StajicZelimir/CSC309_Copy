import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { z } from "zod"; // for validation purposes


// user with "uid" id wants to remove a user who is following them with id "follow"
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
        const { follow } = await request.json();

        if (username === follow) {
            return NextResponse.json({error: "User shouldn't follow themselves"}, {status: 400});
        }

        const user = await prisma.user.findUnique({
            where: {
                "username": username,
            },

        });

        const followUser = await prisma.user.findUnique({
            where: {
                "username": follow,
            },

        });

        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        if (!followUser) {
            return NextResponse.json({error: "User to follow not found."}, {status: 404});
        }



        try {

            // const updatedUser = await prisma.user.update({
            //     where: {
            //         "uid": uid,
            //     },
            //     data: {
            //         followed: {
            //             disconnect: { "uid": follow },
            //         },
            //     },

            // });
            const updatedUser = await prisma.follow.delete({
                where: {
                    userId_followId: {
                        userId: Number(followUser.uid),
                        followId: Number(user.uid),
                    },
                },
            });


            return NextResponse.json(updatedUser);
        } catch (error: any) {
            return NextResponse.json({error: "User not following you"}, {status: 400});
        }
    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});
    }
}