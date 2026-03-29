import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";
import { franc } from "franc";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";


const translationCache: Record<number, Date[]> = {};

  
//GETS ALL THREADS IN GENERAL FORUM
export async function GET(request: any) {
    try {

        const { searchParams } = new URL(request.url);

        // Convert URLSearchParams → plain object
        const params = Object.fromEntries(searchParams);

        // Now you can destructure
        var {tid, cid} = params;
        
        if((cid != undefined && tid != undefined) || (cid === undefined && tid === undefined)){
            return NextResponse.json({error: "bad parameters"}, {status: 400});
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
        const user = await prisma.user.findUnique({
            where: {
                "uid": authPayload.userId,
            },
        });
        if (!user) {
            return NextResponse.json({error: "User does not exist."}, {status: 404});
        }
        const userID =  user.uid


        if(cid != undefined){
            var parsedcid = parseInt(cid);
            if(Number.isNaN(parsedcid)){
                return NextResponse.json({error: "bad thread id given"}, {status: 400});
            }
            var commentResult = await prisma.comment.findFirst({
                where:{
                    cid:parsedcid
                }
            });
            if(!commentResult){
                return NextResponse.json({error: "comment does not exist"}, {status: 404});
            }
            if(commentResult.englishTranslation){
                return NextResponse.json({message: commentResult.englishTranslation}, {status: 200});
            }
            else{
                const cacheResult = checkCache(userID);
                if(!cacheResult){
                    return NextResponse.json({error: "too many requests sent at once, try again in a bit"}, {status: 409});
                }
                const translation = await translate(commentResult.text)
                const updateResult = await prisma.comment.update({
                    where:{
                        cid:parsedcid
                    },
                    data:{
                        englishTranslation:translation[0].translation_text
                    }
                });
                return NextResponse.json({message: translation[0].translation_text}, {status: 200});
            }
        }
        if(tid != undefined){
            var parsedtid = parseInt(tid);
            if(Number.isNaN(parsedtid)){
                return NextResponse.json({error: "bad thread id given"}, {status: 400});
            }
            const threadResult = await prisma.threads.findFirst({
                where:{
                    tid:parsedtid
                }
            });
            if(!threadResult){
                return NextResponse.json({error: "thread does not exist"}, {status: 404});
                
            }
            if(threadResult.englishTranslation){
                return NextResponse.json({message: threadResult.englishTranslation}, {status: 200});
            }
            else{
                const cacheResult = checkCache(userID);
                if(!cacheResult){
                    return NextResponse.json({error: "too many requests sent at once, try again in a bit"}, {status: 409});
                }
                const translation = await translate(threadResult.title + ": " + threadResult.text)
                const updateResult = await prisma.threads.update({
                    where:{
                        tid:parsedtid
                    },
                    data:{
                        englishTranslation:translation[0].translation_text
                    }
                });
                return NextResponse.json({message: translation[0].translation_text}, {status: 200});
            }
        }
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 400});
    }
}

function checkCache(userID:number):boolean{
    console.log(translationCache)
    //returns true if user is good to make another translation request
    //store it in cache
    if(userID in translationCache){
        const now = Date.now();

        translationCache[userID] = translationCache[userID].filter(d => {
            return now - d.getTime() <= 60*1000; //for 60 seconds
        });

        const count = translationCache[userID].length;

        if(count > 2){ //limited to 3 calls per min
            return false
        }
    }
    if(userID in translationCache){
        translationCache[userID].push(new Date());
    }
    else{
        translationCache[userID] = [new Date()]
    }
    return true

}
async function translate(input:string){

    const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/"+process.env.HF_TRANS_MODEL,
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + process.env.HF_API_KEY2,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: input
          })
        }
      );
      
    const data = await response.json();
    return data
}