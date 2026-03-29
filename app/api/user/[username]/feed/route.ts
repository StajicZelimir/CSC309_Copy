import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { NextResponse } from "next/server";
import { z } from "zod"; // for validation purposes


// Get person activity feed for user with uid, includes recent comments/replies on my thread/comment, recent posts
// from people i follow, updates from fav teams: including new match scores and new threads in the team's forum
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
                    threads: {
                        include: {
                            comments: true,
                        },
                        orderBy: {
                            date: 'desc',
                        }
                    },
                    posts: {
                        include: {
                            replies: true,
                        },
                        orderBy: {
                            date: 'desc',
                        }
                    },
                    
                    followed: {
                        include: {
                            follow: {
                                include: {
                                    threads: {
                                        orderBy: {
                                            date: 'desc',
                                        },
                                    },
                                    posts: {
                                        orderBy: {
                                            date: 'desc',
                                        },
                                    },
                                },
                                
                            },
                        },
                        orderBy: {
                            followTime: 'desc', // Sort by most recently followed
                        },

                    },
                    fav: {
                        include: {
                            threads: true,
                        }
                    }
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