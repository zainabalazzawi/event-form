import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ImageUpload } from "./ImageUpload";

const UPDATE_GROUP = gql`
  mutation UpdateGroup(
    $id: Int!
    $name: String
    $about: String
    $image: String
  ) {
    updateGroup(id: $id, name: $name, about: $about, image: $image) {
      id
      name
      about
      image
      organizerId
      organizerEmail
      memberCount
    }
  }
`;

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  about: z.string().min(1, { message: "About is required" }),
  image: z.string().optional(),
});

type EditGroupFormProps = {
  group: {
    id: number;
    name: string;
    about: string;
    image?: string;
  };
  isOpen: boolean;
  onClose: () => void;
};

const EditGroupForm = ({ group, isOpen, onClose }: EditGroupFormProps) => {
  const client = useApolloClient();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: group.name,
      about: group.about,
      image: group.image || "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const updateGroupMutation = useMutation({
    mutationFn: async (fields: z.infer<typeof formSchema> & { id: number }) => {
      const { data } = await client.mutate({
        mutation: UPDATE_GROUP,
        variables: {
          id: fields.id,
          name: fields.name,
          about: fields.about,
          image: fields.image,
        },
      });
      return data.updateGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      onClose();
    },
  });

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    updateGroupMutation.mutate({
      id: group.id,
      ...fields,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)} className="w-full">
            <FormItem className="my-5">
              <FormLabel>Name</FormLabel>
              <Input {...register("name")} />
              <FormMessage>
                {errors.name && <span>{errors.name.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>About</FormLabel>
              <Textarea {...register("about")} />
              <FormMessage>
                {errors.about && <span>{errors.about.message}</span>}
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
              Update Group
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupForm;
