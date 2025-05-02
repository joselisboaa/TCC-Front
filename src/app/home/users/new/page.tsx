"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import fetchRequest from "@/utils/fetchRequest";
import { useMediaQuery } from "@mui/material";

interface UserGroup {
  id: number;
  text: string;
}

interface UserForm {
  name?: string;
  phone_number: string;
  email: string;
  user_groups: UserGroup[];
  isAdmin: boolean;
}

const schema = yup.object({
  name: yup.string().optional(),
  phone_number: yup.string().matches(/^(?:\([1-9]{2}\)|[1-9]{2})[-.\s]?9?[6-9]\d{3}[-.\s]?\d{4}$/, "Formato do telefone deve ser: (99) 99999-9999").required("Número de telefone é obrigatório"),
  email: yup.string().email("Email inválido").required("Email é obrigatório"),
  user_groups: yup.array().of(
    yup.object({
      id: yup.number().required(),
      text: yup.string().required(),
    })
  ).min(1, "Selecione pelo menos um grupo").required(),
  isAdmin: yup.boolean().default(false),
});

export default function CreateUser() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const isDesktop = useMediaQuery('(min-width:600px)');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      phone_number: "",
      email: "",
      user_groups: [],
      isAdmin: false,
    },
  });

  const { data: userGroups = [], isFetching: isFetchingGroups } = useQuery(
    "userGroups",
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

  const adminGroup = userGroups.find((group) => group.text.toLowerCase() === "administrador");

  useEffect(() => {
    const selectedGroups = watch("user_groups") as UserGroup[];
    if (adminGroup) {
      const isAdmin = selectedGroups.some((group) => group.id === adminGroup.id);
      setValue("isAdmin", isAdmin);
    }
  }, [watch("user_groups"), adminGroup]);

  const createMutation = useMutation(
    async (formData: UserForm) => {
      await fetchRequest("/users", {
        method: "POST",
        body: formData,
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Usuário criado com sucesso!", { variant: "success" });
        router.push("/home/users");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao criar usuário: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const onSubmit = (data: UserForm) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push("/home/users");
  };

  if (isFetchingGroups) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "fit",
      p: { xs: 2, sm: 4 }
    }}>
      <Box sx={{ 
        width: "100%", 
        maxWidth: 420, 
        textAlign: "center",
        ...(isDesktop && {
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: 4,
          padding: 4
        })
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Criar Usuário
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os detalhes do usuário abaixo.
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
                options={userGroups}
                noOptionsText="Nenhum grupo encontrado"
                getOptionLabel={(option) => option.text}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => {
                  field.onChange(newValue);
                  if (adminGroup) {
                    const isAdmin = newValue.some((group) => group.id === adminGroup.id);
                    setValue("isAdmin", isAdmin);
                  }
                }}
                renderInput={(params) => <TextField {...params} label="Selecionar Grupos" fullWidth error={!!errors.user_groups} helperText={errors.user_groups?.message} />}
              />
            )}
          />

          <Controller
            name="isAdmin"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    {...field}
                    checked={field.value}
                    color="primary"
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (adminGroup) {
                        const selectedGroups = watch("user_groups") as UserGroup[];
                        if (e.target.checked) {
                          if (!selectedGroups.some((group) => group.id === adminGroup.id)) {
                            setValue("user_groups", [...selectedGroups, adminGroup]);
                          }
                        } else {
                          setValue("user_groups", selectedGroups.filter((group) => group.id !== adminGroup.id));
                        }
                      }
                    }}
                  />
                }
                label="Usuário Administrador"
              />
            )}
          />

          <Box sx={{ 
            display: "flex", 
            gap: 2, 
            justifyContent: "center",
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button 
              variant="contained" 
              sx={{ 
                backgroundColor: "#D32F2F", 
                color: "#FFF", 
                fontWeight: "bold", 
                width: { xs: '100%', sm: '11rem' }, 
                padding: "10px", 
                borderRadius: "8px", 
                "&:hover": { backgroundColor: "#B71C1C" } 
              }} 
              onClick={handleCancel}
            >
              Cancelar
            </Button>            
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ 
                background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", 
                color: "#FFF", 
                fontWeight: "bold", 
                width: { xs: '100%', sm: '11rem' }, 
                padding: "10px", 
                borderRadius: "8px", 
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } 
              }} 
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}