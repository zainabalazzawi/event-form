"use client";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchStore } from "@/store/searchStore";
import { formatTimeRange } from "@/lib/utils";
import {
  Calendar,
  CircleCheck,
  Pencil,
  Plus,
  LoaderCircleIcon,
  Trash2,
  Clock,
} from "lucide-react";
import Image from "next/image";
import JoinEventButton from "./JoinEventButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import CreateGroupEventForm from "./CreateGroupEventForm";
import { useRouter } from "next/navigation";
import { LoadingState } from "./LoadingState";
import EventCard from "./EventCard";
export type Event = {
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

const DELETE_EVENT = gql`
  mutation DeleteEvent($id: Int!) {
    deleteEvent(id: $id)
  }
`;
const GET_GROUP_EVENTS = gql`
  query GetGroupEvents($groupId: Int!) {
    groupEvents(groupId: $groupId) {
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

const CHECK_GROUP_ADMIN = gql`
  query CheckGroupAdmin($groupId: Int!) {
    groupMembers(groupId: $groupId) {
      members {
        id
        role
        userId
        groupId
        joinedAt
      }
      pageSize
    }
  }
`;

const getGroupEvents = async (client: any, groupId: number) => {
  const { data } = await client.query({
    query: GET_GROUP_EVENTS,
    variables: { groupId },
  });
  return data.groupEvents;
};

interface GroupEventListProps {
  groupId: number;
}

const GroupEventList = ({ groupId }: GroupEventListProps) => {
  const client = useApolloClient();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const { searchQuery } = useSearchStore();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const router = useRouter();

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["groupEvents", groupId],
    queryFn: () => getGroupEvents(client, groupId),
  });

  const { data: memberData } = useQuery({
    queryKey: ["groupAdmin", groupId, session?.user?.email],
    queryFn: async () => {
      if (!session?.user?.email) return null;
      const { data } = await client.query({
        query: CHECK_GROUP_ADMIN,
        variables: {
          groupId,
        },
      });
      return data.groupMembers;
    },
    enabled: !!session?.user?.email,
  });
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const { data } = await client.mutate({
        mutation: DELETE_EVENT,
        variables: { id: eventId },
      });
      return data.deleteEvent;
    },
    onSuccess: (_, deletedEventId) => {
      queryClient.setQueryData(
        ["groupEvents", groupId],
        (oldEvents: Event[] = []) =>
          oldEvents.filter((event) => event.id !== deletedEventId)
      );
      setEventToDelete(null);
    },
  });

  const handleDelete = (eventId: number) => {
    setEventToDelete(eventId);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteEventMutation.mutate(eventToDelete);
    }
  };

  const filteredEvents = events?.filter(
    (event: Event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <LoadingState
        text="Loading groups"
        iconSize={64}
        className="animate-spin text-[#649C9E]"
      />
    );
  }
  if (isError) return <div>Error loading events</div>;

  const now = new Date().getTime();
  const upcomingEvents = filteredEvents
    ?.filter((event: Event) => {
      const eventEndTimestamp = parseInt(event.endDate);
      return !isNaN(eventEndTimestamp) && eventEndTimestamp > now;
    })
    .sort(
      (a: Event, b: Event) => parseInt(a.startDate) - parseInt(b.startDate)
    );

  const pastEvents = filteredEvents
    ?.filter((event: Event) => {
      const eventEndTimestamp = parseInt(event.endDate);
      return !isNaN(eventEndTimestamp) && eventEndTimestamp <= now;
    })
    .sort(
      (a: Event, b: Event) => parseInt(b.startDate) - parseInt(a.startDate)
    );

  return (
    <div className="px-8 mt-8 pb-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            <div className="flex justify-between items-center mb-6">
              {memberData?.members?.some(
                (member: any) =>
                  member.role === "admin" &&
                  member.userId === parseInt(session?.user?.id as string)
              ) && (
                <Button
                  onClick={() => setShowEventDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Create Event
                </Button>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <CreateGroupEventForm
              groupId={groupId}
              onSuccess={() => setShowEventDialog(false)}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <h1 className="text-2xl font-bold my-10">Upcoming events</h1>

      <div className="grid grid-cols-4 gap-4">
        {upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents.map((event: Event) => (
            <EventCard
              key={event.id}
              event={event}
              groupId={groupId}
              userId={userId}
              userEmail={session?.user?.email}
              handleDelete={handleDelete}
            />
          ))
        ) : (
          <div>No events found</div>
        )}
      </div>
      <h1 className="text-2xl font-bold my-10">Past events</h1>

      <div className="grid grid-cols-4 gap-4">
        {pastEvents && pastEvents.length > 0 ? (
          pastEvents.map((event: Event) => (
            <EventCard
              key={event.id}
              event={event}
              groupId={groupId}
              userId={userId}
              userEmail={session?.user?.email}
              handleDelete={handleDelete}
            />
          ))
        ) : (
          <div>No events found</div>
        )}
      </div>

      <Dialog
        open={!!eventToDelete}
        onOpenChange={(open) => !open && setEventToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  Deleting...
                </div>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupEventList;
