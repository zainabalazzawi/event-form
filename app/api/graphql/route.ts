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
  email: string;
  attendeeCount?: number;
  image?: string;
};

const typeDefs = gql`
  type Event {
    id: Int!
    title: String!
    description: String!
    date: String!
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

  type Query {
    events: [Event!]!
    event(id: Int!): Event
    subscriptions(userId: Int!): [Subscription!]!
  }

  input CreateEventInput {
    title: String!
    description: String!
    date: String!
    organizer: String!
    email: String
    image: String
  }

  type Mutation {
    createEvent(
      title: String!
      description: String!
      date: String!
      organizer: String!
      email: String
      image: String
    ): Event
    updateEvent(
      id: Int!
      title: String
      description: String
      date: String
      image: String
    ): Event
    joinEvent(userId: Int!, eventId: Int!): Subscription
    updateJoinStatus(id: Int!, status: String!): Subscription
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
          GROUP BY e.id, e.title, e.description, e.date, e.organizer, e.email, e.image
          ORDER BY e.date DESC
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
  },
  Mutation: {
    createEvent: async (
      _: unknown,
      { title, description, date, organizer, email, image }: Event
    ) => {
      try {
        const event = await sql`
            INSERT INTO events (title, description, date, organizer, email, image)
            VALUES (${title}, ${description}, ${date}, ${organizer}, ${email}, ${image})
            RETURNING id, title, description, date, organizer, email, image
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
        date,
        organizer,
        image
      }: Partial<Event> & { id: number }
    ) => {
      try {
        const formattedDate = date ? new Date(parseInt(date)).toISOString() : undefined;

        const event = await sql`
          UPDATE events
          SET 
            title = COALESCE(${title}, title),
            description = COALESCE(${description}, description),
            date = COALESCE(${formattedDate}, date),
             image = COALESCE(${image}, image)
          WHERE id = ${id}
          RETURNING id, title, description, date, organizer, email, image
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
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
