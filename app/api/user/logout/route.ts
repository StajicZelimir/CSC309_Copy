import { prisma } from "@/prisma/db";
import { hashPassword } from "@/utils/auth";
import { comparePassword } from "@/utils/auth";
import { generateToken } from "@/utils/auth";


import { authorize } from "@/utils/auth";


import { NextResponse } from "next/server";



export async function POST(request: any) {
    // try {
    //     // const auth = await request.headers.get("authorization");
    //     const {email} = await request.json();
        
    //     try {
    //         const userTokenDelete = await prisma.user.update({
    //             where: {
    //                 "email": email,
    //             },
    //             data: {
    //                 "access": null,
    //             },
    //         });
    //         return NextResponse.json({message: "Sucessfully logged out"}, {status: 200});
    //     } catch (error: any) {
    //         return NextResponse.json({error: "No user with this email exists"}, {status: 400});
    //     }


    // } catch (error: any) {
    //     return NextResponse.json({error: "Server Error"}, {status: 500});
    // }
}
