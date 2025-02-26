import { Complaint } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface ComplaintListProps {
  complaints: Complaint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ComplaintList({ complaints, selectedId, onSelect }: ComplaintListProps) {
  return (
    <div className="space-y-4">
      {complaints.map((complaint) => (
        <Card
          key={complaint.id}
          className={`p-4 ${
            selectedId === complaint.id ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">{complaint.title}</h3>
            <Badge variant={complaint.status === "RESOLVED" ? "default" : "secondary"}>
              {complaint.status}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {complaint.description}
          </p>

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Created: {format(new Date(complaint.createdAt), "PPp")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(complaint.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Open Chat
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}