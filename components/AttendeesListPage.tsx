"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";

type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
};

const GET_ATTENDEES = gql`
  query GetAttendees {
    attendees {
      id
      firstName
      lastName
      email
      phone
      attendanceState
    }
  }
`;

const getAttendees = async (client: any) => {
  const { data } = await client.query({
    query: GET_ATTENDEES,
  });
  return data.attendees;
};

const AttendeesList = () => {
  const client = useApolloClient();
  const {
    data: attendees,
    isLoading,
    isError,
    error,
  } = useQuery<Attendee[]>({
    queryKey: ["attendees"],
    queryFn: () => getAttendees(client),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="flex items-center justify-center">
      <div className="mt-10 p-5 border border-gray-300 rounded w-[50%]">
        <h2 className="text-xl font-semibold mb-4">List of Attendees</h2>
        {attendees && attendees.length > 0 ? (
          <div>
            {attendees.map((attendee) => (
              <div
                key={attendee.id}
                className="mb-4 border border-gray-300 rounded p-5"
              >
                <div className="font-semibold ">
                  First Name:
                  <span className="font-light">{attendee.firstName}</span>
                </div>
                <div className="font-semibold">
                  Last Name:
                  <span className="font-light">{attendee.lastName}</span>
                </div>
                <div className="font-semibold">
                  Email: <span className="font-light">{attendee.email}</span>
                </div>

                <div className="text-[#649C9E] font-semibold mt-4">
                  <Link href={`/attendees-list/${attendee.id}`}>
                    see info of attendee
                  </Link>
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
