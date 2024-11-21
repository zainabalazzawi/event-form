"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import JoinEventButton from "@/components/JoinEventButton";

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
    <div className="bg-slate-50 h-screen">
      <div className="w-full bg-white 0 px-[4rem] py-3 mb-20 shadow-md">
        <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
        <div>Host by</div>
        <p className="font-semibold">{event.organizer}</p>
      </div>

      <div className="flex flex-row mx-[10rem] w-[80%] justify-between">
        <div className="flex flex-col">
          <div className="mb-4">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
          </div>

          <div>
            <h2 className="font-bold">Details</h2>
            <p>{event.description}</p>
          </div>
        </div>

        <Card className="p-6 w-[30%]">
          <CardContent className="flex flex-row gap-5">
            <Clock />
            <p>{formatDate(event.date)}</p>
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex flex-col items-start  gap-4">
            <span className="text-slate-600">{formatDate(event.date)}</span>
            <h3 className="font-semibold text-lg">{event.title}</h3>
          </div>
          <JoinEventButton eventId={event.id} />
        </div>
      </div>
    </div>
  );
}
