# **App Name**: ClinicWise

## Core Features:

- Real-time Room Status: Display the current status (Occupied, Reserved, Free) of each consulting room in real-time, updating dynamically as bookings change.
- Appointment Scheduling: Enable users to create, edit, and cancel appointments, with validation to prevent overlapping bookings within the same consulting room. Uses Cloud Functions to ensure data integrity.
- Role-Based Access Control: Implement role-based access control (Admin, Doctor) using Firebase Authentication and Custom Claims or a users collection to restrict access to features and data based on user roles.
- Doctor-Specific Agenda: Allow doctors to view their personal agendas, showing only the appointments assigned to them. This helps doctors easily manage their schedules.
- Automated conflict resolution: The AI tool will identify potential scheduling conflicts or overlaps based on existing booking data, providing suggestions for resolution or alternative time slots during the booking process.
- Check-in/Check-out Functionality: Implement check-in and check-out functionality to update the appointment status and track room usage in real time. Admin can force changes in status.
- Admin Dashboard: Provide an admin dashboard with CRUD operations for doctors and bookings, enabling comprehensive management of the clinic's scheduling system.

## Style Guidelines:

- Primary color: A calming blue (#5DADE2) to evoke a sense of trust and reliability.
- Background color: Light blue (#E0F7FA), providing a clean and professional backdrop.
- Accent color: A warm orange (#F39C12) to highlight important actions and call-to-action elements.
- Body font: 'PT Sans', a modern, friendly, sans-serif font, suitable for the main body text and UI elements.
- Headline font: 'Space Grotesk', a modern sans-serif, to complement PT Sans, especially well-suited for titles, headers, and labels.
- Use clear, consistent icons from a library like Material Design Icons to represent different appointment types, statuses, and actions.
- Design the main dashboard as a responsive grid to accommodate different screen sizes, ensuring that each consulting room's status is clearly visible at a glance.
- Incorporate subtle animations, like smooth transitions when updating appointment statuses, to enhance the user experience and provide visual feedback.