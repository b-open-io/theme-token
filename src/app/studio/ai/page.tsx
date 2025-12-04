import { notFound } from "next/navigation";
import { AiStudio } from "@/components/studio/ai-studio";
import { featureFlags } from "@/lib/feature-flags";

export default function AiStudioPage() {
	if (!featureFlags.ai) {
		notFound();
	}

	return <AiStudio />;
}

