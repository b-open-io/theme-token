"use client";

import { Message, MessageAction, MessageActions, MessageContent } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Copy, Paperclip, RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { DemoSection } from "./utils";

export function AiDemo() {
	return (
		<div className="space-y-8">
			<DemoSection title="Chat Interface" description="AI interaction elements">
				<div className="mx-auto max-w-2xl space-y-6">
					{/* User Message */}
					<Message from="user">
						<MessageContent>
							How do I style AI components with theme tokens?
						</MessageContent>
					</Message>

					{/* Assistant Message with Reasoning */}
					<Message from="assistant">
						<MessageContent className="space-y-4">
							<Reasoning>
								<ReasoningTrigger>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Brain className="h-4 w-4" />
										<span>Analyzing theme structure...</span>
									</div>
								</ReasoningTrigger>
								<ReasoningContent>
									The user wants to know about styling AI components. I should explain how the theme tokens (primary, secondary, muted, etc.) map to the AI elements like messages, reasoning blocks, and input fields.
								</ReasoningContent>
							</Reasoning>
							
							<p>
								AI components automatically inherit your theme's colors and typography. For example:
							</p>
							<ul className="ml-4 list-disc space-y-1">
								<li>User messages use <code className="bg-muted px-1 rounded">secondary</code> background</li>
								<li>Assistant messages use <code className="bg-muted px-1 rounded">background</code></li>
								<li>Reasoning blocks use <code className="bg-muted px-1 rounded">muted</code> colors</li>
							</ul>
						</MessageContent>
						<MessageActions>
							<MessageAction tooltip="Copy">
								<Copy className="h-4 w-4" />
							</MessageAction>
							<MessageAction tooltip="Regenerate">
								<RefreshCw className="h-4 w-4" />
							</MessageAction>
							<div className="flex-1" />
							<MessageAction tooltip="Good response">
								<ThumbsUp className="h-4 w-4" />
							</MessageAction>
							<MessageAction tooltip="Bad response">
								<ThumbsDown className="h-4 w-4" />
							</MessageAction>
						</MessageActions>
					</Message>
				</div>
			</DemoSection>

			<DemoSection title="Suggestions" description="Quick action prompts">
				<div className="flex flex-wrap gap-2">
					<Suggestion suggestion="Generate a dark mode theme" />
					<Suggestion suggestion="Create a pastel color palette" />
					<Suggestion suggestion="Explain OKLCH colors" />
				</div>
			</DemoSection>

			<DemoSection title="Input Area" description="Prompt input with attachments">
				<Card className="p-4">
					<PromptInput onSubmit={() => {}}>
						<PromptInputTextarea placeholder="Ask anything..." />
						<PromptInputFooter>
							<Button variant="ghost" size="icon" type="button">
								<Paperclip className="h-4 w-4" />
							</Button>
							<div className="flex-1" />
							<Button size="sm" type="submit">Send</Button>
						</PromptInputFooter>
					</PromptInput>
				</Card>
			</DemoSection>
		</div>
	);
}

