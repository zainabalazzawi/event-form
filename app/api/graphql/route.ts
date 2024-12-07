import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import { sql } from "@vercel/postgres";
import { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/lib/auth";

type Event = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  organizer: string;
  email: string;
  attendeeCount?: number;
  image?: string;
};

type Group = {
  id: number;
  name: string;
  about: string;
  createdAt: string;
  organizerId: number;
  organizerEmail: string;
  organizerName: string;
  memberCount: number;
  image?: string;
};

const typeDefs = gql`
  type Group {
    id: Int!
    name: String!
    about: String!
    createdAt: String!
    organizerId: Int!
    organizerEmail: String!
    organizerName: String
    memberCount: Int!
    image: String
  }

  type Event {
    id: Int!
    title: String!
    description: String!
    startDate: String!
    endDate: String!
    organizer: String!
    email: String
    attendeeCount: Int!
    image: String
  }

  type GroupMembership {
    id: Int!
    userId: Int!
    groupId: Int!
    role: String!
    joinedAt: String!
  }
  type Subscription {
    id: Int!
    userId: Int!
    eventId: Int!
    status: String!
  }
  type Comment {
    id: Int!
    content: String!
    createdAt: String!
    userId: Int!
    eventId: Int!
    userEmail: String!
  }

  type Query {
    events: [Event!]!
    event(id: Int!): Event
    subscriptions(userId: Int!): [Subscription!]!
    comments(eventId: Int!): [Comment!]!
    groups: [Group!]!
    group(id: Int!): Group
    groupEvents(groupId: Int!): [Event!]!
    groupMembers(groupId: Int!): [GroupMembership!]!
    userGroups(userId: Int!): [Group!]!
  }

  type Mutation {
    createEvent(
      title: String!
      description: String!
      startDate: String!
      endDate: String!
      organizer: String!
      email: String
      image: String
    ): Event

    updateEvent(
      id: Int!
      title: String
      description: String
      startDate: String
      endDate: String
      image: String
    ): Event

    createGroup(name: String!, about: String!, image: String): Group
    updateGroup(id: Int!, name: String, about: String, image: String): Group
    joinEvent(userId: Int!, eventId: Int!): Subscription
    updateJoinStatus(id: Int!, status: String!): Subscription
    createComment(content: String!, eventId: Int!, userId: Int!): Comment
    joinGroup(userId: Int!, groupId: Int!): GroupMembership
    leaveGroup(userId: Int!, groupId: Int!): Boolean

    createGroupEvent(
      groupId: Int!
      title: String!
      description: String!
      startDate: String!
      endDate: String!
      organizer: String!
      email: String
      image: String
    ): Event
    deleteGroup(id: Int!): Boolean
  }
`;

const resolvers = {
  Query: {
    events: async () => {
      try {
        const events = await sql`
          SELECT e.*, 
          COUNT(DISTINCT CASE WHEN s.status = 'join' THEN s.user_id END) as "attendeeCount"
          FROM events e
          LEFT JOIN subscriptions s ON e.id = s.event_id
          GROUP BY e.id, e.title, e.description, e."startDate", e."endDate", e.organizer, e.email, e.image
          ORDER BY e."startDate" DESC
        `;
        return events.rows;
      } catch (error) {
        console.error("Error fetching events:", error);
        throw new Error("Failed to fetch events");
      }
    },

    groups: async () => {
      try {
        const groups = await sql`
          SELECT 
            g.id,
            g.name,
            g.about,
            g.created_at as "createdAt",
            g.organizer_id as "organizerId",
            g.image,
            COUNT(DISTINCT gm.user_id) as "memberCount",
            u.email as "organizerEmail",
            u.name as "organizerName"
          FROM groups g
          LEFT JOIN group_memberships gm ON g.id = gm.group_id
          LEFT JOIN users u ON g.organizer_id = u.id
          GROUP BY g.id, g.name, g.about, g.created_at, g.organizer_id, g.image, u.email, u.name
          ORDER BY g.created_at DESC
        `;
        return groups.rows;
      } catch (error) {
        console.error("Detailed error fetching groups:", error);
        throw error;
      }
    },
    subscriptions: async (_: unknown, { userId }: { userId: number }) => {
      try {
        const subscribers = await sql`
          SELECT id, user_id as "userId", event_id as "eventId", status
          FROM subscriptions
          WHERE user_id = ${userId}
        `;
        return subscribers.rows;
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        throw new Error("Failed to fetch subscriptions");
      }
    },
    event: async (_: unknown, { id }: { id: number }) => {
      try {
        const event = await sql`
          SELECT * FROM events 
          WHERE id = ${id}
        `;

        if (event.rows.length === 0) {
          throw new Error("Event not found");
        }

        return event.rows[0];
      } catch (error) {
        console.error("Error fetching event:", error);
        throw new Error("Failed to fetch event");
      }
    },
    group: async (_: unknown, { id }: { id: number }) => {
      try {
        const group = await sql`
          SELECT 
            g.id,
            g.name,
            g.about,
            g.created_at as "createdAt",
            g.organizer_id as "organizerId",
            g.image,
            COUNT(DISTINCT gm.user_id) as "memberCount",
            u.email as "organizerEmail",
            u.name as "organizerName"
          FROM groups g
          LEFT JOIN group_memberships gm ON g.id = gm.group_id
          LEFT JOIN users u ON g.organizer_id = u.id
          WHERE g.id = ${id}
          GROUP BY g.id, g.name, g.about, g.created_at, g.organizer_id, g.image, u.email, u.name
        `;

        if (group.rows.length === 0) {
          throw new Error("Group not found");
        }

        return group.rows[0];
      } catch (error) {
        console.error("Error fetching group:", error);
        throw new Error("Failed to fetch group");
      }
    },

    comments: async (_: unknown, { eventId }: { eventId: number }) => {
      try {
        const comments = await sql`
          SELECT 
            c.id,
            c.content,
            TO_CHAR(c.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt", 
            c.user_id AS "userId",
            c.event_id AS "eventId",
            u.email AS "userEmail"
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.event_id = ${eventId}
          ORDER BY c.created_at DESC
        `;
        return comments.rows;
      } catch (error) {
        console.error("Error fetching comments:", error);
        throw new Error("Failed to fetch comments");
      }
    },
    groupMembers: async (_: unknown, { groupId }: { groupId: number }) => {
      try {
        const memberships = await sql`
          SELECT 
            gm.id,
            gm.user_id as "userId",
            gm.group_id as "groupId",
            gm.role,
            gm.joined_at as "joinedAt"
          FROM group_memberships gm
          WHERE gm.group_id = ${groupId}
        `;

        return memberships.rows;
      } catch (error) {
        console.error("Error fetching group members:", error);
        throw new Error("Failed to fetch group members");
      }
    },
  },
  Mutation: {
    createEvent: async (
      _: unknown,
      { title, description, startDate, endDate, organizer, email, image }: Event
    ) => {
      try {
        const event = await sql`
          INSERT INTO events (title, description, "startDate", "endDate", organizer, email, image)
          VALUES (${title}, ${description}, ${startDate}, ${endDate}, ${organizer}, ${email}, ${image})
          RETURNING id, title, description, "startDate", "endDate", organizer, email, image
        `;
        return event.rows[0];
      } catch (error) {
        console.error("Error creating event:", error);
        throw new Error("Failed to create event");
      }
    },
    joinEvent: async (
      _: unknown,
      { userId, eventId }: { userId: number; eventId: number }
    ) => {
      const existingSubscription = await sql`
        SELECT id FROM subscriptions
        WHERE user_id = ${userId} AND event_id = ${eventId}
      `;

      if (existingSubscription.rows.length > 0) {
        throw new Error("User has already joined this event");
      }

      const result = await sql`
        INSERT INTO subscriptions (user_id, event_id, status)
        VALUES (${userId}, ${eventId}, 'join')
        RETURNING id, user_id AS "userId", event_id AS "eventId", status
      `;
      return result.rows[0];
    },
    updateJoinStatus: async (
      _: unknown,
      { id, status }: { id: number; status: string }
    ) => {
      const result = await sql`
        UPDATE subscriptions
        SET status = ${status}
        WHERE id = ${id}
        RETURNING id, user_id AS "userId", event_id AS "eventId", status
      `;

      if (result.rows.length === 0) {
        throw new Error(
          "Subscription not found or user not authorized to update"
        );
      }

      return result.rows[0];
    },
    updateEvent: async (
      _: unknown,
      {
        id,
        title,
        description,
        startDate,
        endDate,
        image,
      }: Partial<Event> & { id: number }
    ) => {
      try {
        const event = await sql`
          UPDATE events
          SET 
            title = COALESCE(${title}, title),
            description = COALESCE(${description}, description),
            "startDate" = COALESCE(${startDate}, "startDate"),
            "endDate" = COALESCE(${endDate}, "endDate"),
            image = COALESCE(${image}, image)
          WHERE id = ${id}
          RETURNING id, title, description, "startDate", "endDate", organizer, email, image
        `;
        if (event.rows.length === 0) {
          throw new Error("Event not found");
        }
        return event.rows[0];
      } catch (error) {
        console.error("Error updating event:", error);
        throw new Error("Failed to update event");
      }
    },
    createComment: async (
      _: unknown,
      {
        content,
        eventId,
        userId,
      }: { content: string; eventId: number; userId: number }
    ) => {
      try {
        const userEmail = await sql`
          SELECT email FROM users WHERE id = ${userId}
        `;

        if (userEmail.rows.length === 0) {
          throw new Error("User not found");
        }

        const comment = await sql`
          INSERT INTO comments (content, event_id, user_id, created_at)
          VALUES (${content}, ${eventId}, ${userId}, NOW())
          RETURNING 
            id, 
            content, 
            TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
            user_id AS "userId", 
            event_id AS "eventId"
        `;

        return {
          ...comment.rows[0],
          userEmail: userEmail.rows[0].email,
        };
      } catch (error) {
        console.error("Error creating comment:", error);
        throw new Error("Failed to create comment");
      }
    },
    createGroup: async (
      _: unknown,
      { name, about, image }: { name: string; about: string; image?: string },
      { session }: { session: Session | null }
    ) => {
      if (!session?.user?.email) {
        throw new Error("You must be logged in to create a group");
      }

      try {
        const userResult = await sql`
          SELECT id FROM users WHERE email = ${session.user.email}
        `;

        if (userResult.rows.length === 0) {
          throw new Error("User not found");
        }

        const organizerId = userResult.rows[0].id;

        const group = await sql`
          INSERT INTO groups (name, about, image, organizer_id, created_at)
          VALUES (${name}, ${about}, ${image}, ${organizerId}, NOW())
          RETURNING 
            id, 
            name, 
            about, 
            created_at as "createdAt",
            organizer_id as "organizerId",
            image
        `;

        await sql`
          INSERT INTO group_memberships (user_id, group_id, role, joined_at)
          VALUES (${organizerId}, ${group.rows[0].id}, 'admin', NOW())
        `;

        return {
          ...group.rows[0],
          memberCount: 1,
          organizerEmail: session.user.email,
          organizerName: userResult.rows[0].name
        };
      } catch (error) {
        console.error("Error creating group:", error);
        throw new Error("Failed to create group");
      }
    },
    deleteGroup: async (
      _: unknown,
      { id }: { id: number },
      { session }: { session: Session | null }
    ) => {
      if (!session?.user?.email) {
        throw new Error("You must be logged in to delete a group");
      }

      try {
        // Check if user is the organizer
        const groupResult = await sql`
          SELECT organizer_id 
          FROM groups 
          WHERE id = ${id}
        `;

        const userResult = await sql`
          SELECT id FROM users WHERE email = ${session.user.email}
        `;

        if (userResult.rows[0].id !== groupResult.rows[0].organizer_id) {
          throw new Error("Only the group organizer can delete the group");
        }

        // Delete group memberships
        await sql`
          DELETE FROM group_memberships WHERE group_id = ${id}
        `;

        // Delete the group
        await sql`
          DELETE FROM groups WHERE id = ${id}
        `;

        return true;
      } catch (error) {
        console.error("Error deleting group:", error);
        throw new Error("Failed to delete group");
      }
    },
    updateGroup: async (
      _: unknown,
      { id, name, about, image }: Partial<Group> & { id: number },
      { session }: { session: Session | null }
    ) => {
      if (!session?.user?.email) {
        throw new Error("You must be logged in to update a group");
      }

      try {
        // Check if user is the organizer
        const groupResult = await sql`
          SELECT organizer_id 
          FROM groups 
          WHERE id = ${id}
        `;

        const userResult = await sql`
          SELECT id FROM users WHERE email = ${session.user.email}
        `;

        if (userResult.rows[0].id !== groupResult.rows[0].organizer_id) {
          throw new Error("Only the group organizer can update the group");
        }

        const group = await sql`
          UPDATE groups
          SET 
            name = COALESCE(${name}, name),
            about = COALESCE(${about}, about),
            image = COALESCE(${image}, image)
          WHERE id = ${id}
          RETURNING 
            id, 
            name, 
            about, 
            created_at as "createdAt",
            organizer_id as "organizerId",
            image
        `;

        if (group.rows.length === 0) {
          throw new Error("Group not found");
        }

        return {
          ...group.rows[0],
          memberCount: 1,
          organizerEmail: session.user.email,
          organizerName: userResult.rows[0].name
        };
      } catch (error) {
        console.error("Error updating group:", error);
        throw new Error("Failed to update group");
      }
    },
    joinGroup: async (
      _: unknown,
      { userId, groupId }: { userId: number; groupId: number },
      { session }: { session: Session | null }
    ) => {
      if (!session?.user?.email) {
        throw new Error("You must be logged in to join a group");
      }

      try {
        const membership = await sql`
          INSERT INTO group_memberships (user_id, group_id, role, joined_at)
          VALUES (${userId}, ${groupId}, 'member', NOW())
          RETURNING 
            id,
            user_id as "userId",
            group_id as "groupId",
            role,
            joined_at as "joinedAt"
        `;

        return membership.rows[0];
      } catch (error) {
        console.error("Error joining group:", error);
        throw new Error("Failed to join group");
      }
    },

    leaveGroup: async (
      _: unknown,
      { userId, groupId }: { userId: number; groupId: number },
      { session }: { session: Session | null }
    ) => {
      if (!session?.user?.email) {
        throw new Error("You must be logged in to leave a group");
      }

      try {
        await sql`
          DELETE FROM group_memberships 
          WHERE user_id = ${userId} AND group_id = ${groupId}
        `;

        return true;
      } catch (error) {
        console.error("Error leaving group:", error);
        throw new Error("Failed to leave group");
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async () => {
    try {
      const session = await getServerSession(authOptions);
      return { session };
    } catch (error) {
      console.error("Session error:", error);
      return { session: null };
    }
  },
});

export { handler as GET, handler as POST };
