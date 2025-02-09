"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import EditEventForm from "@/components/EditEventForm";

const GET_EVENT_BY_ID = gql`
  query GetEventById($id: Int!) {
    event(id: $id) {
      id
      title
      description
      startDate
      endDate
      organizer
      image
    }
  }
`;

export default function EditEventPage() {
  const params = useParams();
  const client = useApolloClient();
  const router = useRouter();
  const eventId = parseInt(params.eventId as string);
  const groupId = parseInt(params.id as string);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const { data } = await client.query({
        query: GET_EVENT_BY_ID,
        variables: { id: eventId },
      });
      return data.event;
    },
  });


  if (isLoading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;


  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EditEventForm
        event={event}
        onSuccess={() => router.push(`/groups/${groupId}/events`)}
      />
    </div>
  );
}