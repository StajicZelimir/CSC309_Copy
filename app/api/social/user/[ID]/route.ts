import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";

//returns all the threads comments polls published by the given user
export async function GET(request: any, { params }: { params: { ID: string } }) {
    try {
        const { ID } = await params;
        var userid;
        userid = parseInt(ID)

        //try to parse the Id to int
        if(Number.isNaN(userid)){
            return NextResponse.json({error: "bad user id given"}, {status: 400});
        }

        //check if this user even exists
        const userResult = await prisma.user.findFirst({
            where:{
                uid:userid
            },
        })

        if(!userResult){
            return NextResponse.json({error: "user does not exist"}, {status: 404});
        }










        //verify the requested user is authenticated to perform this request
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
        const authenticatedUser = await prisma.user.findFirst({
            where: {
                "uid": authPayload.userId,
            },
        });
        if (!authenticatedUser) {
            return NextResponse.json({error: "User does not exist."}, {status: 404});
        }
        if(userid != authenticatedUser.uid && authenticatedUser.role != "admin"){
            return NextResponse.json({error: "you are not authorized to perform this request"}, {status: 403});
        }



        //pull all threads for this user
        const threadResult = await prisma.threads.findMany({
            where: {
                ownerId:userid,
                isHidden:false
            },
            select:
            {
                tid:true,
                ownerId:true,
                title:true,
                text:true,
                date:true,
                tags:true,
                closed:true,
            }
        });


        //pull all comments and polls from this user, and pull the users votes for the polls as well
        const commentResult = await prisma.comment.findMany({
            where: {
                ownerId:userid,
                isHidden:false
            },
            select:{
                cid:true,
                ownerId:true,
                date:true,
                text:true,
                thread:{select:{tid:true,
                                owner:{select:{uid:true,
                                                username:true}},
                                teamId:true,
                                title:true,
                                date:true,
                                closed:true,
                                text:true,
                                tags:true,
                            }},
                poll:{
                    where:{
                        isHidden:false
                    },
                    include:{
                        votes:{
                            where:{
                                userId:authenticatedUser.uid,
                            },

                        }
                    }
                }
            }
        });
    
        return NextResponse.json({message: {threads:threadResult, comments:commentResult}}, {status: 200});
    
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}
