"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress, Paper, Grid, Alert } from "@mui/material";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function Home() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchChartData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_IA_URL}/data`);
      if (!response.ok) {
        throw new Error("Erro ao conectar com a API");
      }

      const result = await response.json();

      const formattedData: any = [];

      Object.entries(result.historical).forEach(([date, value]) => {
        formattedData.push({
          name: date.substring(0, 7),
          historico: value,
          previsto: null,
        });
      });

      Object.entries(result.predicted).forEach(([date, value]) => {
        formattedData.push({
          name: date.substring(0, 7),
          historico: null,
          previsto: value,
        });
      });

      setData(formattedData);
      setError(false);
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return (
    <Box sx={{ padding: 4, backgroundColor: "#f4f6f8", minHeight: "100vh" }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", color: "#333", textAlign: "center" }}>
        Bem-vindo ao Mapeamento de Acessibilidade
      </Typography>

      <Typography variant="body1" sx={{ textAlign: "center", color: "#666", marginBottom: 4 }}>
        Gerencie grupos de usuários e visualize os dados de acessibilidade de forma intuitiva.
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push("/home/user-group")}
            sx={{ fontSize: "16px", fontWeight: "bold", borderRadius: "8px", padding: "10px 20px" }}
          >
            Gerenciar Grupos de Usuários
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => router.push("/home/answers")}
            sx={{ fontSize: "16px", fontWeight: "bold", borderRadius: "8px", padding: "10px 20px" }}
          >
            Gerenciar Respostas
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Box sx={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
          <Alert severity="error">Não foi possível carregar os dados. Verifique a API e tente novamente.</Alert>
        </Box>
      )}

      {!error && (
        <Box sx={{ marginTop: 6, display: "flex", justifyContent: "center" }}>
          <Paper
            elevation={3}
            sx={{ width: "90%", maxWidth: 800, padding: 3, borderRadius: "12px", backgroundColor: "#fff" }}
          >
            <Typography variant="h6" gutterBottom sx={{ textAlign: "center", fontWeight: "bold", color: "#444" }}>
              Indicadores de Acessibilidade por Mês
            </Typography>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 250 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    stroke="#555"
                    angle={-30}
                    textAnchor="end"
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#555" />
                  <Tooltip />
                  <Bar dataKey="historico" fill="#1976D2" radius={[5, 5, 0, 0]} name="Histórico" />
                  <Bar dataKey="previsto" fill="#4CAF50" radius={[5, 5, 0, 0]} name="Previsto" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
