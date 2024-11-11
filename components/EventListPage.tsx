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

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
  attendeeCount: number;
  email: string;  
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
    <div>
      {eventsLoading && <div>Loading...</div>}
      {eventsError && <div>Error loading events</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const subscription = subscriptions?.find(
              (s) => s.eventId === event.id
            );
            return (
              <div
                key={event.id}
                className="mb-4 border border-gray-300 rounded p-5"
              >
                <div className="font-semibold">
                  Title: <span className="font-light">{event.title}</span>
                </div>
                <div className="font-semibold">
                  Description:
                  <span className="font-light">{event.description}</span>
                </div>
                <div className="font-semibold">
                  Date:
                  <span className="font-light">{formatDate(event.date)}</span>
                </div>
                <div className="font-semibold">
                  Organizer:
                  <span className="font-light">{event.organizer}</span>
                </div>
                <div className="font-semibold mt-2">
                  Attendees:
                  <span className="font-light"> {event.attendeeCount}</span>
                </div>

                {userId && (
                  <div className="mt-4">

                    {session?.user?.email?.toLowerCase() === event.email?.toLowerCase() && (
                    <Button
                      onClick={() => setEditingEvent(event)}
                      variant="outline"
                      className="mt-2"
                    >
                      Edit Event
                    </Button>)}
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
                <div className="text-[#649C9E] font-semibold mt-4">
                  <Link href={`/events/${event.id}`}>See event details</Link>
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
