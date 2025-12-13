
export type ScriptEventType = "say" | "think" | "wait";

export interface ScriptEvent {
	type: ScriptEventType;
	text?: string;
	duration?: number; // in ms
}

export type SwatchyScript = ScriptEvent[];

// Helper to create simple speech
const say = (text: string, duration = 3000): ScriptEvent => ({ type: "say", text, duration });
// Helper to create simple thought
const think = (text: string, duration = 3000): ScriptEvent => ({ type: "think", text, duration });
// Helper to wait
const wait = (duration = 1000): ScriptEvent => ({ type: "wait", duration });

const HOME_SCRIPTS: SwatchyScript[] = [
    [think("Is that a new pixel?", 2000), wait(500), say("Welcome home! The colors missed you.", 3000)],
    [think("Everything starts here...", 2000), say("Ready to create something legendary?", 3000)],
    [say("Theme Token is looking good today!", 3000), think("Especially the border radii...", 2000)],
    [think("Scanning for creativity...", 1500), wait(500), say("High levels of inspiration detected!", 3000)],
    [think("I wonder what we'll build today.", 3000)],
    [say("Don't forget to check out the marketplace!", 3000)],
    [think("1 sat = 1 theme...", 2000), think("Wait, that's not right math.", 2000), say("Ordinals are forever!", 3000)],
    [say("Did you know you can customize me?", 3000), think("Please don't make me green.", 2000)],
    [think("Loading enthusiasm...", 1000), say("Let's go!", 2000)],
    [think("Looking at the blockchain...", 2000), say("Blocks are stacking up nicely.", 3000)],
];

const THEME_STUDIO_SCRIPTS: SwatchyScript[] = [
    [think("Hmm, too much blue?", 2000), say("Try a splash of orange!", 3000)],
    [say("Dark mode is so mysterious.", 3000), think("Like a ninja.", 2000)],
    [think("Radius: 0.5rem or 1rem?", 2500), say("Rounder is friendlier!", 3000)],
    [say("Remember to check contrast ratios!", 3000)],
    [think("Mixing colors...", 1500), wait(500), say("Ooh, that's a spicy palette!", 3000)],
    [say("This theme needs a name.", 3000), think("Cyber-something?", 2000)],
    [think("Adjusting primary color...", 2000), say("Perfect!", 2000)],
    [say("You can remix existing themes too!", 3000)],
    [think("I love the smell of fresh CSS variables.", 3000)],
    [say("Once you mint it, it's yours forever.", 3000)],
];

const REGISTRY_STUDIO_SCRIPTS: SwatchyScript[] = [
    [think("Building blocks...", 2000), say("React components are like legos.", 3000)],
    [say("Need a dashboard? I can generate that.", 3000)],
    [think("Constructing interface...", 2000), say("Beep boop! UI complete.", 2000)],
    [say("ShadCN compatible, always.", 3000)],
    [think("Button, Card, Input...", 2000), say("We have all the ingredients.", 3000)],
    [say("Try asking for a 'pricing table'.", 3000)],
    [think("Compiling TypeScript...", 1500), say("Just kidding, I'm just a mascot.", 3000)],
    [say("Clean code is happy code.", 3000)],
    [think("I wonder if this component is responsive.", 2500), say("It better be!", 2000)],
    [say("Components live on the blockchain too!", 3000)],
];

const MARKET_SCRIPTS: SwatchyScript[] = [
    [think("So many choices...", 2000), say("Found any hidden gems?", 3000)],
    [say("Support independent creators!", 3000)],
    [think("Checking wallet balance...", 2000), say("Invest in good design.", 3000)],
    [say("That font would look great on your site.", 3000)],
    [think("Prices fluctuate...", 2000), say("But style is eternal.", 3000)],
    [say("List your own themes here!", 3000)],
    [think("Scanning listings...", 1500), say("Hot items today!", 2000)],
    [say("Collecting themes is a hobby.", 3000)],
    [think("Is that a rare one?", 2000)],
    [say("Direct P2P trading via OrdLock.", 3000)],
];

const GENERIC_SCRIPTS: SwatchyScript[] = [
    [think("Just floating around...", 3000)],
    [say("Need help? Just click me!", 3000)],
    [think("I'm watching you...", 1000), wait(500), say("Creatively!", 2000)],
    [think("Computing...", 2000)],
    [say("Theme Token is the future.", 3000)],
    [think("Do I have legs?", 2000), say("Nope, just style.", 2000)],
    [say("Have you connected your wallet?", 3000)],
    [think("Processing pixels...", 2000)],
    [say("I can generate fonts too!", 3000)],
    [think("Bored...", 1000), say("Let's make something!", 2000)],
];

export function getScriptsForPath(pathname: string): SwatchyScript[] {
    if (pathname === "/") return HOME_SCRIPTS;
    if (pathname.startsWith("/studio/theme")) return THEME_STUDIO_SCRIPTS;
    if (pathname.startsWith("/studio/registry")) return REGISTRY_STUDIO_SCRIPTS;
    if (pathname.startsWith("/market")) return MARKET_SCRIPTS;
    return GENERIC_SCRIPTS;
}
