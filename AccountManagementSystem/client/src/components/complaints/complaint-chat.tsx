import { useState, useEffect, useRef } from "react";
import { Complaint, ComplaintMessage, User, UserRole } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Send, AlertCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/hooks/use-locale";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

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
  const { t } = useLocale();

  // Fetch all staff members who are currently online
  const { data: onlineStaff } = useQuery<User[]>({
    queryKey: ["/api/users/staff/online"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/complaints/${complaint.id}`);

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
  }, [complaint.id]);

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

  const isStaff = (user: User) => {
    return [UserRole.OWNER, UserRole.ADMIN, UserRole.MODERATOR, UserRole.SUPPORT].includes(user.role as UserRole);
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

        {/* Online Staff Section */}
        {isStaff(currentUser) && onlineStaff && onlineStaff.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6">
                  {t('complaints.onlineStaff', { count: onlineStaff.length })}
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  {onlineStaff.map((staff) => (
                    <div key={staff.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6" />
                      <div>
                        <p className="text-sm font-medium">{staff.displayName || staff.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {t(`roles.${staff.role.toLowerCase()}`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Initial complaint message */}
        <div className="flex gap-3 justify-start">
          <Avatar className="h-8 w-8" />
          <div className="rounded-lg p-3 max-w-[70%] bg-muted">
            <p className="text-sm">{complaint.description}</p>
            <p className="text-xs opacity-70 mt-1">
              {format(new Date(complaint.createdAt), "PPp")}
            </p>
          </div>
        </div>

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

      <form onSubmit={handleSubmit} className="p-4 border-t">
        {!isConnected && (
          <div className="flex items-center text-destructive text-sm mb-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            {t('status.reconnecting')}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('complaints.typePlaceholder')}
            className="flex-1"
            disabled={!isConnected}
          />
          <Button type="submit" size="icon" disabled={!isConnected}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
}