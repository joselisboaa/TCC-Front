/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

export default function CreateUserGroup() {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const createMutation = useMutation(
    async () => {

      await fetchRequest("/user-groups", {
        method: "POST",
        body: { text: groupName, description: description },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Grupo criado com sucesso!", { variant: "success" });
        router.push("/home/user-group");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao criar grupo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const handleSubmit = () => {
    if (!groupName.trim() || !description.trim()) {
      enqueueSnackbar("Todos os campos devem ser preenchidos.", { variant: "warning" });
      return;
    }
    setLoading(true);
    createMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/home/user-group");
  };

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
          Criar Grupo
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os campos abaixo para criar um novo grupo de acessibilidade.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Nome do Grupo"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            fullWidth
            variant="outlined"
            name="text"
          />
          <TextField
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            variant="outlined"
            multiline
            name="description"
            rows={3}
          />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#D32F2F",
                color: "#FFF",
                width: "11rem",
                fontWeight: "bold",
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
                width: "11rem",
                fontWeight: "bold",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
              }}
              onClick={handleSubmit}
              disabled={loading || createMutation.isLoading}
            >
              {loading || createMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
