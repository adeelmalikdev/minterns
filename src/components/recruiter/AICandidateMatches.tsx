import { Sparkles, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAICandidateMatching } from "@/hooks/useAIMatching";

interface AICandidateMatchesProps {
  opportunityId: string;
}

export function AICandidateMatches({ opportunityId }: AICandidateMatchesProps) {
  const { data, isLoading, error } = useAICandidateMatching(opportunityId, 5);

  if (error) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-Suggested Candidates
          <Badge variant="secondary" className="text-xs">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : data?.candidates && data.candidates.length > 0 ? (
          <div className="space-y-3">
            {data.candidates.map((candidate) => (
              <div key={candidate.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {candidate.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {candidate.full_name || "Unknown Student"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                </div>
                {data.reasons[candidate.user_id] && (
                  <p className="text-xs text-muted-foreground max-w-[200px] truncate hidden lg:block">
                    {data.reasons[candidate.user_id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No candidate suggestions available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
