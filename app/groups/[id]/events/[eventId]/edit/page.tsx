"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams, useRouter } from "next/navigation";
import EditEventForm from "@/components/EditEventForm";
import { Button } from "@/components/ui/button";
import { CornerDownLeft } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";

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

  if (isLoading) {
    return (
      <LoadingState
        text='Loading'
        iconSize={64}
        className="animate-spin text-[#649C9E]"
      />
    ) }
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        <Button onClick={() => router.push(`/groups/${groupId}/events`)}  className="mr-2">
          <CornerDownLeft size={18} />
        </Button>
        Edit Event
      </h1>
      <EditEventForm
        event={event}
        onSuccess={() => router.push(`/groups/${groupId}/events`)}
      />
    </div>
  );
}
