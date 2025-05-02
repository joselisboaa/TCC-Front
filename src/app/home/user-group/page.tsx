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

export default function UserGroups() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: userGroups, isLoading: isLoadingUserGroups } = useQuery<UserGroup[]>(
    "user-groups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", {
        method: "GET",
      });

      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar grupo de usuários: ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`,
          { variant: "error" }
        );
      },
    }
  );

  const { isLoading: isLoadingDelete, mutate: deleteMutation } = useMutation(
    async (id: number) => {
      await fetchRequest<null, null>(`/user-groups/${id}`, {
        method: "DELETE",
      });
    },
    {
      onSuccess: (_, id) => {
        queryClient.setQueryData<UserGroup[]>("user-groups", (old) =>
          (old || []).filter((user_group) => user_group.id !== id)
        );
        enqueueSnackbar("Resposta excluída com sucesso!", { variant: "success" });
      },
      onError: (error: unknown) => {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao excluir o grupo de usuário.";
      
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
        Grupos de Usuários
      </Typography>
      <Button
        variant="contained"
        onClick={() => router.push("/home/user-group/new")}
        sx={{ 
          marginBottom: 2, 
          backgroundColor: "#7E57C2",
          width: { xs: '100%', sm: 'auto' }
        }}
      >
        Criar Novo Grupo
      </Button>
      {isLoadingUserGroups && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {userGroups?.map((group) => (
          <Card
            key={group.id}
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
              <Typography variant="h6" component="div" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {group.text}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Descrição: {group.description ? group.description : "Nenhuma descrição fornecida"}
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
                onClick={() => router.push(`/home/user-group/edit/${group.id}`)}
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
                onClick={() => handleDeleteClick(group.id)}
                disabled={isLoadingDelete}
                sx={{ flex: { xs: 1, sm: 'auto' } }}
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
        entityName="Grupo de Usuário"
      />
    </Box>
  );
}
