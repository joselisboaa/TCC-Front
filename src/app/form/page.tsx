"use client";
import fetchRequest from "@/utils/fetchRequest";
import { useEffect, useState } from "react";
import { 
  Container, Paper, Typography, FormControl, FormControlLabel, 
  RadioGroup, Radio, Button, CircularProgress, TextField
} from "@mui/material";
import Cookies from "js-cookie";
import { jwtVerify } from "jose";

interface Answer {
  id: number;
  text: string;
  other: boolean;
  question_id: number;
}

interface Question {
  id: number;
  text: string;
  user_group_id: number;
  answers: Answer[];
}

interface User {
  id: number;
  phone_number: string;
  email: string;
  password: string;
  user_groups: { id: number; text: string; description: string }[];
};

export default function DynamicForm() {
  const [formData, setFormData] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, Answer | null>>({});
  const [otherResponses, setOtherResponses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    async function getUserIdFromToken() {
      const token = Cookies.get("jwt");
      if (!token) return;

      try {
        const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        const user = payload.user as User;

        setUserId(user.id);
      } catch (error) {
        console.error("Erro ao validar JWT:", error);
      }
    }

    getUserIdFromToken();
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;

      try {
        const res = await fetchRequest<any, { body: Question[] }>(`/users/${userId}/form`);
        
        if (Array.isArray(res.body)) {
          setFormData(res.body);

          const initialAnswers: Record<number, Answer | null> = {};
          res.body.forEach((question) => {
            initialAnswers[question.id] = null;
          });
          setSelectedAnswers(initialAnswers);
        } else {
          setFormData([]);
        }
      } catch (error) {
        console.error("Erro ao carregar o formulário:", error);
        setFormData([]);
      } finally {
        setLoading(false);
      }
    }      

    fetchData();
  }, [userId]);

  const handleAnswerChange = (questionId: number, answer: Answer) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    if (answer.other) {
      setOtherResponses((prev) => ({
        ...prev,
        [answer.id]: "",
      }));
    } else {
      setOtherResponses((prev) => {
        const updated = { ...prev };
        delete updated[answer.id];
        return updated;
      });
    }
  };

  const handleOtherTextChange = (answerId: number, text: string) => {
    setOtherResponses((prev) => ({
      ...prev,
      [answerId]: text,
    }));
  };

  const handleClear = () => {
    setSelectedAnswers({});
    setOtherResponses({});
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
  
    if (Object.values(selectedAnswers).some((answer) => answer === null)) {
      alert("Por favor, responda todas as perguntas.");
      setSubmitting(false);
      return;
    }
  
    const requestBody = {
      answers: Object.values(selectedAnswers).map((answer) => ({
        id: answer!.id,
        text: answer!.text,
        other: answer!.other,
        question_id: formData.find(q => q.answers.some(a => a.id === answer!.id))?.id || null,
      })),
      user_id: userId,
      other_answers: {},
    };
  
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
  
    try {
      await fetchRequest("/responses", {
        method: "POST",
        body: requestBody,
      });
      alert("Respostas enviadas com sucesso!");
    } catch (error) {
      alert("Erro ao enviar respostas.");
      console.error("Erro ao enviar respostas:", error);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Container maxWidth="sm" className="flex items-center justify-center h-fit">
      <Paper elevation={3} className="p-6 w-full">
        {loading ? (
          <div className="flex justify-center">
            <CircularProgress color="secondary" />
          </div>
        ) : formData.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <Typography id="form-title" variant="h5" className="mb-5" gutterBottom>
              Questionário
            </Typography>
            {formData.map((question) => (
              <div key={question.id} className="mb-4">
                <Typography variant="h6" gutterBottom>
                  {question.text}
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={selectedAnswers[question.id]?.id ?? ""}
                    onChange={(e) => {
                      const selectedAnswer = question.answers.find(
                        (a) => a.id === Number(e.target.value)
                      );
                      if (selectedAnswer) {
                        handleAnswerChange(question.id, selectedAnswer);
                      }
                    }}
                  >
                    {question.answers.map((answer) => (
                      <div key={answer.id}>
                        <FormControlLabel
                          value={answer.id}
                          control={<Radio sx={{ color: "#7E57C2" }} />}
                          label={answer.text}
                        />
                        {answer.other && selectedAnswers[question.id]?.id === answer.id && (
                          <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Digite sua resposta"
                            value={otherResponses[answer.id] || ""}
                            onChange={(e) => handleOtherTextChange(answer.id, e.target.value)}
                            sx={{ mt: 1 }}
                          />
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
              </div>
            ))}
            <div className="my-2 mt-16">
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #7E57C2, #5E3BEE)",
                  color: "#FFF",
                  fontWeight: "bold",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  "&:hover": { background: "linear-gradient(135deg, #5E3BEE, #7E57C2)" },
                }}
                type="submit"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={20} sx={{ color: "#FFF" }} /> : "Salvar"}
              </Button>
              <Button
                variant="contained"
                sx={{
                  background: "red", 
                  mt: 2,
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                }}
                onClick={handleClear}
              >
                Limpar
              </Button>
            </div>
          </form>
        ) : (
          <Typography color="error">Erro ao carregar o formulário.</Typography>
        )}
      </Paper>
    </Container>
  );
}
