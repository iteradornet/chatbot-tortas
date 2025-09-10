import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ChatbotIcon from "./components/ChatbotIcon";
import ChatForm from "./components/ChatForm";
import ChatMessage from "./components/ChatMessage";
import { companyInfo } from "./info";

const App = () => {
  const chatBodyRef = useRef();
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      hideInChat: true,
      role: "model",
      text: companyInfo,
    },
  ]);

  const generateBotResponse = async (history) => {
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => [
        ...prev.filter((msg) => msg.text !== "Pensando..."),
        { role: "model", text, isError },
      ]);
    };

    const formattedHistory = history.map(({ role, text }) => ({ role, parts: [{ text }] }));

    try {
      // Mostrar mensaje de "Pensando..." mientras llega la respuesta
      setChatHistory((prev) => [...prev, { role: "model", text: "Pensando..." }]);

      // Llamada a la API con Axios
      const { data } = await axios.post(
        import.meta.env.VITE_API_URL,
        { contents: formattedHistory },
        { headers: { "Content-Type": "application/json" } }
      );

      // Procesar la respuesta del bot
      const apiResponseText = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();

      updateHistory(apiResponseText);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message || "Algo salió mal!";
      updateHistory(errorMessage, true);
    }
  };

  useEffect(() => {
    // Desplazamiento automático al final del chat
    chatBodyRef.current.scrollTo({
      top: chatBodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>
      <button onClick={() => setShowChatbot((prev) => !prev)} id="chatbot-toggler">
        <span className="material-symbols-rounded"><ChatbotIcon/></span>
        <span className="material-symbols-rounded">Cerrar</span>
      </button>

      <div className="chatbot-popup">
        {/* Chatbot Header */}
        <div className="chat-header">
          <div className="header-info">
            <ChatbotIcon />
            <h2 className="logo-text">Tortas adrian</h2>
          </div>
          <button
            onClick={() => setShowChatbot((prev) => !prev)}
            className="material-symbols-rounded"
          >
            {/* flecha hacia abajo */}
          </button>
        </div>

        {/* Body del chatbot */}
        <div ref={chatBodyRef} className="chat-body">
          <div className="message bot-message">
            <ChatbotIcon />
            <p className="message-text">
              Hola, Bienvenido a Tortas Adrián
              <br />
              ¿Cómo puedo ayudarte?
            </p>
          </div>

          {/* Render del historial de chat */}
          {chatHistory.map((chat, index) => (
            <ChatMessage key={index} chat={chat} />
          ))}
        </div>

        {/* Footer del chatbot */}
        <div className="chat-footer">
          <ChatForm
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            generateBotResponse={generateBotResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
