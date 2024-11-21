"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { useRouter } from "next/navigation";
import SignInDialog from "./SignInDialog";
import { useSearchStore } from "@/store/searchStore";
import { formatDate } from "@/lib/utils";
import EditEventForm from "./EditEventForm";
import { Calendar, CircleCheck, Pencil } from "lucide-react";
import Image from "next/image";

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
  attendeeCount: number;
  email: string;
  image: string;
};

type Subscription = {
  id: number;
  userId: number;
  eventId: number;
  status: string;
};

const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      title
      description
      date
      organizer
      attendeeCount
      email
      image
    }
  }
`;

const GET_SUBSCRIPTIONS = gql`
  query Getsubscriptions($userId: Int!) {
    subscriptions(userId: $userId) {
      id
      userId
      eventId
      status
    }
  }
`;

const JOIN_EVENT = gql`
  mutation JoinEvent($userId: Int!, $eventId: Int!) {
    joinEvent(userId: $userId, eventId: $eventId) {
      id
      userId
      eventId
      status
    }
  }
`;

const UPDATE_JOIN_STATUS = gql`
  mutation UpdateJoinStatus($id: Int!, $status: String!) {
    updateJoinStatus(id: $id, status: $status) {
      id
      userId
      eventId
      status
    }
  }
`;

const getEvents = async (client: any) => {
  const { data } = await client.query({
    query: GET_EVENTS,
  });
  return data.events;
};

const getSubscriptions = async (client: any, userId: number) => {
  const { data } = await client.query({
    query: GET_SUBSCRIPTIONS,
    variables: { userId },
  });
  return data.subscriptions;
};

const EventListPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const {
    data: subscriptions,
    isLoading: subscriptionsLoading,
    isError: subscriptionsError,
  } = useQuery<Subscription[]>({
    queryKey: ["subscriptions", userId],
    queryFn: () => getSubscriptions(client, userId!),
    enabled: !!userId,
  });

  const joinEventMutation = useMutation({
    mutationFn: async (variables: { userId: number; eventId: number }) => {
      const { data } = await client.mutate({
        mutation: JOIN_EVENT,
        variables,
      });
      return data.joinEvent;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["subscriptions", userId],
        (old: Subscription[] = []) => [...old, data]
      );
    },
  });

  const updateJoinStatusMutation = useMutation({
    mutationFn: async (variables: { id: number; status: string }) => {
      const { data } = await client.mutate({
        mutation: UPDATE_JOIN_STATUS,
        variables,
      });
      return data.updateJoinStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", userId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  if (eventsLoading || subscriptionsLoading) {
    return <div>Loading...</div>;
  }

  if (eventsError || subscriptionsError) {
    return <div>Error: Unable to load events. Please try again later.</div>;
  }

  const handleJoinEvent = async (eventId: number) => {
    if (userId) {
      try {
        await joinEventMutation.mutateAsync({ userId, eventId });
      } catch (error) {
        console.error("Error joining event:", error);
      }
    }
  };

  const handleUpdateStatus = (subscriberId: number, newStatus: string) => {
    updateJoinStatusMutation.mutate({ id: subscriberId, status: newStatus });
  };

  return (
    <div className="px-8 mt-8">
      {eventsLoading && <div>Loading...</div>}
      {eventsError && <div>Error loading events</div>}
      <div className="grid grid-cols-4 gap-4">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const subscription = subscriptions?.find(
              (s) => s.eventId === event.id
            );
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
                  <div className="flex felx-row items-center gap-3">
                    <Calendar size={15} className="text-gray-600" />
                    <span className="font-light">
                      {" "}
                      {formatDate(event.date)}
                    </span>
                  </div>
                  <div className="flex felx-row items-center gap-3">
                    <CircleCheck size={15} className="text-gray-600" />
                    <span className="font-light">
                      {" "}
                      {event.attendeeCount} going
                    </span>
                  </div>
                  {userId && (
                    <div className="mt-4">
                      {subscription ? (
                        <div className="flex space-x-2">
                          <Toggle
                            pressed={subscription.status === "join"}
                            onClick={() =>
                              handleUpdateStatus(subscription.id, "join")
                            }
                            variant="outline"
                          >
                            Join
                          </Toggle>
                          <Toggle
                            pressed={subscription.status === "maybe"}
                            onClick={() =>
                              handleUpdateStatus(subscription.id, "maybe")
                            }
                            variant="outline"
                          >
                            Maybe
                          </Toggle>
                          <Toggle
                            pressed={subscription.status === "cancel"}
                            onClick={() =>
                              handleUpdateStatus(subscription.id, "cancel")
                            }
                            variant="outline"
                          >
                            Cancel
                          </Toggle>
                        </div>
                      ) : (
                        <Button onClick={() => handleJoinEvent(event.id)}>
                          Join Event
                        </Button>
                      )}
                    </div>
                  )}
                  {!userId && (
                    <SignInDialog>
                      <Button className="mt-3">Join Event</Button>
                    </SignInDialog>
                  )}
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
