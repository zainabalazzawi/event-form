"use client";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegistrationForm = () => {
  const [submittedFields, setSubmittedField] = useState<z.infer<
    typeof formSchema
  > | null>(null);


  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: "This field is required",
    }),
    sirName: z.string().min(2, {
      message: "This field is required",
    }),
    email: z
      .string()
      .min(2, {
        message: "This field is required",
      })
      .email({ message: "Invalid email address" }),
    phone: z.coerce.number().min(2, {
      message: "This field is required",
    }),
    options: z.enum(["BY_SOCIAL_MEDIA", "BY_OTHERS", "BY_ADS"]),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      sirName: "",
      email: "",
      phone: undefined,
      options: 'BY_SOCIAL_MEDIA'
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const onHandleSubmit = async (fields: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("http://localhost:3000", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      });

      if (!response.ok) {
        throw new Error("Failed to submit the form");
      }
      const data = await response; //.json(); // need to check why get SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
      console.log("form was successfully submitted", data);

      setSubmittedField(fields);
    } catch (error) {
      console.log("something wrong happened while filling in the form", error);
    }
  };
  return (
    <div>
      <div className="p-10 w-[50%]">
        <h1>Registration Attendee Event</h1>
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
              <FormLabel>Sir Name</FormLabel>
              <Input {...register("sirName")} />
              <FormMessage>
                {errors.sirName && <span>{errors.sirName.message}</span>}
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

            <Select {...register("options")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BY_SOCIAL_MEDIA">by social media</SelectItem>
                  <SelectItem value="BY_OTHERS">by others</SelectItem>
                  <SelectItem value="BY_ADS">by ads</SelectItem>
                </SelectContent>
              </Select>

            <Button type="submit" className="mt-6">
              Submit
            </Button>
          </form>
        </Form>

        {submittedFields && (
          <div className="mt-10 p-5 border border-gray-300 rounded">
            <h2 className="text-xl font-semibold mb-4">
              ticket of attendee event
            </h2>
            <p className="font-semibold">
              first Name:
              <span className="font-light">{submittedFields.firstName}</span>
            </p>
            <p className="font-semibold">
              sir Name:
              <span className="font-light">{submittedFields.sirName}</span>
            </p>
            <p className="font-semibold">
              email: <span className="font-light">{submittedFields.email}</span>
            </p>
            <p className="font-semibold">
              phone: <span className="font-light">{submittedFields.phone}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationForm;
