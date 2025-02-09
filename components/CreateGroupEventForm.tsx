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
import { Textarea } from "./ui/textarea";
import { DateTimePicker } from "./ui/date-time-picker";
import { Card, CardContent } from "./ui/card";

const CREATE_GROUP_EVENT = gql`
  mutation CreateGroupEvent(
    $groupId: Int!
    $title: String!
    $description: String!
    $startDate: String!
    $endDate: String!
    $organizer: String!
    $email: String!
    $image: String
  ) {
    createGroupEvent(
      groupId: $groupId
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

const CreateGroupEventForm = ({
  groupId,
  onSuccess,
}: {
  groupId: number;
  onSuccess?: () => void;
}) => {
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
    setValue,
    watch,
    formState: { errors },
  } = form;

  const createEventMutation = async (fields: z.infer<typeof formSchema>) => {
    if (!session?.user?.email) return;

    const { data } = await client.mutate({
      mutation: CREATE_GROUP_EVENT,
      variables: {
        groupId,
        title: fields.title,
        description: fields.description,
        startDate: fields.startDate,
        endDate: fields.endDate,
        organizer: fields.organizer,
        email: session.user.email,
        image: fields.image,
      },
    });
    return data.createGroupEvent;
  };

  const mutation = useMutation({
    mutationFn: createEventMutation,
    onSuccess: (newEvent) => {
      console.log("Event created successfully:", newEvent);
      onSuccess?.();
      router.push(`/groups/${groupId}/events/${newEvent.id}`);
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
      2: ["startDate", "endDate", "organizer"] as const,
    }[step];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );
      setValue("startDate", localDate.toISOString(), { shouldValidate: true });
    }
  };
  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );
      setValue("endDate", localDate.toISOString(), { shouldValidate: true });
    }
  };

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  console.log("startDate", startDate);

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
              <Textarea {...register("description")} />
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
                    <FormLabel className="text-sm text-gray-500">
                      Start Date and Time
                    </FormLabel>
                    <DateTimePicker
                      value={startDate ? new Date(startDate) : undefined}
                      onChange={handleStartDateChange}
                    />
                    <FormMessage>
                      {errors.startDate && (
                        <span>{errors.startDate.message}</span>
                      )}
                    </FormMessage>
                  </div>

                  <div className="flex-1">
                    <FormLabel className="text-sm text-gray-500">
                      End Date and Time
                    </FormLabel>
                    <DateTimePicker
                      value={endDate ? new Date(endDate) : undefined}
                      onChange={handleEndDateChange}
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
    <Card className="p-6">
      <CardContent className="">
        <div className="flex items-center justify-center">
          <div className="p-10 w-[90%]">
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
                {mutation.error?.message === "Failed to create group event"
                  ? "You do not have permission to create events in this group. Only group admins can create events."
                  : mutation.error?.message ||
                    "Error creating event. Please try again."}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateGroupEventForm;
