'use server';

/**
 * @fileOverview A flow for identifying potential scheduling conflicts and suggesting alternative time slots.
 *
 * - automatedConflictResolution - A function that handles the conflict resolution process.
 * - AutomatedConflictResolutionInput - The input type for the automatedConflictResolution function.
 * - AutomatedConflictResolutionOutput - The return type for the automatedConflictResolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedConflictResolutionInputSchema = z.object({
  roomId: z.string().describe('The ID of the room.'),
  dateKey: z.string().describe('The date key in YYYY-MM-DD format.'),
  startMin: z.number().describe('The start time in minutes from the beginning of the day.'),
  endMin: z.number().describe('The end time in minutes from the beginning of the day.'),
  doctorId: z.string().describe('The ID of the doctor.'),
});
export type AutomatedConflictResolutionInput = z.infer<
  typeof AutomatedConflictResolutionInputSchema
>;

const SuggestedSlotSchema = z.object({
  startMin: z.number().describe('Suggested start time in minutes from the beginning of the day.'),
  endMin: z.number().describe('Suggested end time in minutes from the beginning of the day.'),
});

const AutomatedConflictResolutionOutputSchema = z.object({
  hasConflict: z.boolean().describe('Whether a conflict exists.'),
  suggestedSlots: z.array(SuggestedSlotSchema).describe('Suggested alternative time slots.'),
  reason: z.string().optional().describe('Reason for the conflict, if any.'),
});

export type AutomatedConflictResolutionOutput = z.infer<
  typeof AutomatedConflictResolutionOutputSchema
>;

export async function automatedConflictResolution(
  input: AutomatedConflictResolutionInput
): Promise<AutomatedConflictResolutionOutput> {
  return automatedConflictResolutionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatedConflictResolutionPrompt',
  input: {schema: AutomatedConflictResolutionInputSchema},
  output: {schema: AutomatedConflictResolutionOutputSchema},
  prompt: `You are an AI assistant designed to identify potential scheduling conflicts and suggest alternative time slots.

  Given the following booking details, determine if there is a conflict with existing bookings.

  Room ID: {{{roomId}}}
  Date: {{{dateKey}}}
  Proposed Start Time: {{{startMin}}} (minutes from the beginning of the day)
  Proposed End Time: {{{endMin}}} (minutes from the beginning of the day)
  Doctor ID: {{{doctorId}}}

  Consider that bookings cannot overlap within the same room and must fall within the same day.

  If a conflict exists, provide a reason and suggest up to 3 alternative time slots, each with a start and end time, that avoid the conflict.

  If there is no conflict, indicate that no conflict exists and do not provide alternative time slots.
  Return the output in JSON format. Be concise.
  `,
});

const automatedConflictResolutionFlow = ai.defineFlow(
  {
    name: 'automatedConflictResolutionFlow',
    inputSchema: AutomatedConflictResolutionInputSchema,
    outputSchema: AutomatedConflictResolutionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
