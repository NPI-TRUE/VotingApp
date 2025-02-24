import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LogOut, Trophy, Medal } from "lucide-react";
import type { Candidate } from "@shared/schema";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const { data: candidates, isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    refetchInterval: 1000, // Poll every second for updates
    select: (data) => {
      // Ordina i candidati per voti in ordine decrescente
      return [...data].sort((a, b) => b.votes - a.votes);
    }
  });

  const voteMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      const res = await apiRequest("POST", `/api/vote/${candidateId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    switch(index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Classifica Candidati</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <p className="text-sm text-muted-foreground">
            Voti rimanenti: {user?.votesRemaining}
          </p>
          {user?.isAdmin && (
            <Button variant="outline" asChild>
              <Link href="/admin">Admin Dashboard</Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Logout
          </Button>
        </div>
      </div>

      {candidates?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Nessun candidato disponibile per il voto
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates?.map((candidate, index) => (
            <Card 
              key={candidate.id}
              className={`transition-all ${
                index === 0 ? 'border-yellow-500 shadow-lg' :
                index === 1 ? 'border-gray-400' :
                index === 2 ? 'border-amber-700' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getRankIcon(index)}
                    <div>
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        {candidate.name}
                        <span className="text-sm font-normal text-muted-foreground">
                          #{index + 1}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {candidate.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {candidate.votes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        voti
                      </p>
                    </div>
                    <Button
                      onClick={() => voteMutation.mutate(candidate.id)}
                      disabled={voteMutation.isPending || user?.votesRemaining === 0}
                    >
                      {voteMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Vota
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}