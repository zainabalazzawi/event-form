import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import { sql } from "@vercel/postgres";


type Attendee = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  attendanceState: string;
};

const typeDefs = gql`
  type Attendee {
    id: Int!
    firstName: String!
    lastName: String!
    email: String!
    phone: String!
    attendanceState: String
  }

  type Query {
    attendees: [Attendee!]!
    attendee(id: Int!): Attendee
  }

type Mutation {
  updateAttendanceState(id: Int!, attendanceState: String!): Attendee
  addAttendee(firstName: String!, lastName: String!, email: String!, phone: String!, attendanceState: String = "ATTENDING"): Attendee
}
`;

const resolvers = {
  Query: {
    attendees: async () => {
      const result = await sql`
        SELECT 
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          phone,
          attendance_state AS "attendanceState"
        FROM attendees
      `;
      return result.rows;
    },
    attendee: async (_: unknown, {id}:{ id :number}) => {
      const result = await sql`
        SELECT 
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          phone,
          attendance_state AS "attendanceState"
        FROM attendees
        WHERE id = ${id}
      `;
      return result.rows[0];
    },
  },
  Mutation: {
    updateAttendanceState: async (_: unknown, { id, attendanceState }: { id: number; attendanceState: string }) => {
      const result = await sql`
        UPDATE attendees
        SET attendance_state = ${attendanceState}
        WHERE id = ${id}
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email, phone, attendance_state AS "attendanceState"
      `;
      return result.rows[0];
    },
    addAttendee: async (_: unknown, { firstName, lastName, email, phone, attendanceState = "ATTENDING" } : Attendee) => {
      const result = await sql`
        INSERT INTO attendees (first_name, last_name, email, phone, attendance_state)
        VALUES (${firstName}, ${lastName}, ${email}, ${phone}, ${attendanceState})
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email, phone, attendance_state AS "attendanceState"
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
