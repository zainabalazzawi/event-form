"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const GET_EVENT_BY_ID = gql`
  query GetEventById($id: Int!) {
    event(id: $id) {
      id
      title
      description
      date
      organizer
      image
    }
  }
`;

const getEventById = async (client: any, id: number) => {
  const { data } = await client.query({
    query: GET_EVENT_BY_ID,
    variables: { id },
  });
  return data.event;
};

export default function EventPage() {
  const params = useParams();
  const client = useApolloClient();
  const eventId = parseInt(params.id as string);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(client, eventId),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading event</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      {event.image && (
        <div className="mb-4">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Description:</h2>
          <p>{event.description}</p>
        </div>
        <div>
          <h2 className="font-semibold">Date:</h2>
          <p>{formatDate(event.date)}</p>
        </div>
        <div>
          <h2 className="font-semibold">Organizer:</h2>
          <p>{event.organizer}</p>
        </div>
      </div>

      <div className="text-[#649C9E] font-semibold mt-4">
        <Link href={`/events`}>Back to event list</Link>
      </div>
    </div>
  );
}
