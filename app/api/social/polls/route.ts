import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { match } from "assert";
import { cookies } from "next/headers";

//POST REQUEST TO HANDLE NEW poll CREATION
export async function POST(request: any) {
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


        
        //check that json body exists
        let body;
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }
        const {commentID, deadline, option1, option2, option3, option4}:{commentID:number, deadline?:Date, option1:string, option2:string, option3:string, option4:string} = body
        
        var parsedDeadline;
        if(deadline){
            parsedDeadline = new Date(deadline);
            if (!(parsedDeadline instanceof Date) || isNaN(parsedDeadline.getTime())) {
            
                return NextResponse.json({error: "bad date parameter"}, {status: 400});
            }
        }
        if(typeof option1 != "string" && typeof option2 != "string" && typeof option3 != "string" && typeof option4 != "string"){
            return NextResponse.json({error: "atleast 1 valid option required"}, {status: 400});
        }

        // basic sanitization checks
        if(typeof commentID != "number"){
            return NextResponse.json({error: "bad parameters"}, {status: 400});
        }

        //check that the first options fields are used in order
        if(option1 == undefined){
            if(option2 != undefined || option3 != undefined || option4 != undefined){
                return NextResponse.json({error: "use columns in order"}, {status: 400});
            }
        }
        if(option2 == undefined){
            if(option3 != undefined || option4 != undefined){
                return NextResponse.json({error: "use columns in order"}, {status: 400});
            }
        }
        if(option3 == undefined){
            if(option4 != undefined){
                return NextResponse.json({error: "use columns in order"}, {status: 400});
            }
        }

        //check types of options
        const payload:any = {
            commentId:commentID,
            deadline:deadline,
        } 

        if(option1 != undefined){
            if(typeof option1 != "string"){
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
            payload["option1"] = option1
            payload["option1Score"] = 0
        }
        if(option2 != undefined){
            if(typeof option2 != "string"){
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
            payload["option2"] = option2
            payload["option2Score"] = 0
        }
        if(option3 != undefined){
            if(typeof option3 != "string"){
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
            payload["option3"] = option3
            payload["option3Score"] = 0
        }
        if(option4 != undefined){
            if(typeof option4 != "string"){
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
            payload["option4"] = option4
            payload["option4Score"] = 0
        }
        
        
        //check if comment exists to attach this poll on:
        const commentCheck = await prisma.comment.findUnique({
            where: {
                cid: commentID,
                isHidden:false,
                thread:{
                    isHidden:false
                }
            },
            include:{
                thread:{select:{
                    closed:true,
                    match:true
                }},
                poll:{
                    where:{
                        isHidden:false
                    }
                }
            }
        });
        if (!commentCheck) {
            return NextResponse.json({error: "specified comment does not exist."}, {status: 404});
        }
        if(commentCheck.thread.closed){
            return NextResponse.json({error: "the dedicated thread is closed"}, {status: 400});
        }
        if(commentCheck.poll.length > 0){
            return NextResponse.json({error: "this comment already has a poll attached to it"}, {status: 400});
        }
        
        if(commentCheck.thread.match){
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            if(commentCheck.thread.match.date < twoWeeksAgo){

                const closethread = await prisma.threads.update({
                    where: {
                        "tid": commentCheck.threadId
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


        //upload new poll
        const pollResult = await prisma.poll.create({
            data: payload
        });

        if (!pollResult) {
            return NextResponse.json({error: "error creating poll"}, {status: 400});
        }

        //check if its not already in the queue, if not add it
        const aiCommentsCheck = await prisma.aiComments.findFirst({
            where:{
                commentId:commentID
            }
        })
        if(!aiCommentsCheck){
            const aiCommentResult = await prisma.aiComments.create({
                data:{
                    commentId:commentID
                }
            })
        }


        return NextResponse.json({message: pollResult}, {status: 200});


    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 400});
    }
}

export async function DELETE(request: any) {
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
        const userID = user.uid;
        const userRole = user.role;



        let body: any = {};
        //users are allowed to only edit text, title, tags
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }
        const {pid}:{pid:number} = body;

        if(typeof pid != "number"){
            return NextResponse.json({ error: "bad parameters" }, { status: 400 });
        }


        //first check if poll exists, find the commend it is associated to and find its owner
        const pollCheck = await prisma.poll.findFirst({
            where:{
                pid:pid,
                isHidden:false,
                comment:{
                    isHidden:false
                }
                
            },
            include:
            {
                comment:{
                    select:{
                        threadId:true,
                        thread:{
                            select:{match:true}
                        },
                        ownerId:true
                    }
                }
            }
        })

        if(!pollCheck){
            return NextResponse.json({error: "poll does not exist"}, {status: 404});
        }
        if(pollCheck.comment.ownerId != userID && userRole != "admin"){
            return NextResponse.json({error: "you are not authorized to perform this request"}, {status: 403});
        }
        if(pollCheck.comment.thread.match){
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            if(pollCheck.comment.thread.match.date < twoWeeksAgo){

                const closethread = await prisma.threads.updateMany({
                    where: {
                        "tid": pollCheck.comment.threadId
                    },
                    data:{
                        closed:true
                    }
                });
            }
        }

        //set the poll to hidden
        const polldelete = await prisma.poll.update({
            where:{
                pid:pid
            },
            data:{isHidden:true}
        })

        return NextResponse.json({message: ""}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 400});
    }
}


