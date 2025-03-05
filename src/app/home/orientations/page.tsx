"use client";

import { useRouter } from "next/navigation";
import { Box, Button, Card, CardActions, CardContent, Typography, CircularProgress, Backdrop } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import DeleteConfirmationDialog from "@/components/DeleteDialog";
import { useState } from "react";

interface Orientation {
  id: number;
  text: string;
  value: number;
  answer_id: number;
  answer: {
    id: number;
    text: string;
    question: {
      id: number;
      text: string;
      user_group: {
        id: number;
        text: string;
        description: string;
      }
    }
  }
}

export default function OrientationsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: orientations, isLoading } = useQuery<Orientation[]>(
    "orientations",
    async () => {
      const response = await fetchRequest<null, Orientation[]>("/orientations", {
        method: "GET",
      });

      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar grupos: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { variant: "error" }
        );
      },
    }
  );

  const { isLoading: isLoadingDelete, mutate: deleteMutation } = useMutation(
    async (id: number) => {
      await fetchRequest<null, null>(`/orientations/${id}`, {
        method: "DELETE",
      });
    },
    {
      onSuccess: (_, id) => {
        queryClient.setQueryData<Orientation[]>("orientations", (old) =>
          (old || []).filter((orientation) => orientation.id !== Number(id))
        );
        enqueueSnackbar("Orientação excluída com sucesso!", { variant: "success" });
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir a orientação.";
      
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
        Orientações
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/orientations/new")}
        sx={{ marginBottom: 2, backgroundColor: "#7E57C2" }}
      >
        Nova Orientação
      </Button>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {orientations?.map((orientation) => (
            <Card key={orientation.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingInline: 2 }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="h6" component="div">
                  {orientation.text}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Peso da Orientação: {orientation.value}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pergunta: {orientation.answer.question.text}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Resposta: {orientation.answer.text}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Grupo de Usuário: {orientation.answer.question.user_group.text}
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
                  onClick={() => handleDeleteClick(orientation.id)}
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={20} /> : "Excluir"}
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
      <DeleteConfirmationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={confirmDelete}
        entityName="Orientação"
      />
    </Box>
  );
}
