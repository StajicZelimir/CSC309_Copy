import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";

import { authorize } from "@/utils/auth";
import { NextResponse } from "next/server";


//POST REQUEST TO HANDLE NEW THREAD CREATION
export async function GET(request: any, { params }: { params: { ID: string } }) {
    try {
        const { ID } = await params;
        var teamID;
        teamID = parseInt(ID)

        //try to parse the Id to int
        if(Number.isNaN(teamID)){
            return NextResponse.json({error: "bad team id given"}, {status: 400});
        }
        

        //check for teamID if it exists
        const team:null | object = await prisma.team.findUnique({
            where: {
                "tid": teamID
            }
        });
        if(!team){
            return NextResponse.json({error: "teamID does not exist"}, {status: 404});
        }   

        //search in prisma for 1.threads that point to teamID and 2.matches which reference teamid.
        const threadResult1 = await prisma.threads.findMany({
            where: {
                isHidden:false,
                OR:[
                    {teamId:teamID},
                    {match:{is:{team1Id:teamID}}},
                    {match:{is:{team2Id:teamID}}},
                ]
            },
            select:{
                tid:true,
                title:true,
                text:true,
                date:true,
                tags:true,
                closed:true,

                owner:{
                    select:{
                        uid:true,
                        username:true
                    }
                }
            },
            orderBy: { date: "desc" }
        });

        return NextResponse.json({message: threadResult1}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}
