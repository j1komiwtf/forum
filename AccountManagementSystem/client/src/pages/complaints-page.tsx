import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Complaint, ComplaintMessage, User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { ComplaintList } from "@/components/complaints/complaint-list";
import { ComplaintChat } from "@/components/complaints/complaint-chat";
import { CreateComplaintDialog } from "@/components/complaints/create-complaint-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function ComplaintsPage() {
  const { user } = useAuth();
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: complaints } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints/user"],
  });

  const { data: selectedComplaint } = useQuery<Complaint>({
    queryKey: ["/api/complaints", selectedComplaintId],
    enabled: !!selectedComplaintId,
  });

  const { data: messages } = useQuery<ComplaintMessage[]>({
    queryKey: ["/api/complaints", selectedComplaintId, "messages"],
    enabled: !!selectedComplaintId,
  });

  const { data: assignedStaff } = useQuery<User>({
    queryKey: ["/api/users", selectedComplaint?.assignedToId],
    enabled: !!selectedComplaint?.assignedToId,
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <ComplaintList
              complaints={complaints ?? []}
              selectedId={selectedComplaintId}
              onSelect={setSelectedComplaintId}
            />
          </div>

          <div className="col-span-8">
            {selectedComplaint && (
              <ComplaintChat
                complaint={selectedComplaint}
                messages={messages ?? []}
                currentUser={user!}
                assignedStaff={assignedStaff}
              />
            )}
          </div>
        </div>

        <CreateComplaintDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </main>
    </div>
  );
}