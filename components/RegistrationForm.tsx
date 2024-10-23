"use client";

import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useFormStore } from "@/app/FormFieldsStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";

const ADD_ATTENDEE = gql`
  mutation AddAttendee($firstName: String!, $lastName: String!, $email: String!, $phone: String!, $attendanceState: String) {
    addAttendee(firstName: $firstName, lastName: $lastName, email: $email, phone: $phone, attendanceState: $attendanceState) {
      id
      firstName
      lastName
      email
      phone
      attendanceState
    }
  }
`;

const RegistrationForm = () => {
  const router = useRouter();
  const { setFormFields } = useFormStore();
  const queryClient = useQueryClient();
  const client = useApolloClient();

  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: "Name field is required",
    }),
    lastName: z.string().min(2, {
      message: "Last Name field is required",
    }),
    email: z
      .string()
      .min(2, {
        message: "Email field is required",
      })
      .email({ message: "Invalid email address" }),
    phone: z.coerce.number().min(2, {
      message: "Phone field is required",
    }),
    // options: z.enum(["BY_SOCIAL_MEDIA", "BY_OTHERS", "BY_ADS"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: undefined,
      // options: 'BY_SOCIAL_MEDIA'
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;



  const addAttendeeMutation = async (fields: z.infer<typeof formSchema>) => {
    const { data } = await client.mutate({
      mutation: ADD_ATTENDEE,
      variables: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        phone: fields.phone.toString(),
      },
    });
    return data.addAttendee;
  };

  const mutation = useMutation({
    mutationFn: addAttendeeMutation,
    onSuccess: (newAttendee) => {
      queryClient.invalidateQueries({ queryKey: ["attendees"] });
      setFormFields(newAttendee);
      setTimeout(() => {
      router.push("/ticket-page");
      }, 2000);
    },
    onError: (error) => {
      console.error("Something went wrong while submitting the form", error);
    },
  });

  const onHandleSubmit = (fields: z.infer<typeof formSchema>) => {
    mutation.mutate(fields);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="p-10 w-[50%]">
        <h1 className="font-semibold">Registration Attendee Event</h1>
        <Form {...form}>
          <form onSubmit={handleSubmit(onHandleSubmit)}>
            <FormItem className="my-5">
              <FormLabel>First Name</FormLabel>
              <Input {...register("firstName")} />
              <FormMessage>
                {errors.firstName && <span>{errors.firstName.message}</span>}
              </FormMessage>
            </FormItem>

            <FormItem className="my-5">
              <FormLabel>Last Name</FormLabel>
              <Input {...register("lastName")} />
              <FormMessage>
                {errors.lastName && <span>{errors.lastName.message}</span>}
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
              <FormLabel>Phone</FormLabel>
              <Input type="number" {...register("phone")} />
              <FormMessage>
                {errors.phone && <span>{errors.phone.message}</span>}
              </FormMessage>
            </FormItem>
            {/* 
            <Select {...register("options")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BY_SOCIAL_MEDIA">by social media</SelectItem>
                  <SelectItem value="BY_OTHERS">by others</SelectItem>
                  <SelectItem value="BY_ADS">by ads</SelectItem>
                </SelectContent>
              </Select> */}

            <Button type="submit" className="mt-6">
              Submit
            </Button>
          </form>
        </Form>

        {mutation.isSuccess && (
          <div className="mt-4 p-4 w-[80%] text-green-800 border border-green-800 rounded">
            Form successfully submitted! redirecting to ticket page...
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
