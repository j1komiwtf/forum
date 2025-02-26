import { Complaint, User, UserRole } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  MoreHorizontal,
  UserCheck,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface ComplaintTableProps {
  complaints: Complaint[];
  users: User[];
  currentUser: User;
}

export function ComplaintTable({ complaints, users, currentUser }: ComplaintTableProps) {
  const assignComplaintMutation = useMutation({
    mutationFn: async (complaintId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/complaints/${complaintId}/assign`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
    },
  });

  const resolveComplaintMutation = useMutation({
    mutationFn: async (complaintId: number) => {
      const res = await apiRequest(
        "PATCH",
        `/api/complaints/${complaintId}/resolve`
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
    },
  });

  function getUserName(userId: number) {
    return users.find((u) => u.id === userId)?.username ?? "Unknown User";
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="outline">Resolved</Badge>;
      default:
        return null;
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Reported By</TableHead>
          <TableHead>Against</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {complaints.map((complaint) => (
          <TableRow key={complaint.id}>
            <TableCell className="font-medium">{complaint.title}</TableCell>
            <TableCell>{getUserName(complaint.userId)}</TableCell>
            <TableCell>{getUserName(complaint.targetUserId)}</TableCell>
            <TableCell>{getStatusBadge(complaint.status)}</TableCell>
            <TableCell>
              {complaint.assignedToId
                ? getUserName(complaint.assignedToId)
                : "Unassigned"}
            </TableCell>
            <TableCell>
              {format(new Date(complaint.createdAt), "PPp")}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {complaint.status === "PENDING" && (
                    <DropdownMenuItem
                      onClick={() => assignComplaintMutation.mutate(complaint.id)}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Take Assignment
                    </DropdownMenuItem>
                  )}
                  {complaint.status === "IN_PROGRESS" &&
                    complaint.assignedToId === currentUser.id && (
                      <DropdownMenuItem
                        onClick={() =>
                          resolveComplaintMutation.mutate(complaint.id)
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
