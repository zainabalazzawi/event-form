"use client";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchStore } from "@/store/searchStore";
import { formatTimeRange } from "@/lib/utils";
import EditEventForm from "./EditEventForm";
import { Calendar, CircleCheck, Pencil } from "lucide-react";
import Image from "next/image";
import JoinEventButton from "./JoinEventButton";

type Event = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizer: string;
  attendeeCount: number;
  email: string;
  image: string;
};

const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      description
      startDate
      endDate
      organizer
      attendeeCount
      email
      image
    }
  }
`;

const getEvents = async (client: any) => {
  const { data } = await client.query({
    query: GET_EVENTS,
  });
  return data.events;
};

const EventListPage = () => {
  const client = useApolloClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const { searchQuery } = useSearchStore();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const {
    data: events,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useQuery<Event[]>({
    queryKey: ["events"],
    queryFn: () => getEvents(client),
  });

  const filteredEvents = events?.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (eventsLoading) {
    return <div>Loading...</div>;
  }

  if (eventsError) {
    return <div>Error: Unable to load events. Please try again later.</div>;
  }

  return (
    <div className="px-8 mt-8 pb-6">
      {eventsLoading && <div>Loading...</div>}
      {eventsError && <div>Error loading events</div>}
      <div className="grid grid-cols-4 gap-4">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            return (
              <div
                key={event.id}
                className="mb-4 border border-gray-300 rounded-lg"
              >
                <div className="mb-4 w-full h-48 bg-neutral-200 rounded-t-lg">
                  {event.image && (
                    <Image
                      src={event.image}
                      alt={event.title}
                      width={300}
                      height={150}
                      className="object-cover h-48 w-full rounded-t-lg"
                    />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-row gap-2 items-center font-semibold hover:text-[#649C9E] hover:underline">
                    <Link href={`/events/${event.id}`}>
                      <span className="font-bold text-xl">{event.title}</span>
                    </Link>
                    {userId &&
                      session?.user?.email?.toLowerCase() ===
                        event.email?.toLowerCase() && (
                        <Pencil
                          size={15}
                          onClick={() => setEditingEvent(event)}
                          className="cursor-pointer"
                        />
                      )}
                  </div>
                  <div className="text-base text-slate-600 font-semibold">
                    Hosted by:&nbsp;{event.organizer}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Calendar size={15} className="text-gray-600" />
                    <span className="font-medium">
                      {formatTimeRange(event.startDate, event.endDate).date}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formatTimeRange(event.startDate, event.endDate).time}
                    </span>
                  </div>
                  <div className="flex felx-row items-center gap-3">
                    <CircleCheck size={15} className="text-gray-600" />
                    <span className="font-light">
                      {event.attendeeCount} going
                    </span>
                  </div>
                  <div className="mt-4">
                    {" "}
                    <JoinEventButton eventId={event.id} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div>No events found</div>
        )}
      </div>
      {editingEvent && (
        <EditEventForm
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};

export default EventListPage;
