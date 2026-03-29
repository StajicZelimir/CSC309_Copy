import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { threadId } from "worker_threads";
import { cookies } from "next/headers";

//handles pole updates
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
        const {option1,option2,option3,option4,deadline}:{option1?:string,option2?:string,option3?:string,option4?:string,deadline?:Date} = body
        


        // sanitization checks
        if(option1 == undefined && option2 == undefined && option3 == undefined && option4 == undefined && deadline == undefined){
            return NextResponse.json({error: "bad parameters needs atleast 1 valid change"}, {status: 400});
        }

        if(option1 != undefined){
            if(typeof option1 != "string"){
                return NextResponse.json({error: "bad parameters1"}, {status: 400});
            }
            if(option1 == ""){
                return NextResponse.json({error: "options cant be empty string"}, {status: 400});
            }
        }
        if(option2 != undefined){
            if(typeof option2 != "string"){
                return NextResponse.json({error: "bad parameters2"}, {status: 400});
            }
            if(option2 == ""){
                return NextResponse.json({error: "options cant be empty string"}, {status: 400});
            }
        }
        if(option3 != undefined){
            if(typeof option3 != "string"){
                return NextResponse.json({error: "bad parameters3"}, {status: 400});
            }
            if(option3 == ""){
                return NextResponse.json({error: "options cant be empty string"}, {status: 400});
            }
        }
        if(option4 != undefined){
            if(typeof option4 != "string"){
                return NextResponse.json({error: "bad parameters4"}, {status: 400});
            }
            if(option4 == ""){
                return NextResponse.json({error: "options cant be empty string"}, {status: 400});
            }
        }
        if(deadline != undefined){
            const parsed = new Date(deadline);
            if (isNaN(parsed.getTime())) {
                return NextResponse.json({ error: "bad parameters5" }, { status: 400 });
            }
        }


        //check if poll exists
        const pollCheck = await prisma.poll.findFirst({
            where: {
                pid:pollID,
                isHidden:false
            },
            include:
            {
                comment:{
                    select:{
                        ownerId:true,
                        threadId:true,
                        thread:{
                            select:{
                                closed:true,
                                match:true
                            }
                        }
                    }
                }
            }
        });

        if (!pollCheck) {
            return NextResponse.json({error: "poll does not exist."}, {status: 404});
        }
        if(pollCheck.comment.ownerId != userID){
            return NextResponse.json({error: "you are not authorized to make this request"}, {status: 403}); 
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

        const oldOpt1 = pollCheck.option1
        const oldOpt2 = pollCheck.option2
        const oldOpt3 = pollCheck.option3
        const oldOpt4 = pollCheck.option4
        const olddeadline = pollCheck.deadline
        const oldDatePosted = pollCheck.datePosted

        var changes = 0
        const updatePayload:any = {}

        if(option1 != undefined){
            if(option1 != oldOpt1){
                changes += 1
                updatePayload.option1 = option1
            }
            
        }
        if(option2 != undefined){
            if(oldOpt2 == null){
                return NextResponse.json({error: "more options cannot be added to a poll once it is already made"}, {status: 400});
            }
            else if(option2 != oldOpt2){
                changes += 1
                updatePayload.option2 = option2
            }
        }

        if(option3 != undefined){
            if(oldOpt3 == null){
                return NextResponse.json({error: "more options cannot be added to a poll once it is already made"}, {status: 400});
            }
            else if(option3 != oldOpt3){
                changes += 1
                updatePayload.option3 = option3
            }
        }

        if(option4 != undefined){
            if(oldOpt4 == null){
                return NextResponse.json({error: "more options cannot be added to a poll once it is already made"}, {status: 400});
            }
            else if(option4 != oldOpt4){
                changes += 1
                updatePayload.option4 = option4
            }
        }
        if(deadline != undefined){
            if(olddeadline != deadline){
                updatePayload.deadline = deadline
            }
        }

        if(changes == 0){
            return NextResponse.json({error: "no updates made"}, {status: 409});
        }
        updatePayload.datePosted = new Date()

        //update original table, add old version to thread edit table, in a transaction, either both or nothing
        const transactionResult = await prisma.$transaction([
            prisma.poll.update({
                where:{
                    pid:pollID,
                },
                data:updatePayload
            }),
            prisma.pollEdits.create({
                data: {
                    pid:pollID,
                    oldOption1:oldOpt1,
                    oldOption2:oldOpt2,
                    oldOption3:oldOpt3,
                    oldOption4:oldOpt4,
                    oldDeadline:olddeadline,
                    oldDate:oldDatePosted
                },
            })
          ]);
        if(!transactionResult){
            return NextResponse.json({error: "could not attempt to update poll or save old version"}, {status: 400});
        }

        const aiCommentsCheck = await prisma.aiComments.findFirst({
            where:{
                commentId:pollCheck.commentId
            }
        })
        if(!aiCommentsCheck){
            const aiCommentResult = await prisma.aiComments.create({
                data:{
                    commentId:pollCheck.commentId
                }
            })
        }

        return NextResponse.json({message: transactionResult[0]}, {status: 200});
        


    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 400});
    }
}
