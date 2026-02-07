/**
 * SOM Metadata - Quick Reference for All Screen Object Models
 *
 * This file provides a concise summary of all SOM files for AI analysis.
 * AI MUST keep this file updated when any SOM file changes.
 *
 * Structure:
 * - screenName: Screen identifier
 * - screenCodePath: Path to actual screen code
 * - navigableScreens: Screens reachable from this screen
 * - flows: Available flows with metadata
 * - identifyingSelector: Primary selector for screen detection (from SOM)
 *
 * Update Rules:
 * - When creating/updating SOM: Update this file immediately
 * - Keep entries concise (use abbreviations, omit verbose descriptions)
 * - Use flow names as keys (not full descriptions)
 * - Include only essential metadata (userType, envVars, expectedNavigation)
 */

export interface FlowMetadata {
	userType?: 'new' | 'returning' | 'existing_new';
	envVars?: Record<string, string>; // e.g., {phoneNumber: 'ENV_VAR_NAME'}
	expectedNavigation?: string[];
	keywords?: string[];
}

export interface FlowInfo {
	steps: string[]; // Abbreviated step descriptions
	metadata?: FlowMetadata;
}

export interface ScreenMetadata {
	screenName: string;
	screenCodePath: string;
	navigableScreens: string[];
	flows: Record<string, FlowInfo | string[]>; // Flow name -> steps or FlowInfo
	identifyingSelector: string; // Primary selector for screen detection
}

/**
 * Complete SOM Metadata Registry
 * Maps screen names to their metadata for quick AI analysis
 */
export const SOM_METADATA: Record<string, ScreenMetadata> = {
	Landing: {
		screenName: 'Landing',
		screenCodePath: 'src/features/auth/screens/LandingScreen.tsx',
		navigableScreens: ['VerifyOtp', 'Terms', 'Home'],
		flows: {
			'register new user with phone number': {
				steps: [
					'dismiss ATT popup if present',
					'tap country dropdown',
					'filter country list (Pakistan)',
					'select first country',
					'enter phone {NEW_USER_PHONE_NUMBER}',
					'tap continue → VerifyOtp',
				],
				metadata: {
					userType: 'new',
					envVars: {phoneNumber: 'NEW_USER_PHONE_NUMBER'},
					expectedNavigation: ['VerifyOtp'],
					keywords: ['new user', 'create profile', 'register', 'sign up', 'registration'],
				},
			},
			'login with phone number for returning user': {
				steps: [
					'dismiss ATT popup if present',
					'tap country dropdown',
					'filter country list (Pakistan)',
					'select first country',
					'enter phone {EXISTING_USER_PHONE_NUMBER}',
					'tap continue → VerifyOtp',
				],
				metadata: {
					userType: 'returning',
					envVars: {phoneNumber: 'EXISTING_USER_PHONE_NUMBER'},
					expectedNavigation: ['VerifyOtp'],
					keywords: ['returning user', 'existing user', 'login', 'sign in'],
				},
			},
			'login with phone number for existing new user': {
				steps: [
					'dismiss ATT popup if present',
					'tap country dropdown',
					'filter country list (Pakistan)',
					'select first country',
					'enter phone {EXISTING_NEW_USER_PHONE_NUMBER}',
					'tap continue → VerifyOtp',
				],
				metadata: {
					userType: 'existing_new',
					envVars: {phoneNumber: 'EXISTING_NEW_USER_PHONE_NUMBER'},
					expectedNavigation: ['VerifyOtp'],
					keywords: ['login', 'login as new user', 'existing new user', 'new user login'],
				},
			},
		},
		identifyingSelector: 'phone-number-add:screen:title',
	},

	VerifyOtp: {
		screenName: 'VerifyOtp',
		screenCodePath: 'src/features/auth/screens/VerifyOtpScreen.tsx',
		navigableScreens: ['RegisterUser', 'Home'],
		flows: {
			'verify otp': [
				'screen opens with instruction, OTP input, resend button',
				'user can resend OTP code',
				'OTP auto-submitted when 4 digits entered {DEV_USER_OTP}',
				'navigates to RegisterUser or Home based on user type',
			],
		},
		identifyingSelector: 'verify-otp-screen-container',
	},

	RegisterUser: {
		screenName: 'RegisterUser',
		screenCodePath: 'src/features/auth/screens/RegisterUserScreen.tsx',
		navigableScreens: ['Home'],
		flows: {
			'register user': [
				'screen opens with title "Share your details"',
				'enter first name',
				'enter last name',
				'enter email',
				'continue button enabled after all fields filled',
				'tap continue → Home',
			],
		},
		identifyingSelector: 'verify-mobile-number:screen:title',
	},
};

/**
 * Navigation Graph Helper
 * Returns all screens that can navigate to a target screen
 */
export function getScreensNavigatingTo(targetScreen: string): string[] {
	const sources: string[] = [];
	for (const [screenName, metadata] of Object.entries(SOM_METADATA)) {
		if (metadata.navigableScreens.includes(targetScreen)) {
			sources.push(screenName);
		}
	}
	return sources;
}

/**
 * Find Navigation Path
 * Returns shortest path from source to target screen
 */
export function findNavigationPath(sourceScreen: string, targetScreen: string): string[] | null {
	if (sourceScreen === targetScreen) {
		return [sourceScreen];
	}

	const visited = new Set<string>();
	const queue: {screen: string; path: string[]}[] = [{screen: sourceScreen, path: [sourceScreen]}];

	while (queue.length > 0) {
		const {screen, path} = queue.shift()!;

		if (screen === targetScreen) {
			return path;
		}

		if (visited.has(screen)) {
			continue;
		}
		visited.add(screen);

		const metadata = SOM_METADATA[screen];
		if (!metadata) {
			continue;
		}

		for (const nextScreen of metadata.navigableScreens) {
			if (!visited.has(nextScreen)) {
				queue.push({screen: nextScreen, path: [...path, nextScreen]});
			}
		}
	}

	return null;
}

/**
 * Get All Available Flows for a Screen
 */
export function getScreenFlows(screenName: string): Record<string, FlowInfo | string[]> | null {
	return SOM_METADATA[screenName]?.flows || null;
}

/**
 * Get Flow Metadata (if available)
 */
export function getFlowMetadata(screenName: string, flowName: string): FlowMetadata | null {
	const flows = getScreenFlows(screenName);
	if (!flows || !flows[flowName]) {
		return null;
	}

	const flow = flows[flowName];
	return Array.isArray(flow) ? null : flow.metadata || null;
}

