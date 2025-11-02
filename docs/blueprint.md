# **App Name**: Magang By BERAN

## Core Features:

- User Authentication: Secure user login with Firebase Authentication, supporting different user roles (Admin, SPV, Sales).
- Sales Data Aggregation: Aggregate sales data from multiple Google Sheets based on user role and sales code assignments managed in Firestore. This feature utilizes Google Sheets API to retrieve and combine data.
- Admin Dashboard: CRUD operations for users and projects including assigning sales codes to salespersons. Read performance summaries for all projects.
- SPV Dashboard: Dashboard displaying performance summaries for the Sales team managed by the supervisor.
- Sales Dashboard: Dashboard displaying individual sales performance data aggregated from relevant Google Sheets, filtered by salesCode. Provide a 'refresh' button.
- Data Caching: Implement a caching mechanism (either on the client-side PWA or in a Firebase Cloud Function) to temporarily store data fetched from Google Sheets, with periodic refresh options to maintain data freshness.
- Role Based Access Control: Enforce role-based access control using Firebase Security Rules to ensure users can only access data relevant to their roles.

## Style Guidelines:

- Primary color: Deep blue (#1A237E) to evoke trust and professionalism.
- Background color: Light gray (#F5F5F5), subtly desaturated from the primary blue to provide a clean backdrop.
- Accent color: Vibrant orange (#FF9800) to highlight key actions and metrics, drawing attention to important data points.
- Body and headline font: 'Inter', a sans-serif, will be used for both headings and body text for its modern and readable appearance.
- Use a consistent set of professional icons from a library like Material Design Icons to represent different data types and actions.
- A clean, modern layout with clear sections for each role, optimized for both desktop and mobile devices using a responsive design approach. The dashboard uses cards and tables for organized data presentation.
- Subtle animations, such as loading spinners and smooth transitions, to enhance user experience and provide feedback during data loading or interaction.