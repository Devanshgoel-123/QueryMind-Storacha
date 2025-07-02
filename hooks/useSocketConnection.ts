/* eslint-disable @typescript-eslint/no-unused-vars */
import { io, Socket } from "socket.io-client";
import dotenv from "dotenv";
import { useEffect, useRef, useState } from "react";
dotenv.config();

export interface generalQueryProps {
  message: string | undefined;
}
export const useSocketConnection = () => {
  const [renderElement, setRenderElement] = useState<string | undefined>(
    undefined
  );
  const [element, setElement] = useState<
    "response" | null
  >(null);

  const generalQuery = useRef<generalQueryProps>({
    message: undefined,
  });

   const socketURL = "";
  useEffect(() => {
    if (!socketURL) {
      console.error("WebSocket URL not defined");
      return;
    }
    const socket_connections: Socket = io(
      ``,
      {
        transports: ["websocket"],
      }
    );
    if (!socket_connections) {
    }

    socket_connections.on("connect", () => {
      console.log("port connected");
    });

    socket_connections.on("general_query", (data) => {
      generalQuery.current.message = data.position;
      setElement("response");
    });

    socket_connections.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
    });

    socket_connections.on("connect_error", (err) => {
      console.log("Connection error:", err);
    });

    return () => {
      socket_connections.disconnect();
    };
  }, [socketURL]);

  return {
    element,
    generalQuery,
  };
};
