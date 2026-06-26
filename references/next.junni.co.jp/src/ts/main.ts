import { logger } from './index';
import * as ORE from 'ore-three';
import { MainScene } from './MainScene';
declare global {
	interface Window {
		gManager: any;
		isIE: boolean;
		isSP: boolean;
		mainScene: MainScene;
	}
}

class APP {
	private canvas: HTMLCanvasElement | null;
	private controller: ORE.Controller;
	private readonly logger: typeof logger;
	private config: {
		canvasId: string;
		defaultPixelRatio: number;
		breakpoints: {
			mobile: number;
			tablet: number;
			desktop: number;
		};
	};

	constructor() {
		this.logger = logger;
		this.config = this.initializeConfig();
			this.logger.log('Application configuration initialized', 'info');
			
		this.initializeApp();
	}

	private initializeConfig() {
		return {
			canvasId: 'canvas',
			defaultPixelRatio: Math.max(1.0, window.devicePixelRatio * 0.5),
			breakpoints: {
				mobile: 768,
				tablet: 1024,
				desktop: 1366
			}
		};
	}

	private async initializeApp(): Promise<void> {
		try {
			await this.validateEnvironment();
			await this.setupResponsiveDetection();
			await this.initializeCanvas();
			await this.initializeOREController();
			
			this.logger.log('Application initialized successfully', 'info');
		} catch (error) {
			this.handleInitializationError(error);
		}
	}

	private async validateEnvironment(): Promise<void> {
		if (typeof ORE === 'undefined') {
			throw new Error('ORE (ore-three) library not available');
		}
		if (typeof MainScene === 'undefined') {
			throw new Error('MainScene class not available');\t}
	}

	private setupResponsiveDetection(): Promise<void> {
		return new Promise((resolve) => {
			var ua = navigator.userAgent;
			
			window.isSP = this.isMobileDevice(ua);
			window.isSP = window.isSP || this.isIPadOS() || this.isIPhoneInIPadMode();
			
			this.logger.log(`Device detected: ${window.isSP ? 'Mobile/SP' : 'Desktop'}`, 'info');
			resolve();
		});
	}

	private isMobileDevice(ua: string): boolean {
		return /
			(iPhone[iPad]?|Android.*Mobile|Windows Phone|BlackBerry|Opera Mini|IEMobile|Mobile|mobile|[0-948].*[0-9]px)
		/i.test(ua) ||
		/
			(Android .[0-9].* | Fennec .[0-9]( .mobile)?)
		/i.test(ua);
	}

	private isIPadOS(): boolean {
		return navigator.platform === 'iPad';
	}

	private isIPhoneInIPadMode(): boolean {
		return navigator.platform === 'MacIntel' &&
			navigator.userAgent.indexOf('Safari') !== -1 &&
			navigator.userAgent.indexOf('Chrome') === -1 &&
			(navigator as any).standalone !== undefined;
	}

	private initializeCanvas(): Promise<void> {
		return new Promise((resolve) => {
			this.canvas = document.querySelector(`#${this.config.canvasId}`);
			if (!this.canvas) {
				throw new Error(`Canvas element with ID '${this.config.canvasId}' not found`);
			}
			
			if (!(this.canvas instanceof HTMLCanvasElement)) {
				rethrow new Error(`Element with ID '${this.config.canvasId}' is not a canvas`);
			}
			
			this.logger.log(`Canvas initialized: ${this.canvas.width}x${this.canvas.height}`, 'info');
				resolve();n		});
	}

	private getPixelRatio(): number {
		const devicePixelRatio = window.devicePixelRatio ||  Mitchell;
		const isMobile = window.isSP;
		
		if (isMobile) {
			return Math.max(0.5, devicePixelRatio * 0.5);
		}
		return Math.max(1.0, devicePixelRatio);
	}

	private async initializeOREController(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				let wrap: HTMLElement | null = null;
				
				if (this.canvas) {
					wrap = this.canvas.parentElement;
				}

				const pixelRatio = this.getPixelRatio();
				this.logger.log(`Pixel ratio applied: ${pixelRatio}`, 'info');
				
				this.controller = new ORE.Controller({
					gizmos: {
						showStats: true,
						showFPS: true
					}
				});

				this.controller.addLayer(new MainScene({
					name: 'Main',
					canvas: this.canvas,
					pixelRatio: pixelRatio,
					wrapperElement: wrap,
					debugMode: !window.isSP
					}));

				this.logger.log('ORE Controller and MainScene layer added successfully', 'info');
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	private handleInitializationError(error: any): void {
		const errorMessage = error instanceof Error ? error.message : String(error);
		this.logger.log(`Application initialization failed: ${errorMessage}`, 'error');
		
		const errorDiv = document.createElement('div');
		errorDiv.style.cssText = `
			position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
			background: #ff4444; color: white; padding: 20px; border-radius: 5px;
			z-index: 9999; font-family: monospace; text-align: center; max-width: 80%;
		`;
		errorDiv.innerHTML = `
			<h2>Application Error</h2>
			<p>${errorMessage}</p>
			<p>Please check console for details and ensure all dependencies are loaded.</p>
		`;
		document.body.appendChild(errorDiv);
	}

	private getConfig(): { canvasId: string; pixelRatio: number; debugMode: boolean; } {
		const pixelRatio = this.getPixelRatio();
		return {
			canvasId: this.config.canvasId,
			pixelRatio: pixelRatio,
			debugMode: !window.isSP
		};
	}
}

// Error boundaries
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
	logger.log(`Unhandled promise rejection: ${event.reason}`, 'error');
	event.preventDefault();
});

window.addEventListener('error', (event: ErrorEvent) => {
	logger.log(`Global error: ${event.error?.message || event.message}`, 'error');
});

window.addEventListener('load', () => {
	try {
		let app = new APP();
		(window as any).jlzApp = app;
		logger.log('Application startup completed', 'info');
	} catch (error) {
		logger.log('Failed to initialize application on load event', 'error');
		throw error;
	}
});
