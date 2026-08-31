export function buildThemeShareText(
	themeName: string,
	previewUrl: string,
	installCommand: string,
): string {
	return `I just inscribed "${themeName}" as a Theme Token on BSV!\n\n${previewUrl}\n\nInstall it in your project:\n${installCommand}`;
}
