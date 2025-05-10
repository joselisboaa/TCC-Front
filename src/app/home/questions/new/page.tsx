"use client";

import { useRouter } from "next/navigation";
import { Box, Button, TextField, Autocomplete, CircularProgress, Typography, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import fetchRequest from "@/utils/fetchRequest";
import { useMediaQuery } from "@mui/material";

export interface UserGroup {
  id: number;
  text: string;
}

export interface Answer {
  id: number;
  text: string;
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


export default function CreateQuestion() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const isDesktop = useMediaQuery('(min-width:600px)');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Form>({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      userGroups: [],
      answers: [],
    },
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

  const saveQuestionMutation = useMutation(
    async (data: Form) => {
      await fetchRequest("/questions", {
        method: "POST",
        body: {
          text: data.text,
          user_group_ids: data.userGroups.map((user_group) => user_group.id), 
          answer_ids: data.answers.map((answer) => answer.id),
        },
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

  const onSubmit = async (data: Form) => {
    await saveQuestionMutation.mutateAsync(data);
  };


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
            name="userGroups"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                multiple
                options={userGroups || []}
                getOptionLabel={(option) => option.text}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loadingGroups}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar Grupos de Usuários"
                    fullWidth
                    error={!!errors.userGroups}
                    helperText={
                      Array.isArray(errors.userGroups)
                        ? errors.userGroups[0]?.message
                        : (errors.userGroups as any)?.message
                    }
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
              disabled={isSubmitting || saveQuestionMutation.isLoading}
            >
              {isSubmitting || saveQuestionMutation.isLoading ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
