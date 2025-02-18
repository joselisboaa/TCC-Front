/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper, Autocomplete } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

interface UserGroup {
  id: number;
  text: string;
}

export default function EditQuestion() {
  const [text, setText] = useState("");
  const [userGroup, setUserGroup] = useState<UserGroup | null>(null);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { data: questionData, isLoading: isFetchingQuestion } = useQuery(
    ["question", id],
    async () => {
      const response = await fetchRequest<null, { text: string; user_group_id: number }>(
        `/questions/${id}`,
        { method: "GET" }
      );
      return response.body;
    },
    {
      enabled: !!id,
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar a questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/questions");
      },
    }
  );

  const { data: userGroups, isLoading: isFetchingUserGroups } = useQuery(
    "userGroups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", { method: "GET" });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar grupos de usuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const updateMutation = useMutation(
    async () => {
      await fetchRequest(`/questions/${id}`, {
        method: "PUT",
        body: { text, user_group_id: userGroup?.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Questão atualizada com sucesso!", { variant: "success" });
        router.push("/home/questions");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao atualizar questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  useEffect(() => {
    if (questionData) {
      setText(questionData.text);
      const selectedGroup = userGroups?.find((group) => group.id === questionData.user_group_id);
      setUserGroup(selectedGroup || null);
    }
  }, [questionData, userGroups]);

  const handleSubmit = () => {
    if (!text.trim() || !userGroup) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }
    updateMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/home/questions");
  };

  if (isFetchingQuestion || isFetchingUserGroups) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Editar Questão
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os dados da questão abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField label="Texto da Questão" value={text} onChange={(e) => setText(e.target.value)} fullWidth variant="outlined" />
          <Autocomplete
            value={userGroup}
            onChange={(event, newValue) => setUserGroup(newValue)}
            options={userGroups || []}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField {...params} label="Selecionar Grupo de Usuários" fullWidth variant="outlined" />
            )}
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
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
