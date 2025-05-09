"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardActions, CardContent, Typography, CircularProgress, Box, Backdrop } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import DeleteConfirmationDialog from "@/components/DeleteDialog";

interface UserGroup {
  id: number;
  text: string;
  description: string;
}

interface Question {
  id: number;
  text: string;
  last_change: string;
  user_groups: UserGroup[];
  answers: Answer[];
}

interface Answer {
  id: number;
  text: string;
  other: boolean;
  value: number;
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

  const hasQuestionsWithoutAnswers = questions?.some((q) => q.answers.length === 0);

  return (
    <Box sx={{ padding: { xs: 2, sm: 4 } }}>
      <Backdrop open={isLoadingDelete} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Questões
      </Typography>

      {hasQuestionsWithoutAnswers && (
        <Typography variant="body1" sx={{ color: "error.main", mb: 2 }}>
          Atenção: Questões sem respostas não serão exibidas no formulário.
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/questions/new")}
        sx={{ 
          marginBottom: 2, 
          backgroundColor: "#7E57C2",
          width: { xs: '100%', sm: 'auto' }
        }}
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
          <Card 
            key={question.id} 
            variant="outlined" 
            sx={{ 
              display: "flex", 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: "space-between", 
              alignItems: { xs: 'stretch', sm: 'center' }, 
              padding: 2,
              gap: { xs: 2, sm: 0 }
            }}
          >
            <CardContent sx={{ flex: 1, p: { xs: 1, sm: 2 } }}>
              <Typography
                variant="h6"
                component="div"
                sx={{ 
                  color: question.answers.length === 0 ? "error.main" : "text.primary",
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                {question.answers.length === 0 ? `${question.text} (Questão sem respostas)` : question.text}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grupos de Usuário: {question.user_groups.map((group) => group.text).join(', ')}
              </Typography>
            </CardContent>
            <CardActions sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', sm: 'row' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
              width: { xs: '100%', sm: 'auto' },
              p: { xs: 1, sm: 2 }
            }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push(`/home/questions/edit/${question.id}`)}
                sx={{ 
                  marginRight: { xs: 0, sm: 1 },
                  flex: { xs: 1, sm: 'auto' }
                }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteClick(question.id)}
                disabled={isLoadingQuestions}
                sx={{ flex: { xs: 1, sm: 'auto' } }}
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
