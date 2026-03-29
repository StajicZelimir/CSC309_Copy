import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


//POST REQUEST TO HANDLE NEW THREAD CREATION
export async function POST(request: any) {
    try {
        let body;
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }

        const {title, text, teamId, tags}:{title:string, text:string, teamId?:number, tags:string[]} = body
        
        //type check
        if(typeof title != "string" || typeof text != "string"){
            return NextResponse.json({error: "bad parameters"}, {status: 400});
        }
        if(teamId != undefined){
            if(typeof teamId != "number"){
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
        }
        if(tags != undefined){
            if(typeof tags != "object"){
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
        }
    
        //input sanitization check
        if(title == "" || text == ""){
            return NextResponse.json({error: "bad parameters"}, {status: 400});
        }


        //convert tag list to string
        var tagStr = ""
        for(var i=0; i<tags.length; i++){
            if(typeof tags[i] != "string"){
                //tags would never be sent as something other than a string, suspicious request
                return NextResponse.json({error: "bad parameters"}, {status: 400});
            }
            tagStr += "#" + tags[i]
            if(i < tags.length-1){
                tagStr+=" "
            }
            
        }


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



        //check if the team exists if user is requesting it in their thread
        if(typeof teamId == "number"){
            const team:null | object = await prisma.team.findUnique({
                where: {
                    "tid": teamId
                }
            });
            if(!team){
                return NextResponse.json({error: "team not found"}, {status: 404});
            }   
        }
    


        //upload new thread
        const threadResult = await prisma.threads.create({
            data: {
                title:title,
                ownerId:userID,
                teamId:teamId,
                closed: false,
                text:text,
                tags:tagStr
            },
        });

        if(threadResult){
            //<<NEED TO SEND THIS TO ZELI'S BATCH TABLE BEFORE CLOSING WITH 200>>
            const aiThreadResult = await prisma.aiThreads.create({
                data:{
                    threadId:threadResult.tid
                }
            })
        }

        return NextResponse.json({message: {tid: threadResult.tid}}, {status: 200});

    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}




function stringToBool(s: string): boolean | undefined {
    if(typeof s != "string"){
        return undefined
    }
    if(s.toLowerCase() === "true"){
        return true
    }
    if(s.toLowerCase() === "false"){
        return false
    }
    return undefined
  }


export async function GET(request: any) {
    //Get threads by search, title, author, team, tags are boolean filters, if all are false: check for threads w.r.t all categories
    // sorted by date or popularity.
    //this is a public query => no auth

    try {
        const { searchParams } = new URL(request.url);

        // Convert URLSearchParams → plain object
        const params = Object.fromEntries(searchParams);

        // Now you can destructure
        var {search, title, owner, team, tag} = params;

        var titlebool = stringToBool(title)
        var ownerbool = stringToBool(owner)
        var teambool = stringToBool(team)
        var tagsbool = stringToBool(tag)

        if(typeof search != "string"){
            return NextResponse.json({error: "bad parameters"}, {status: 400})
        }
        if(search == ""){
            return NextResponse.json({}, {status: 200});
        }

        search = search.toLowerCase()
        //if no filters are specified, set all filters to true
        if(!(titlebool === true || ownerbool === true || teambool === true || tagsbool === true)){
            titlebool = true
            ownerbool = true
            teambool = true
            tagsbool = true
            
        }

    
        const orList:object[] = []
        titlebool == true? orList.push({ title: { contains: search,mode: "insensitive"} }):null
        tagsbool == true? orList.push({ tags: { contains: search,mode: "insensitive"} }):null
        ownerbool == true? orList.push({ owner: { is: { username: { contains: search,mode: "insensitive"} } } }):null
        teambool == true? orList.push({ OR:[{team: {is:{ name: { contains: search,mode: "insensitive"} }}},
                                            {match:{is:{homeTeam:{name:{contains:search,mode: "insensitive"}}}}},
                                            {match:{is:{awayTeam:{name:{contains:search,mode: "insensitive"}}}}}
                                            ]}):null

        const threadResult = await prisma.threads.findMany({
            where: {
                OR:orList,
                isHidden:false
            },
            select:{
                tid:true,
                title:true,
                text:true,
                date:true,
                tags:true,
                closed:true,
                team:{select:{
                    tid:true,
                    name:true
                }},
                owner:{
                    select:{
                        uid:true,
                        username:true,
                        avatar:true
                    }
                }
            },
            orderBy: { date: "desc" }
        });

        return NextResponse.json({message:threadResult}, {status: 200});
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}








//Delete a thread (make it hidden)
export async function DELETE(request: any) {
    try{
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
        const {tid}:{tid:number} = body;

        if(typeof tid != "number"){
            return NextResponse.json({error: "bad thread id"}, {status: 400});
        }

        //first check if it exists
        const threadCheck = await prisma.threads.findFirst({
            where:{
                tid:tid
            },
        })
        if(!threadCheck){
            return NextResponse.json({error: "thread does not exist"}, {status: 404});
        }
        if(threadCheck.ownerId != userID && userRole != "admin"){
            return NextResponse.json({error: "you are not authorized to perform this request"}, {status: 403});
        }
        if(threadCheck.isHidden == true){
            return NextResponse.json({error: "this thread is already deleted"}, {status: 400});
        }



        const transactionResult = await prisma.$transaction([
            //update all comments under this thread to hidden
            prisma.comment.updateMany({
                where:{
                    threadId:tid,
                    isHidden:false
                },
                data:{
                    isHidden:true
                }
            }),
            //update all polls under this thread to hidden
            prisma.poll.updateMany({
                where:{
                    comment:{
                        threadId:tid
                    }
                },
                data:{
                    isHidden:true
                }
            }),
            //upddate this thread's status to hidden
            prisma.threads.update({
                where:{
                    tid:tid
                },
                data:{isHidden:true}
            })
            
          ]);
        if(!transactionResult){
            return NextResponse.json({error: "error while deleting this thread and related comments/polls"}, {status: 400});
        }

        return NextResponse.json({message: ""}, {status: 200});
    }
    catch(ex:any){
        console.log(ex.message);
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}