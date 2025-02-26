import { useState, useEffect, useRef } from "react";
import { Complaint, ComplaintMessage, User } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Send, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComplaintChatProps {
  complaint: Complaint;
  messages: ComplaintMessage[];
  currentUser: User;
  assignedStaff?: User;
}

export function ComplaintChat({
  complaint,
  messages,
  currentUser,
  assignedStaff,
}: ComplaintChatProps) {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/complaints`);

    ws.onopen = () => {
      console.log("Connected to complaint chat");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error("WebSocket error:", data.error);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from complaint chat");
      setIsConnected(false);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket || !isConnected) return;

    socket.send(JSON.stringify({
      complaintId: complaint.id,
      text: message.trim(),
    }));

    setMessage("");
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-semibold">{complaint.title}</h2>
          <Badge variant={complaint.status === "RESOLVED" ? "default" : "secondary"}>
            {complaint.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{complaint.description}</p>
        {assignedStaff && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>Assigned to:</span>
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5" />
              <span>{assignedStaff.displayName || assignedStaff.username}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.userId === currentUser.id ? "justify-end" : "justify-start"
            }`}
          >
            {msg.userId !== currentUser.id && (
              <Avatar className="h-8 w-8" />
            )}
            <div
              className={`rounded-lg p-3 max-w-[70%] ${
                msg.isSystemMessage
                  ? "bg-muted text-center w-full"
                  : msg.userId === currentUser.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {format(new Date(msg.createdAt), "PPp")}
              </p>
            </div>
            {msg.userId === currentUser.id && (
              <Avatar className="h-8 w-8" />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        {!isConnected && (
          <div className="flex items-center text-destructive text-sm mb-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            Reconnecting...
          </div>
        )}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          disabled={!isConnected}
        />
        <Button type="submit" size="icon" disabled={!isConnected}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}