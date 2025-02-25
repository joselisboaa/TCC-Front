/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";

interface Answer {
  id: number;
  text: string;
}

interface Orientation {
  id: number;
  text: string;
  value: number;
  answer: Answer;
}

interface FormData {
  text: string;
  value: number;
  answer: Answer;
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da orientação é obrigatório"),
  value: yup.number().typeError("O peso deve ser um número").required("O peso da orientação é obrigatório"),
  answer: yup
    .object()
    .shape({
      id: yup.number().required(),
      text: yup.string().required(),
    })
    .test("valid-answer", "A resposta é obrigatória", (value) => {
      return value && value.id !== 0 && value.text.trim() !== "";
    })
    .required("A resposta é obrigatória"),
});


export default function EditOrientation() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();

  const { control, handleSubmit, getValues, setValue, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      text: "",
      answer: { id: 0, text: "" },
    },
  });

  const { data: orientationData, isLoading: isFetchingOrientation } = useQuery(
    ["orientation", id],
    async () => {
      const response = await fetchRequest<null, Orientation>(
        `/orientations/${id}`,
        { method: "GET" }
      );


      setValue("text", response.body.text);
      setValue("value", response.body.value);
      setValue("answer", response.body.answer);

      return response.body;
    },
    {
      enabled: !!id,
      onError: (error: unknown) => {
        enqueueSnackbar(`Erro ao carregar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
        router.push("/home/orientations");
      },
    }
  );

  const { data: answers, isLoading: isFetchingAnswers } = useQuery(
    "answers",
    async () => {
      const response = await fetchRequest<null, Answer[]>("/answers", { method: "GET" });
      return response.body;
    },
    {
      onError: (error: unknown) => {
        enqueueSnackbar(`Erro ao carregar respostas: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const updateMutation = useMutation(
    async (data: FormData) => {
      await fetchRequest(`/orientations/${id}`, {
        method: "PUT",
        body: { text: data.text, value: data.value, answer_id: data.answer?.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Orientação atualizada com sucesso!", { variant: "success" });
        router.push("/home/orientations");
      },
      onError: (error: unknown) => {
        enqueueSnackbar(`Erro ao atualizar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isFetchingAnswers || isFetchingOrientation || getValues("answer.id") === 0) {
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
          Editar Orientação
        </Typography>
        <Typography variant="body2" sx={{ color: "#666", marginBottom: 2 }}>
          Atualize os detalhes da orientação abaixo.
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: "grid", gap: 2 }}>
          <Controller
            name="text"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Texto da Orientação" fullWidth variant="outlined" error={!!errors.text} helperText={errors.text?.message} />
            )}
          />

          <Controller
            name="value"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Peso da Orientação" type="number" fullWidth variant="outlined" error={!!errors.value} helperText={errors.value?.message} />
            )}
          />

          <Controller
            name="answer"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={answers || []}
                getOptionLabel={(option) => option.text}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={isFetchingAnswers}
                onChange={(_, newValue) => field.onChange(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Selecionar Resposta" fullWidth error={!!errors.answer} helperText={errors.answer?.message} />
                )}
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
                variant="contained"
                sx={{ backgroundColor: "#D32F2F", color: "#FFF", fontWeight: "bold", width: "11rem", padding: "10px", borderRadius: "8px", "&:hover": { backgroundColor: "#B71C1C" } }}
                onClick={() => router.push("/home/orientations")}
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
      </Paper>
    </Box>
  );
}
