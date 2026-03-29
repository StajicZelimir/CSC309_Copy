import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";

import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes


// user with "uid" id wants to follow user with "follow" id
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
        // console.log(auth.split(" ")[1])
       const authPayload = verifyToken(auth.value);
    
        if (!authPayload) {
        return NextResponse.json({ error: "Expired Access Token, please send Refresh Token" }, { status: 401 });
        }
        // 


        const { username } = await params;
        const { follow } = await request.json();

        if (username === follow) {
            return NextResponse.json({error: "User cannot follow themselves"}, {status: 400});
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
            //             connect: { "uid": follow },
            //         },
            //     },

            // });
            const updatedUser = await prisma.follow.create({
                data: {
                    "userId": Number(user.uid),
                    "followId": Number(followUser.uid),
                },
            })


            return NextResponse.json(updatedUser);
        } catch (error: any) {
            console.log(error);
            return NextResponse.json({error: "Already following user"}, {status: 400});
        }
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({error: "Server Error"}, {status: 500});
    }
}

// get all users who the user with "uid" is following, and who is following them
// @ts-ignore
export async function GET(request: any, { params }) {
    try {
        const { uid } = await params;

        const user = await prisma.user.findUnique({
            where: {
                "uid": Number(uid),
            },

        });

        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        try {

            // const followed = await prisma.user.findUnique({
            //     where: {
            //         "uid": uid,
            //     },

            //     include: {
            //         "followed": true,
            //         "followers": true,
            //     }
            // })
            const followed = await prisma.user.findUnique({
                where: { 
                    uid: Number(uid),
                },
                include: {
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
                },
            });

            return NextResponse.json(followed);
        } catch (error: any) {
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }

    } catch (error: any) {
        return NextResponse.json({error: "Server Error"}, {status: 500});

    }

}