"use client";

import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useSession } from "next-auth/react";
import { ImageUpload } from "./ImageUpload";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!, $about: String!, $image: String) {
    createGroup(name: $name, about: $about, image: $image) {
      id
      name
      about
      createdAt
      organizerId
      organizerEmail
      memberCount
      image
    }
  }
`;

const CreateGroupForm = () => {
  const client = useApolloClient();
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);

  const formSchema = z.object({
    name: z.string().min(1, { message: "Name is required" }),
    about: z.string().min(1, { message: "About is required" }),
    image: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      about: "",
      image: "",
    },
  });

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = form;

  const createGroupMutation = async (fields: z.infer<typeof formSchema>) => {
    if (!session?.user?.email) return;

    const { data } = await client.mutate({
      mutation: CREATE_GROUP,
      variables: {
        name: fields.name,
        about: fields.about,
        image: fields.image,
      },
    });
    return data.createGroup;
  };

  const mutation = useMutation({
    mutationFn: createGroupMutation,
    onSuccess: (newGroup) => {
      router.push(`/groups/${newGroup.id}`);
    },
    onError: (error) => {
      console.error("Error creating group:", error);
    },
  });

  const handleNext = async (e: FormEvent<HTMLInputElement>) => {
    e.preventDefault(); 
    const fieldsToValidate = {
      1: ["name"] as const,
      2: ["about"] as const,
      3: ["image"] as const,
    }[step];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    mutation.mutate(fields);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <FormItem className="mb-4">
            <FormLabel>Group Name</FormLabel>
            <Input {...register("name")} placeholder="Enter your group name" />
            <FormMessage>
              {errors.name && <span>{errors.name.message}</span>}
            </FormMessage>
          </FormItem>
        );
      case 2:
        return (
          <FormItem className="mb-4">
            <FormLabel>About</FormLabel>
            <Textarea 
              {...register("about")} 
              placeholder="Tell us about your group"
              className="min-h-[200px]"
            />
            <FormMessage>
              {errors.about && <span>{errors.about.message}</span>}
            </FormMessage>
          </FormItem>
        );
      case 3:
        return (
          <FormItem className="mb-4">
            <FormLabel>Group Image</FormLabel>
            <ImageUpload {...register("image")} />
            <FormMessage>
              {errors.image && <span>{errors.image.message}</span>}
            </FormMessage>
          </FormItem>
        );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create a New Group</h2>
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
                <Button 
                  type="button"
                  onClick={handleNext}
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              )}
            </div>
          </form>
        </Form>

        {mutation.isSuccess && (
          <div className="mt-4 p-4 text-green-800 border border-green-800 rounded">
            Group created successfully!
          </div>
        )}

        {mutation.isError && (
          <div className="mt-4 p-4 text-red-800 border border-red-800 rounded">
            Error creating group. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroupForm;
