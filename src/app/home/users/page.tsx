/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardActions, CardContent, Typography, CircularProgress, Box } from "@mui/material";
import { useSnackbar } from "notistack";
import fetchRequest from "@/utils/fetchRequest";

interface User {
  id: number;
  phone_number: string;
  email: string;
  user_groups: {
    id: number;
    text: string;
  }[];
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetchRequest<null, User[]>("/users", {
          method: "GET",
        });
        setUsers(response.body);
      } catch (error) {
        enqueueSnackbar(
          `Erro ao carregar usuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  async function handleDelete(id: number) {
    try {
      setLoading(true);
      await fetchRequest<null, null>(`/users/${id}`, {
        method: "DELETE",
      });
      enqueueSnackbar("Usuário removido com sucesso!", { variant: "success" });
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (error) {
      enqueueSnackbar(
        `Erro ao excluir usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  }

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
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ display: "grid", gap: 2 }}>
        {users.map((user) => (
          <Card key={user.id} variant="outlined" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 2 }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div">
                {user.email}
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
                onClick={() => handleDelete(user.id)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : "Excluir"}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
