"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper, useMediaQuery } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import fetchRequest from "@/utils/fetchRequest";

const schema = yup.object().shape({
  text: yup.string().trim().required("O nome do grupo é obrigatório"),
  description: yup.string().trim().optional(),
});

export default function EditUserGroup() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();
  const isDesktop = useMediaQuery('(min-width:600px)');

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { text: "", description: "" },
  });

  const { data, isLoading: isFetching } = useQuery(
    ["userGroup", id],
    async () => {
      const response = await fetchRequest<null, { text: string; description: string }>(`/user-groups/${id}`, {
        method: "GET",
      });
      return response.body;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setValue("text", data.text);
        setValue("description", data.description);
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar o grupo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/user-group");
      },
    }
  );

  const updateMutation = useMutation(
    async (formData: { text: string; description?: string }) => {
      await fetchRequest(`/user-groups/${id}`, {
        method: "PUT",
        body: formData,
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Grupo atualizado com sucesso!", { variant: "success" });
        router.push("/home/user-group");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao atualizar grupo: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const onSubmit = async (data: { text: string; description?: string }) => {
    await updateMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    router.push("/home/user-group");
  };

  if (isFetching) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 2, sm: 4 }
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          ...(isDesktop && {
            backgroundColor: "white",
            borderRadius: 3,
            boxShadow: 4,
            padding: 4
          })
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE", fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Editar Grupo
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os dados do grupo de acessibilidade abaixo.
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
                error={!!errors.description}
                helperText={errors.description?.message}
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
                width: { xs: '100%', sm: '11rem' },
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
              variant="contained"
              type="submit"
              sx={{
                background: "linear-gradient(135deg, #7E57C2, #5E3BEE)",
                color: "#FFF",
                width: { xs: '100%', sm: '11rem' },
                fontWeight: "bold",
                padding: "10px",
                borderRadius: "8px",
                "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
              }}
              disabled={isSubmitting || updateMutation.isLoading}
            >
              {isSubmitting || updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
