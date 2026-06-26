// Stage4 Interaction Handler - Integration Implementation
// Integration orchestrator for StageInteractionHandler coordination

import type { IStageInteraction } from './interfaces/IStageInteraction';
import { StageInteractionHandler } from './StageInteractionHandler';

export class StageInteractionIntegration {
  private stageInteractionHandler: StageInteractionHandler;
  private stageInteractionHandlers: IStageInteraction[];
  
  constructor(config: any = {}) {
    this.stageInteractionHandler = new StageInteractionHandler(config);
    this.stageInteractionHandlers = [];
    
    // Register the main StageInteractionHandler
    this.registerStageInteraction(this.stageInteractionHandler);
    console.log('StageInteractionIntegration: Initialized and configured');
  }
  
  public registerStageInteraction(interaction: IStageInteraction): void {
    this.stageInteractionHandlers.push(interaction);
    console.log('StageInteractionIntegration: Registered interaction');
  }
  
  public syncStageInteraction(): void {
    this.stageInteractionHandlers.forEach(handler => {
      handler.syncStageInteraction();
    });
    console.log('StageInteractionIntegration: Synchronized all interactions');
  }
  
  public triggerStageSwitch(currentSection: any, targetSection: any): void {
    this.stageInteractionHandlers.forEach(handler => {
      handler.stageSwitchAction(currentSection, targetSection);
    });
    console.log('StageInteractionIntegration: Triggered stage switch');
  }
  
  public getStageInteractionHandler(): StageInteractionHandler {
    return this.stageInteractionHandler;
  }
  
  public configureIntegration(config: any): void {
    console.log('StageInteractionIntegration: Configuration applied');
    this.stageInteractionHandler.updateStageInteractionConfiguration(config);
  }
  
  public getIntegrationStatus(): any {
    return {
      handlerCount: this.stageInteractionHandlers.length,
      configured: true
    };
  }
}

export { StageInteractionIntegration };
