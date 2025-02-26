import { User, UserRole } from "@shared/schema";
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
  Shield,
  ShieldAlert,
  Star,
  Trash2,
  UserX,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface UserTableProps {
  users: User[];
  currentUser: User;
}

export function UserTable({ users, currentUser }: UserTableProps) {
  const { toast } = useToast();
  const isOwner = currentUser.role === UserRole.OWNER;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: UserRole;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: number;
      updates: Partial<User>;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/status`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/verify`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User verified successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Display Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium flex items-center gap-1">
              {user.username}
              {user.isVerified && (
                <CheckCircle className="h-4 w-4 text-primary fill-primary" />
              )}
            </TableCell>
            <TableCell>{user.displayName || user.username}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={
                  user.role === UserRole.OWNER
                    ? "border-yellow-500 text-yellow-500"
                    : undefined
                }
              >
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {user.isPremium && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    Premium
                  </Badge>
                )}
                {user.isBlocked && (
                  <Badge variant="destructive">Blocked</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              {user.id !== currentUser.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(isOwner || isAdmin) && (
                      <DropdownMenuItem
                        onClick={() =>
                          verifyUserMutation.mutate(user.id)
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {user.isVerified ? "Remove Verification" : "Verify"}
                      </DropdownMenuItem>
                    )}

                    {isOwner && user.role !== UserRole.OWNER && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: UserRole.ADMIN,
                            })
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: UserRole.MODERATOR,
                            })
                          }
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          Make Moderator
                        </DropdownMenuItem>
                      </>
                    )}

                    {(isOwner || isAdmin) && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({
                              userId: user.id,
                              updates: { isPremium: !user.isPremium },
                            })
                          }
                        >
                          <Star className="mr-2 h-4 w-4" />
                          {user.isPremium ? "Remove Premium" : "Make Premium"}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            updateStatusMutation.mutate({
                              userId: user.id,
                              updates: { isBlocked: !user.isBlocked },
                            })
                          }
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          {user.isBlocked ? "Unblock User" : "Block User"}
                        </DropdownMenuItem>
                      </>
                    )}

                    {isOwner && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this user? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}