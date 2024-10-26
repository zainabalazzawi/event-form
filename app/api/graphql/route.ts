import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import { sql } from "@vercel/postgres";

const typeDefs = gql`

type Event {
  id: Int!
  title: String!
  description: String!
  date: String!
  organizer: String!
}

  type Query {
    events: [Event!]!
  }

  type Mutation {
    createEvent(
      title: String!
      description: String!
      date: String!
      organizer: String!
    ): Event
    }
`;

const resolvers = {
  Query: {
    events: async () => {
      const result = await sql`
        SELECT id, title, description, date, organizer
        FROM events
      `;
      return result.rows;
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
      }: { title: string; description: string; date: string; organizer: string }
    ) => {
      const timestamp = new Date(date).getTime().toString();
      const result = await sql`
        INSERT INTO events (title, description, date, organizer)
        VALUES (${title}, ${description}, ${timestamp}, ${organizer})
        RETURNING id, title, description, date, organizer
      `;
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
