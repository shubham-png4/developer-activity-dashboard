from crewai import Task

class SupportTasks:
    def classification_task(self, agent, ticket_text: str) -> Task:
        """
        Task 1: Evaluates customer sentiment, urgency, and categorizes the ticket.
        """
        return Task(
            description=(
                f"Analyze the following customer support ticket:\n\n"
                f"\"{ticket_text}\"\n\n"
                f"1. Identify the core issue.\n"
                f"2. Classify the category as either 'Technical', 'Billing', or 'General'.\n"
                f"3. Determine the urgency level as 'High', 'Medium', or 'Low'."
            ),
            expected_output=(
                "A clean summary specifying the Category, Urgency level, and a 1-sentence breakdown of the core issue."
            ),
            agent=agent
        )

    def execution_task(self, agent, ticket_text: str) -> Task:
        """
        Task 2: Uses the categorization results from Task 1 to draft an appropriate email reply.
        """
        return Task(
            description=(
                f"Review the original customer ticket:\n\"{ticket_text}\"\n\n"
                f"Using the category and urgency evaluated in the previous task, draft a full, professional, "
                f"and empathetic email response directly addressing the user's issue."
            ),
            expected_output=(
                "A complete markdown-formatted email response including Subject Line, Salutation, Body, and Sign-off."
            ),
            agent=agent
        )