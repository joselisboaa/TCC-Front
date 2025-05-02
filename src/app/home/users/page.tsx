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
        enqueueSnackbar("Usuário excluído com sucesso!", { variant: "success" });
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
    <Box sx={{ padding: { xs: 2, sm: 4 } }}>
      <Backdrop open={isLoadingDelete} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Usuários
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => router.push("/home/users/new")}
        sx={{ 
          marginBottom: 2, 
          backgroundColor: "#7E57C2",
          width: { xs: '100%', sm: 'auto' }
        }}
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
          <Card key={user.id} variant="outlined" sx={{ 
            display: "flex", 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: "space-between", 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            padding: 2,
            gap: { xs: 2, sm: 0 }
          }}>
            <CardContent sx={{ 
              flex: 1, 
              p: { xs: 1, sm: 2 },
              minWidth: 0
            }}>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  wordBreak: 'break-word'
                }}
              >
                {user.name ? user.name : "Sem nome"}
              </Typography>
              <Typography 
                variant="body2" 
                component="div" 
                sx={{ 
                  mt: 0.5,
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Email: {user.email}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  mt: 0.5,
                  wordBreak: 'break-word'
                }}
              >
                Telefone: {user.phone_number}
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  mt: 0.5,
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Grupos: {user.user_groups.map((group) => group.text).join(", ")}
              </Typography>
            </CardContent>
            <CardActions sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'row', sm: 'row' },
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
              width: { xs: '100%', sm: 'auto' },
              p: { xs: 1, sm: 2 },
              flexShrink: 0
            }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => router.push(`/home/users/edit/${user.id}`)}
                sx={{ 
                  marginRight: { xs: 0, sm: 1 },
                  flex: { xs: 1, sm: 'none' },
                  mx: { xs: 0.5, sm: 0 },
                  whiteSpace: 'nowrap'
                }}
              >
                Editar
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteClick(user.id)}
                disabled={isLoadingDelete}
                sx={{ 
                  flex: { xs: 1, sm: 'none' },
                  mx: { xs: 0.5, sm: 0 },
                  whiteSpace: 'nowrap'
                }}
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
