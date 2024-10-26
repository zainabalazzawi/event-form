"use client";
import React from "react";
import {  useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
  isRsvped?: boolean;
  rsvpStatus?: string;
};

const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      description
      date
      organizer
    }
  }
`;


const getEvents = async (client: any) => {
  const { data } = await client.query({
    query: GET_EVENTS,
  });
  return data.events;
};

const formatDate = (dateString: string) => {
  let date = new Date(dateString);

  if (isNaN(date.getTime())) {
    date = new Date(parseInt(dateString));
  }

  if (isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const EventListPage = () => {
  const client = useApolloClient();
  const {
    data: events,
    isLoading,
    isError,
    error,
  } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: () => getEvents(client),
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
        <h2 className="text-xl font-semibold mb-4">List of Events</h2>
        {events && events.length > 0 ? (
          <div>
            {events.map((event) => (
              <div
                key={event.id}
                className="mb-4 border border-gray-300 rounded p-5"
              >
                <div className="font-semibold">
                  Title: <span className="font-light">{event.title}</span>
                </div>
                <div className="font-semibold">
                  Description:{" "}
                  <span className="font-light">{event.description}</span>
                </div>
                <div className="font-semibold">
                  Date:{" "}
                  <span className="font-light">{formatDate(event.date)}</span>
                </div>
                <div className="font-semibold">
                  Organizer:{" "}
                  <span className="font-light">{event.organizer}</span>
                </div>
          
                <div className="text-[#649C9E] font-semibold mt-4">
                  <Link href={`/events/${event.id}`}>See event details</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </div>
  );
};

export default EventListPage;
