"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  WholeWord,
  MessageSquareDashed, 
  MessageSquareOff,
  MessageSquareText,
  ArrowLeft, 
  Clock, 
  Flag, 
  History, 
  MessageSquare, 
  Send,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { EditHistoryDialog } from './EditHistoryDialog';
import { PollComponent } from './PollComponent';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { json } from 'stream/consumers';
import { pid } from 'process';

interface EditHistoryCompItem {
  id: string;
  content: string;
  editedAt: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  pid: string;
  options: PollOption[];
  totalVotes: number;
  endsAt: string;
  chosenid?: string;
  editHistory?: EditHistoryCompItem[];
  threadClosed:boolean;
}

interface Comment {
  cid: number;
  author: {
    avatar:string | undefined;
    uid:number
    username: string;
  };
  text: string;
  date: string;
  replies: Comment[];
  editHistory?: EditHistoryCompItem[];
  poll?: Poll;
}

interface Thread {
  tid: number;
  title: string;
  text: string;
  tags: string;
  team:{
    tid:number,
    name:string
  }
  author: {
    uid:number;
    username: string;
    avatar:string | undefined;
  };
  date:string;
  closed: string;
  match: object | null
  editHistory?: EditHistoryCompItem[];
}

export function ThreadViewPage( {tid}: any ) {
  const router = useRouter();
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  const [showEditCommentDialog, setShowEditCommentDialog] = useState(false);
  const [showEditThreadDialog, setShowEditThreadDialog] = useState(false);
  const [showEditPollDialog, setShowEditPollDialog] = useState(false);

  const [reportTarget, setReportTarget] = useState<{ type: 'thread' | 'comment'; id: number } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'thread' | 'comment'; id: number } | null>(null);
  const [editTarget, setEditTarget] = useState<{ type: 'thread' | 'comment' | 'poll'; comment:Comment | undefined} | null>(null);
  const [edittedData, setEdittedData] = useState<{deadline:string|undefined ;option1:string|undefined;option2:string|undefined;option3:string|undefined;option4:string|undefined; tags: string |undefined; title: string | undefined; body:string | undefined} | undefined>({deadline:undefined,option1:undefined,option2:undefined,option3:undefined,option4:undefined,tags:undefined, title:undefined, body:undefined});


  const [currentUserId,setCurrentUserId] = useState(null);
  const [currentUsername,setCurrentUsername] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [isAdmin, setIsAdmin] = useState(false)

  const [deletingPollComment, setdeletingPollComment] = useState<Comment | undefined>(undefined);
  const [showDeletePollDialog, setShowDeletePollDialog] = useState(false);


  const [newPollData, setNewPollData] = useState<{comment?:Comment, deadline?:string, option1?:string, option2?:string, option3?:string, option4?:string}>({});
  const [showNewPollDialog, setShowNewPollDialog] = useState(false);

  const [isClosed, setIsClosed] = useState(false)
  const [currAvatar, setCurrAvatar] = useState("https://robohash.org/guest");

  useEffect(()=>{
    const curr = localStorage.getItem("currentUser")

    if(curr){
      const datajson = JSON.parse(curr)
      setCurrentUserId(datajson.uid)
      setCurrentUsername(datajson.username)
      setIsAdmin(datajson.isAdmin)
      setCurrAvatar(datajson.avatar)
    }
    PullThread()

    const scrollY = sessionStorage.getItem("scrollY");
    if (scrollY) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(scrollY));
        sessionStorage.removeItem("scrollY");
      }, 200);
    }
  },[])




  const refreshToken = async () =>{
    var response = await fetch("/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    console.log("REFRESHED:")
    console.log(response.status)
    return response.status
  }
  
  const PullThread = async ()=>{
    const td = tid;
    const res = await fetch(`/api/social/threads/${td}`)
    const data = await res.json();
    if(data?.message?.thread){
      const thread = data.message.thread
      const threadEdits:EditHistoryCompItem[] = []
      if(thread.edits){
        for(var i of thread.edits){
          const historyItem:EditHistoryCompItem = {
            id: i.tid+ "_" + i.teid,
            content: "Title: " + i.oldTitle + "\nText:" + i.oldText+ "\nTags:" + i.oldTags,
            editedAt: i.oldDate,
          }
          threadEdits.push(historyItem)
        }
      }

      const threadobj:Thread = {
        tid:thread.tid,
        tags:thread.tags,
        title: thread.title,
        text: thread.text,
        author: thread.owner,
        closed: thread.closed,
        match: thread.match,
        date:thread.date,
        editHistory:threadEdits,

        team:{
          tid:thread.team?.tid ?? "",
          name:thread.team?.name ?? ""
        }
      }


      setIsClosed(thread.closed)


      setThread(threadobj)
      

      const comments:Comment[] = []
      const posts = data.message.posts

      const clist = comments
      const seen:number[] = []

      for(var i of posts){
        clist.push(mapComment(i, thread.closed))
      }
      setComments(clist)
      
    }
    setLoading(false);
  }


  function mapComment(apiComment: any, threadClosed:boolean): Comment {
    
    var pollobj:Poll | undefined = undefined
    const optionslst:any = []
    var total = 0

    if(apiComment.poll.length > 0){
      if(apiComment.poll[0].option1 != null){
        const option1:PollOption = {
          id: apiComment.poll[0].pid.toString() + "_1",
          text: apiComment.poll[0].option1,
          votes: apiComment.poll[0].option1Score
        }
        optionslst.push(option1)
        total += apiComment.poll[0].option1Score;
      }
      if(apiComment.poll[0].option2 != null){
        const option2:PollOption = {
          id: apiComment.poll[0].pid.toString() + "_2",
          text: apiComment.poll[0].option2,
          votes: apiComment.poll[0].option2Score
        }
        optionslst.push(option2)
        total += apiComment.poll[0].option2Score;
      }
      if(apiComment.poll[0].option3 != null){
        const option3:PollOption = {
          id: apiComment.poll[0].pid.toString() + "_3",
          text: apiComment.poll[0].option3,
          votes: apiComment.poll[0].option3Score
        }
        optionslst.push(option3)
        total += apiComment.poll[0].option3Score;
      }
      if(apiComment.poll[0].option4 != null){
        const option4:PollOption = {
          id: apiComment.poll[0].pid.toString() + "_4",
          text: apiComment.poll[0].option4,
          votes: apiComment.poll[0].option4Score
        }
        optionslst.push(option4)
        total += apiComment.poll[0].option4Score;
      }

      pollobj = {
        pid: apiComment.poll[0].pid,
        options: optionslst,
        totalVotes:total,
        endsAt: apiComment.poll[0].deadline,
        threadClosed:threadClosed
      }

      if(apiComment.poll[0].votes?.length > 0){
          pollobj.chosenid = apiComment.poll[0].pid + "_" + apiComment.poll[0].votes[0].option
      }
      const pollEdits:EditHistoryCompItem[] = []
      if(apiComment?.poll[0]?.edits){
        for(var i of apiComment?.poll[0]?.edits){
          var str = ""
          if(i.oldOption1){
            str += "option1: " + i.oldOption1 + "\n"
          }
          if(i.oldOption2){
            str += "option2: " + i.oldOption2 + "\n"
          }
          if(i.oldOption3){
            str += "option3: " + i.oldOption3 + "\n"
          }
          if(i.oldOption4){
            str += "option4: " + i.oldOption4
          }

          const historyItem:EditHistoryCompItem = {
            id: i.pid + "_" + i.peid,
            content: str,
            editedAt: i.oldDate,
          }
          pollEdits.push(historyItem)
          pollobj.editHistory = pollEdits
        }
      }
    }

    


    //setup edit history for comment
    const commentEdits:EditHistoryCompItem[] = []
    if(apiComment.edits){
      for(var i of apiComment.edits){
        const historyItem:EditHistoryCompItem = {
          id: i.cid+ "_" + i.ceid,
          content: "Text:" + i.oldText,
          editedAt: i.oldDate,
        }
        commentEdits.push(historyItem)
      }
    }

    return {
      cid: apiComment.cid,
      author:apiComment.owner,
      text: apiComment.text,
      poll: pollobj,
      date: apiComment.date,
      editHistory:commentEdits,
      replies: (apiComment.replies || []).map((reply: any) =>
        mapComment(reply, threadClosed)
      ),
    };
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const handleUserClick = (username: string) => {
    router.push(`/user/${username}`);

  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    fetchCommentPost(newComment, undefined);
    setNewComment('');
  };

  const handlePostReply = (comment: Comment) => {
    if (!replyText.trim()) return;
    fetchCommentPost(replyText, comment)
    setReplyText('');
    setReplyingTo(null);
  };


  const fetchCommentPost = async (text:string, parentcomment:Comment | undefined)=> {
    if(!currentUserId){
      alert("You must be logged in to make this request")
      router.push("/")
      return
    }
    
    const body:any = {"text":text,"threadId":thread?.tid}
    if(parentcomment != undefined){
      body["parentCommentId"] = parentcomment.cid
    }

    //fetch here
    var response = await fetch("/api/social/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if(response.status == 401){
      const refresh = await refreshToken()
      if(refresh != 200){
        router.push("/");
        return
      }
      response = await fetch("/api/social/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      if(response.status == 401){
        router.push("/")
        return
      }
    }
    if(response.ok){
      const replydata = await response.json()
      
      if(currentUserId != null && currentUsername != null){
        const comObj:Comment = {
          cid: replydata.message?.cid,
          author: {uid:currentUserId, username:currentUsername, avatar: currAvatar ?? "https://robohash.org/default"},
          text: text,
          date: replydata.message?.date,
          replies: []
        }
        if(parentcomment){
          parentcomment?.replies.unshift(comObj)
          setComments(comments)
        }
        else{
          setComments(prev => [comObj, ...prev]);

        }
        router.refresh()
      }
      else{
        const msg = await response.json()
        window.sessionStorage.setItem("scrollY", window.scrollY.toString());
        window.location.reload();
      }
    }
    else{
      alert("Your reply could not be handled at this time.")
      const replydata = await response.json()
    }
    
    
  }

  const handleReport = (type: 'thread' | 'comment', id: number) => {
    setReportTarget({ type, id });
    setShowReportDialog(true);
  };

  const submitReport = async () => {
    if(!currentUserId){
      alert("You must be logged in to make this request")
      router.push("/")
      return
    }
    const body:any = {text:reportReason}
    if(reportTarget?.type == "thread" ){
      body["tid"] = reportTarget.id

    }
    else if(reportTarget?.type == 'comment' ){
      body["cid"] = reportTarget.id
    }

    var response = await fetch("/api/social/moderation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    //need refresh token
    if(response.status == 401){
      const refresh = await refreshToken();
      if(refresh == 401){
        alert("Session expired, please login again")
        router.push("/")
        return
      }
      response = await fetch("/api/social/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
      if(response.status == 401){
        router.push("/")
        return
      }
    }
    if(response.ok){
      alert("Thank you for submitting a report, our team will review this post shortly")
    }
    else{
      alert("this request could not be created at this time. Try again later")
    }
    setReportReason("")

    setShowReportDialog(false);
    setReportTarget(null);
  };



  const handleDelete = (type: 'thread' | 'comment', id: number) => {
    setDeleteTarget({ type, id });
    setShowDeleteDialog(true);
  };

  const handleEdit = (type: 'thread' | 'comment' | 'poll', comment:Comment | undefined) => {
    var newData:any = {};
    setEditTarget({ type: type, comment:comment});
    if(type == "thread"){
      newData.title = thread?.title
      newData.body = thread?.text
      newData.tags = thread?.tags
      setEdittedData(newData)
      setShowEditThreadDialog(true);
    }
    else if(type == "comment"){
      newData.body = comment?.text
      setEdittedData(newData)
      setShowEditCommentDialog(true);
    }
    else if(type == "poll"){
      if(comment?.poll){
        const options = comment.poll.options
        newData.option1 = options[0]?.text
        newData.option2 = options[1]?.text
        newData.option3 = options[2]?.text
        newData.option4 = options[3]?.text
        newData.deadline = formatForInput(comment.poll.endsAt)
        setEdittedData(newData)
        setEditTarget({type:"poll",comment:comment})
        setShowEditPollDialog(true);
      }
    }
  };

  const formatForInput = (date: string) => {
    const d = new Date(date)
  
    const pad = (n: number) => n.toString().padStart(2, "0")
  
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const submitEdit = async () => {
    //check if logged in
    if(!currentUserId){
      alert("You must be logged in to make this request")
      router.push("/")
      return
    }
    
    if (editTarget?.type === 'thread') {
      var splitted = undefined
      if(edittedData?.tags != undefined){
        if(!edittedData.tags.startsWith("#") && edittedData.tags.length > 0){
          alert("tags must start with a #")
          return
        }
        splitted = edittedData.tags
        .split("#")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
        for(var i in splitted){
          splitted[i] = splitted[i].trim()
        }
      }

      var response = await fetch(`/api/social/threads/${thread?.tid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title:edittedData?.title,
          text:edittedData?.body,
          tags:splitted
        }),
      })
      if(response.status == 401){
        const refresh = await refreshToken();
        if(refresh == 401){
          alert("Session expired, please login again")
          router.push("/");
          return
        }
        response = await fetch(`/api/social/threads/${thread?.tid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title:edittedData?.title,
            text:edittedData?.body,
            tags:splitted
          }),
        })
        if(response.status == 401){
          router.push("/")
          return
        }
      }
      if(response.status == 409){
        return
      }
      if(response.ok){
        if(thread != null){  
          setThread(prev => {
            if (!prev) return prev;
          
            return {
              ...prev,
              title: edittedData?.title ?? prev.title,
              text: edittedData?.body ?? prev.text,
              tags:edittedData?.tags ?? prev.tags
            };
          });
        }
      }
      else{
        const data = await response.json()
        alert("Thread update was not able to be made at this time")
        router.push("/")
        return;
      }
    }
    else if (editTarget?.type === 'comment') {
      const currComment = editTarget.comment

      var response = await fetch(`/api/social/comments/${currComment?.cid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title:edittedData?.title,
          text:edittedData?.body
        }),
      })
      if(response.status == 401){
        const refresh = await refreshToken();
        if(refresh == 401){
          alert("Session expired, please login again")
          router.push("/")
          return
        }
        response = await fetch(`/api/social/comments/${currComment?.cid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title:edittedData?.title,
            text:edittedData?.body
          }),
        })
        if(response.status == 401){
          router.push("/")
          return
        }
      }
      if(response.status == 409){
        return
      }
      if(response.ok){
        if(editTarget.comment != undefined){
          if(edittedData?.body){
            editTarget.comment.text = edittedData.body
            setComments(comments);
            router.refresh()
          }
        }
      }
      else{
        alert("comment update was not able to be made at this time")
        router.push("/")
        return
      }
      
    }
    else if (editTarget?.type === 'poll') {
      const payload:any = {}
      const lst:string[] = []
      if(editTarget.comment?.poll?.pid){
        const pollId = editTarget.comment?.poll.pid  
        const iso = new Date(edittedData?.deadline ?? "").toISOString();
        payload.deadline = iso
        
  
        if(edittedData?.option1 != undefined){
          if(edittedData?.option1.trim().length > 0){
            lst.push(edittedData?.option1)
          }
          
        }
        if(edittedData?.option2 != undefined){
          if(edittedData?.option2 .trim().length > 0){
            lst.push(edittedData?.option2)
          }
        }

        if(edittedData?.option3 != undefined){
          if(edittedData?.option3.trim().length > 0){
            lst.push(edittedData?.option3)
          }
        }

        if(edittedData?.option4 != undefined){
          if(edittedData?.option4.trim().length > 0){
            lst.push(edittedData?.option4)
          }
        }
  
        var count = 1
        for(var i of lst){
          if(i.trim().length > 0){
            payload["option"+count] = i
            count +=1
          }          
        }

        if(lst.length != editTarget.comment.poll.options.length){
          alert("number of poll options cant change")
          return
        }
  
        //now fetch
        var response = await fetch(`/api/social/polls/${pollId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
        if(response.status == 401){
          const refresh = await refreshToken()
          if(refresh != 200){
            router.push("/");
            return
          }
          response = await fetch(`/api/social/polls/${pollId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })
          const data = response.json()
          if(response.status == 401){
            router.push("/")
            return
          }
        }
        if(response.status==409){
          return
        }
        if(response.ok){
            window.sessionStorage.setItem("scrollY", window.scrollY.toString());
            window.location.reload();
          
        }
        else{
          alert("This request could not be completed")
          router.push("/")
        }
      }
    }
  
    setEdittedData(undefined);
    setEditTarget(null)
  }


  const submitDelete:any = async () => {
    if(!currentUserId){
      alert("You must be logged in to make this request")
      router.push("/")
      return
    }
    if (deleteTarget?.type === 'thread') {
      // In a real app, delete the thread and navigate back
      //fetch here
      var response = await fetch("/api/social/threads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tid: deleteTarget?.id
        }),
      })
      if(response.status == 401){
        const refresh = await refreshToken();
        if(refresh == 401){
          alert("Session expired, please login again")
          router.push("/")
          return
        }
        response = await fetch("/api/social/threads", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tid: deleteTarget?.id
          }),
        })
        if(response.status == 401){
          router.push("/")
          return
        }
      }
      if(response.ok){
        router.push("/")
        return
      }
      else{
        alert("unable to process this request")
      }
    } else {

      //fetch here
      var response = await fetch("/api/social/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cid: deleteTarget?.id
        }),
      })
      if(response.status == 401){
        const refresh = await refreshToken();
        if(refresh == 401){
          alert("Session expired, please login again")
          router.push("/")
          return
        }
        response = await fetch("/api/social/comments", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cid: deleteTarget?.id
          }),
        })
        if(response.status == 401){
          router.push("/")
          return
        }
      }
      if(response.ok){
        //succesffuly deleted, remove
        setComments(deleteCommentById(comments, deleteTarget?.id));
      }
      else{
        alert("an error occured while processing this request");
        router.push('/')
        return
      }
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const handleTranslate = async (type: "thread" | "comment", comment:Comment | undefined)=>{
    if(!currentUserId){
      alert("You must be logged in to make this request")
      router.push("/")
      return
    }
    var id = undefined
    var idType = undefined

    if(type == "thread"){
      id = thread?.tid
      idType = "tid"
    }
    else if(type == "comment"){
      if(comment){
        id = comment.cid
      }
      idType = "cid"
    }
    
    //now fetch translation
    if(type && id){
      var response = await fetch(`/api/translator?${idType}=${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      })
      if(response.status == 401){
        const refresh = await refreshToken();
        if(refresh == 401){
          alert("Session expired, please login again")
          router.push("/")
          return
        }
        response = await fetch(`/api/translator?${idType}=${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        })
        if(response.status == 401){
          router.push("/")
          return
        }
      }
      if(response.ok){
        const data = await response.json()
        alert(data.message)
      }
      else{
        alert("Could not process this request. Try again in a bit")
      }
    }
  }

  function deleteCommentById(comments: Comment[], targetId: number | undefined): Comment[] {
    return comments
      .filter(c => c.cid !== targetId) // remove at current level
      .map(c => ({
        ...c,
        replies: deleteCommentById(c.replies || [], targetId), // recurse
      }));
  }
  const handleNewPoll = (comment:Comment) => {
    setShowNewPollDialog(true)
    if(comment != undefined){
      const newPoll = {comment:comment}
      setNewPollData(newPoll);
    }

  }

  const deletePoll = async () =>{
    if(deletingPollComment?.poll == undefined){
      return
    }
    if(currentUserId == undefined){
      router.push("/")
    }

    var response = await fetch("/api/social/polls", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pid: deletingPollComment?.poll.pid
      }),
    })
    //need refresh token
    if(response.status == 401){
      const refresh = await refreshToken();
      if(refresh == 401){
        alert("Session expired, please login again")
        router.push("/")
        return
      }
      response = await fetch("/api/social/polls", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pid: deletingPollComment?.poll.pid
        }),
      })
      if(response.status == 401){
        router.push("/")
        return
      }
    }
    if(response.ok){
      deletingPollComment.poll = undefined
      router.refresh()
    }
    else{
      alert("unable to make this request")
    }

  }


  const submitNewPoll = async () => {
    if(!currentUserId){
      alert("You must be logged in to make this request")
      router.push("/");
      return
    }
    const payload:any = {}
    const lst:string[] = []
    if(newPollData?.comment){
      payload.commentID = newPollData.comment.cid
    }
    if(!newPollData.deadline){
      const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const isoString = in24Hours.toISOString();

      payload.deadline = isoString
    }
    else{
      const iso = new Date(newPollData.deadline).toISOString();
      payload.deadline = iso
    }

    if(newPollData.option1 != undefined){
      lst.push(newPollData.option1)
    }
    if(newPollData.option2 != undefined){
      lst.push(newPollData.option2)
    }
    if(newPollData.option3 != undefined){
      lst.push(newPollData.option3)
    }
    if(newPollData.option4 != undefined){
      lst.push(newPollData.option4)
    }

    var count = 1
    for(var i of lst){
      if(i.trim().length > 0){
        payload["option"+count] = i
        count +=1
      }
      
    }
    //now fetch
    var response = await fetch("/api/social/polls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
    if(response.status == 401){
      const refresh = await refreshToken()
      if(refresh != 200){
        router.push("/");
        return
      }
      response = await fetch("/api/social/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const data = response.json()
      if(response.status == 401){
        router.push("/")
        return
      }
    }
    if(response.ok){
        window.sessionStorage.setItem("scrollY", window.scrollY.toString());
        window.location.reload();
      
    }
  }

  const isOwner = (authorid: number) => {
    return currentUserId === authorid;
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isReplying = replyingTo === comment.cid;
    const canDelete = isOwner(comment.author.uid) || isAdmin;
    const canEdit = isOwner(comment.author.uid)
    const hasPoll = comment.poll != undefined

    

    return (
      <div key={comment.cid} className={depth > 0 ? 'ml-12 mt-4' : ''}>
        <div className="flex gap-3">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={(comment.author.avatar == undefined || comment.author.avatar == null || comment.author.avatar == "")? "https://robohash.org/default" : comment.author.avatar} alt="User avatar" />
        </Avatar>
          <div className="flex-1">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span 
                    className={`font-semibold text-sm cursor-pointer hover:underline ${
                      comment.author.uid === currentUserId
                        ? "text-yellow-600 dark:text-yellow-400"
                        : ""
                    }`}
                    onClick={() => handleUserClick(comment.author.username)}
                  >
                    {comment.author.username}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(comment.date)}
                  </span>
                  {comment.editHistory && comment.editHistory.length > 1 && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 cursor-pointer">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-500" align="end">
                    <DropdownMenuItem className='cursor-pointer' onClick={() => handleReport('comment', comment.cid)}>
                      <Flag className="h-4 w-4 mr-2 cursor-pointer" />
                      Report
                    </DropdownMenuItem>

                    <DropdownMenuItem className='cursor-pointer' onClick={() => handleTranslate('comment', comment)}>
                      <WholeWord className="h-4 w-4 mr-2 " />
                      Translate
                    </DropdownMenuItem>


                    {comment.editHistory && comment.editHistory.length > 0 && (
                      <EditHistoryDialog 
                        history={comment.editHistory}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <History className="h-4 w-4 mr-2 cursor-pointer" />
                            View Comment Edit History
                          </DropdownMenuItem>
                        }
                      />
                    )}

                    {!isClosed && canEdit && (
                      <DropdownMenuItem 
                        onClick={() => handleEdit('comment', comment)}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}

                    {(!isClosed && canEdit && !hasPoll) && (
                        <DropdownMenuItem 
                        onClick={() => handleNewPoll(comment)}
                        className="text-destructive focus:text-destructive cursor-pointer">
                        <MessageSquareText className="h-4 w-4 mr-2" />
                        Add Poll
                      </DropdownMenuItem>
                      )
                      }
                    {hasPoll && comment?.poll?.editHistory && comment?.poll?.editHistory.length > 0 && (
                      <EditHistoryDialog 
                        history={comment?.poll?.editHistory}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <History className="h-4 w-4 mr-2 cursor-pointer" />
                            View Poll Edit History
                          </DropdownMenuItem>
                        }
                      />
                    )}
                    
                    
                    {!isClosed && (canEdit && hasPoll) && (
                        <DropdownMenuItem 
                        onClick={() => {handleEdit('poll', comment)}}
                        className="text-destructive focus:text-destructive cursor-pointer">
                        <MessageSquareDashed className="h-4 w-4 mr-2" />
                        Edit Poll
                      </DropdownMenuItem>
                      )
                    } 
                    
                    {(canEdit && hasPoll) && (
                        <DropdownMenuItem 
                        onClick={() => {setdeletingPollComment(comment); setShowDeletePollDialog(true)}}
                        className="text-destructive focus:text-destructive cursor-pointer">
                        <MessageSquareOff className="h-4 w-4 mr-2" />
                        Delete Poll
                      </DropdownMenuItem>
                      )
                    } 
                    


                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => handleDelete('comment', comment.cid)}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Comment
                      </DropdownMenuItem>
                    )}
                    
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm">{comment.text}</p>
            </div>

            {/* Poll if attached to comment */}
            {comment.poll && (
              <div className="mt-3">
                <PollComponent poll={comment.poll} />
              </div>
            )}

            {/* Comment Actions */}
            {!isClosed && 
            (<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <button 
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                onClick={() => setReplyingTo(isReplying ? null : comment.cid)}>
                <MessageSquare className="h-3 w-3" />
                Reply
              </button>
            </div>)}

            {/* Reply Input */}
            {!isClosed && isReplying && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-20 text-sm"
                />
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handlePostReply(comment)}
                    disabled={!replyText.trim()}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies.map((reply) => (
              <div key={reply.cid}>
                {renderComment(reply, depth + 1)}
              </div>
            ))}



          </div>
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <p className="text-muted-foreground">Loading thread...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">
        <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <h1 className="text-muted-foreground">Thread not found</h1>
        </div>
      </div>
    );
  }
  

  const canDeleteThread = isOwner(thread.author.uid) || isAdmin;
  const canEditThread = isOwner(thread.author.uid);

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-50">

    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header with Thread Content */}
      <div className="bg-white dark:bg-slate-900 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/main")}
            className="mb-8 -ml-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-4">
            {thread.editHistory && thread.editHistory.length > 1 && (
              <Badge variant="outline" className="text-xs">Edited</Badge>
            )}
          </div>

          {isClosed && (<p className="text-red-500">THREAD CLOSED</p>)}

          {/* Thread Title */}
          <h1 className="text-4xl font-bold mb-2">{thread.title}</h1>
          <div className='flex'>
          <p className='text-gray-500 mb-6'>
              {thread.tags}
          </p>
          {thread.team && (<p className='ml-5 text-blue-600 dark:text-blue-200'>{thread.team.name}</p>)}

          </div>


          {/* Author Info and Actions */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-3">
              {thread.author.uid != 0 && (<div className='flex'>
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={(thread.author.avatar == undefined || thread.author.avatar == null || thread.author.avatar == "")? "https://robohash.org/default" : thread.author.avatar} alt="User avatar" />
                </Avatar>
              <div>
                <span 
                  className={`font-semibold text-base cursor-pointer hover:underline block${
                    thread.author.uid === currentUserId
                      ? "text-yellow-600 dark:text-yellow-400"
                      : ""
                  }`}
                  onClick={() => handleUserClick(thread.author.username)}
                >
                  {thread.author.username}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimestamp(thread.date)}
                </span>

                

              </div>
              </div>)}
              
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-500 cursor-pointer" align="end">
                
                
                <DropdownMenuItem className='cursor-pointer' onClick={() => handleReport('thread', thread.tid)}>
                  <Flag className="h-4 w-4 mr-2 " />
                  Report
                </DropdownMenuItem>

                <DropdownMenuItem className='cursor-pointer' onClick={() => handleTranslate('thread', undefined)}>
                  <WholeWord className="h-4 w-4 mr-2 " />
                  Translate
                </DropdownMenuItem>

                {thread.editHistory && thread.editHistory.length > 0 && (
                  <EditHistoryDialog 
                    history={thread.editHistory}
                    trigger={
                      <DropdownMenuItem className='cursor-pointer' onSelect={(e) => e.preventDefault()}>
                        <History className="h-4 w-4 mr-2" />
                        View Thread Edit History
                      </DropdownMenuItem>
                    }
                  />
                )}
                
                {!isClosed && canEditThread && (
                    <DropdownMenuItem 
                      onClick={() => handleEdit('thread', undefined)}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                {canDeleteThread && (
                  <DropdownMenuItem 
                    className='cursor-pointer'
                    onClick={() => handleDelete('thread', thread.tid)}
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Thread Description */}
          <p className="text-base leading-relaxed mb-6">{thread.text}</p>
          
        </div>
      </div>



      {/* Main Content Area - Comments Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* New Comment */}

        {!isClosed &&
        (<Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Avatar className="h-15 w-15 mt-1">
                <Avatar className="h-15 w-15 mt-1">
                  <AvatarImage src={(currAvatar == undefined || currAvatar== null || currAvatar == "") ? "https://robohash.org/default" : currAvatar} alt="User avatar" />
                </Avatar>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-24 mb-3"
                />
                <div className="flex justify-end ">
                  <Button className='cursor-pointer' 
                    onClick={handlePostComment}
                    disabled={!newComment.trim()}
                  >
                    Post Comment
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>)
        }

        {/* Comments */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Comments</h2>
          {comments.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No comments yet. Be the first to comment!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <Card key={comment.cid}>
                  <CardContent className="pt-6">
                    {renderComment(comment)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Comment Dialog */}
      <AlertDialog open={showEditCommentDialog} onOpenChange={setShowEditCommentDialog}>
      <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Edit Comment</AlertDialogTitle>
          </AlertDialogHeader>
          
          <AlertDialogDescription>
          All current & previous edits can be viewed by all users.
          </AlertDialogDescription>

          <textarea
            placeholder="Comment:"
            value={edittedData?.body != undefined ? edittedData.body : ""}
            onChange={(e) => {
              setEdittedData(prev => {
                if (!prev) return prev; // handle undefined safely
            
                return {
                  ...prev,
                  body: e.target.value,
                };
              });
            }}
            className="w-full mt-3 p-2 border rounded-md resize-none"
            rows={3}
          />

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setEdittedData(undefined); setEditTarget(null)}}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={edittedData?.body ? false:true} onClick={submitEdit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>







      {/* Edit Thread Dialog */}
      <AlertDialog open={showEditThreadDialog} onOpenChange={setShowEditThreadDialog}>
        <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Edit Thread</AlertDialogTitle>
          </AlertDialogHeader>
          
          <AlertDialogDescription>
          All current & previous edits can be viewed by all users.
          </AlertDialogDescription>

          <textarea
            title='Title'
            placeholder="Enter a new title"
            value={edittedData?.title != undefined ? edittedData.title : ""}
            onChange={(e) => {
              setEdittedData(prev => {
                if (!prev) return prev; // handle undefined safely
            
                return {
                  ...prev,
                  title: e.target.value,
                };
              });
            }}
            className="w-full h-15 mt-3 p-2 border rounded-md resize-none"
            rows={3}
          />
          
          <textarea
            title='Tags'
            placeholder="Enter new tags"
            value={edittedData?.tags != undefined ? edittedData.tags : ""}
            onChange={(e) => {
              setEdittedData(prev => {
                if (!prev) return prev; // handle undefined safely
            
                return {
                  ...prev,
                  tags: e.target.value,
                };
              });
            }}
            className="w-full h-25 mt-3 p-2 border rounded-md resize-none"
            rows={3}
          />

          <textarea
            title='Body'
            placeholder="Enter a new body"
            value={edittedData?.body != undefined ? edittedData.body : ""}
            onChange={(e) => {
              setEdittedData(prev => {
                if (!prev) return prev; // handle undefined safely
            
                return {
                  ...prev,
                  body: e.target.value,
                };
              });
            }}
            className="w-full h-50 mt-3 p-2 border rounded-md resize-none"
            rows={3}
          />

      
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setEdittedData(undefined); setEditTarget(null)}}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={edittedData?.body && edittedData?.title ? false:true} onClick={submitEdit}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* Report comment/thread Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Report Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this {reportTarget?.type}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            placeholder="Add a reason for your report..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full mt-3 p-2 border rounded-md resize-none"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {setReportReason(""); setReportTarget(null)}}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={reportReason?false:true} onClick={submitReport}>Submit Report</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete comment/thread Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Delete {deleteTarget?.type === 'thread' ? 'Thread' : 'Comment'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deleting polls */}
      <AlertDialog open={showDeletePollDialog} onOpenChange={setShowDeletePollDialog}>
        <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Poll? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setdeletingPollComment(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={()=>{deletePoll()}} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



      {/* new Poll creation Dialog */}
      <AlertDialog open={showNewPollDialog} onOpenChange={setShowNewPollDialog}>
        <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Create a new Poll</AlertDialogTitle>
          </AlertDialogHeader>
          
          <AlertDialogDescription>
          A poll can have up to 4 options, and requires a deadline!
          If an option is blank, it will not be used. Atleast 1 option required
          </AlertDialogDescription>

          {Array.from({ length: 4 }).map((_, i) => {
            type OptionKey = "option1" | "option2" | "option3" | "option4";
            const key = `option${i + 1}` as OptionKey;


            return (
            <textarea
              key={i}
              placeholder="Enter an option"
              value={newPollData[key]}
              onChange={(e) => {
                setNewPollData(prev => {
                  if (!prev) return prev; // handle undefined safely
              
                  return {
                    ...prev,
                    [key]: e.target.value,
                  };
                });
              }}
              className="w-full h-15 mt-3 p-2 border rounded-md resize-none"
              rows={3}/>)
            })}
            
              <div>
              <h2>Deadline:</h2>
              <input
                type="datetime-local"
                value={newPollData.deadline}
                onChange={(e) => {
                  setNewPollData(prev => {
                    if (!prev) return prev; // handle undefined safely
                
                    return {
                      ...prev,
                      deadline: e.target.value,
                    };
                  });

                }}
              />
              </div>
              
          

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewPollData({})}>Cancel</AlertDialogCancel>

                <AlertDialogAction disabled={!(((newPollData.option1 ?? "").length > 0)
                                            ||((newPollData.option2 ?? "").length > 0)
                                            ||((newPollData.option3 ?? "").length > 0)
                                            ||((newPollData.option4 ?? "").length > 0))} onClick={submitNewPoll}>
                  Confirm
                  </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>






      {/* Edit Poll Dialog */}
      <AlertDialog open={showEditPollDialog} onOpenChange={setShowEditPollDialog}>
        <AlertDialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">Edit a Poll</AlertDialogTitle>
          </AlertDialogHeader>
          
          <AlertDialogDescription>
          The number of options must remain the same!
          </AlertDialogDescription>

              {Array.from({ length: 4 }).map((_, i) => {
                type OptionKey = "option1" | "option2" | "option3" | "option4";
                const key = `option${i + 1}` as OptionKey;

                // 🚨 Skip if undefined
                if (!edittedData?.[key]) return null;

                return (
                  <textarea
                    key={i}
                    placeholder="Enter an option"
                    value={edittedData[key] ?? ""}
                    onChange={(e) => {
                      setEdittedData(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          [key]: e.target.value,
                        };
                      });
                    }}
                    className="w-full h-15 mt-3 p-2 border rounded-md resize-none"
                    rows={3}
                  />
                );
              })}
            
              <div>
              <h2>Deadline:</h2>
              <input
                type="datetime-local"
                value={edittedData?.deadline ?? ""}
                onChange={(e) => {
                  setEdittedData(prev => {
                    if (!prev) return prev; // handle undefined safely
                
                    return {
                      ...prev,
                      deadline: e.target.value,
                    };
                  });

                }}
              />
              </div>
              
          

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewPollData({})}>Cancel</AlertDialogCancel>

                <AlertDialogAction disabled={!(((edittedData?.option1 ?? "").length > 0)
                                            ||((edittedData?.option2 ?? "").length > 0)
                                            ||((edittedData?.option3 ?? "").length > 0)
                                            ||((edittedData?.option4 ?? "").length > 0))} onClick={submitEdit}>
                  Confirm
                  </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>



    </div>
    </div>
  );
}