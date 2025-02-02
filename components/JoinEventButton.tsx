import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import SignInDialog from "./SignInDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { Event } from "./GroupEventList";

type JoinEventButtonProps = {
  eventId: number;
  groupId?: number;
};

type Subscription = {
  id: number;
  userId: number;
  eventId: number;
  status: string;
};

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

const getSubscriptions = async (client: any, userId: number) => {
  const { data } = await client.query({
    query: GET_SUBSCRIPTIONS,
    variables: { userId },
  });
  return data.subscriptions;
};

const JoinEventButton = ({ eventId, groupId }: JoinEventButtonProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const client = useApolloClient();
  const queryClient = useQueryClient();

  const { data: subscriptions } = useQuery({
    queryKey: ["subscriptions", userId],
    queryFn: () => getSubscriptions(client, userId!),
    enabled: !!userId,
  });

  const subscription = subscriptions?.find(
    (s: Subscription) => s.eventId === eventId
  );

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

      queryClient.setQueryData(
        ["groupEvents", groupId],
        (oldEvents: Event[] = []) =>
          oldEvents.map((event) =>
            event.id === eventId
              ? { ...event, attendeeCount: event.attendeeCount + 1 }
              : event
          )
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
    onSuccess: (updatedSubscription) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", userId] });
      
      queryClient.setQueryData(
        ["groupEvents", groupId],
        (oldEvents: Event[] = []) =>
          oldEvents.map((event) =>
            event.id === eventId
              ? {
                  ...event,
                  attendeeCount:
                    updatedSubscription.status === "join"
                      ? event.attendeeCount + 1
                      : Math.max(event.attendeeCount - 1, 0),
                }
              : event
          )
      );
    },
  });
//check count  
  const handleJoinEvent = async () => {
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

  if (!userId) {
    return (
      <SignInDialog>
        <Button>Join Event</Button>
      </SignInDialog>
    );
  }

  return subscription ? (
    <div className="flex space-x-2">
      <Toggle
        pressed={subscription.status === "join"}
        onClick={() => handleUpdateStatus(subscription.id, "join")}
        variant="outline"
      >
        Join
      </Toggle>
      <Toggle
        pressed={subscription.status === "maybe"}
        onClick={() => handleUpdateStatus(subscription.id, "maybe")}
        variant="outline"
      >
        Maybe
      </Toggle>
      <Toggle
        pressed={subscription.status === "cancel"}
        onClick={() => handleUpdateStatus(subscription.id, "cancel")}
        variant="outline"
      >
        Cancel
      </Toggle>
    </div>
  ) : (
    <Button onClick={handleJoinEvent}>Join Event</Button>
  );
};

export default JoinEventButton;
