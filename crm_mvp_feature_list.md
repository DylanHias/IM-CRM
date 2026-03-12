# CRM MVP Feature List

## MVP Feature List

### 1. Customer Management
- View customer list
- Open customer detail page
- See basic customer information synced from Dynamics 365

### 2. Contact Management
- View contact persons linked to a customer
- See contact details
- Add or edit contact notes if allowed

### 3. Activity Logging
- Log meetings
- Log visits
- Log calls
- Add free-text notes
- Link each activity to a customer and optional contact

### 4. Training Overview
- View trainings followed by the customer
- See training name
- See training date
- See participant if available

### 5. Follow-Up Tracking
- Create next actions / follow-ups
- Add due date
- Mark follow-up as completed
- Link follow-up to customer and activity

### 6. Customer Timeline
- Show activities in chronological order
- Show trainings in the same customer history view
- Show follow-ups in context

### 7. Search and Filtering
- Search customers
- Filter by customer owner if needed
- Filter customers by recent activity or no recent activity

### 8. Sync
- Sync customer data from Dynamics 365
- Sync training data from third-party API
- Push locally created activities and follow-ups to the API if required
- Show last sync time
- Show sync errors

### 9. Offline / Local Usage
- Store synced data locally
- Allow viewing customer records offline
- Allow creating activities offline
- Sync pending changes when connection returns

### 10. Security
- User login
- Secure API authentication
- Secure local storage of sensitive data

## Strict MVP Screens
- Login screen
- Customer list
- Customer detail page
- Add activity form
- Follow-up / task form
- Sync status view

## Must-Have Data Entities
- Customer
- Contact
- Activity
- Training
- Follow-up
- Sync record / status

## Out of Scope for MVP
- Opportunity tracking
- Advanced dashboards
- Relationship maps
- Email/calendar integration
- AI summaries
- Visit route planning
- Complex reporting

## MVP Definition
A local-first desktop app that lets a BDM view customers, contacts, activities, and trainings, log new interactions, track follow-ups, and sync with Dynamics 365 and a third-party API.
