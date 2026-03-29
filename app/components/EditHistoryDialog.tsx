import { ReactNode, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Clock } from 'lucide-react';

interface EditHistoryCompItem {
  id: string;
  content: string;
  editedAt: string;
}

interface EditHistoryDialogProps {
  history: EditHistoryCompItem[];
  trigger: ReactNode;
}

export function EditHistoryDialog({ history, trigger }: EditHistoryDialogProps) {
  const [open, setOpen] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-50 border-slate-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">Edit History</DialogTitle>
          <DialogDescription>
            View all previous versions of this content
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="space-y-4 mb-5">
            {history.map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">

                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(item.editedAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-line">{item.content}</p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
