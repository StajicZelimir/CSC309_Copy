import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { use } from "react";
import { cookies } from "next/headers";

//POST REQUEST TO HANDLE NEW THREAD CREATION
export async function PUT(request: any, { params }: { params: { ID: string } }) {
    try {
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
        const user = await prisma.user.findUnique({
            where: {
                "uid": authPayload.userId,
            },
        });
        if (!user) {
            return NextResponse.json({error: "User does not exist."}, {status: 404});
        }
        if(user.isBan){
            return NextResponse.json({error: "This user is banned"}, {status: 403});
        }
        const userID =  user.uid


        //pull commentID from uri, this is the comme2nt we are updating
        const { ID } = await params;
        const pollID = parseInt(ID);
        if(Number.isNaN(pollID)){
            return NextResponse.json({error: "bad poll id given"}, {status: 400});
        }

        
        //check that json body exists
        let body;
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }
        const {option}:{option:number} = body


        if(typeof option != "number"){
            return NextResponse.json({ error: "invalid parameters" }, { status: 400 });
        }
        if(option < 1 || option > 4){
            return NextResponse.json({ error: "invalid parameters" }, { status: 400 });
        }

        //first check if poll exists
        const pollCheck = await prisma.poll.findFirst({
            where:{
                pid:pollID,
                isHidden:false
            },
            include:{
                comment:{
                    select:{
                        threadId:true,
                        thread:{
                            select:{
                                match:true,
                                closed:true
                            }
                        }
                    }  
                },
                votes:{
                    where:{
                        userId:userID
                    }
                }
            }
        })
        if(!pollCheck){
            return NextResponse.json({error: "specified poll does not exist."}, {status: 404});
        }

        //if poll is closed deny this users vote
        if(pollCheck.disabled){
            return NextResponse.json({error: "cannot vote in closed polls"}, {status: 400});
        }
        //check if this user already voted in this poll
        if(pollCheck.votes.length == 1){
            return NextResponse.json({error: "this user already voted in this poll"}, {status: 400});
        }
        if(pollCheck.comment.thread.closed){
            return NextResponse.json({error: "the dedicated thread is closed"}, {status: 400});
        }
        if(pollCheck.comment.thread.match){
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            if(pollCheck.comment.thread.match.date < twoWeeksAgo){

                const closethread = await prisma.threads.update({
                    where: {
                        "tid": pollCheck.comment.threadId
                    },
                    data:{
                        closed:true
                    }
                });
                if(!closethread){
                    return NextResponse.json({error: "An unexpected error occured while closing thread"}, {status: 400})
                }
                //update thread to closed.                
                return NextResponse.json({error: "This thread is closed"}, {status: 400})
            }
        }

        const updatePayload:any = {}
        
        if(option == 1){
            if(pollCheck.option1Score == null){
                return NextResponse.json({error: "this option is not open for votes in this poll"}, {status: 400});
            }
            updatePayload.option1Score = pollCheck.option1Score+1 
        }

        if(option == 2){
            if(pollCheck.option2Score == null){
                return NextResponse.json({error: "this option is not open for votes in this poll"}, {status: 400});
            }
            updatePayload.option2Score = pollCheck.option2Score+1 
        }

        if(option == 3){
            if(pollCheck.option3Score == null){
                return NextResponse.json({error: "this option is not open for votes in this poll"}, {status: 400});
            }
            updatePayload.option3Score = pollCheck.option3Score+1 
        }

        if(option == 4){
            if(pollCheck.option4Score == null){
                return NextResponse.json({error: "this option is not open for votes in this poll"}, {status: 400});
            }
            updatePayload.option4Score = pollCheck.option4Score+1 
        }

        //now 1.add user vote to uservotes table, then update option scores of the poll
        const transactionResult = await prisma.$transaction([
            prisma.pollVotes.create({
                data:{
                    pollId:pollID,
                    userId:userID,
                    option:option
                }
            }),
            prisma.poll.update({
                where:{
                    pid:pollID
                },
                data: updatePayload
            })
          ]);
        if(!transactionResult){
            return NextResponse.json({error: "could not attempt to update thread or save old version"}, {status: 400});
        }

        return NextResponse.json({message:  transactionResult[1]}, {status: 200});
        
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error:  "unexpected error"}, {status: 400});
    }
}
