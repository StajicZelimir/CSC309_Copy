import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";




//post request handler for creating a new comment
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
            console.log(err)
            return NextResponse.json({ error: "json required" }, { status: 400 });
        }
        const {threadId, text, parentCommentId}:{threadId:number, text:string, parentCommentId?:number} = body
        


        // sanitization checks
        if(typeof threadId != "number" || typeof text != "string"){
            return NextResponse.json({error: "bad parameters1"}, {status: 400});
        }
        if(parentCommentId != undefined){
            if(typeof parentCommentId != "number"){
                return NextResponse.json({error: "bad parameters2"}, {status: 400});
            }
        }
        if(text == ""){
            return NextResponse.json({error: "bad parameters3"}, {status: 400});
        }


        
        //check if thread exists
        const threadCheck = await prisma.threads.findUnique({
            where: {
                tid: threadId,
                isHidden:false
            },
            include:{
                match:true,
            }
        });
        if (!threadCheck) {
            return NextResponse.json({error: "specified thread does not exist."}, {status: 404});
        }
        if(threadCheck.closed){
            return NextResponse.json({error: "This thread is closed"}, {status: 400})
        }

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        if(threadCheck.match){
            if(threadCheck.match.date < twoWeeksAgo){

                const closethread = await prisma.threads.update({
                    where: {
                        "tid": threadId
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


        //if this is a reply, check that this comment exists and that its under the thread previously specified
        if(parentCommentId){
            const ParentCommentCheck = await prisma.comment.findUnique({
                where: {
                    "threadId": threadId,
                    "cid":parentCommentId,
                    isHidden:false
                },

            });
            if (!ParentCommentCheck) {
                return NextResponse.json({error: "This comment does not exist under the thread specified"}, {status: 404});
            }
        }

        const payload:any = {
            ownerId:userID,
            threadId:threadId,
            text:text
        }
        if(parentCommentId){
            payload["parentCommentId"] = parentCommentId
        }
        



        //create comment under this thread.
        const commentResult = await prisma.comment.create({
            data: payload
        });

        if(!commentResult){
            return NextResponse.json({error: "error while submitting this comment"}, {status: 400});
        }
        else{
            //<<NEED TO SEND THIS TO ZELI'S BATCH TABLE BEFORE CLOSING WITH 200>>
            const aiCommentResult = await prisma.aiComments.create({
                data:{
                    commentId:commentResult.cid
                }
            })
        }
        
        const { toxic, ...commentrest } = commentResult;
        const { verdict, ...commentObj } = commentrest;
        return NextResponse.json({message: commentObj}, {status: 200});



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
        const {cid}:{cid:number} = body;

        if(typeof cid != "number"){
            return NextResponse.json({ error: "bad cid given" }, { status: 400 });
        }

        //first check if comment exists
        const commentCheck = await prisma.comment.findFirst({
            where:{
                cid:cid,
                isHidden:false,
            },
            include:{
                thread:{
                    select:{
                        closed:true,
                        match:{
                            select:{
                                date:true
                            }
                        }
                    }
                }
            }
        })
        if(!commentCheck){
            return NextResponse.json({error: "comment does not exist"}, {status: 404});
        }
        if(commentCheck.ownerId != userID && userRole != "admin"){
            return NextResponse.json({error: "you are not authorized to perform this request"}, {status: 403});
        }
        if(!commentCheck.thread.closed){
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
                }
            }
        }
    

        //recursively set all replies to hidden as well.
        try{
            const recursiveDelete = await prisma.$transaction(async (tx) => {
                await hideCommentTree(tx, cid);
            });
        }
        catch(ex:any){
            console.log(ex.message)
            return NextResponse.json({error: "an error occured while deleting comment and their replies"}, {status: 400});
        }


        return NextResponse.json({message: ""}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "an unexpected error occured"}, {status: 400});
    }
}


async function hideCommentTree(tx:any, cid: number) {
    await tx.comment.update({
      where: { cid:cid},
      data: { isHidden: true }
    });
    await tx.poll.updateMany({
        where: {commentId:cid},
        data: { isHidden: true }
    });
  
    const replies = await tx.comment.findMany({
      where: { parentCommentId: cid },
      select: { cid: true }
    });
  
    for (const reply of replies) {
      await hideCommentTree(tx, reply.cid);
    }
  }
