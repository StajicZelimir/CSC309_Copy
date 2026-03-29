import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes
import { cookies } from "next/headers";

// Updating user with uid
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
    
        // const authPayload = verifyToken(auth.split(" ")[1]);
        const authPayload = verifyToken(auth.value);
    
        if (!authPayload) {
        return NextResponse.json({ error: "Expired Refresh Token, please login again" }, { status: 401 });
        }
        // 

        const { username } = await params;
        const { updatedUsername, avatar, fav } = await request.json();

        const user = await prisma.user.findUnique({
            where: {
                "username": username,
            },

        });

        

        // Parameter Checks
        if (!user) {
            return NextResponse.json({error: "User not found."}, {status: 404});
        }

        if (fav) {
            const favTeam = await prisma.team.findUnique({
                where: {
                    "tid": fav,
                }
            });

            if (!favTeam) {
                return NextResponse.json({error: "Team not found."}, {status: 404});
            }
        }

        if (updatedUsername) {
            const updatedUser = await prisma.user.findUnique({
                where: {
                "username": updatedUsername,
            },
            });

            if (updatedUser) {
                return NextResponse.json({error: "User with username already exists! Please pick another username"}, {status: 404});
            }
        }

        try {

            const updatedUser = await prisma.user.update({
                where: {
                    "username": username,
                },
                data: {
                    "username":  updatedUsername,
                    "avatar": avatar,
                    "favId": fav,
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

// get all user info for user with id "uid", including their threads, posts, comments, following/followers, and reports
// @ts-ignore
export async function GET(request: any, { params }) {
    try {
        const { username } = await params;

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

            const userInfo = await prisma.user.findUnique({
                where: {
                    "username": username,
                },
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
            console.log(error);
            return NextResponse.json({error: "Server Error"}, {status: 500});
        }

    } catch (error: any) {
        console.log(error);
        return NextResponse.json({error: "Server Error"}, {status: 500});

    }

}