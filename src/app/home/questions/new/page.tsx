"use client";

import { useRouter } from "next/navigation";
import { Box, Button, TextField, Autocomplete, CircularProgress, Typography, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import fetchRequest from "@/utils/fetchRequest";

export interface UserGroup {
  id: number;
  text: string;
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da questão é obrigatório"),
  userGroup: yup
    .object()
    .shape({
      id: yup.number().required(),
      text: yup.string().required(),
    })
    .test("valid-user-group", "O grupo de usuários é obrigatório", (value) => {
      return value && value.id !== 0 && value.text.trim() !== "";
    })
    .required("O grupo de usuários é obrigatório"),
});

export default function CreateQuestion() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { text: "", userGroup: { id: 0, text: ""} },  
  });

  const { data: userGroups, isLoading: loadingGroups } = useQuery<UserGroup[]>(
    "userGroups",
    async () => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", { method: "GET" });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar grupos de usuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const saveQuestionMutation = useMutation(
    async (data: { text: string; userGroup: UserGroup }) => {
      await fetchRequest("/questions", {
        method: "POST",
        body: { text: data.text, user_group_id: data.userGroup.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Questão salva com sucesso!", { variant: "success" });
        reset();
        router.push("/home/questions");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao salvar questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const onSubmit = async (data: { text: string; userGroup: UserGroup }) => {
    await saveQuestionMutation.mutateAsync(data);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Criar Nova Questão
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Preencha os detalhes da questão abaixo.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <Controller
            name="text"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Texto da questão" fullWidth variant="outlined" error={!!errors.text} helperText={errors.text?.message} />
            )}
          />

          <Controller
            name="userGroup"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={userGroups || []}
                getOptionLabel={(option) => option.text}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingGroups}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar Grupo de Usuários"
                    fullWidth
                    error={!!errors.userGroup}
                    helperText={errors.userGroup?.message}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingGroups ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }}
              onClick={() => router.push("/home/questions")}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              type="submit"
              sx={{ background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } }}
              disabled={isSubmitting || saveQuestionMutation.isLoading}
            >
              {isSubmitting || saveQuestionMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
