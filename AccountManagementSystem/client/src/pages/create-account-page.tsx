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
import { useLocale } from "@/hooks/use-locale";

export default function CreateAccountPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLocale();

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
        title: t('status.success'),
        description: t('status.success'),
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: t('status.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user?.role !== UserRole.OWNER) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">{t('navigation.createAccount')}</h1>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{t('navigation.createAccount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="username">{t('auth.username')}</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.displayName')}</Label>
                <Input
                  id="displayName"
                  {...form.register("displayName")}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  className="max-w-md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t('auth.role')}</Label>
                <Select
                  onValueChange={(value) => form.setValue("role", value as UserRole)}
                  defaultValue={form.getValues("role")}
                >
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder={t('roles.user')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMIN}>{t('roles.admin')}</SelectItem>
                    <SelectItem value={UserRole.MODERATOR}>{t('roles.moderator')}</SelectItem>
                    <SelectItem value={UserRole.SUPPORT}>{t('roles.support')}</SelectItem>
                    <SelectItem value={UserRole.USER}>{t('roles.user')}</SelectItem>
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
                {t('navigation.createAccount')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}