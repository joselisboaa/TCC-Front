/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import fetchRequest from "@/utils/fetchRequest";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

interface UserGroup {
  id: number;
  text: string;
}

interface User {
  id: number;
  name?: string;
  phone_number: string;
  email: string;
  user_groups: UserGroup[];
  isAdmin: boolean;
}

const schema = yup.object({
  name: yup.string().optional(),
  phone_number: yup.string().required("Número de telefone é obrigatório"),
  email: yup.string().email("Email inválido").required("Email é obrigatório"),
  user_groups: yup.array().min(1, "Selecione pelo menos um grupo"),
  isAdmin: yup.boolean(),
});

export default function EditUser() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      phone_number: "",
      email: "",
      user_groups: [],
      isAdmin: false,
    },
  });

  const { data: userData, isFetching: isFetchingUser } = useQuery(
    ["user", id],
    async () => {
      const response = await fetchRequest<null, User>(`/users/${id}`, { method: "GET" });
      return response.body;
    },
    {
      enabled: !!id,
      initialData: () => ({ phone_number: "", email: "", user_groups: [], isAdmin: false }),
      onSuccess: (data) => {
        setValue("name", data.name || "");
        setValue("phone_number", data.phone_number);
        setValue("email", data.email);
        setValue("user_groups", data.user_groups);
        setValue("isAdmin", data.isAdmin);
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao carregar o usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
        router.push("/home/users");
      },
    }
  );

  const { data: groups = [], isFetching: isFetchingGroups } = useQuery(
    "user_groups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", { method: "GET" });
      return response.body;
    },
    {
      onError: (error) => {
        enqueueSnackbar(`Erro ao carregar grupos: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const adminGroup = groups.find((group) => group.text.toLowerCase() === "administrador");

  useEffect(() => {
    const selectedGroups = watch("user_groups");
    if (adminGroup) {
      const isAdmin = selectedGroups.some((group) => group.id === adminGroup.id);
      setValue("isAdmin", isAdmin);
    }
  }, [watch("user_groups"), adminGroup]);

  const updateMutation = useMutation(
    async (formData) => {
      await fetchRequest(`/users/${id}`, {
        method: "PUT",
        body: formData,
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Usuário atualizado com sucesso!", { variant: "success" });
        router.push("/home/users");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao atualizar o usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const onSubmit = (data) => {
    updateMutation.mutate(data);
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

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Nome" fullWidth variant="outlined" error={!!errors.name} helperText={errors.name?.message} />
            )}
          />
          
          <Controller
            name="phone_number"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Número de Telefone" fullWidth variant="outlined" error={!!errors.phone_number} helperText={errors.phone_number?.message} />
            )}
          />

          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Email" fullWidth variant="outlined" error={!!errors.email} helperText={errors.email?.message} />
            )}
          />

          <Controller
            name="user_groups"
            control={control}
            render={({ field }) => (
              <Autocomplete
                multiple
                {...field}
                options={groups}
                getOptionLabel={(option) => option.text}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderInput={(params) => <TextField {...params} label="Selecionar Grupos" fullWidth error={!!errors.user_groups} helperText={errors.user_groups?.message} />}
              />
            )}
          />

          <Controller
            name="isAdmin"
            control={control}
            render={({ field }) => (
              <FormControlLabel control={<Switch {...field} checked={field.value} color="primary" />} label="Usuário Administrador" />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="contained" sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }} onClick={handleCancel}>
              Cancelar
            </Button>            
            <Button type="submit" variant="contained" sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }} disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
