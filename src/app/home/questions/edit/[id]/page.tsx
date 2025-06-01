"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Paper, Autocomplete } from "@mui/material";
import { useSnackbar } from "notistack";
import { useMutation, useQuery } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";
import { useMediaQuery } from "@mui/material";

interface UserGroup {
  id: number;
  text: string;
  description?: string;
}

export interface Answer {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  last_change: string;
  user_groups: UserGroup[];
  answers: Answer[];
}

interface Form {
  text: string; 
  userGroups: UserGroup[], 
  answers: Answer[]
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
  answers: yup
      .array()
      .of(yup.object().shape(
        { 
          id: yup.number().required(), 
          text: yup.string().required() 
        }))
      .min(1, "Selecione ao menos uma resposta")
      .required("A resposta é obrigatória"),
});

export default function EditQuestion() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();
  const isDesktop = useMediaQuery('(min-width:600px)');
  const [isQuestionInitialized, setIsQuestionInitialized] = useState(false);

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

  const { data: answers, isLoading: loadingAnswers } = useQuery<Answer[]>(
    "answers",
    async () => {
      const response = await fetchRequest<null, Answer[]>("/answers", { method: "GET" });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(
          `Erro ao carregar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
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
        const matchedGroups = data.user_groups.map(group =>
          userGroups?.find(g => g.id === group.id)
        ).filter(Boolean) as UserGroup[];

        const matchedAnswers = data.answers.map(answer =>
          answers?.find(g => g.id === answer.id)
        ).filter(Boolean) as Answer[];

        setValue("text", data.text);
        setValue("userGroups", matchedGroups);
        setValue("answers", matchedAnswers);
        setIsQuestionInitialized(true);
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
    async (data: Form) => {
      console.log(data)
      await fetchRequest(`/questions/${id}`, {
        method: "PUT",
        body: { 
          text: data.text,
          user_group_ids: data.userGroups.map((group) => group.id),
          answer_ids: data.answers.map((answer) => answer.id),
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

  if (isFetchingQuestion || isFetchingUserGroups || !isQuestionInitialized) {
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
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: "#5E3BEE", fontSize: { xs: '1.5rem', sm: '2rem' } }}>
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

            <Controller
              name="answers"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  options={answers || []}
                  getOptionLabel={(option) => option.text}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={loadingAnswers}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Selecionar Respostas"
                      fullWidth
                      error={!!errors.answers}
                      helperText={
                        Array.isArray(errors.answers)
                          ? errors.answers[0]?.message
                          : (errors.answers as any)?.message
                      }
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingAnswers ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
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
                onClick={() => router.push("/home/questions")}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                type="submit"
                sx={{ 
                  background: "linear-gradient(135deg, #7E57C2, #5E3BEE)", 
                  color: "#FFF", 
                  fontWeight: "bold", 
                  width: { xs: '100%', sm: '11rem' }, 
                  padding: "10px", 
                  borderRadius: "8px", 
                  "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" } 
                }}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
              </Button>
            </Box>
          </Box>
        </form>
      </Box>
    </Box>
  );
}
