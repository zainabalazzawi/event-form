import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import { sql } from "@vercel/postgres";

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

const typeDefs = gql`
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
    joinEvent(userId: Int!, eventId: Int!): Subscription
    updateJoinStatus(id: Int!, status: String!): Subscription
    createComment(content: String!, eventId: Int!, userId: Int!): Comment
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
          userEmail: userEmail.rows[0].email
        };
      } catch (error) {
        console.error("Error creating comment:", error);
        throw new Error("Failed to create comment");
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
