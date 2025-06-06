
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addRoom, updateRoom } from '@/lib/data';
import type { Room, Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const roomFormSchema = z.object({
  name: z.string().min(3, "Room name must be at least 3 characters long."),
  locationId: z.string().min(1, "Location is required."),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface RoomFormDialogProps {
  isOpen: boolean;
  onClose: (updated: boolean) => void;
  room?: Room; 
  locations: Location[];
  defaultLocationId?: string;
}

export function RoomFormDialog({ isOpen, onClose, room, locations, defaultLocationId }: RoomFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: room?.name || '',
      locationId: room?.locationId || defaultLocationId || (locations.length > 0 ? locations[0].id : ''),
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: room?.name || '',
        locationId: room?.locationId || defaultLocationId || (locations.length > 0 ? locations[0].id : ''),
      });
      setIsSubmitting(false);
    }
  }, [isOpen, room, locations, defaultLocationId, form]);

  const onSubmit = async (data: RoomFormValues) => {
    if (locations.length === 0) {
        toast({ title: "Error", description: "No locations available. Please add a location first.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      if (room) {
        const success = await updateRoom({ ...room, name: data.name, locationId: data.locationId });
        if (success) {
          toast({ title: "Room Updated", description: "The room has been successfully updated." });
          onClose(true);
        } else {
           toast({ title: "Error", description: "Failed to update room. Please try again.", variant: "destructive" });
        }
      } else {
        const newRoom = await addRoom(data.name, data.locationId);
        if (newRoom) {
          toast({ title: "Room Added", description: "The new room has been successfully added." });
          onClose(true);
        } else {
          toast({ title: "Error", description: "Failed to add room. Please try again.", variant: "destructive" });
        }
      }
    } catch (error) {
        toast({ title: "Error", description: "An unexpected error occurred while saving the room.", variant: "destructive" });
        console.error("Failed to save room:", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(false); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary">{room ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={locations.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={locations.length > 0 ? "Select a location" : "No locations available"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {locations.length === 0 && <FormMessage>Please add a location first in the 'Locations' section.</FormMessage>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sunrise Suite" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || locations.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {room ? 'Save Changes' : 'Add Room'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
