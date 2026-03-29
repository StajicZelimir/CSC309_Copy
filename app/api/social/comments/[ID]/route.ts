import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";


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
        const commentID = parseInt(ID);
        if(Number.isNaN(commentID)){
            return NextResponse.json({error: "bad comment id given"}, {status: 400});
        }

        
        //check that json body exists
        let body;
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }
        const {text}:{text:string} = body
        


        // sanitization checks
        if(typeof text != "string"){
            return NextResponse.json({error: "bad parameters"}, {status: 400});
        }
        if(text == ""){
            return NextResponse.json({error: "bad parameters"}, {status: 400});
        }

        const commentCheck = await prisma.comment.findUnique({
            where: {
                cid:commentID,
                isHidden:false
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
        });
        if (!commentCheck) {
            return NextResponse.json({error: "This comment does not exist"}, {status: 404});
        }
        if(commentCheck.thread.closed){
            return NextResponse.json({error: "cant update a comment on a closed thread"}, {status: 400});
        }
        if(commentCheck.thread.match){
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            if(commentCheck.thread.match.date < twoWeeksAgo){
                return NextResponse.json({error: "cant update a comment on a closed thread"}, {status: 400});
            }
        }
        //check if the thread belongs to this requester
        if(commentCheck.ownerId != userID){
            return NextResponse.json({error: "your are not authorized to perform this request"}, {status: 403});
        }

        
        const oldText = commentCheck.text
        const oldDate = commentCheck.date
        const oldVerdict = commentCheck.verdict
        const oldToxic = commentCheck.toxic

    
        if(oldText == text){
            return NextResponse.json({error: "no new updates made"}, {status: 409});
        }

        //update original table, add old version to thread edit table, in a transaction, either both or nothing
        const transactionResult = await prisma.$transaction([
            prisma.comment.update({
                where:{
                    cid:commentID
                },
                data:{
                    text:text,
                    date:new Date(),
                    englishTranslation:null
                }
            }),
            prisma.commentEdits.create({
                data: {
                    cid:commentID,
                    oldText:oldText,
                    oldDate:oldDate,
                    oldVerdict:oldVerdict,
                    oldToxic:oldToxic,
                },
            })
          ]);
        if(!transactionResult){
            return NextResponse.json({error: "could not attempt to update thread or save old version"}, {status: 400});
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


        const { toxic, ...commentrest } = transactionResult[0];
        const { verdict, ...commentObj } = commentrest;

        return NextResponse.json({error: commentObj}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
    }
}



