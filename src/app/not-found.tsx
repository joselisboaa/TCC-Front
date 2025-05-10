"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@mui/material"

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (countdown === 0) {
      router.push("/")
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router])

  return (
    <main
      className="flex flex-col items-center justify-center h-screen px-4 text-center bg-background text-foreground"
      role="main"
    >
      <h1 className="text-4xl font-bold mb-4" tabIndex={-1}>
        Página não encontrada
      </h1>

      <p className="text-lg mb-2" role="alert">
        A página que você tentou acessar não existe.
      </p>

      <p className="mb-6" aria-live="assertive">
        Redirecionando para a página inicial em {countdown} segundo{countdown !== 1 ? "s" : ""}.
      </p>

      <Button
        onClick={() => router.push("/")}
        aria-label="Voltar imediatamente para a página inicial"
      >
        Ir para a página inicial agora
      </Button>
    </main>
  )
}
