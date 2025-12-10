"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputTextarea,
	PromptInputFooter,
	PromptInputTools,
	PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { useSwatchyStore } from "./swatchy-store";
import { useSwatchyChat } from "./use-swatchy-chat";
import { PaymentRequestCard } from "./payment-request";

const SUGGESTIONS = [
	"Create a dark cyberpunk theme",
	"Help me pick colors",
	"Browse popular themes",
	"How do I mint a theme?",
];

// Helper to extract text content from message parts
function getMessageText(message: { role: string; parts?: Array<{ type: string; text?: string }> }): string {
	if (!message.parts) return "";

	const textParts = message.parts
		.filter((part) => part.type === "text" && part.text)
		.map((part) => part.text);

	return textParts.join("\n");
}

export function SwatchyChatBubble() {
	const { closeChat } = useSwatchyStore();
	const {
		messages,
		input,
		setInput,
		handleSubmit,
		isLoading,
		paymentPending,
		handlePaymentConfirmed,
		cancelPayment,
	} = useSwatchyChat();

	const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion);
	};

	const onPromptSubmit = () => {
		if (!input.trim() || isLoading) return;
		handleSubmit();
	};

	const onPaymentConfirm = async () => {
		setIsPaymentProcessing(true);
		try {
			await handlePaymentConfirmed();
		} finally {
			setIsPaymentProcessing(false);
		}
	};

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
		}
	}, [messages, paymentPending]);

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
					<div ref={scrollContainerRef} className="flex flex-col gap-4">
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
							<>
								{messages.map((msg) => {
									const text = getMessageText(msg as { role: string; parts?: Array<{ type: string; text?: string }> });
									if (!text) return null;

									return (
										<Message key={msg.id} from={msg.role === "user" ? "user" : "assistant"}>
											<MessageContent>{text}</MessageContent>
										</Message>
									);
								})}
							</>
						)}

						{/* Loading indicator */}
						{isLoading && !paymentPending && (
							<Message from="assistant">
								<MessageContent>
									<span className="animate-pulse">Thinking...</span>
								</MessageContent>
							</Message>
						)}

						{/* Payment request card */}
						{paymentPending && (
							<div className="mt-2">
								<PaymentRequestCard
									payment={paymentPending}
									onConfirm={onPaymentConfirm}
									onCancel={cancelPayment}
									isProcessing={isPaymentProcessing}
								/>
							</div>
						)}
					</div>
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>

			{/* Input */}
			<div className="border-t p-3">
				<PromptInput
					onSubmit={onPromptSubmit}
					className="rounded-lg border bg-muted/30"
				>
					<PromptInputTextarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Ask me anything about themes..."
						className="min-h-10 max-h-24 text-sm"
						disabled={!!paymentPending}
					/>
					<PromptInputFooter>
						<PromptInputTools />
						<PromptInputSubmit
							disabled={!input.trim() || isLoading || !!paymentPending}
							status={isLoading ? "submitted" : undefined}
						/>
					</PromptInputFooter>
				</PromptInput>
			</div>
		</motion.div>
	);
}
