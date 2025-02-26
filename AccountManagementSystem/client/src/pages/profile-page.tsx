import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Complaint, UpdateUserProfile } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: complaints } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints/user"],
  });

  const updateProfileForm = useForm({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const updatePasswordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
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

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/user/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      updatePasswordForm.reset();
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={updateProfileForm.handleSubmit((data) =>
                    updateProfileMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Username (Login)</Label>
                    <Input value={user?.username} disabled />
                    <p className="text-sm text-muted-foreground">
                      Login username cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...updateProfileForm.register("displayName")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input
                      id="avatarUrl"
                      {...updateProfileForm.register("avatarUrl")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <p className="text-sm">
                      {user?.createdAt && format(new Date(user.createdAt), "PPpp")}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={updatePasswordForm.handleSubmit((data) => {
                    if (data.newPassword !== data.confirmPassword) {
                      toast({
                        title: "Error",
                        description: "Passwords do not match",
                        variant: "destructive",
                      });
                      return;
                    }
                    updatePasswordMutation.mutate({
                      currentPassword: data.currentPassword,
                      newPassword: data.newPassword,
                    });
                  })}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...updatePasswordForm.register("currentPassword")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...updatePasswordForm.register("newPassword")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...updatePasswordForm.register("confirmPassword")}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaints?.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{complaint.title}</h3>
                        <Badge
                          variant={
                            complaint.status === "RESOLVED"
                              ? "outline"
                              : complaint.status === "PENDING"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {complaint.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {complaint.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted on{" "}
                        {format(new Date(complaint.createdAt), "PPp")}
                      </p>
                    </div>
                  ))}

                  {!complaints?.length && (
                    <p className="text-center text-muted-foreground">
                      No reports found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
