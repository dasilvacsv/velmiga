import React from "react"
import { User } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ClientInfoCardProps {
  client: any
}

export function ClientInfoCard({ client }: ClientInfoCardProps) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          Información del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <h3 className="font-medium text-muted-foreground">Nombre</h3>
          <p className="font-medium">{client.name}</p>
        </div>

        {client.document && (
          <div>
            <h3 className="font-medium text-muted-foreground">Documento</h3>
            <p>{client.document}</p>
          </div>
        )}

        {client.phone && (
          <div>
            <h3 className="font-medium text-muted-foreground">Teléfono</h3>
            <p>{client.phone}</p>
          </div>
        )}

        {client.email && (
          <div>
            <h3 className="font-medium text-muted-foreground">Email</h3>
            <p>{client.email}</p>
          </div>
        )}

        {client.address && (
          <div>
            <h3 className="font-medium text-muted-foreground">Dirección</h3>
            <p>{client.address}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-full justify-start hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
        >
          <Link href={`/clientes/${client.id}`} className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Ver perfil completo
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}