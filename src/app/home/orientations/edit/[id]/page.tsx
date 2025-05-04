"use client";

import { useRouter, useParams } from "next/navigation";
import { Box, Button, TextField, Typography, CircularProgress, Autocomplete, Paper } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQuery, useMutation } from "react-query";
import { useForm, Controller } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import fetchRequest from "@/utils/fetchRequest";
import { useMediaQuery } from "@mui/material";


interface Question {
  id: number;
  text: string;
  user_group: { text: string };
}

interface Orientation {
  id: number;
  text: string;
  threshold: number;
  question_id: number;
  question: {
    id: number;
    text: string;
    user_group_id: number;
    user_group: { id: number; text: string; description: string };
  };
}

interface FormData {
  text: string;
  question: {
    id: number;
    text: string;
  };
  threshold: number;
}

const schema = yup.object().shape({
  text: yup.string().trim().required("O texto da orientação é obrigatório"),
  threshold: yup.number().typeError("O peso deve ser um número").required("O peso da orientação é obrigatório"),
  question: yup
    .object()
    .shape({
      id: yup.number().moreThan(0, "Selecione uma pergunta válida").required(),
      text: yup.string().required(),
    })
    .required("A pergunta é obrigatória"),
});

export default function EditOrientation() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { id }: any = useParams();
  const isDesktop = useMediaQuery('(min-width:600px)');

  const { control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      text: "",
      threshold: 0,
      question: { id: 0, text: "" }
    },
  });

  const { data: orientationData, isLoading: isFetchingOrientation } = useQuery(
    ["orientation", id],
    async () => {
      const response = await fetchRequest<null, Orientation>(`/orientations/${id}`, { method: "GET" });
      return response.body;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setValue("text", data.text);
        setValue("question", data.question);
        setValue("threshold", data.threshold);
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao carregar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
        router.push("/home/orientations");
      },
    }
  );

  const { data: questions, isLoading: isFetchingQuestions } = useQuery("questions", async () => {
    const response = await fetchRequest<null, Question[]>("/questions", { method: "GET" });
    return response.body;
  }, {
    onError: (error) => {
      enqueueSnackbar(`Erro ao carregar perguntas: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
    },
  });

  const updateMutation = useMutation(
    async (data: FormData) => {
      await fetchRequest(`/orientations/${id}`, {
        method: "PUT",
        body: { text: data.text, threshold: data.threshold, question_id: data.question.id },
      });
    },
    {
      onSuccess: () => {
        enqueueSnackbar("Orientação atualizada com sucesso!", { variant: "success" });
        router.push("/home/orientations");
      },
      onError: (error) => {
        enqueueSnackbar(`Erro ao atualizar a orientação: ${error instanceof Error ? error.message : "Erro desconhecido"}`, { variant: "error" });
      },
    }
  );

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isFetchingOrientation || isFetchingQuestions || getValues("question.id") === 0) {
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
        maxWidth: { xs: "100%", sm: "420px" },
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
              <TextField {...field} label="Texto" fullWidth error={!!errors.text} helperText={errors.text?.message} />
            )}
          />

          <Controller name="threshold" control={control} render={({ field }) => (
            <TextField {...field} label="Peso" type="number" fullWidth error={!!errors.threshold} helperText={errors.threshold?.message} />
          )} />
          
          <Controller
            name="question"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                options={questions || []}
                getOptionLabel={(option) => option?.text || ""}
                noOptionsText="Nenhuma pergunta encontrada"
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_, newValue) => field.onChange(newValue || null)}
                renderInput={(params) => <TextField {...params} label="Selecionar a Pergunta" error={!!errors.question} helperText={errors.question?.message} fullWidth />}
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
                width: { xs: "100%", sm: "11rem" }, 
                padding: "10px", 
                borderRadius: "8px", 
                "&:hover": { backgroundColor: "#B71C1C" } 
              }}
              onClick={() => router.push("/home/orientations")}
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
      </Box>
    </Box>
  );
}