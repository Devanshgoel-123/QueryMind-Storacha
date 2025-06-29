"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import "./styles.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RxCross1 } from "react-icons/rx";
import { LOGO } from "../utils/constants";
import { generalQueryProps, useSocketConnection } from "@/hooks/useSocketConnection";

export interface Message {
    id: string;
    type: "user" | "agent";
    content: string;
    timestamp: Date;
    action: "query" | "response";
    params?:generalQueryProps
  }
  

export const AgentChat = () => {

  const router=useRouter();
  const { element, generalQuery } = useSocketConnection();
  const [sendEnable, setSend] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content:
        "Hello! I'm your trading assistant. I can help you with market analysis, trading strategies, and answer questions about your portfolio. How can I assist you today?",
      timestamp: new Date(),
      action: "response",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    if (!sendEnable) {
      setInputMessage("");
      return;
    }
    const tempMessage = inputMessage.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: tempMessage,
      timestamp: new Date(),
      action: "query",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsTyping(true);
    setSend(false);

    try {
      // await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL_AXIOS}/message`, {
      //   text: tempMessage,
      //   agentId: "QueryMind"
      // });
    } catch (err) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        content: "Sorry We are facing some issues here. Can you please try again later?",
        timestamp: new Date(),
        action: "response",
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("Error sending message:", err);
    } finally {
      setIsTyping(false);
      setSend(true);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderAgentResponse = (message: Message) => {
    if (message.action === "response" ) {
      return (
        <div className="messageContent">
        <div className="messageText">{message.content}</div>
      </div>
      );
    }
  };

  const renderUserQuery = (message: Message) => {
    return (
      <div className="messageContent">
        <div className="messageText">{message.content}</div>
      </div>
    );
  };

  useEffect(() => {
    if(
      element === "response" &&
     (generalQuery.current !== undefined || generalQuery.current != "")
    ){
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "agent",
        content: generalQuery.current.message || "Facing some issues please try again later",
        timestamp: new Date(),
        action:"response",
        params: generalQuery.current,
      };
      setMessages((prev) => [...prev, newMessage]);
    }
    setIsTyping(false);
    setSend(true);
  }, []);
  return (
    <div className="agentChatWrapper">
      <div className="chatHeader">
        <div className="headerInfo">
          <div
            className="crossIcon"
            onClick={() => {
              router.push("/");
            }}
          >
            <RxCross1 />
          </div>
          <div className="agentAvatar">
            <Image
              className="avatarIcon"
              src={LOGO}
              height={45}
              width={45}
              alt=""
            />
          </div>
          <div className="agentDetails">
            <span className="agentName">Pooka Agentic</span>
            <span
              className={`agentStatus online`}
            >
              <div className="statusDot"></div>
              Online
            </span>
          </div>
        </div>
      </div>

      <div className="chatMessages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.type === "agent"
              ? renderAgentResponse(message)
              : renderUserQuery(message)}
          </div>
        ))}

        {isTyping && (
          <div className="message agent">
            <div className="messageAvatar">
              <div className="avatarIcon">
                <Image src={LOGO} width={32} height={32} alt="" className=""/>
              </div>
            </div>
            <div className="messageContent" style={{
              width:"100px",
              overflow:"hidden"
            }}>
              <div className="typingIndicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chatInput">
        <div className="inputContainer">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about trading..."
            className="messageInput"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !sendEnable}
            className="sendButton"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 11L12 6L17 11M12 18V7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
