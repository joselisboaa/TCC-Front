"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardActions, CardContent, Typography, CircularProgress, Box, Backdrop } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";
import DeleteConfirmationDialog from "@/components/DeleteDialog";

interface User {
  id: number;
  phone_number: string;
  email: string;
  user_groups: {
    id: number;
    text: string;
  }[];
  name?: string;
}

export default function Users() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>(
    "users",
    async () => {
      const response = await fetchRequest<null, User[]>("/users", {
        method: "GET",
      });

      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar usuários: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { variant: "error" }
        );
      },
    }
  );

  const { isLoading: isLoadingDelete, mutate: deleteMutation } = useMutation(
    async (id: number) => {
      await fetchRequest<null, null>(`/users/${id}`, {
        method: "DELETE",
      });
    },
    {
      onSuccess: (_, id) => {
        queryClient.setQueryData<User[]>("users", (old) =>
          (old || []).filter((user) => user.id !== Number(id))
        );
        enqueueSnackbar("Usuário excluída com sucesso!", { variant: "success" });
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir a usuário.";
      
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
      <Typography variant="h4" component="h1" gutterBottom>
        Usuários
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/users/new")}
        sx={{ marginBottom: 2, backgroundColor: "#7E57C2" }}
      >
        Criar Novo Usuário
      </Button>
      {isLoadingUsers && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {users?.map((user) => (
          <Card key={user.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {user.name ? user.name : "Sem nome"}
              </Typography>
              <Typography variant="body2" component="div">
                Email: {user.email}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Telefone: {user.phone_number}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Grupos: {user.user_groups.map((group) => group.text).join(", ")}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push(`/home/users/edit/${user.id}`)}
                sx={{ marginRight: 1 }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteClick(user.id)}
                disabled={isLoadingDelete}
              >
                {isLoadingDelete ? <CircularProgress size={20} /> : "Excluir"}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
      <DeleteConfirmationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onConfirm={confirmDelete}
        entityName="Usuário"
      />
    </Box>
  );
}
