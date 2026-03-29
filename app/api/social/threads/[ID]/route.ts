import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";
import { generateToken2 } from "@/utils/auth";
import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { cookies } from "next/headers";



//GET REQUEST TO PULL ALL THREAD DETAILS AND COMMENTS ASSOCIATED WITH THIS THREAD
export async function GET(request: any, { params }: { params: { ID: string } }) {
    try {
        
        //auth is optional here, check if user is logged in.
        var userID;
        //verify the requested user is authenticated to perform this request
        const cookie = await cookies();
        // access token verification
        // const auth = request.headers.get("Authorization");
        const auth = cookie.get("accessToken");
        if(auth){
            const authPayload = await verifyToken(auth.value);
            if (authPayload) {
                const user = await prisma.user.findUnique({
                    where: {
                        "uid": authPayload.userId,
                    },
                });
                if (user) {
                    userID = user.uid;
                }
            }
        }
        

        const { ID } = await params;
        var threadid;
        threadid = parseInt(ID)

        //try to parse the Id to int
        if(Number.isNaN(threadid)){
            return NextResponse.json({error: "bad thread id given"}, {status: 400});
        }

        //check if this thread even exists
        const threadCheck = await prisma.threads.findFirst({
            where: {
                tid:threadid,
                isHidden:false
            },
            select:{
                tid:true,
                owner:{select:{
                    uid:true,
                    username:true,
                    avatar:true
                }},
                match:true,
                title:true,
                text:true,
                team:{
                    select:{
                        tid:true,
                        name:true
                    }
                },
                date:true,
                tags:true,
                closed:true,
                edits:{select:{
                                tid:true,
                                teid:true,
                                oldTitle:true,
                                oldDate:true,
                                oldTags:true,
                                oldText:true
                    },
                    orderBy: {
                      oldDate: "desc"
                    }
                }
            }
        });
        if(!threadCheck){
            return NextResponse.json({error: "this threadid does not exist"}, {status: 404});
        }
        
        //check if this thread is supposed to be closed but hasnt been already
        if(!threadCheck.closed){
            if(threadCheck.match){
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                if(threadCheck.match.date < twoWeeksAgo){

                    const closethread = await prisma.threads.update({
                        where: {
                            "tid": threadid
                        },
                        data:{
                            closed:true
                        }
                    });
                    if(!closethread){
                        return NextResponse.json({error: "An unexpected error occured while closing thread"}, {status: 400})
                    }
                    threadCheck.closed = true
                }
            }
         }

        //as well check if any polls reached their deadlines under this thread
        const closePolls = await prisma.poll.updateMany({
            where: {
                comment:{
                    threadId:threadid
                },
                deadline:{
                    lt:new Date()
                }
            },
            data:{
                disabled:true
            }
        });
        

        var socialResult:any = undefined
        //pull all comments and polls for this thread
        if(userID){ //authenticated, show poll votes along with coments and polls.
            socialResult = await prisma.comment.findMany({
                where: {
                    threadId:threadid,
                    isHidden:false
                },
                select:{
                    cid:true,
                    parentCommentId:true,
                    threadId:true,
                    date:true,
                    text:true,
    
    
                    owner:{
                        select:{
                            uid:true,
                            username:true,
                            avatar:true
                        }
                    },
                    poll:{
                        where:{
                            isHidden:false
                        },
                        include:{
                            votes:{
                                where:{
                                    userId:userID
                                }
                            },
                            edits: {
                                orderBy: {
                                  oldDate: "desc"
                                }
                              }
                        }
                    },
                    edits:{select:{
                        ceid:true,
                        cid:true,
                        oldDate:true,
                        oldText:true,
                    },
                    orderBy: {
                      oldDate: "desc"
                    }
                    }                    
                },
                orderBy:{
                    cid:"desc"
                }
            });
        }
        else{
            socialResult = await prisma.comment.findMany({
                where: {
                    threadId:threadid,
                    isHidden:false
                },
                select:{
                    cid:true,
                    parentCommentId:true,
                    threadId:true,
                    date:true,
                    text:true,
                    owner:{
                        select:{
                            uid:true,
                            username:true,
                            avatar:true
                        }
                    },
                    poll:{
                        where:{
                            isHidden:false
                        },
                        include:{
                            edits: {
                                orderBy: {
                                  oldDate: "desc"
                                }
                              }
                        }
                    },
                    edits: {
                        select: {
                          ceid: true,
                          cid:true,
                          oldDate: true,
                          oldText: true,
                        },
                        orderBy: {
                          oldDate: "desc"
                        }
                      }
                },
                orderBy:{
                    cid:"desc"
                }
            });
        }


        const map: any = {}

        for (const c of socialResult) {
            map[c.cid] = { ...c, replies: [] }
        }
        const roots: any[] = []

        for (const c of socialResult) {
            if (c.parentCommentId == null) {
                roots.push(map[c.cid])
            } else {
                map[c.parentCommentId]?.replies.push(map[c.cid])
            }
        }

        const finalPosts:any = []
        Object.keys(roots).forEach((key:any) => {
            finalPosts.push(roots[key]);
            });

        return NextResponse.json({message: {thread:threadCheck, posts:finalPosts}}, {status: 200});


        
    
    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
}


//update a thread
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
        const userID = user.uid;


        //pull threadid from uri, this is the thread we are updating
        const { ID } = await params;
        var threadid;
        var tagStr = ""
        threadid = parseInt(ID)

        //try to parse the Id to int
        if(Number.isNaN(threadid)){
            return NextResponse.json({error: "bad thread id given"}, {status: 400});
        }

        //check if threadID exists
        const threadCheck = await prisma.threads.findFirst({
            where:{
                tid:threadid,
                isHidden:false,
            },
            include:
            {
                match:true
            }
        })

        //check if the thread exists
        if(!threadCheck){
            return NextResponse.json({error: "thread does not exist"}, {status: 404});
        }
        //check if the thread belongs to this requester
        if(threadCheck.ownerId != userID){
            return NextResponse.json({error: "your are not authorized to perform this request"}, {status: 403});
        }
        
        let body: any = {};

        //users are allowed to only edit text, title, tags
        try{
            body = await request.json();
        }
        catch (err) {
            return NextResponse.json({ error: "valid json required" }, { status: 400 });
        }
        const {text,title, tags}:{title:string, text:string, teamId?:number, tags:string[]} = body;

        if((text == undefined || text == null) &&
            (title == undefined || title == null) &&
            (tags == undefined || tags == null)){
            
            return NextResponse.json({error: "atleast 1 updating field required"}, {status: 400});
        }
        
        //type check
        if(title != undefined){
            if(typeof title != "string"){
                return NextResponse.json({error: "bad parameter types1"}, {status: 400});
            }
        }
        if(text != undefined){
            if(typeof text != "string"){
                return NextResponse.json({error: "bad parameter types2"}, {status: 400});
            }
        }
        if(tags != undefined){
            if(typeof tags != "object"){
                return NextResponse.json({error: "bad parameter types3"}, {status: 400});
            }
            //convert tag list to string
            for(var i=0; i<tags.length; i++){
                if(typeof tags[i] != "string"){
                    //tags would never be sent as something other than a string, suspicious request
                    return NextResponse.json({error: "invalid tag input"}, {status: 400});
                }
                tagStr += "#" + tags[i]
                if(i < tags.length-1){
                    tagStr+=" "
                }
            }
        }
    
        //input sanitization check
        if(title == "" || text == ""){
            return NextResponse.json({error: "empty parameters given"}, {status: 400});
        }

        

        //now pull old data to save in edits table
        const oldTitle = threadCheck.title
        const oldText = threadCheck.text
        const oldTags = threadCheck.tags
        const oldDate = threadCheck.date

        var count = 0;
        if(title != undefined){
            if(title != oldTitle){
                count +=1
            }
        }
        if(text != undefined){
            if(text != oldText){
                count +=1
            }
        }
        console.log(tags)
        if(tags != undefined){
            console.log(tagStr)
            console.log(oldTags)
            if(tagStr != oldTags){
                count +=1
            }
        }
        
        if(count == 0){
            return NextResponse.json({error: "no new updates made"}, {status: 409});
        }

        //construct payload based on whats not empty
        const payload:{title?:string, text?:string, tags?:string, date?:Date, englishTranslation:null} = {englishTranslation:null}
        title != undefined? payload["title"] = title : null
        text != undefined? payload["text"] = text : null
        tags != undefined? payload["tags"] = tagStr : null
        payload["date"] = new Date();


        //update original table, add old version to thread edit table, in a transaction, either both or nothing
        const transactionResult = await prisma.$transaction([
            prisma.threads.update({
                where:{
                    tid:threadid
                },
                data:payload
            }),
            prisma.threadEdits.create({
                data: {
                    tid:threadid,
                    oldText:threadCheck.text,
                    oldDate:threadCheck.date,
                    oldTags:threadCheck.tags,
                    oldTitle:threadCheck.title,
                    oldVerdict:threadCheck.verdict,
                    oldToxic:threadCheck.toxic,
                    
                },
            })
          ]);
        if(!transactionResult){
            return NextResponse.json({error: "could not attempt to update thread or save old version"}, {status: 400});
        }

        //<<NEED TO SEND THIS TO ZELI'S BATCH TABLE BEFORE CLOSING WITH 200>>
        //check if this thread id already exists in aithreads:
        const aiThreadCheck = await prisma.aiThreads.findFirst({
            where:{
                threadId:threadid
            }
        })
        if(!aiThreadCheck){
            const aiThreadResult = await prisma.aiThreads.create({
                data:{
                    threadId:threadid
                }
            })
        }
        

        const { toxic, ...threadrest } = transactionResult[0];
        const { verdict, ...threadObj } = threadrest;

        return NextResponse.json({message: threadObj}, {status: 200});

    }
    catch(ex: any){
        console.log(ex.message)
        return NextResponse.json({error: "unexpected error"}, {status: 500});
    }
};


