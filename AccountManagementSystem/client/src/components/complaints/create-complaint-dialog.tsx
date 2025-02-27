import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertComplaintSchema, type InsertComplaint } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

interface CreateComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateComplaintDialog({
  open,
  onOpenChange,
}: CreateComplaintDialogProps) {
  const { toast } = useToast();
  const { t } = useLocale();

  const form = useForm<InsertComplaint>({
    resolver: zodResolver(insertComplaintSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const createComplaintMutation = useMutation({
    mutationFn: async (data: InsertComplaint) => {
      // Create the complaint first
      const complaintRes = await apiRequest("POST", "/api/complaints", data);
      const complaint = await complaintRes.json();

      // Then create the initial message using the description
      await apiRequest("POST", `/api/complaints/${complaint.id}/messages`, {
        message: data.description,
        isSystemMessage: false
      });

      return complaint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      onOpenChange(false);
      form.reset();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('complaints.createTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              createComplaintMutation.mutate(data)
            )}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('complaints.title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('complaints.description')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={createComplaintMutation.isPending}
              >
                {createComplaintMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('status.creating')}
                  </>
                ) : (
                  t('actions.create')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}