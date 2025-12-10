"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { useSwatchyStore } from "./swatchy-store";
import { useSwatchyChat } from "./use-swatchy-chat";

const SUGGESTIONS = [
	"Create a dark cyberpunk theme",
	"Help me pick colors",
	"Browse popular themes",
	"How do I mint a theme?",
];

export function SwatchyChatBubble() {
	const { messages, closeChat } = useSwatchyStore();
	const { input, setInput, handleSubmit, isLoading } = useSwatchyChat();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		handleSubmit();
	};

	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
		// Focus the textarea after setting input
		setTimeout(() => textareaRef.current?.focus(), 0);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<motion.div
			className="fixed right-4 top-32 z-[55] flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl max-sm:inset-x-4 max-sm:bottom-4 max-sm:left-4 max-sm:right-4 max-sm:top-auto max-sm:h-[70vh] max-sm:w-auto"
			initial={{ opacity: 0, scale: 0.9, y: -20 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.9, y: -20 }}
			transition={{ type: "spring", stiffness: 300, damping: 25 }}
		>
			{/* Speech bubble pointer - desktop only */}
			<div className="absolute -top-3 right-8 hidden h-0 w-0 border-b-[12px] border-l-[12px] border-r-[12px] border-b-border border-l-transparent border-r-transparent sm:block" />
			<div className="absolute -top-2.5 right-8 hidden h-0 w-0 border-b-[11px] border-l-[11px] border-r-[11px] border-b-background border-l-transparent border-r-transparent sm:block" />

			{/* Header */}
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium">Swatchy</span>
					<span className="text-xs text-muted-foreground">Theme Assistant</span>
				</div>
				<Button variant="ghost" size="icon" onClick={closeChat}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			{/* Messages */}
			<Conversation className="flex-1">
				<ConversationContent className="gap-4 p-3">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
							<p className="text-sm text-muted-foreground">
								Hi! I&apos;m Swatchy, your theme assistant. How can I help you
								today?
							</p>
							<Suggestions className="flex-wrap justify-center gap-2">
								{SUGGESTIONS.map((suggestion) => (
									<Suggestion
										key={suggestion}
										suggestion={suggestion}
										onClick={handleSuggestionClick}
										className="text-xs"
									/>
								))}
							</Suggestions>
						</div>
					) : (
						messages.map((msg) => (
							<Message key={msg.id} from={msg.role}>
								<MessageContent>{msg.content}</MessageContent>
							</Message>
						))
					)}
					{isLoading && (
						<Message from="assistant">
							<MessageContent>
								<span className="animate-pulse">Thinking...</span>
							</MessageContent>
						</Message>
					)}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			{/* Input */}
			<form onSubmit={onSubmit} className="border-t p-3">
				<div className="flex gap-2">
					<textarea
						ref={textareaRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Ask me anything about themes..."
						className="min-h-10 max-h-24 flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
						rows={1}
					/>
					<Button
						type="submit"
						size="icon"
						disabled={!input.trim() || isLoading}
						className="shrink-0"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="h-4 w-4"
						>
							<path d="m5 12 7-7 7 7" />
							<path d="M12 19V5" />
						</svg>
					</Button>
				</div>
			</form>
		</motion.div>
	);
}
