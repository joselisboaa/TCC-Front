"use client";

import { useRouter } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import fetchRequest from "@/utils/fetchRequest";

const schema = yup.object({
  text: yup.string().required("Nome do grupo é obrigatório"),
  description: yup.string().optional(),
});

export default function CreateUserGroup() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      description: "",
    },
  });

  const createMutation = useMutation(
    async (formData) => {
      await fetchRequest("/user-groups", {
        method: "POST",
        body: formData,
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Grupo criado com sucesso!", { variant: "success" });
        router.push("/home/user-group");
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao criar grupo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const onSubmit = (data) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    router.push("/home/user-group");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <Paper
        elevation={4}
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Criar Grupo
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os campos abaixo para criar um novo grupo de acessibilidade.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <Controller
            name="text"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Nome do Grupo"
                fullWidth
                variant="outlined"
                error={!!errors.text}
                helperText={errors.text?.message}
              />
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Descrição"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#D32F2F",
                color: "#FFF",
                width: "11rem",
                fontWeight: "bold",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { backgroundColor: "#B71C1C" },
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
                width: "11rem",
                fontWeight: "bold",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
              }}
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
