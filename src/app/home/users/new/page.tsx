/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery } from "react-query";
import fetchRequest from "@/utils/fetchRequest";

interface UserGroup {
  id: number;
  text: string;
}

export default function CreateUser() {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { data: userGroups = [] } = useQuery<UserGroup[]>(
    "userGroups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", { method: "GET" });
      return response.body;
    },
    { staleTime: Infinity }
  );

  const adminGroup = userGroups.find((group) => group.text.toLowerCase() === "administrador");

  const handleGroupChange = (_event: React.SyntheticEvent, newValue: UserGroup[]) => {
    const newGroupIds = newValue.map((group) => group.id);
    setSelectedGroupIds(newGroupIds);
    if (adminGroup) {
      setIsAdmin(newGroupIds.includes(adminGroup.id));
    }
  };

  const handleAdminToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsAdmin(checked);

    if (checked && adminGroup?.id && !selectedGroupIds.includes(adminGroup.id)) {
      setSelectedGroupIds([...selectedGroupIds, adminGroup.id]);
    } else if (!checked) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== adminGroup?.id));
    }
  };

  const handleSubmit = async () => {
    if (!phoneNumber.trim() || !email.trim() || !password.trim() || selectedGroupIds.length === 0) {
      enqueueSnackbar("Preencha todos os campos", { variant: "warning" });
      return;
    }

    try {
      setLoading(true);
      await fetchRequest("/users", {
        method: "POST",
        body: {
          phone_number: phoneNumber,
          email,
          password,
          user_groups: selectedGroupIds.map((id) => ({ id })),
        },
      });

      enqueueSnackbar("Usuário criado com sucesso!", { variant: "success" });
      router.push("/home/users");
    } catch (error) {
      enqueueSnackbar(
        `Erro ao criar usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/home/users");
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Criar Usuário
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os detalhes do usuário abaixo.
        </Typography>

        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField label="Número de Telefone" fullWidth value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} variant="outlined" />
          <TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} variant="outlined" />
          <TextField label="Senha" fullWidth type="password" value={password} onChange={(e) => setPassword(e.target.value)} variant="outlined" />

          <Autocomplete
            multiple
            options={userGroups}
            getOptionLabel={(option) => option.text}
            value={userGroups.filter((group) => selectedGroupIds.includes(group.id))}
            onChange={handleGroupChange}
            renderInput={(params) => <TextField {...params} label="Grupos de Usuário" fullWidth variant="outlined" />}
          />

          <FormControlLabel
            control={<Switch checked={isAdmin} onChange={handleAdminToggle} color="primary" />}
            label="Administrador"
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="contained" sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }} onClick={handleCancel}>
              Cancelar
            </Button>
            <Button variant="contained" sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }} onClick={handleSubmit} disabled={loading}>
              {loading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
