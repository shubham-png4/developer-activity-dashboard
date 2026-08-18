import os
import yaml
from crewai import Agent

class SupportAgents:
    def __init__(self):
        # Resolve path to config/agents.yaml relative to this file
        base_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(base_dir, '../config/agents.yaml')
        
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)

    def classifier(self) -> Agent:
        """Instantiates the ticket classification agent."""
        return Agent(
            role=self.config['classifier_agent']['role'],
            goal=self.config['classifier_agent']['goal'],
            backstory=self.config['classifier_agent']['backstory'],
            verbose=True,
            allow_delegation=False
        )

    def responder(self) -> Agent:
        """Instantiates the customer response drafting agent."""
        return Agent(
            role=self.config['responder_agent']['role'],
            goal=self.config['responder_agent']['goal'],
            backstory=self.config['responder_agent']['backstory'],
            verbose=True,
            allow_delegation=False
        )