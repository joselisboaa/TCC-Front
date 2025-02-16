/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, CardActions, CardContent, Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

interface Orientation {
  id: number;
  text: string;
  value: number;
  answer_id: number;
}

export default function OrientationsPage() {
  const [orientations, setOrientations] = useState<Orientation[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    async function fetchOrientations() {
      try {
        setLoading(true);
        const response = await fetchRequest<null, Orientation[]>("/orientations", {
          method: "GET"
        });
        setOrientations(response.body);
      } catch (error) {
        enqueueSnackbar(
          `Erro ao carregar orientações: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    }
    fetchOrientations();
  }, []);

  async function handleDelete(id: number) {
    try {
      setLoading(true);
      await fetchRequest<null, null>(`/orientations/${id}`, {
        method: "DELETE"
      });

      enqueueSnackbar("Orientação removida com sucesso!", { variant: "success" });
      setOrientations((prev) => prev.filter((orientation) => orientation.id !== id));
    } catch (error) {
      enqueueSnackbar(
        `Erro ao excluir orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Orientações
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/orientations/new")}
        sx={{ marginBottom: 2 }}
      >
        Nova Orientação
      </Button>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {orientations.map((orientation) => (
            <Card key={orientation.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6" component="div">
                  {orientation.text}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Peso da Orientação: {orientation.value}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => router.push(`/home/orientations/edit/${orientation.id}`)}
                  sx={{ marginRight: 1 }}
                >
                  Editar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDelete(orientation.id)}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : "Excluir"}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
