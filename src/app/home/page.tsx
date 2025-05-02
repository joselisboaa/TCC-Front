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
    <Box sx={{ padding: 2, minHeight: "100vh" }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", color: "#333", textAlign: "center" }}>
        Bem-vindo ao Mapeamento de Acessibilidade
      </Typography>

      <Typography variant="body1" sx={{ textAlign: "center", color: "#666", marginBottom: 4 }}>
        Gerencie grupos de usuários e visualize os dados de acessibilidade de forma intuitiva.
      </Typography>

      {isLoadingStats ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 4 }}>
          <CircularProgress />
        </Box>
      ) : statistics && (
        <Grid container spacing={3} sx={{ mt: 4 }}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Status dos Usuários
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Usuários com Grupos
                      </Typography>
                      <Typography variant="h4">
                        {statistics.userStatus.withGroups}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Usuários sem Grupos
                      </Typography>
                      <Typography variant="h4">
                        {statistics.userStatus.withoutGroups}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Distribuição de Usuários por Grupo
              </Typography>
              {statistics.userGroupDistribution.map((group) => (
                <Card key={group.text} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{group.text}</Typography>
                    <Typography variant="h6">{group._count.users} usuários</Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Grupos com Respostas
              </Typography>
              {statistics.groupsWithResponses.map((group) => (
                <Card key={group.text} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">{group.text}</Typography>
                    <Typography variant="h6">{group._count.users} usuários</Typography>
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
