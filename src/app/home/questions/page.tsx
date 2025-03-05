"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardActions, CardContent, Typography, CircularProgress, Box, Backdrop } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import DeleteConfirmationDialog from "@/components/DeleteDialog";

interface Question {
  id: number;
  text: string;
  user_group: {
    id: number;
    text: string;
    description: string;
  }
}

export default function Questions() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<Question[]>(
    "questions",
    async () => {
      const response = await fetchRequest<null, Question[]>("/questions", {
        method: "GET",
      });

      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar questões: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { variant: "error" }
        );
      },
    }
  );

  const { isLoading: isLoadingDelete, mutate: deleteMutation } = useMutation(
    async (id: number) => {
      await fetchRequest<null, Question>(`/questions/${id}`, {
        method: "DELETE",
      });
    },
    {
      onSuccess: (_, id) => {
        queryClient.setQueryData<Question[]>("questions", (old) =>
          (old || []).filter((question) => question.id !== id)
        );
        enqueueSnackbar("Questão excluída com sucesso!", { variant: "success" });
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir a questão.";
      
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
        Questões
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/questions/new")}
        sx={{ marginBottom: 2, backgroundColor: "#7E57C2" }}
      >
        Criar Nova Questão
      </Button>
      {isLoadingQuestions && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {questions?.map((question) => (
          <Card key={question.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {question.text}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grupo de Usuário: {question.user_group.text}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push(`/home/questions/edit/${question.id}`)}
                sx={{ marginRight: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteClick(question.id)}
                disabled={isLoadingQuestions}
              >
                {isLoadingQuestions ? <CircularProgress size={20} /> : "Excluir"}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <DeleteConfirmationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={confirmDelete}
        entityName="Questão"
      />
    </Box>
  );
}
