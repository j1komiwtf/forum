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
import { useLocale } from "@/hooks/use-locale";

interface UserTableProps {
  users: User[];
  currentUser: User;
}

export function UserTable({ users, currentUser }: UserTableProps) {
  const { toast } = useToast();
  const { t } = useLocale();
  const isOwner = currentUser.role === UserRole.OWNER;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Helper function to check if a user can be promoted/demoted to a role
  const canChangeRole = (user: User, role: UserRole) => {
    // Owner can't change their own role
    if (user.id === currentUser.id) return false;
    // Can't change owner's role
    if (user.role === UserRole.OWNER) return false;
    // If user already has this role, show demotion option
    if (user.role === role) return true;
    // Otherwise show promotion option
    return true;
  };

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
        title: t('status.success'),
        description: t('status.success'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('status.error'),
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
        title: t('status.success'),
        description: t('status.success'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('status.error'),
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
        title: t('status.success'),
        description: t('status.success'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('status.error'),
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
        title: t('status.success'),
        description: t('status.success'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('status.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('auth.username')}</TableHead>
          <TableHead>{t('auth.displayName')}</TableHead>
          <TableHead>{t('auth.role')}</TableHead>
          <TableHead>{t('status.title')}</TableHead>
          <TableHead className="text-right">{t('actions.title')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium flex items-center gap-2">
              {user.username}
              {user.isVerified && (
                <CheckCircle className="h-4 w-4 text-primary fill-primary shrink-0" />
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
                {t(`roles.${user.role.toLowerCase()}`)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                {user.isPremium && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {t('status.premium')}
                  </Badge>
                )}
                {user.isBlocked && (
                  <Badge variant="destructive">{t('status.blocked')}</Badge>
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
                        {user.isVerified ? t('actions.removeVerification') : t('actions.verify')}
                      </DropdownMenuItem>
                    )}

                    {isOwner && user.role !== UserRole.OWNER && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: canChangeRole(user, UserRole.ADMIN) && user.role === UserRole.ADMIN 
                                ? UserRole.USER 
                                : UserRole.ADMIN,
                            })
                          }
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          {user.role === UserRole.ADMIN ? t('actions.removeAdmin') : t('actions.makeAdmin')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: canChangeRole(user, UserRole.MODERATOR) && user.role === UserRole.MODERATOR
                                ? UserRole.USER
                                : UserRole.MODERATOR,
                            })
                          }
                        >
                          <ShieldAlert className="mr-2 h-4 w-4" />
                          {user.role === UserRole.MODERATOR ? t('actions.removeModerator') : t('actions.makeModerator')}
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
                          {user.isPremium ? t('actions.removePremium') : t('actions.makePremium')}
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
                          {user.isBlocked ? t('actions.unblock') : t('actions.block')}
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
                            {t('actions.delete')}
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('actions.deleteUser')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('actions.deleteUserConfirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                            >
                              {t('actions.delete')}
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