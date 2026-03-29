import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";


//GETS ALL THREADS IN GENERAL FORUM
export async function GET(request: any) {
    try {
        

        //pull all threads which have a match pointing to it.
        const threadResult = await prisma.threads.findMany({
            where: {
                isHidden:false
                
            },
            select:{
                tid:true,
                ownerId:true,
                title:true,
                text:true,
                date:true,
                tags:true,
                team:{select:{
                    tid:true,
                    name:true
                }},
                closed:true,
                owner:{
                    select:{
                        uid:true,
                        username:true,
                        avatar:true
                    }
                },
            },
            orderBy: { date: "desc" }
        });

        return NextResponse.json({message: threadResult}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}
