import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { XCircle, RefreshCw, Calendar, Loader2 } from "lucide-react";

const cancelFormSchema = z.object({
  cancellationNotes: z.string().min(10, "Debe incluir al menos 10 caracteres").optional(),
  cancellationType: z.enum(["permanent", "reschedule", "revert"]),
  fechaAgendado: z.date().optional().nullable(),
});

type CancelFormValues = z.infer<typeof cancelFormSchema>;

interface CancellationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string;
  userId: string;
  isCancelled: boolean;
  onSubmit: (values: CancelFormValues) => Promise<void>;
  isLoading: boolean;
}

export function CancellationDialog({
  open,
  onOpenChange,
  serviceOrderId,
  userId,
  isCancelled,
  onSubmit,
  isLoading
}: CancellationDialogProps) {
  const cancelForm = useForm<CancelFormValues>({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: {
      cancellationNotes: undefined, // Cambiado a undefined por defecto
      cancellationType: isCancelled ? "revert" : "permanent",
      fechaAgendado: null,
    },
  });

  const selectedCancellationType = cancelForm.watch("cancellationType");

  const handleSubmit = async (values: CancelFormValues) => {
    if (isCancelled) {
      values.cancellationNotes = undefined;
    }
    await onSubmit(values);
  };

  // Reset form cuando el diálogo se abre/cierra
  React.useEffect(() => {
    if (open) {
      cancelForm.reset({
        cancellationNotes: isCancelled ? undefined : "", // Asegurar undefined al reactivar
        cancellationType: isCancelled ? "revert" : "permanent",
        fechaAgendado: null,
      });
    }
  }, [open, isCancelled, cancelForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 text-red-600 dark:text-red-400">
            {isCancelled ? (
              <>
                <RefreshCw className="h-5 w-5" />
                Reactivar Orden
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5" />
                Cancelar Orden
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...cancelForm}>
          <form onSubmit={cancelForm.handleSubmit(handleSubmit)} className="space-y-5">
            {!isCancelled && (
              <FormField
                control={cancelForm.control}
                name="cancellationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground flex items-center gap-1">
                      Razón de Cancelación
                      <span className="text-destructive text-sm">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explique el motivo de la cancelación"
                        {...field}
                        className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Es necesario indicar la razón por la que se cancela la orden
                    </FormDescription>
                    <FormMessage className="text-destructive text-sm" />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={cancelForm.control}
              name="cancellationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de {isCancelled ? "Reactivación" : "Cancelación"}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {isCancelled ? (
                        <div className="flex items-center space-x-2 p-3 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <RadioGroupItem value="revert" id="revert" className="text-blue-600" />
                          <Label htmlFor="revert" className="flex items-center cursor-pointer w-full">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mr-3">
                              <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-300">Reactivar Orden</p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">La orden volverá a estar activa con su estado anterior</p>
                            </div>
                          </Label>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            <RadioGroupItem value="permanent" id="permanent" className="text-red-600" />
                            <Label htmlFor="permanent" className="flex items-center cursor-pointer w-full">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </div>
                              <div>
                                <p className="font-medium text-red-800 dark:text-red-300">Cancelación Permanente</p>
                                <p className="text-sm text-red-600 dark:text-red-400">La orden será cancelada definitivamente</p>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 p-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                            <RadioGroupItem value="reschedule" id="reschedule" className="text-amber-600" />
                            <Label htmlFor="reschedule" className="flex items-center cursor-pointer w-full">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 mr-3">
                                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <p className="font-medium text-amber-800 dark:text-amber-300">Cancelar y Reprogramar</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">La orden se reprogramará para otra fecha</p>
                              </div>
                            </Label>
                          </div>
                        </>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCancellationType === "reschedule" && (
              <FormField
                control={cancelForm.control}
                name="fechaAgendado"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-foreground flex items-center gap-1">
                      Nueva Fecha de Agenda
                      <span className="text-destructive text-sm">*</span>
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        date={field.value || undefined}
                        setDate={(date) => field.onChange(date)}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>
                      Seleccione la nueva fecha y hora para reprogramar la orden
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || 
                  (!isCancelled && !cancelForm.getValues("cancellationNotes")) || 
                  (selectedCancellationType === "reschedule" && !cancelForm.getValues("fechaAgendado"))}
                className={
                  isCancelled ? "bg-blue-600 hover:bg-blue-700 text-white" :
                  selectedCancellationType === "permanent" ? 
                    "bg-red-600 hover:bg-red-700 text-white" : 
                    "bg-amber-600 hover:bg-amber-700 text-white"
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isCancelled ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : selectedCancellationType === "permanent" ? (
                  <XCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                {isCancelled ? "Reactivar Orden" :
                 selectedCancellationType === "permanent" ? "Cancelar Orden" : "Reprogramar Orden"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}