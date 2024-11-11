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

const CREATE_EVENT = gql`
  mutation CreateEvent(
    $title: String!
    $description: String!
    $date: String!
    $organizer: String!
    $email: String!
  ) {
    createEvent(
      title: $title
      description: $description
      date: $date
      organizer: $organizer
      email: $email
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
  const { data: session } = useSession();
  const [step, setStep] = useState(1);

  const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    date: z.string().min(1, { message: "Date is required" }),
    organizer: z.string().min(1, { message: "Organizer is required" }),
    email: z.string().min(1, { message: "Email is required" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      organizer: "",
      email: session?.user?.email || "",
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
        date: fields.date,
        organizer: fields.organizer,
        email: session.user.email,
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

  const handleNext = async () => {
    const fieldsToValidate = {
      1: ["title", "description"] as const,
      2: ["date", "organizer"] as const,
      3: ["email"] as const,
    }[step];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 3));
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
          </>
        );
      case 3:
        return (
          <FormItem className="my-5">
            <FormLabel>Email</FormLabel>
            <Input
              {...register("email")}
              value={session?.user?.email || ""}
              disabled
            />
            <FormMessage>
              {errors.email && <span>{errors.email.message}</span>}
            </FormMessage>
          </FormItem>
        );
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="p-10 w-[50%]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-semibold">Create Event - Step {step} of 3</h1>
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
            <div
              className={`h-2 w-12 rounded ${
                step >= 3 ? "bg-primary" : "bg-gray-200"
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

              {step < 3 ? (
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
