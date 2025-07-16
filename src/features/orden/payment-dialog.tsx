import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Loader2, Banknote, CreditCardIcon, Landmark, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { recordPayment } from "./actions";
import { formatCurrency } from "@/lib/utils";
import { useTheme } from "next-themes"; 

const formSchema = z.object({
  amount: z.string().refine(
    (val) => {
      const num = Number.parseFloat(val.replace(/,/g, "."));
      return !isNaN(num) && num > 0;
    },
    { message: "El monto debe ser un número mayor a 0" },
  ),
  paymentMethod: z.string({
    required_error: "Debe seleccionar un método de pago",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string;
  totalAmount: number;
  paidAmount: number;
  userId: string;
}

export function PaymentDialog({
  open,
  onOpenChange,
  serviceOrderId,
  totalAmount,
  paidAmount,
  userId,
}: PaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingAmount = totalAmount - paidAmount;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: pendingAmount > 0 ? pendingAmount.toString() : "",
      paymentMethod: "",
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const amount = Number.parseFloat(values.amount.replace(/,/g, "."));

      const result = await recordPayment(
        serviceOrderId,
        amount,
        values.paymentMethod,
        values.reference || null,
        values.notes || null,
        userId,
      );

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Pago registrado correctamente",
          variant: "success",
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al registrar el pago",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Icon mapping for payment methods
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "CASH":
        return <Banknote className="h-4 w-4" />;
      case "CARD":
        return <CreditCardIcon className="h-4 w-4" />;
      case "TRANSFER":
        return <Landmark className="h-4 w-4" />;
      case "MOBILE_PAYMENT":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const selectedPaymentMethod = form.watch("paymentMethod");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CreditCard className="h-5 w-5 text-primary" />
            </motion.div>
            <span>Registrar Pago</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <motion.div 
            className="bg-primary/10 p-4 rounded-lg flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-sm font-medium text-primary/80">Monto Total</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
          </motion.div>
          <motion.div 
            className="bg-green-500/10 p-4 rounded-lg flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm font-medium text-green-600 dark:text-green-400">Monto Pagado</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(paidAmount)}</p>
          </motion.div>
          {pendingAmount > 0 && (
            <motion.div 
              className="col-span-2 bg-amber-500/10 p-4 rounded-lg flex flex-col"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Saldo Pendiente</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(pendingAmount)}</p>
            </motion.div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Monto a Pagar</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-muted-foreground">$</span>
                      </div>
                      <Input 
                        {...field} 
                        placeholder="0.00" 
                        className="pl-7 transition-all focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-muted-foreground text-sm">
                    Ingrese el monto del pago (use punto o coma para decimales)
                  </FormDescription>
                  <FormMessage className="text-destructive text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Método de Pago</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH" className="flex items-center">
                        <div className="flex items-center">
                          <Banknote className="mr-2 h-4 w-4 text-green-600" />
                          <span>Efectivo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CARD">
                        <div className="flex items-center">
                          <CreditCardIcon className="mr-2 h-4 w-4 text-blue-600" />
                          <span>Tarjeta</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="TRANSFER">
                        <div className="flex items-center">
                          <Landmark className="mr-2 h-4 w-4 text-purple-600" />
                          <span>Transferencia</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MOBILE_PAYMENT">
                        <div className="flex items-center">
                          <Smartphone className="mr-2 h-4 w-4 text-orange-600" />
                          <span>Pago Móvil</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="OTHER">
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4 text-gray-600" />
                          <span>Otro</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-destructive text-sm" />
                </FormItem>
              )}
            />

            <AnimatePresence>
              {selectedPaymentMethod && selectedPaymentMethod !== "CASH" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Referencia</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Número de referencia o confirmación" 
                            className="transition-all focus:ring-2 focus:ring-primary/20"
                          />
                        </FormControl>
                        <FormMessage className="text-destructive text-sm" />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Notas adicionales sobre el pago" 
                      {...field} 
                      rows={2} 
                      className="transition-all resize-none focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage className="text-destructive text-sm" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isSubmitting}
                className="transition-all hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="transition-all"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Registrando...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {selectedPaymentMethod ? (
                      getPaymentMethodIcon(selectedPaymentMethod)
                    ) : (
                      <CreditCard className="mr-2 h-4 w-4" />
                    )}
                    <span className="ml-2">Registrar Pago</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}