"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, FileText, CheckCircle, Clock } from "lucide-react";
import { PaymentForm } from "./components/PaymentForm";
import { getFinancialData, updatePaymentStatus, createPayment } from "./actions";
import { toast } from "sonner";

export default function FinanzasPage() {
  const [financialData, setFinancialData] = useState({
    lawyerPayments: [],
    clientBilling: [],
    summary: {}
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      const data = await getFinancialData();
      setFinancialData(data);
    } catch (error) {
      toast.error("Error al cargar datos financieros");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (paymentId, newStatus, type) => {
    try {
      await updatePaymentStatus(paymentId, newStatus, type);
      await loadFinancialData();
      toast.success("Estado actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SOLICITADO":
        return "bg-yellow-100 text-yellow-800";
      case "PAGADO":
        return "bg-green-100 text-green-800";
      case "PAGADO_PARCIAL":
        return "bg-blue-100 text-blue-800";
      case "FACTURADO":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filterPayments = (payments) => {
    if (statusFilter === "ALL") return payments;
    return payments.filter(payment => payment.status === statusFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground">
            Gestión de nóminas y pagos del sistema
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialData.summary.pendingPayments?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {financialData.summary.pendingPaymentsCount} pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación Mensual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialData.summary.monthlyBilling?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Procesados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.summary.processedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abogados Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.summary.activeLawyers}</div>
            <p className="text-xs text-muted-foreground">
              Con pagos pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different payment types */}
      <Tabs defaultValue="lawyers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lawyers">Nómina de Abogados</TabsTrigger>
          <TabsTrigger value="clients">Nómina de Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="lawyers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pagos a Abogados</CardTitle>
                  <CardDescription>
                    Gestión de pagos solicitados por abogados
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                    <SelectItem value="PAGADO">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterPayments(financialData.lawyerPayments).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{payment.lawyerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Expediente: {payment.expedienteNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Solicitado: {new Date(payment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold">${payment.amount.toLocaleString()}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                      {payment.status === "SOLICITADO" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePaymentStatus(payment.id, "PAGADO", "lawyer")}
                        >
                          Marcar como Pagado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Facturación a Clientes</CardTitle>
                  <CardDescription>
                    Gestión de facturación y pagos de clientes
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="SOLICITADO">Solicitado</SelectItem>
                    <SelectItem value="FACTURADO">Facturado</SelectItem>
                    <SelectItem value="PAGADO_PARCIAL">Pagado Parcial</SelectItem>
                    <SelectItem value="PAGADO">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterPayments(financialData.clientBilling).map((billing) => (
                  <div key={billing.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{billing.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          Expediente: {billing.expedienteNumber}
                        </p>
                        {billing.invoiceNumber && (
                          <p className="text-sm text-muted-foreground">
                            Factura: {billing.invoiceNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-bold">${billing.amount.toLocaleString()}</p>
                        <Badge className={getStatusColor(billing.status)}>
                          {billing.status}
                        </Badge>
                      </div>
                      {billing.status === "SOLICITADO" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdatePaymentStatus(billing.id, "FACTURADO", "client")}
                        >
                          Marcar como Facturado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}