"use client";

import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { useRouter } from "next/navigation";

const CREATE_EVENT = gql`
  mutation CreateEvent(
    $title: String!
    $description: String!
    $startDate: String!
    $endDate: String!
    $organizer: String!
    $email: String!
    $image: String
  ) {
    createEvent(
      title: $title
      description: $description
      startDate: $startDate
      endDate: $endDate
      organizer: $organizer
      email: $email
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

const CreateEventForm = () => {
  const client = useApolloClient();
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);

  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    startDate: z.string().min(1, { message: "Start date is required" }),
    endDate: z.string().min(1, { message: "End date is required" }),
    organizer: z.string().min(1, { message: "Organizer is required" }),
    email: z.string().min(1, { message: "Email is required" }),
    image: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      organizer: "",
      email: session?.user?.email || "",
      image: "",
    },
  });

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = form;

  const createEventMutation = async (fields: z.infer<typeof formSchema>) => {
    if (!session?.user?.email) return;

    const { data } = await client.mutate({
      mutation: CREATE_EVENT,
      variables: {
        title: fields.title,
        description: fields.description,
        startDate: fields.startDate,
        endDate: fields.endDate,
        organizer: fields.organizer,
        email: session.user.email,
        image: fields.image,
      },
    });
    return data.createEvent;
  };

  const mutation = useMutation({
    mutationFn: createEventMutation,
    onSuccess: (newEvent) => {
      console.log("Event created successfully:", newEvent);  
      router.push(`/events/${newEvent.id}`);

    },
    onError: (error) => {
      console.error("Error creating event:", error);
    },
  });

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    mutation.mutate(fields);
  };

  const handleNext = async () => {
    const fieldsToValidate = {
      1: ["title", "description", "image"] as const,
      2: ["startDate", "endDate","organizer"] as const,
    }[step];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
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
          </>
        );
      case 2:
        return (
          <>
            <FormItem className="my-5">
              <FormLabel>Image</FormLabel>
              <ImageUpload {...register("image")} />
            </FormItem>
            <FormItem className="my-5">
              <FormLabel>Event Date and Time</FormLabel>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <FormLabel className="text-sm text-gray-500">Start</FormLabel>
                    <Input 
                      type="datetime-local" 
                      {...register("startDate")} 
                      className="mt-1"
                    />
                    <FormMessage>
                      {errors.startDate && <span>{errors.startDate.message}</span>}
                    </FormMessage>
                  </div>
                  
                  <div className="flex-1">
                    <FormLabel className="text-sm text-gray-500">End</FormLabel>
                    <Input 
                      type="datetime-local" 
                      {...register("endDate")} 
                      className="mt-1"
                    />
                    <FormMessage>
                      {errors.endDate && <span>{errors.endDate.message}</span>}
                    </FormMessage>
                  </div>
                </div>
              </div>
            </FormItem>
            <FormItem className="my-5">
              <FormLabel>Organizer</FormLabel>
              <Input {...register("organizer")} />
              <FormMessage>
                {errors.organizer && <span>{errors.organizer.message}</span>}
              </FormMessage>
            </FormItem>
          </>
        );
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="p-10 w-[50%]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-semibold">Create Event</h1>
          <div className="flex gap-2">
            <div
              className={`h-2 w-12 rounded ${
                step >= 1 ? "bg-primary" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-2 w-12 rounded ${
                step >= 2 ? "bg-primary" : "bg-gray-200"
              }`}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)}>
            {renderStep()}

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {step < 2 ? (
                <Button type="button" onClick={handleNext}>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit">Create Event</Button>
              )}
            </div>
          </form>
        </Form>

        {mutation.isSuccess && (
          <div className="mt-4 p-4 text-green-800 border border-green-800 rounded">
            Event created successfully!
          </div>
        )}

        {mutation.isError && (
          <div className="mt-4 p-4 text-red-800 border border-red-800 rounded">
            Error creating event. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateEventForm;
