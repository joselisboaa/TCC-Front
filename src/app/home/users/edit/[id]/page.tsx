/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

interface UserGroup {
  id: number;
  text: string;
}

interface User {
  id: number;
  phone_number: string;
  email: string;
  user_groups: UserGroup[];
  isAdmin: boolean;
}

export default function EditUser() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<UserGroup[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { data: userData, isLoading: isFetchingUser } = useQuery(
    ["user", id],
    async () => {
      const response = await fetchRequest<null, User>(`/users/${id}`, { method: "GET" });
      return response.body;
    },
    {
      enabled: !!id,
      onError: (error: unknown) => {
        enqueueSnackbar(`Erro ao carregar o usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
        router.push("/home/users");
      },
    }
  );

  const { data: groups = [], isLoading: isFetchingGroups } = useQuery(
    "user_groups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", { method: "GET" });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(`Erro ao carregar grupos: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const adminGroup = groups.find(group => group.text.toLowerCase() === "administrador");

  useEffect(() => {
    if (userData) {
      setPhoneNumber(userData.phone_number || "");
      setEmail(userData.email || "");
      setSelectedGroups(userData.user_groups || []);
      setIsAdmin(userData.isAdmin || false);
    }
  }, [userData, groups]);

  useEffect(() => {
    if (adminGroup) {
      if (isAdmin && !selectedGroups.some(group => group.id === adminGroup.id)) {
        setSelectedGroups([...selectedGroups, adminGroup]);
      } else if (!isAdmin) {
        setSelectedGroups(selectedGroups.filter(group => group.id !== adminGroup.id));
      }
    }
  }, [isAdmin, adminGroup]);

  const handleGroupChange = (event, newValue) => {
    setSelectedGroups(newValue);
    if (adminGroup) {
      setIsAdmin(newValue.some(group => group.id === adminGroup.id));
    }
  };

  const handleAdminToggle = (event) => {
    setIsAdmin(event.target.checked);
  };

  const updateMutation = useMutation(
    async () => {
      await fetchRequest(`/users/${id}`, {
        method: "PUT",
        body: { phone_number: phoneNumber, email, user_groups: selectedGroups, isAdmin },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Usuário atualizado com sucesso!", { variant: "success" });
        router.push("/home/users");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(`Erro ao atualizar o usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const handleSubmit = () => {
    if (!phoneNumber.trim() || !email.trim()) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }
    updateMutation.mutate();
  };

  const handleCancel = () => {
    router.push("/home/users");
  };

  if (isFetchingUser || isFetchingGroups) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Editar Usuário
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes do usuário abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField label="Número de Telefone" fullWidth value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} variant="outlined" />
          <TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} variant="outlined" />

          <Autocomplete
            multiple
            value={selectedGroups}
            onChange={handleGroupChange}
            options={groups}
            getOptionLabel={(option) => option.text}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Selecionar Grupos" fullWidth required />}
          />

          <FormControlLabel
            control={<Switch checked={isAdmin} onChange={handleAdminToggle} color="primary" />}
            label="Usuário Administrador"
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="contained" sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }} onClick={handleCancel}>
              Cancelar
            </Button>
            <Button variant="contained" sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }} onClick={handleSubmit} disabled={updateMutation.isLoading}>
                {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
