"use client";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { CornerDownLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useSession } from "next-auth/react";

type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
  attendanceState: string;
};

const GET_ATTENDEE = gql`
  query GetAttendee($id: Int!) {
    attendee(id: $id) {
      id
      firstName
      lastName
      email
      phone
      attendanceState
    }
  }
`;

const UPDATE_ATTENDANCE_STATE = gql`
  mutation UpdateAttendanceState($id: Int!, $attendanceState: String!) {
    updateAttendanceState(id: $id, attendanceState: $attendanceState) {
      id
      attendanceState
    }
  }
`;

type AttendeeProps = {
  id: number;
};
const AttendeeInfo = ({ id }: AttendeeProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const client = useApolloClient();

  const getAttendee = async () => {
    const { data } = await client.query({
      query: GET_ATTENDEE,
      variables: { id },
    });
    return data.attendee;
  };
  const updateAttendanceState = async (newState: string) => {
    const { data } = await client.mutate({
      mutation: UPDATE_ATTENDANCE_STATE,
      variables: { id, attendanceState: newState },
    });
    return data.updateAttendanceState;
  }

  const {
    data: attendee,
    isLoading,
    isError,
    error,
  } = useQuery<Attendee>({
    queryKey: ["attendee", id],
    queryFn: getAttendee,
  });

  const form = useForm({
    defaultValues: {
      attendanceState: attendee?.attendanceState || "ATTENDING",
    },
  });
  const { control, handleSubmit } = form;
  const mutation = useMutation({
    mutationFn: updateAttendanceState,
    onSuccess: () => {   
      queryClient.invalidateQueries({ queryKey: ["attendee", id] });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  const onSubmit = (data: { attendanceState: string }) => {
    mutation.mutate(data.attendanceState);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="mt-10 p-5 border border-gray-300 rounded w-[50%]">
        <h2 className="text-xl font-semibold mb-4">Attendee Details</h2>
        {attendee ? (
          <div className="mb-4 border border-gray-300 rounded p-5">
            <div className="font-semibold ">
              First Name:
              <span className="font-light">{attendee.firstName}</span>
            </div>
            <div className="font-semibold">
              Last Name: <span className="font-light">{attendee.lastName}</span>
            </div>
            <div className="font-semibold">
              Email: <span className="font-light">{attendee.email}</span>
            </div>
            {session && session.user?.email === attendee.email && (
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                  <FormField
                    control={control}
                    name="attendanceState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attendance State</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Attending" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ATTENDING">Attending</SelectItem>
                            <SelectItem value="NOT_ATTENDING">
                              Not Attending
                            </SelectItem>
                            <SelectItem value="MAYBE">Maybe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="mt-4">
                    Update Attendance
                  </Button>
                </form>
              </Form>
            )}
          </div>
        ) : (
          <p>No attendee found.</p>
        )}

        <div className="flex flex-row items-center gap-2">
          <Button
            onClick={() => {
              router.push("/attendees-list");
            }}
          >
            <CornerDownLeft size={20} />
          </Button>
          <div className="font-semibold"> Back to attendees list</div>
        </div>
      </div>
    </div>
  );
};

export default AttendeeInfo;
