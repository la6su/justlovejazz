// Stage4 Interaction Handler Interface
// IStageInteraction defines the Stage4 coordination interface
// for Stage5.x Phase integration with StageInteractionHandler

export interface IStageInteraction {
  // Stage interaction sync mechanism
  syncStageInteraction(): void;
  
  // StageInteraction coordination registration  
  register(interaction: IStageInteraction): Promise<void>;
  
  // StageInteraction based coordination control
  stageSwitchAction(currentSection: any, targetSection: any): void;
  
  // Stage4 StageInteractionHandler substitution functionality
  stageInteraction?: IStageInteraction;
  
  // Stage4 StageManager integration support
  stageManager?: any;
  
  // Stage4 StageInteraction alternative - unified StageInteraction interface
  unifiedStageInteraction?: IStageInteraction;
}
