import { useLiveQuery } from "dexie-react-hooks";
import ollama from "ollama";
import { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { ChatMessage } from "~/components/ChatMessage";
import { ThoughtMessage } from "~/components/ThoughtMessage";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { db } from "~/lib/dexie";

const ChatPage = () => {
  const [textInput, setTextInput] = useState("");
  const [streamedThought, setStreamedThought] = useState("");
  const [streamedMessage, setStreamedMessage] = useState("");

  const scrollToBottomRef = useRef<HTMLDivElement>(null);

  const params = useParams();

  const messages = useLiveQuery(
    () => db.getMessagesForThread(params.threadId as string),
    [params.threadId]
  );

  const handleSubmit = async () => {
    await db.createMessage({
      content: textInput,
      role: "user",
      threadId: params.threadId as string,
      thought: "",
    });

    setTextInput("");

    const stream = await ollama.chat({
      model: "deepseek-r1:1.5b",
      messages: [
        {
          role: "user",
          content: textInput.trim(),
        },
      ],
      stream: true,
    });

    let fullThought = "";
    let fullContent = "";

    let outputMode: "think" | "response" = "think";

    for await (const part of stream) {
      if (outputMode === "think") {
        if (
          !(
            part.message.content.includes("<think>") ||
            part.message.content.includes("</think>")
          )
        ) {
          fullThought += part.message.content;
        }

        setStreamedThought(fullThought);

        if (part.message.content.includes("</think>")) {
          outputMode = "response";
        }
      } else {
        fullContent += part.message.content;
        setStreamedMessage((prevMessage) => prevMessage + part.message.content);
      }
    }

    const cleanThought = fullThought.replace(/<\/?think>/g, "");
    setStreamedThought(cleanThought);

    await db.createMessage({
      content: fullContent.trim(),
      role: "assistant",
      threadId: params.threadId as string,
      thought: cleanThought,
    });

    setStreamedThought("");
    setStreamedMessage("");
  };

  const handleTextareaChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTextInput(event.target.value);
  };

  const handleScrollToBottom = () => {
    scrollToBottomRef.current?.scrollIntoView();
  };

  useLayoutEffect(() => {
    handleScrollToBottom();
  }, [messages, streamedMessage, streamedThought]);

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center px-4 h-16 border-b">
        <h1 className="text-xl font-bold ml-4">AI Chat Dashboard</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 w-full relative">
        <div className="mx-auto space-y-4 pb-20 max-w-screen-md">
          {messages?.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              thought={message.thought}
            />
          ))}

          {streamedThought && <ThoughtMessage thought={streamedThought} />}

          {streamedMessage && (
            <ChatMessage role="assistant" content={streamedMessage} />
          )}

          <div ref={scrollToBottomRef}></div>
        </div>
      </main>
      <footer className="border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            className="flex-1 text-3xl font-medium"
            placeholder="Type your message here..."
            rows={5}
            onChange={handleTextareaChange}
            value={textInput}
          />
          <Button onClick={handleSubmit} type="button">
            Send
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
