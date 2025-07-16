// technician-assignment-dialog.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, UserCheck, Users, UserX, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { assignTechnician, deactivateTechnicianAssignment } from "./actions";
import { getTechnicians } from "../tecnicos/technicians";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  replacements: z.array(
    z.object({
      oldId: z.string().uuid(),
      newId: z.string().uuid()
    })
  ),
  newTechnicians: z.array(z.string().uuid()),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TechnicianAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceOrderId: string;
  currentTechnicianIds: string[];
  userId: string;
  onAssignmentSuccess?: (updatedAssignments: any[]) => void;
}

export function TechnicianAssignmentDialog({
  open,
  onOpenChange,
  serviceOrderId,
  currentTechnicianIds = [],
  userId,
  onAssignmentSuccess,
}: TechnicianAssignmentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [replacementsSearch, setReplacementsSearch] = useState<Record<number, string>>({});
  const [newTechSearch, setNewTechSearch] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      replacements: currentTechnicianIds.map(id => ({ oldId: id, newId: id })),
      newTechnicians: [],
      notes: "",
    },
  });

  const filteredTechniciansForReplacement = useMemo(
    () => (index: number) => {
      const searchQuery = replacementsSearch[index]?.toLowerCase() || '';
      return technicians.filter(tech => 
        tech.name.toLowerCase().includes(searchQuery) &&
        tech.is_active &&
        (tech.id === form.getValues(`replacements.${index}.oldId`) || 
        !currentTechnicianIds.includes(tech.id))
      );
    },
    [technicians, replacementsSearch, currentTechnicianIds, form]
  );

  const filteredNewTechnicians = useMemo(() => {
    const searchQuery = newTechSearch.toLowerCase();
    return technicians.filter(tech => 
      tech.name.toLowerCase().includes(searchQuery) &&
      tech.is_active &&
      !currentTechnicianIds.includes(tech.id) &&
      !form.getValues('newTechnicians').includes(tech.id)
    );
  }, [technicians, newTechSearch, currentTechnicianIds, form]);

  useEffect(() => {
    if (open) {
      form.reset({
        replacements: currentTechnicianIds.map(id => ({ oldId: id, newId: id })),
        newTechnicians: [],
        notes: "",
      });
    }
  }, [open, currentTechnicianIds, form]);

  useEffect(() => {
    const loadTechnicians = async () => {
      setIsLoading(true);
      try {
        const result = await getTechnicians();
        setTechnicians(result.data || []);
      } catch (error) {
        toast({ title: "Error", description: "Error al cargar los técnicos", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    if (open) loadTechnicians();
  }, [open, toast]);

  const getTechnicianName = (id: string) => 
    technicians.find(t => t.id === id)?.name || "Técnico desconocido";

  const handleDirectDeactivate = async (techId: string) => {
    if (processingIds.includes(techId)) return;
    
    setProcessingIds(prev => [...prev, techId]);
    try {
      const result = await deactivateTechnicianAssignment(serviceOrderId, techId, userId);
      if (result.success) {
        const updatedIds = currentTechnicianIds.filter(id => id !== techId);
        form.setValue('replacements', updatedIds.map(id => ({ oldId: id, newId: id })));
        toast({ title: "Éxito", description: `${getTechnicianName(techId)} desactivado`, variant: "default" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al desactivar técnico", variant: "destructive" });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== techId));
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const results = await Promise.all([
        ...values.replacements.filter(r => r.newId !== r.oldId)
          .map(r => assignTechnician(serviceOrderId, r.newId, values.notes, userId, r.oldId)),
        ...values.newTechnicians.map(techId => 
          assignTechnician(serviceOrderId, techId, values.notes, userId, "")
        )
      ]);

      if (results.every(r => r.success)) {
        toast({ title: "Éxito", description: "Asignaciones actualizadas", variant: "default" });
        router.refresh();
        onOpenChange(false);
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al guardar cambios", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = () => {
    const { replacements, newTechnicians } = form.getValues();
    return replacements.some(r => r.newId !== r.oldId) || newTechnicians.length > 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestionar Técnicos
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Instrucciones para los técnicos"
                      rows={2}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {currentTechnicianIds.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm">Técnicos Asignados</FormLabel>
                  <Badge variant="outline" className="text-xs">
                    {currentTechnicianIds.length} activo{currentTechnicianIds.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="border rounded-md">
                  <ScrollArea className="h-48">
                    <div className="p-4 space-y-3">
                      <AnimatePresence initial={false}>
                        {form.getValues('replacements').map((replacement, index) => (
                          <motion.div 
                            key={replacement.oldId}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 mb-1"
                          >
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {getTechnicianName(replacement.oldId)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDirectDeactivate(replacement.oldId)}
                                  disabled={processingIds.includes(replacement.oldId)}
                                  className="text-red-500 hover:bg-red-50 h-7 px-2"
                                >
                                  {processingIds.includes(replacement.oldId) ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <UserX className="h-3.5 w-3.5" />
                                  )}
                                  <span className="ml-1 text-xs">Dar de baja</span>
                                </Button>
                              </div>
                              
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between h-8 text-sm"
                                  >
                                    <span className="truncate">
                                      {replacement.newId === replacement.oldId ? (
                                        "Seleccionar reemplazo..."
                                      ) : (
                                        getTechnicianName(replacement.newId)
                                      )}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                  <Command shouldFilter={false}>
                                    <CommandInput 
                                      placeholder="Buscar técnico..." 
                                      value={replacementsSearch[index] || ''}
                                      onValueChange={(value) => setReplacementsSearch(prev => ({
                                        ...prev,
                                        [index]: value
                                      }))}
                                      className="h-9"
                                    />
                                    <CommandList>
                                      <ScrollArea className="h-48">
                                        <CommandEmpty className="py-2 text-xs">No se encontraron técnicos</CommandEmpty>
                                        <CommandGroup>
                                          {filteredTechniciansForReplacement(index).map((tech) => (
                                            <CommandItem
                                              key={tech.id}
                                              value={tech.id}
                                              onSelect={() => {
                                                form.setValue(`replacements.${index}.newId`, tech.id);
                                                setReplacementsSearch(prev => ({
                                                  ...prev,
                                                  [index]: ''
                                                }));
                                              }}
                                              className="text-sm h-9"
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-3.5 w-3.5",
                                                  tech.id === replacement.newId ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {tech.name}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </ScrollArea>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <FormLabel className="text-sm">Añadir Nuevos Técnicos</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-9"
                  >
                    <div className="flex flex-wrap gap-1">
                      {form.watch('newTechnicians').map(techId => (
                        <Badge 
                          key={techId} 
                          variant="secondary" 
                          className="px-1.5 py-0 text-xs font-medium"
                        >
                          {getTechnicianName(techId)}
                        </Badge>
                      ))}
                      {form.watch('newTechnicians').length === 0 && (
                        <span className="text-sm text-muted-foreground">Seleccionar técnicos...</span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar técnicos..."
                      value={newTechSearch}
                      onValueChange={setNewTechSearch}
                      className="h-9"
                    />
                    <CommandList>
                      <ScrollArea className="h-48">
                        <CommandEmpty className="py-2 text-xs">No se encontraron técnicos</CommandEmpty>
                        <CommandGroup>
                          {filteredNewTechnicians.map((tech) => (
                            <CommandItem
                              key={tech.id}
                              value={tech.id}
                              onSelect={() => {
                                const current = form.getValues('newTechnicians');
                                const newTechs = current.includes(tech.id)
                                  ? current.filter(id => id !== tech.id)
                                  : [...current, tech.id];
                                form.setValue('newTechnicians', newTechs);
                                setNewTechSearch("");
                              }}
                              className="text-sm h-9"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5",
                                  form.watch('newTechnicians').includes(tech.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {tech.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </ScrollArea>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !hasChanges()} className="h-9">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-2 h-4 w-4" />
                )}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}