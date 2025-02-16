/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import Cookies from "js-cookie";

export default function EditUserGroup() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams(); 
  const token = Cookies.get("jwt") as string;

  const { data, isLoading: isFetching } = useQuery(
    ["userGroup", id],
    async () => {
      const response = await fetchRequest<null, { text: string }>(`/user-groups/${id}`, {
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
        body: { text },
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
    if (data) setText(data.text);
  }, [data]);

  const handleSubmit = () => {
    if (!text.trim()) {
      enqueueSnackbar("O campo de texto não pode estar vazio.", { variant: "warning" });
      return;
    }
    setLoading(true);
    updateMutation.mutate();
  };

  if (isFetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Editar Grupo de Usuários
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
          disabled={loading || updateMutation.isLoading}
        >
          {loading || updateMutation.isLoading ? <CircularProgress size={20} /> : "Salvar"}
        </Button>
      </Box>
    </Box>
  );
}
