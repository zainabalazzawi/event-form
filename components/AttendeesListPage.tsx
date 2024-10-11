"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
};

const getAttendees = async () => {
  const { data } = await axios.get("/api/attendees");
  return data
};

const AttendeesList = () => {
  const { data, isLoading, isError, error } = useQuery<Attendee[]>({
    queryKey: ["attendees"],
    queryFn: getAttendees,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  const attendees = data;
  return (
    <div className="flex items-center justify-center">
      <div className="mt-10 p-5 border border-gray-300 rounded w-[50%]">
        <h2 className="text-xl font-semibold mb-4">List of Attendees</h2>
        {attendees && attendees.length > 0 ? (
          <div>
            {attendees.map((attendee, id) => (
              <div key={id} className="mb-4 border border-gray-300 rounded p-5">
                <div className="font-semibold ">
                  First Name:{" "}
                  <span className="font-light">{attendee.firstName}</span>
                </div>
                <div className="font-semibold">
                  Last Name:{" "}
                  <span className="font-light">{attendee.lastName}</span>
                </div>
                <div className="font-semibold">
                  Email: <span className="font-light">{attendee.email}</span>
                </div>
                <div className="font-semibold">
                  Phone: <span className="font-light">{attendee.phone}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No attendees found.</p>
        )}
      </div>
    </div>
  );
};

export default AttendeesList;
