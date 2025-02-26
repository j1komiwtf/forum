import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { UserRole } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "@/components/layout/sidebar";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
      role: UserRole.USER,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User account created successfully",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Only owner can access this page
  if (user?.role !== UserRole.OWNER) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Create Account</h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New User Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username">Username (for login)</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...form.register("displayName")}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  onValueChange={(value) => form.setValue("role", value as UserRole)}
                  defaultValue={form.getValues("role")}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                    <SelectItem value={UserRole.MODERATOR}>Moderator</SelectItem>
                    <SelectItem value={UserRole.SUPPORT}>Support</SelectItem>
                    <SelectItem value={UserRole.USER}>User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="mt-4"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
