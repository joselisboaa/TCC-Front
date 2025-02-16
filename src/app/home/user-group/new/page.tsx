/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

export default function CreateUserGroup() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const token = Cookies.get("jwt") as string;

  const createMutation = useMutation(
    async () => {
      await fetchRequest("/user-groups", {
        method: "POST",
        body: { text },
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
    if (!text.trim()) {
      enqueueSnackbar("O campo de texto não pode estar vazio.", { variant: "warning" });
      return;
    }
    setLoading(true);
    createMutation.mutate();
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Criar Grupo de Usuários
      </Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Nome do Grupo"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || createMutation.isLoading}
        >
          {loading || createMutation.isLoading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
}
