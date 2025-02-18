/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

export default function EditUserGroup() {
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { data, isLoading: isFetching } = useQuery(
    ["userGroup", id],
    async () => {
      const response = await fetchRequest<null, { text: string; description: string }>(`/user-groups/${id}`, {
        method: "GET",
      });
      return response.body;
    },
    {
      enabled: !!id,
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar o grupo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/user-group");
      },
    }
  );

  const updateMutation = useMutation(
    async () => {
      await fetchRequest(`/user-groups/${id}`, {
        method: "PUT",
        body: { text, description },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Grupo atualizado com sucesso!", { variant: "success" });
        router.push("/home/user-group");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao atualizar grupo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  useEffect(() => {
    if (data) {
      setText(data.text);
      setDescription(data.description);
    }
  }, [data]);

  const handleSubmit = () => {
    if (!text.trim() || !description.trim()) {
      enqueueSnackbar("Todos os campos devem ser preenchidos.", { variant: "warning" });
      return;
    }
    setLoading(true);
    updateMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/home/user-group");
  };

  if (isFetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#F8F9FA",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Editar Grupo
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os dados do grupo de acessibilidade abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Nome do Grupo"
            value={text || ""}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            variant="outlined"
          />
          <TextField
            label="Descrição"
            value={description || ""}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            variant="outlined"
            multiline
            rows={3}
          />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#D32F2F",
                color: "#FFF",
                fontWeight: "bold",
                width: "11rem",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "#B71C1C" },
              }}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #7E57C2, #5E3BEE)",
                color: "#FFF",
                fontWeight: "bold",
                width: "11rem",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
              }}
              onClick={handleSubmit}
              disabled={loading || updateMutation.isLoading}
            >
              {loading || updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
