"use client";

import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";

const CREATE_EVENT = gql`
  mutation CreateEvent(
    $title: String!,
    $description: String!,
    $date: String!,
    $organizer: String!,
  ) {
    createEvent(
      title: $title,
      description: $description,
      date: $date,
      organizer: $organizer,
    ) {
      id
      title
      description
      date
      organizer
    }
  }
`;
const CreateEventForm = () => {
  const client = useApolloClient();

  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    date: z.string().min(1, { message: "Date is required" }),
    organizer: z.string().min(1, { message: "Organizer is required" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      organizer: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const createEventMutation = async (fields: z.infer<typeof formSchema>) => {
    const { data } = await client.mutate({
      mutation: CREATE_EVENT,
      variables: {
        title: fields.title,
        description: fields.description,
        date: fields.date,
        organizer: fields.organizer,
      },
    });
    return data.createEvent;
  };


  
  const mutation = useMutation({
    mutationFn: createEventMutation,
    onSuccess: (newEvent) => {
      console.log("Event created successfully:", newEvent);
    },
    onError: (error) => {
      console.error("Error creating event:", error);
    },
  });

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    mutation.mutate(fields);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="p-10 w-[50%]">
        <h1 className="font-semibold">Create Event</h1>
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
                {errors.description && (
                  <span>{errors.description.message}</span>
                )}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Date</FormLabel>
              <Input type="date" {...register("date")} />
              <FormMessage>
                {errors.date && <span>{errors.date.message}</span>}
              </FormMessage>
            </FormItem>
            <FormItem className="my-5">
              <FormLabel>Organizer</FormLabel>
              <Input {...register("organizer")} />
              <FormMessage>
                {errors.organizer && <span>{errors.organizer.message}</span>}
              </FormMessage>
            </FormItem>
            <Button type="submit" className="mt-6">
              Create Event
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateEventForm;
