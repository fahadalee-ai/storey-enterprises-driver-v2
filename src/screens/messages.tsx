import { useNavigate } from "@tanstack/react-router";
import { CheckCheck, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { images } from "@/data/images";
import { Button, EmptyState, ErrorState, Header, Input, ListSkeleton, Screen, useListPhase } from "@/components/driver/ui";
import { formatTimeEt } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { useDriver } from "@/lib/store";

const replies = ["On my way", "Arrived", "Running 10 min late"];

export function MessagesScreen() {
  const ready = useAuthed();
  const navigate = useNavigate();
  const { threads } = useDriver();
  const { phase, retry } = useListPhase();
  if (!ready) return <Screen tab><div className="p-4"><ListSkeleton /></div></Screen>;
  return (
    <Screen tab>
      <div className="px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Messages</h1>
          <button type="button" className="min-h-12 text-sm font-semibold text-primary" onClick={retry}>Refresh</button>
        </div>
        {phase === "loading" ? <ListSkeleton /> : null}
        {phase === "error" ? <ErrorState onRetry={retry} /> : null}
        {phase === "ready" && threads.length === 0 ? <EmptyState title="No messages yet" body="Dispatch and customer threads show up here." /> : null}
        {phase === "ready" ? (
          <div className="mt-3 space-y-2">
            {threads.map((thread) => {
              const last = thread.messages[thread.messages.length - 1];
              const unread = thread.messages.filter((message) => message.from === "them" && !message.read).length;
              return (
                <button key={thread.id} type="button" className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white p-3 text-left" onClick={() => navigate({ to: "/messages/$threadId", params: { threadId: thread.id } })}>
                  <span className="flex size-12 items-center justify-center rounded-full bg-[#E7EDFF] text-sm font-bold text-primary">{thread.kind === "admin" ? "D" : "C"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{thread.title}</span>
                      {last ? <span className="text-[11px] text-muted-foreground">{formatTimeEt(last.at)}</span> : null}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">{last?.text || thread.subtitle}</span>
                  </span>
                  {unread > 0 ? <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{unread}</span> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </Screen>
  );
}

export function ThreadScreen({ threadId }: { threadId: string }) {
  const ready = useAuthed();
  const { threads, sendMessage, markThreadRead } = useDriver();
  const thread = threads.find((item) => item.id === threadId);
  const [text, setText] = useState("");
  useEffect(() => {
    if (thread) markThreadRead(thread.id);
  }, [threadId]);

  if (!ready) return <Screen><div /></Screen>;
  if (!thread) return <Screen><Header title="Messages" /><p className="px-4">Thread not found.</p></Screen>;

  return (
    <Screen scroll={false}>
      <Header title={thread.title} subtitle={thread.subtitle} fallback="/messages" />
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {thread.messages.map((message) => (
          <div key={message.id} className={`flex ${message.from === "driver" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${message.from === "driver" ? "bg-primary text-white" : "bg-white text-ink"}`}>
              {message.photo ? <img src={message.photo} alt="Attachment" className="mb-2 h-24 rounded-xl object-cover" /> : null}
              {message.text ? <p>{message.text}</p> : null}
              <p className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${message.from === "driver" ? "text-white/80" : "text-muted-foreground"}`}>
                {formatTimeEt(message.at)}
                {message.from === "driver" ? message.pending ? <Clock3 size={12} /> : <CheckCheck size={12} /> : null}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {replies.map((reply) => (
            <button key={reply} type="button" className="min-h-10 shrink-0 rounded-full bg-[#E7EDFF] px-3 text-xs font-semibold text-primary" onClick={() => sendMessage(thread.id, reply)}>
              {reply}
            </button>
          ))}
        </div>
        <form className="flex items-center gap-2" onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim()) return;
          sendMessage(thread.id, text.trim());
          setText("");
        }}>
          <label className="flex size-12 items-center justify-center rounded-[14px] border text-xs font-semibold">
            Photo
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => sendMessage(thread.id, "Photo", String(reader.result));
              reader.readAsDataURL(file);
            }} />
          </label>
          <button type="button" className="min-h-12 rounded-[14px] border px-2 text-xs font-semibold" onClick={() => sendMessage(thread.id, "Photo", images.specimen)}>Sample</button>
          <Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Message" />
          <Button type="submit" className="px-3">Send</Button>
        </form>
      </div>
    </Screen>
  );
}
