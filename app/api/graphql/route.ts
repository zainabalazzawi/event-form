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

  type Subscription {
    id: Int!
    userId: Int!
    eventId: Int!
    status: String!
  }

  type Query {
    events: [Event!]!
    event(id: Int!): Event
    subscriptions(userId: Int!): [Subscription!]!
  }

  type Mutation {
    createEvent(
      title: String!
      description: String!
      date: String!
      organizer: String!
    ): Event
    joinEvent(userId: Int!, eventId: Int!): Subscription
    updateJoinStatus(id: Int!, status: String!): Subscription
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
        try {
          const event = await sql`
            INSERT INTO events (title, description, date, organizer)
            VALUES (${title}, ${description}, ${date}, ${organizer})
            RETURNING id, title, description, date, organizer
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
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
