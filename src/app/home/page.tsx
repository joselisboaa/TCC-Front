"use client";

import { Box, Typography, CircularProgress, Paper, Grid, Card, CardContent } from "@mui/material";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";

interface GroupStatistics {
  text: string;
  _count: {
    users: number;
  };
}

interface UserStatus {
  withGroups: number;
  withoutGroups: number;
}

interface StatisticsData {
  userGroupDistribution: GroupStatistics[];
  groupsWithResponses: GroupStatistics[];
  userStatus: UserStatus;
}

export default function Home() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { data: statistics, isLoading: isLoadingStats } = useQuery<StatisticsData>(
    "user-groups-statistics",
    async () => {
      const response = await fetchRequest<null, StatisticsData>("/user-groups/statistics", {
        method: "GET",
      });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar estatísticas: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { variant: "error" }
        );
      },
    }
  );

  return (
    <Box sx={{ padding: { xs: 1, sm: 2 }, minHeight: "100vh" }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          fontWeight: "bold", 
          color: "#333", 
          textAlign: "center",
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" }
        }}
      >
        Bem-vindo ao Mapeamento de Acessibilidade
      </Typography>

      <Typography 
        variant="body1" 
        sx={{ 
          textAlign: "center", 
          color: "#666", 
          marginBottom: 4,
          fontSize: { xs: "0.875rem", sm: "1rem" },
          px: { xs: 1, sm: 2 }
        }}
      >
        Gerencie grupos de usuários e visualize os dados de acessibilidade de forma intuitiva.
      </Typography>

      {isLoadingStats ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : statistics && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: { xs: 2, sm: 4 } }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                Status dos Usuários
              </Typography>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        color="textSecondary" 
                        gutterBottom
                        sx={{ 
                          fontSize: { xs: "0.875rem", sm: "1rem" }
                        }}
                      >
                        Usuários com Grupos
                      </Typography>
                      <Typography 
                        variant="h4"
                        sx={{ 
                          fontSize: { xs: "1.5rem", sm: "2rem" }
                        }}
                      >
                        {statistics.userStatus.withGroups}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography 
                        color="textSecondary" 
                        gutterBottom
                        sx={{ 
                          fontSize: { xs: "0.875rem", sm: "1rem" }
                        }}
                      >
                        Usuários sem Grupos
                      </Typography>
                      <Typography 
                        variant="h4"
                        sx={{ 
                          fontSize: { xs: "1.5rem", sm: "2rem" }
                        }}
                      >
                        {statistics.userStatus.withoutGroups}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                Distribuição de Usuários por Grupo
              </Typography>
              {statistics.userGroupDistribution.map((group) => (
                <Card key={group.text} sx={{ mb: { xs: 1, sm: 2 } }}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        fontSize: { xs: "0.875rem", sm: "1rem" }
                      }}
                    >
                      {group.text}
                    </Typography>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: "1.1rem", sm: "1.25rem" }
                      }}
                    >
                      {group._count.users} usuários
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  mb: { xs: 1, sm: 2 }
                }}
              >
                Grupos com Respostas
              </Typography>
              {statistics.groupsWithResponses.map((group) => (
                <Card key={group.text} sx={{ mb: { xs: 1, sm: 2 } }}>
                  <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        fontSize: { xs: "0.875rem", sm: "1rem" }
                      }}
                    >
                      {group.text}
                    </Typography>
                    <Typography 
                      variant="h6"
                      sx={{ 
                        fontSize: { xs: "1.1rem", sm: "1.25rem" }
                      }}
                    >
                      {group._count.users} usuários
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
