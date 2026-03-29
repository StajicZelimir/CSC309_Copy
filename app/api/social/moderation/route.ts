import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";

//POST REQUEST TO HANDLE A NEW USER REPORT
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
        const authenticatedUser = await prisma.user.findFirst({
            where: {
                "uid": authPayload.userId,
            },
        });
        if (!authenticatedUser) {
            return NextResponse.json({error: "User does not exist."}, {status: 404});
        }
        if(authenticatedUser.isBan){
            return NextResponse.json({error: "This user is banned"}, {status: 403});
        }

        //check that json body exists
        let body;
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }
        const {tid, cid, text}:{tid?:number, cid?:number, text:string} = body

        //sanitization
        if((tid == undefined && cid == undefined) || text == undefined || (tid != undefined && cid != undefined)){
            return NextResponse.json({ error: "bad parameters given" }, { status: 400 });
        }

        if(typeof text != "string"){
            return NextResponse.json({ error: "bad reason type passed" }, { status: 400 });
        }

        if(text == ""){
            return NextResponse.json({ error: "reason for report cannot be empty" }, { status: 400 });
        }



        const payload:{userId:number, threadId?:number, commentId?:number, text:string} = {
            userId:authenticatedUser.uid,
            text:text
        }



        if(tid != undefined){
            if(typeof tid != "number"){
                return NextResponse.json({ error: "bad tid given" }, { status: 400 });
            }
            //check if thread exists
            const threadCheck = await prisma.threads.findFirst({
                where:{
                    tid:tid,
                    isHidden:false,
                },
            })
            if(!threadCheck){
                return NextResponse.json({ error: "this thread does not exist" }, { status: 404 });
            }
            payload.threadId = tid 
        }



        
        if(cid != undefined){
            if(typeof cid != "number"){
                return NextResponse.json({ error: "bad cid given" }, { status: 400 });
            }
            //check if comment even exists
            const commentCheck = await prisma.comment.findFirst({
                where:{
                    cid:cid,
                    isHidden:false,
                },
            })
            if(!commentCheck){
                return NextResponse.json({ error: "this comment does not exist" }, { status: 404 });
            }
            payload.commentId = cid 
        }

        const reportCreate = await prisma.reports.create({
            data:payload
        })


        return NextResponse.json({message: reportCreate}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
    }
}
