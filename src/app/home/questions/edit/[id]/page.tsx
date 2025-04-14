"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper, Autocomplete } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";

interface UserGroup {
  id: number;
  text: string;
  description?: string;
}

interface Question {
  id: number;
  text: string;
  last_change: string;
  user_groups: UserGroup[];
}


const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da questão é obrigatório"),
  userGroups: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.number().required(),
        text: yup.string().required(),
      })
    )
    .min(1, "Selecione ao menos um grupo de usuários")
    .required("O grupo de usuários é obrigatório"),
});

export default function EditQuestion() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { text: "", userGroups: [] },
  });

  const { data: userGroups, isLoading: isFetchingUserGroups } = useQuery<UserGroup[]>(
    "userGroups",
    async (): Promise<UserGroup[]> => {
      const response = await fetchRequest<null, UserGroup[]>("/user-groups", { method: "GET" });
      return response.body;
    },
    {
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar grupos de usuários: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const { data: questionData, isLoading: isFetchingQuestion } = useQuery<Question>(
    ["question", id],
    async (): Promise<Question> => {
      const response = await fetchRequest<null, Question>(`/questions/${id}`, { method: "GET" });
      return response.body;
    },
    {
      enabled: !!id && !!userGroups,
      onSuccess: (data) => {
        setValue("text", data.text);
        const matchedGroups = data.user_groups.map(group =>
          userGroups?.find(g => g.id === group.id)
        ).filter(Boolean) as UserGroup[];
        setValue("userGroups", matchedGroups);
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar a questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/questions");
      },
    }
  );

  const updateMutation = useMutation(
    async (data: {text: string, userGroups: UserGroup[]}) => {
      await fetchRequest(`/questions/${id}`, {
        method: "PUT",
        body: { 
          text: data.text,
          user_group_ids: data.userGroups.map((group) => group.id),
        },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Questão atualizada com sucesso!", { variant: "success" });
        router.push("/home/questions");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao atualizar questão: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        { variant: "error" });
      },
    }
  );

  if (isFetchingQuestion || isFetchingUserGroups || getValues("userGroups").length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", height: "fit" }}>
      <Paper elevation={4} sx={{ padding: 4, width: "100%", maxWidth: 420, borderRadius: 3, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE" }}>
          Editar Questão
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os dados da questão abaixo.
        </Typography>

        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Controller
              name="text"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Texto da Questão" fullWidth variant="outlined" error={!!errors.text} helperText={errors.text?.message} />
              )}
            />

            <Controller
              name="userGroups"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  options={userGroups || []}
                  getOptionLabel={(option) => option.text}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Grupos de Usuários"
                      fullWidth
                      variant="outlined"
                      error={!!errors.userGroups}
                      helperText={(errors.userGroups as any)?.message}
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
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
