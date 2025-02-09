"use client";

import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { useParams } from "next/navigation";
import { formatTimeRange } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import JoinEventButton from "@/components/JoinEventButton";
import Comments from "@/components/Comments";
import { DataTable } from "@/components/ui/data-table";
import { eventMemberColumns } from "./eventMemberColumns.const";
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
const GET_EVENT_MEMBERS = gql`
  query GetEventMembers($eventId: Int!) {
    eventMembers(eventId: $eventId) {
      members {
        id
        name
        role
        status
        image
      }
      pageSize
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

const getEventMembers = async (client: any, eventId: number) => {
  const { data } = await client.query({
    query: GET_EVENT_MEMBERS,
    variables: { eventId },
  });
  return data.eventMembers;
};

export default function EventPage() {
  const params = useParams();
  const client = useApolloClient();
  const eventId = parseInt(params.eventId as string);

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(client, eventId),
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["eventMembers", eventId],
    queryFn: () => getEventMembers(client, eventId),
  });

  if (isLoading) {
    return (
      <LoadingState
        text='Loading group detail'
        iconSize={64}
        className="animate-spin text-[#649C9E]"
      />
    ) }  if (isError) return <div>Error loading event</div>;
  if (!event) return <div>Event not found</div>;

  return (
    <div className="bg-slate-50 h-full pb-[10rem]">
      <div className="w-full bg-white 0 px-[4rem] py-3 mb-20 shadow-md">
        <h1 className="text-2xl font-bold mb-4">{event.title}</h1>
        <div>Host by</div>
        <p className="font-semibold">{event.organizer}</p>
      </div>

      <div className="flex flex-row mx-[10rem] w-[80%] justify-between">
        <div className="flex flex-col w-[50%]">
          <div className="mb-4">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
          </div>

          <div className="w-full">
            <h2 className="font-bold">Details</h2>
            <p>{event.description}</p>
            <Comments eventId={event.id} />
            <div>
            <h2 className="font-bold mb-4">Attendees</h2>
            <DataTable
              columns={eventMemberColumns}
              data={membersData?.members || []}
              pageSize={membersData?.pageSize}
            />
          </div>
          </div>
        </div>

        <Card className="p-6 w-[30%] h-[30%]">
          <CardContent className="flex flex-row items-center gap-5">
            <Clock size={20} className="text-gray-400" />
            <div className="flex flex-col text-sm">
              <span className="font-normal">
                {formatTimeRange(event.startDate, event.endDate).date}
              </span>
              <span className=" text-gray-600">
                {formatTimeRange(event.startDate, event.endDate).time}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex flex-col items-start  gap-1">
            <span className="text-slate-600">
              {formatTimeRange(event.startDate, event.endDate, true).date}
            </span>
            <h3 className="font-semibold text-lg">{event.title}</h3>
          </div>
          <JoinEventButton eventId={event.id} />
        </div>
      </div>
    </div>
  );
}
