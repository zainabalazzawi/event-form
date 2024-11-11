import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const UPDATE_EVENT = gql`
  mutation UpdateEvent(
    $id: Int!
    $title: String
    $description: String
    $date: String
  ) {
    updateEvent(
      id: $id
      title: $title
      description: $description
      date: $date
    ) {
      id
      title
      description
      date
      organizer
    }
  }
`;

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  date: z.string().min(1, { message: "Date is required" }),
});

type EditEventFormProps = {
  event: {
    id: number;
    title: string;
    description: string;
    date: string;
  };
  isOpen: boolean;
  onClose: () => void;
};

const EditEventForm = ({ event, isOpen, onClose }: EditEventFormProps) => {
  const client = useApolloClient();
  const queryClient = useQueryClient();

  // Format the date to YYYY-MM-DD for the date input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(isNaN(Number(dateString)) ? dateString : Number(dateString));
    return date.toISOString().split('T')[0];
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      date: formatDateForInput(event.date),
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const updateEventMutation = async (fields: z.infer<typeof formSchema> & { id: number }) => {
    const { data } = await client.mutate({
      mutation: UPDATE_EVENT,
      variables: {
        id: fields.id,
        title: fields.title,
        description: fields.description,
        date: fields.date,
      },
    });
    return data.updateEvent;
  };

  const mutation = useMutation({
    mutationFn: updateEventMutation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", event.id] });
      onClose();
    },
  });

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    mutation.mutate({
      id: event.id,
      ...fields
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <FormItem className="my-5">
              <FormLabel>Title</FormLabel>
              <Input {...register("title")} />
              <FormMessage>
                {errors.title && <span>{errors.title.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Description</FormLabel>
              <Input {...register("description")} />
              <FormMessage>
                {errors.description && <span>{errors.description.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Date</FormLabel>
              <Input type="date" {...register("date")} />
              <FormMessage>
                {errors.date && <span>{errors.date.message}</span>}
              </FormMessage>
            </FormItem>

            <Button type="submit" className="mt-6">
              Update Event
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventForm;
