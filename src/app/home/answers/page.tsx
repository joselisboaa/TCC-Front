"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardActions, CardContent, Typography, CircularProgress, Box, Backdrop } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import DeleteConfirmationDialog from "@/components/DeleteDialog";

interface Answer {
  id: number;
  text: string;
  last_change: Date;
  question: {
    id: number;
    text: string;
    other: boolean;
    user_group: {
      id: number;
      text: string;
      description: string;
    }
  }
}

const pad = (num) => {
  return num < 10 ? `0${num}` : num;
}

const transformDate = (date): string => {
  const newDate = new Date(date);

  return `${pad(newDate.getDate())}/${pad(newDate.getMonth())}/${pad(newDate.getFullYear())} ${pad(newDate.getHours())}:${pad(newDate.getMinutes())}:${pad(newDate.getSeconds())}`;
}

export default function Answers() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: answers, isLoading: isLoadingAnswers } = useQuery<Answer[]>(
    "answers",
    async () => {
      const response = await fetchRequest<null, Answer[]>("/answers", {
        method: "GET",
      });

      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar respostas: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { variant: "error" }
        );
      },
    }
  );

  const { isLoading: isLoadingDelete, mutate: deleteMutation } = useMutation(
    async (id: number) => {
      await fetchRequest<null, null>(`/answers/${id}`, {
        method: "DELETE",
      });
    },
    {
      onSuccess: (_, id) => {
        queryClient.setQueryData<Answer[]>("answers", (old) =>
          (old || []).filter((answer) => answer.id !== Number(id))
        );
        enqueueSnackbar("Resposta excluída com sucesso!", { variant: "success" });
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir a resposta.";
      
        enqueueSnackbar(errorMessage, { variant: "error" });
      }      
    }
  );

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setOpenDialog(true);
  };

  const confirmDelete = () => {
    if (selectedId !== null) {
      deleteMutation(selectedId);
      setOpenDialog(false);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Backdrop open={isLoadingDelete} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" component="h1" gutterBottom>
        Respostas
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/answers/new")}
        sx={{ marginBottom: 2, backgroundColor: "#7E57C2" }}
      >
        Criar Nova Resposta
      </Button>
      {isLoadingAnswers && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {answers?.map((answer) => (
          <Card key={answer.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {answer.text}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pergunta: {answer.question.text}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grupo de Usuário: {answer.question.user_group.text}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Última mudança: {transformDate(answer.last_change)}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push(`/home/answers/edit/${answer.id}`)}
                sx={{ marginRight: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteClick(answer.id)}
                disabled={isLoadingDelete}
              >
                {isLoadingAnswers ? <CircularProgress size={20} /> : "Excluir"}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <DeleteConfirmationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={confirmDelete}
        entityName="Resposta"
      />
    </Box>
  );
}