import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql, useApolloClient } from "@apollo/client";
import { Button } from "./ui/button";
import { FormEvent, useState } from "react";
import SignInDialog from "./SignInDialog";
import { Textarea } from "./ui/textarea";
import { formatCommentDate } from "@/lib/utils";


type Comment = {
  id: number;
  content: string;
  eventId: number;
  userId: number;
  userEmail: string
  createdAt:string
};
type CommentsProps = {
  eventId: number;
};
const GET_COMMENTS = gql`
  query GetComments($eventId: Int!) {
    comments(eventId: $eventId) {
      id
      content
      createdAt
      userId
      userEmail
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($content: String!, $eventId: Int!, $userId: Int!) {
    createComment(content: $content, eventId: $eventId, userId: $userId) {
      id
      content
      createdAt
      userId
      userEmail
    }
  }
`;

const Comments = ({ eventId }: CommentsProps) => {
  const { data: session } = useSession();
  const client = useApolloClient();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");


  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", eventId],
    queryFn: async () => {
      const { data } = await client.query({
        query: GET_COMMENTS,
        variables: { eventId },
      });
      return data.comments;
    },
  });


  const createCommentMutation = useMutation({
    mutationFn: async (variables: {
      content: string;
      eventId: number;
      userId: number;
    }) => {
      const { data } = await client.mutate({
        mutation: CREATE_COMMENT,
        variables,
      });
      return data.createComment;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["comments", eventId],
        (old: Comment[] = []) => [data, ...old]
      );
      setContent("");
    },
  });
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id || !content.trim()) return;

    createCommentMutation.mutate({
      content: content.trim(),
      eventId,
      userId: parseInt(session.user.id),
    });
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Comments ({comments?.length || 0})
        </h2>

        {session ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
            />
            <Button type="submit" disabled={!content.trim()}>
              Save Comment
            </Button>
          </form>
        ) : (
          <SignInDialog>
            <Button variant="outline" className="w-full sm:w-auto">
              Sign in to comment
            </Button>
          </SignInDialog>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div>Loading comments...</div>
        ) : comments?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet</p>
        ) : (
          comments?.map((comment: any) => (
            <div
              key={comment.id}
              className="border-b border-gray-100 last:border-0 pb-4"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">{comment.userEmail}</span>
                <span className="text-[12px] text-gray-500">
                  {formatCommentDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
