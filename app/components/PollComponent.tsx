import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { BarChart3, History, Clock, Vote } from 'lucide-react';
import { EditHistoryDialog } from './EditHistoryDialog';
import { useRouter } from 'next/navigation';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface EditHistoryCompItem {
  id: string;
  content: string;
  editedAt: string;
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

interface PollComponentProps {
  poll: Poll;
}

export function PollComponent({ poll }: PollComponentProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);
  const [options, setOptions] = useState<PollOption[]>([]);


  useEffect(()=>{
    if(poll.chosenid){
      setSelectedOption(poll.chosenid)
      setHasVoted(true)
    }
    setTotalVotes(poll.totalVotes)
    setOptions(poll.options)
    

  },[])

  const refreshToken = async () =>{
    var response = await fetch("/api/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
    return response.status
  }

  const handleVote = async () => {
    if (selectedOption) {
      try {
        var curr = localStorage.getItem("currentUser")
        if(curr){
          const parsed = JSON.parse(curr);
          if (!parsed?.uid) {
            router.push('/')
            return
          }
        }
        else{
          router.push('/')
          return
        }
        

        if(curr == undefined || curr == null){
          router.push('/')
            return
        }
        if(curr){
          if(!JSON.parse(curr).uid){
            router.push('/')
            return
          }
        }
      } catch (e) {
        alert("Must be logged in to make this request")
        router.push("/")
        return
      }

      if(selectedOption){
        var parsed = selectedOption.split("_")[1]
        
        //fetch tthe vote
        var response = await fetch(`/api/social/polls/vote/${poll.pid}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
         },
          body: JSON.stringify({option:parseInt(parsed)}),
        })
        if(response.status==401){
          
          const refreshResult = await refreshToken()
          console.log("REFRESHED TOKEN")
          if(refreshResult == 401){
            alert("Session expired, please login again")
            router.push("/")
            return
          }
          else{
            response = await fetch(`/api/social/polls/vote/${poll.pid}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
             },
              body: JSON.stringify({option:parseInt(parsed)}),
            })
            if(response.status == 401){
              alert()
            }
          }
        }
        if(response.ok){
          const newOptions = options
          newOptions[parseInt(parsed)-1].votes += 1
          setOptions(newOptions)
          setTotalVotes(totalVotes+1);
          setHasVoted(true);
        }
        else{
          alert("Your vote could not be processed at this time")
          router.push("/")
          return
        }
        
      }    
    }
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };
  console.log(poll.threadClosed)
  const isExpired = ((new Date(poll.endsAt) < new Date()) || poll.threadClosed);

  const formatEndDate = (dateString: string) => {
    
    const date = new Date(dateString);
    const now = new Date();
    
    if (date < now) {
      return 'Poll ended';
    }
    
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (poll.threadClosed){
      return "Expired"
    }
    if (diffInHours < 24) {
      return `Ends in ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Ends in ${diffInDays}d`;
    }
  };

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Poll</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {formatEndDate(poll.endsAt)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {options.map((option) => {
            const percentage = getPercentage(option.votes);
            const isSelected = selectedOption === option.id;
            
            return (
              <div key={option.id} className="space-y-1">
                {!hasVoted && !isExpired ? (
                  <button
                    onClick={() => setSelectedOption(option.id)}
                    className={`w-full text-left p-3 rounded-lg border-1 transition-all ${
                      isSelected
                      ? 'border-primary bg-primary/20 ring-4 ring-primary/50'
                      : 'border-primary bg-primary/20 ring-primary/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{option.text}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{" "}</span>
                          <span className="text-xs text-muted-foreground">
                            {" "}
                          </span>
                        </div>
                    </div>
                  </button>
                ) : (
                  <div
                    className={`w-full text-left p-3 rounded-lg border-1 transition-all ${

                      selectedOption == option.id
                        ? 'border-primary bg-primary/20 ring-4 ring-primary/50'
                        : 'border-primary bg-primary/20 ring-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{option.text}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{percentage}%</span>
                        <span className="text-xs text-muted-foreground">
                          ({option.votes})
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!hasVoted && !isExpired ? (
          <Button
            onClick={handleVote}
            disabled={!selectedOption}
            className="w-full mt-4 cursor-pointer"
            size="sm"
          >
            Submit Vote
          </Button>
        ):(
          <div className="w-full mt-4 h-8"/>
        )}

        <div className="mt-3 text-xs text-muted-foreground text-center">
          {totalVotes} total votes
        </div>
      </CardContent>
    </Card>
  );
}
