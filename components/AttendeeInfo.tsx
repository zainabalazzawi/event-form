"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CornerDownLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
};

const getAttendee = async (id: number) => {
  const { data } = await axios.get(`/api/attendees/${id}`);
  return data;
};

type AttendeeProps = {
  id: number;
};

const AttendeeInfo = ({ id }: AttendeeProps) => {
  const router = useRouter();
  const { data, isLoading, isError, error } = useQuery<Attendee>({
    queryKey: ["attendee", id],
    queryFn: () => getAttendee(id),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  const attendee = data;
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
