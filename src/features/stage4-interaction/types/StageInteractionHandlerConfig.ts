// StageInteraction Handler Configuration Types
// Configuration interface for StageInteractionHandler in Stage5.x Phase integration

type StageInteractionHandlerConfig = {
  // Stage4 coordinator configuration
  coordinator?: any;
  
  // StageInteraction internal bridge configuration  
  stageInteractionBridge?: {
    syncStageInteraction?(): void;
    register?(interaction: any): Promise<void>;
    stageSwitchAction?(currentSection: any, targetSection: any): void;
  };
  
  // StageInteraction alternative types configuration
  stageInteractionAlternative?: any;
  
  // Stage4 StageInteraction handler initialization config
  initConfig?: {
    stageInteractionProperty?: boolean;
    enableStageInteractionBridge?: boolean;
  };
};

export type { StageInteractionHandlerConfig };
