import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import SignInDialog from "./SignInDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { Group } from "./GroupListPage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type JoinGroupButtonProps = {
  groupId: number;
};

type GroupMembership = {
  id: number;
  userId: number;
  groupId: number;
  role: string;
  joinedAt: string;
};
const GET_GROUP_MEMBERSHIPS = gql`
  query GetGroupMemberships($groupId: Int!) {
    groupMembers(groupId: $groupId) {
      members {
        id
        userId
        groupId
        role
        joinedAt
      }
      pageSize
    }
  }
`;
const JOIN_GROUP = gql`
  mutation JoinGroup($userId: Int!, $groupId: Int!) {
    joinGroup(userId: $userId, groupId: $groupId) {
      id
      userId
      groupId
      role
      joinedAt
    }
  }
`;

const LEAVE_GROUP = gql`
  mutation LeaveGroup($userId: Int!, $groupId: Int!) {
    leaveGroup(userId: $userId, groupId: $groupId)
  }
`;

const JoinGroupButton = ({ groupId }: JoinGroupButtonProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const client = useApolloClient();
  const queryClient = useQueryClient();

  const getGroupMemberships = async (client: any, groupId: number) => {
    const { data } = await client.query({
      query: GET_GROUP_MEMBERSHIPS,
      variables: { groupId },
    });
    return data.groupMembers;
  };

  const { data: membershipsData } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => getGroupMemberships(client, groupId),
    enabled: !!groupId,
  });

  const isMember = membershipsData?.memberships?.some(
    (m: GroupMembership) => m.userId === userId
  );

  const joinGroupMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.mutate({
        mutation: JOIN_GROUP,
        variables: { userId, groupId },
      });
      return data.joinGroup;
    },
    onSuccess: (newMembership) => {
      queryClient.setQueryData(
        ["groupMembers", groupId],
        (old: GroupMembership[] = []) => [...old, newMembership]
      );

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) =>
        oldGroups.map((group) =>
          group.id === groupId
            ? { ...group, memberCount: group.memberCount + 1 }
            : group
        )
      );

      queryClient.setQueryData(["group", groupId], (oldGroup: Group) =>
        oldGroup
          ? { ...oldGroup, memberCount: oldGroup.memberCount + 1 }
          : oldGroup
      );
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.mutate({
        mutation: LEAVE_GROUP,
        variables: { userId, groupId },
      });
      return data.leaveGroup;
    },
    onSuccess: () => {
      queryClient.setQueryData(
        ["groupMembers", groupId],
        (old: GroupMembership[] = []) =>
          old?.filter((member) => member.userId !== userId) || []
      );

      queryClient.setQueryData(["groups"], (oldGroups: Group[] = []) =>
        oldGroups.map((group) =>
          group.id === groupId
            ? { ...group, memberCount: Math.max(group.memberCount - 1, 0) }
            : group
        )
      );

      queryClient.setQueryData(["group", groupId], (oldGroup: Group) =>
        oldGroup
          ? { ...oldGroup, memberCount: Math.max(oldGroup.memberCount - 1, 0) }
          : oldGroup
      );
    },
  });

  const handleJoinGroup = () => {
    if (userId) {
      joinGroupMutation.mutate();
    }
  };

  const handleLeaveGroup = () => {
    if (userId) {
      leaveGroupMutation.mutate();
    }
  };

  if (!userId) {
    return (
      <SignInDialog
        signInDescription="Sign in to join group"
        signUpDescription="Create an account to join group"
      >
        <Button>Join Group</Button>
      </SignInDialog>
    );
  }

  if (!isMember) {
    return <Button onClick={handleJoinGroup}>Join Group</Button>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="w-[15%]">
        <Button variant="outline">
          You're a member
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        {isMember ? (
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={handleLeaveGroup}
          >
            Leave group
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleJoinGroup}>
            Join group
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default JoinGroupButton;
