'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, startOfToday, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useSessionUser } from '@/hooks/use-session-user';
import type { Room, Doctor, Booking, AddBookingResult } from '@/lib/types';
import { generateTimeSlots, formatMinutesToTime, cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Loader2, Lightbulb, UserCircle } from 'lucide-react';
import Link from 'next/link';

const bookingFormSchema = z.object({
  doctorId: z.string().min(1, { message: 'Debe seleccionar un doctor.' }),
  date: z.date({ required_error: 'Debe seleccionar una fecha.' }),
  startMin: z.coerce.number().min(1, { message: 'Debe seleccionar hora de inicio.' }),
  endMin: z.coerce.number().min(1, { message: 'Debe seleccionar hora de fin.' }),
}).refine(data => data.endMin > data.startMin, {
  message: 'La hora de fin debe ser posterior a la de inicio.',
  path: ['endMin'],
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  doctors: Doctor[];
  bookings: Booking[];
  onAddBooking: (data: any) => Promise<AddBookingResult>;
  lockedDoctorId?: string;
}

export function BookingModal({ isOpen, onClose, room, doctors, onAddBooking, lockedDoctorId }: BookingModalProps) {
  const { user, isLoading: isUserLoading } = useSessionUser();
  const { toast } = useToast();
  const [view, setView] = useState<'form' | 'suggestions'>('form');
  const [suggestions, setSuggestions] = useState<{ startMin: number, endMin: number }[]>([]);
  const [conflictReason, setConflictReason] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Memoize today to prevent infinite render loops in useEffect
  // Use a stable reference that updates if the day actually changes
  const today = useMemo(() => startOfToday(), []);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date: today,
      doctorId: '',
      startMin: 0,
      endMin: 0,
    }
  });

  const selectedDate = form.watch('date');
  const doctorOptions = lockedDoctorId ? doctors.filter(d => d.id === lockedDoctorId) : doctors;

  // timeSlots calculation depends on selectedDate and current actual time
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    // We use a new Date() here inside the factory which is fine as it's triggered by selectedDate change
    return generateTimeSlots(selectedDate, 30, new Date());
  }, [selectedDate]);

  useEffect(() => {
    if (isOpen) {
      // Logic to find sensible default slots when modal opens
      const now = new Date();
      const slotsForToday = generateTimeSlots(today, 30, now);
      
      const firstAvailable = slotsForToday.length > 0 ? slotsForToday[0].value : 480; // 8:00 AM
      const secondAvailable = slotsForToday.length > 1 ? slotsForToday[1].value : firstAvailable + 60; // +1 hour

      form.reset({ 
        date: today, 
        doctorId: lockedDoctorId || '', 
        startMin: firstAvailable, 
        endMin: secondAvailable 
      });
      setView('form');
      setSuggestions([]);
      setIsLoading(false);
    }
    // Only run when isOpen transitions to true to avoid loops with form internal state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  async function onSubmit(data: BookingFormValues) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sesión requerida",
        description: "Debe iniciar sesión para poder realizar una reserva.",
      });
      return;
    }

    setIsLoading(true);
    const result = await onAddBooking({ ...data, roomId: room.id });
    setIsLoading(false);

    if (result.success) {
      toast({
        title: "Reserva Creada",
        description: `El consultorio ${room.name} ha sido reservado.`,
      });
      onClose();
    } else if (result.suggestions && result.suggestions.length > 0) {
      setSuggestions(result.suggestions);
      setConflictReason(result.reason);
      setView('suggestions');
    } else {
      toast({
        variant: "destructive",
        title: "Error de Reserva",
        description: result.message || "No se pudo crear la reserva debido a un conflicto irresoluble.",
      });
    }
  }

  const handleSelectSuggestion = (suggestion: { startMin: number; endMin: number }) => {
    form.setValue('startMin', suggestion.startMin, { shouldValidate: true });
    form.setValue('endMin', suggestion.endMin, { shouldValidate: true });
    setView('form');
  };

  if (isOpen && !isUserLoading && !user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">Acceso Restringido</DialogTitle>
            <DialogDescription>Solo el personal autorizado puede realizar reservas.</DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-4 text-center">
            <UserCircle className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hemos detectado una sesión activa o el permiso necesario. Por favor, inicia sesión para continuar.
            </p>
            <Link href="/admin" className="w-full">
              <Button className="w-full">Ir a Acceso Staff</Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{view === 'form' ? `Apartar ${room.name}`: 'Sugerencias de Horario'}</DialogTitle>
           {view === 'form' && <DialogDescription>Complete los detalles para la nueva reserva.</DialogDescription>}
        </DialogHeader>

        {view === 'form' ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""} disabled={!!lockedDoctorId}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Seleccione un doctor" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doctorOptions.map(doc => <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen} modal>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccione una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-auto p-0 z-[60]" 
                      align="start"
                      onInteractOutside={(e) => e.preventDefault()}
                    >
                      <Calendar 
                        mode="single" 
                        selected={field.value} 
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }
                        }}
                        disabled={{ before: today }}
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startMin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inicio</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {timeSlots.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}
                      {timeSlots.length === 0 && <SelectItem value="0" disabled>Sin horarios disponibles</SelectItem>}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="endMin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fin</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {timeSlots.map(t => <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>)}
                      {timeSlots.length === 0 && <SelectItem value="0" disabled>Sin horarios disponibles</SelectItem>}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading || isUserLoading || !user || timeSlots.length === 0} className="bg-primary hover:bg-primary/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Reserva
              </Button>
            </DialogFooter>
          </form>
        </Form>
        ) : (
          <div className="space-y-4">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>¡Conflicto de Horario Detectado!</AlertTitle>
              <AlertDescription>{conflictReason || "El horario seleccionado se traslapa con otra reserva."}</AlertDescription>
            </Alert>
            <p className="text-sm font-medium text-foreground">Aquí hay algunas alternativas sugeridas por nuestra IA:</p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <Button key={i} variant="outline" className="w-full justify-start" onClick={() => handleSelectSuggestion(s)}>
                  <Clock className="mr-2 h-4 w-4" />
                  {formatMinutesToTime(s.startMin)} - {formatMinutesToTime(s.endMin)}
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setView('form')}>Volver al formulario</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
