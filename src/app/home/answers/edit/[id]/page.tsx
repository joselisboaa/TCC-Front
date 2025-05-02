"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper, FormControlLabel, Switch, useMediaQuery } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";

interface UserGroup {
  id: number;
  text: string;
}

interface Question {
  id: number;
  text: string;
  user_groups?: UserGroup[];
}

interface Answer {
  text: string;
  questions: Question[];
  other: boolean;
  value: number;
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da resposta é obrigatório"),
  questions: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.number().required("A questão é obrigatória"),
        text: yup.string().required("A questão é obrigatória"),
      })
    )
    .min(1, "Selecione pelo menos uma pergunta")
    .required("A pergunta é obrigatória"),
  other: yup.boolean().required("O campo outros é obrigatório"),
  value: yup.number().required("O valor é obrigatório").typeError("O valor deve ser um número"),
});


export default function EditAnswer() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();
  const isDesktop = useMediaQuery('(min-width:600px)');

  const { control, getValues, handleSubmit, setValue, formState: { errors } } = useForm<Answer>({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      questions: [{ 
        id: 0, 
        text: "",
        user_groups: [{ text: "" }]
      }],
      other: false,
      value: 0
    },
  });
  

  const { data: questions, isLoading: isFetchingQuestions } = useQuery(
    "questions",
    async () => {
      const response = await fetchRequest<null, Question[]>("/questions", { method: "GET" });
      return response.body;
    },
    {
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  const { data: answerData, isLoading: isFetchingAnswer } = useQuery(
    ["answer", id],
    async () => {
      const response = await fetchRequest<null, { text: string; questions: Question[]; question_id: number; other: boolean, value: number }>(
        `/answers/${id}`,
        { method: "GET" }
      );
      return response.body;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setValue("text", data.text);
        setValue("other", data.other);
        setValue("value", data.value);
        setValue("questions", data.questions.map(question => ({
          id: question.id,
          text: question.text,
          user_group: { id: question.user_groups, text: "" },
          last_change: ""
        })));
      
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao carregar a resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
        router.push("/home/answers");
      },
    }
  );

  const updateMutation = useMutation(
    async (data: Answer) => {
      await fetchRequest(`/answers/${id}`, {
        method: "PUT",
        body: { text: data.text, question_id: data.questions.map(q => q.id), other: data.other, value: data.value },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Resposta atualizada com sucesso!", { variant: "success" });
        router.push("/home/answers");
      },
      onError: (error) => {
        enqueueSnackbar(
          `Erro ao atualizar a resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          { variant: "error" }
        );
      },
    }
  );

  if (isFetchingAnswer || isFetchingQuestions || getValues('questions.0.id') === 0) {
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
      padding: { xs: 2, sm: 4 }
    }}>
      <Box sx={{ 
        width: "100%",
        maxWidth: { xs: "100%", sm: "50vw" },
        textAlign: "center",
        ...(isDesktop && {
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: 4,
          padding: 4
        })
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          color: "#5E3BEE",
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          Editar Resposta
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes da resposta abaixo.
        </Typography>

        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <Controller
              name="text"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Texto da Resposta" fullWidth variant="outlined" error={!!errors.text} helperText={errors.text?.message} />
              )}
            />

            <Controller
              name="questions"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  options={questions || []}
                  getOptionLabel={(option) => option.text}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  loading={isFetchingQuestions}
                  sx={{
                    '& .MuiAutocomplete-tag': {
                      maxWidth: '100%',
                      margin: '2px',
                      '& .MuiChip-label': {
                        whiteSpace: 'normal'
                      }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      sx={{
                        ".MuiInputBase-root": {
                          flexWrap: "wrap",
                          alignItems: "flex-start",
                          minHeight: "80px",
                        }
                      }}
                      label="Selecionar Perguntas"
                      error={!!errors.questions}
                      helperText={errors.questions?.message}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isFetchingQuestions ? <CircularProgress size={20} /> : null}
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
              name="value"
              control={control}
              render={({ field }) => <TextField {...field} label="Valor da Resposta" fullWidth variant="outlined" error={!!errors.value} helperText={errors.value?.message}/>}
            />

            <Controller
              name="other"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} color="primary" />} label="Outros" />
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
                  width: { xs: "100%", sm: "11rem" }, 
                  padding: "10px", 
                  borderRadius: "8px", 
                  "&:hover": { backgroundColor: "#B71C1C" } 
                }}
                onClick={() => router.push("/home/answers")}
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
                  width: { xs: "100%", sm: "11rem" }, 
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
