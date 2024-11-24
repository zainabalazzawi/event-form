import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ImageUpload } from "./ImageUpload";

const UPDATE_EVENT = gql`
  mutation UpdateEvent(
    $id: Int!
    $title: String
    $description: String
    $startDate: String
    $endDate: String
    $image: String
  ) {
    updateEvent(
      id: $id
      title: $title
      description: $description
      startDate: $startDate
      endDate: $endDate
      image: $image
    ) {
      id
      title
      description
      startDate
      endDate
      organizer
      image
    }
  }
`;

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  image: z.string().optional(),
});

type EditEventFormProps = {
  event: {
    id: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    image?: string;
  };
  isOpen: boolean;
  onClose: () => void;
};

const EditEventForm = ({ event, isOpen, onClose }: EditEventFormProps) => {
  const client = useApolloClient();
  const queryClient = useQueryClient();

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString || Date.now());
    return isNaN(date.getTime()) 
      ? new Date().toISOString().slice(0, 16) 
      : date.toISOString().slice(0, 16);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      startDate: formatDateForInput(event.startDate),
      endDate: formatDateForInput(event.endDate),
      image: event.image || "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const updateEventMutation = async (
    fields: z.infer<typeof formSchema> & { id: number }
  ) => {
    const { data } = await client.mutate({
      mutation: UPDATE_EVENT,
      variables: {
        id: fields.id,
        title: fields.title,
        description: fields.description,
        startDate: fields.startDate,
        endDate: fields.endDate,
        image: fields.image,
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
      ...fields,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)} className="w-full">
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
                {errors.description && (
                  <span>{errors.description.message}</span>
                )}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Start Date and Time</FormLabel>
              <Input 
                type="datetime-local" 
                {...register("startDate")} 
              />
              <FormMessage>
                {errors.startDate && <span>{errors.startDate.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>End Date and Time</FormLabel>
              <Input 
                type="datetime-local" 
                {...register("endDate")} 
              />
              <FormMessage>
                {errors.endDate && <span>{errors.endDate.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Image</FormLabel>
              <ImageUpload name="image" />
              <FormMessage>
                {errors.image && <span>{errors.image.message}</span>}
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
