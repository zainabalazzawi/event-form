import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import { sql } from "@vercel/postgres";

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  organizer: string;
};

const typeDefs = gql`
  type Event {
    id: Int!
    title: String!
    description: String!
    date: String!
    organizer: String!
  }

  type Subscriber {
    id: Int!
    userId: Int!
    eventId: Int!
    status: String!
  }

  type Query {
    events: [Event!]!
    subscribers(userId: Int!): [Subscriber!]!
  }

  type Mutation {
    createEvent(
      title: String!
      description: String!
      date: String!
      organizer: String!
    ): Event
    joinEvent(userId: Int!, eventId: Int!): Subscriber
    updateJoinStatus(id: Int!, status: String!): Subscriber
  }
`;

const resolvers = {
  Query: {
    events: async () => {
      try {
        const events = await sql`SELECT * FROM events ORDER BY date DESC`;
        return events.rows;
      } catch (error) {
        console.error("Error fetching events:", error);
        throw new Error("Failed to fetch events");
      }
    },
    subscribers: async (_: unknown, { userId }: { userId: number }) => {
      try {
        const subscribers = await sql`
          SELECT id, user_id as "userId", event_id as "eventId", status
          FROM subscribers
          WHERE user_id = ${userId}
        `;
        return subscribers.rows;
      } catch (error) {
        console.error("Error fetching subscribers:", error);
        throw new Error("Failed to fetch subscribers");
      }
    },
  },
  Mutation: {
    createEvent: async (
      _: unknown,
      {
        title,
        description,
        date,
        organizer,
      }: Event
    ) => {
      const timestamp = new Date(date).getTime().toString();
      const event = await sql`
        INSERT INTO events (title, description, date, organizer)
        VALUES (${title}, ${description}, ${timestamp}, ${organizer})
        RETURNING id, title, description, date, organizer
      `;
      return event.rows[0];
    },
    joinEvent: async (
      _: unknown,
      { userId, eventId }: { userId: number; eventId: number }
    ) => {
      const existingSubscription = await sql`
        SELECT id FROM subscribers
        WHERE user_id = ${userId} AND event_id = ${eventId}
      `;

      if (existingSubscription.rows.length > 0) {
        throw new Error("User has already joined this event");
      }

      const result = await sql`
        INSERT INTO subscribers (user_id, event_id, status)
        VALUES (${userId}, ${eventId}, 'joined')
        RETURNING id, user_id AS "userId", event_id AS "eventId", status
      `;
      return result.rows[0];
    },
    updateJoinStatus: async (
      _: unknown,
      { id, status }: { id: number; status: string }
    ) => {
      const result = await sql`
        UPDATE subscribers
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
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
