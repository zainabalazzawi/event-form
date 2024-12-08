import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const signupSchema = z.object({
  email: z
    .string()
    .min(2, {
      message: "Email field is required",
    })
    .email({ message: "Invalid email address" }),
  password: z.string().min(6, {
    message: "Password field is required and must be at least 6 characters",
  }),
  name: z.string().min(2, {
    message: "name field is required",
  }),
});

type SignupFormData = z.infer<typeof signupSchema>;

const SignupForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const signUpMutation = async (signupData: SignupFormData) => {
    const response = await axios.post("/api/auth/signup", signupData);
    if (response.status !== 200) {
      throw new Error(response.data.error);
    }
    return response.data;
  };

  const mutation = useMutation({
    mutationFn: signUpMutation,
    onSuccess: () => {
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    },
  });
  const onHandleSubmit = (signupData: SignupFormData) => {
    mutation.mutate(signupData);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onHandleSubmit)}>
        <FormItem className="my-5">
          <FormLabel>Name</FormLabel>
          <Input type="text" {...register("name")} />
          <FormMessage>
            {errors.name && <span>{errors.name.message}</span>}
          </FormMessage>
        </FormItem>
        <FormItem className="my-5">
          <FormLabel>Email</FormLabel>
          <Input {...register("email")} />
          <FormMessage>
            {errors.email && <span>{errors.email.message}</span>}
          </FormMessage>
        </FormItem>

        <FormItem className="my-5">
          <FormLabel>Password</FormLabel>
          <Input type="password" {...register("password")} />
          <FormMessage>
            {errors.password && <span>{errors.password.message}</span>}
          </FormMessage>
        </FormItem>

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Signing up..." : "Sign up"}
        </Button>

        {mutation.isError && (
          <div className="mt-4 p-4 text-red-800 border border-red-800 rounded text-center">
            User with this email already exists
          </div>
        )}
        {mutation.isSuccess && (
          <div className="mt-4 p-4 text-green-800 border border-green-800 rounded text-center">
            Account created successfully!
          </div>
        )}
      </form>
    </Form>
  );
};
export default SignupForm;
