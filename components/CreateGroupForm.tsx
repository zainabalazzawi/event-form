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

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    mutation.mutate(fields);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Create a New Group</h2>
        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <FormItem className="mb-4">
              <FormLabel>Group Name</FormLabel>
              <Input {...register("name")} />
              <FormMessage>
                {errors.name && <span>{errors.name.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="mb-4">
              <FormLabel>About</FormLabel>
              <Textarea {...register("about")} />
              <FormMessage>
                {errors.about && <span>{errors.about.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Image</FormLabel>
              <ImageUpload {...register("image")} />
            </FormItem>

            <Button 
              type="submit" 
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Create Group"}
            </Button>
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
