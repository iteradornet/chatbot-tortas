import { useRef } from "react";
const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const inputRef = useRef();
  const handleFormSubmit = (e) => {
    e.preventDefault();
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;
    inputRef.current.value = "";
    // actualiza el historial de chat con el mensaje del usuario
    setChatHistory((history) => [...history, { role: "user", text: userMessage }]);
    // Retraso de 600 ms antes de mostrar "Pensando..." y generar respuesta
    setTimeout(() => {
      // Agregué un marcador de "Pensando..." para la respuesta del bot
      setChatHistory((history) => [...history, { role: "model", text: "Pensando..." }]);
      // Llamar a la función para generar la respuesta del bot
      generateBotResponse([...chatHistory, { role: "user", text: `
Utilizando los datos facilitados anteriormente, por favor, responda a esta consulta.: ${userMessage}` }]);
    }, 600);
  };
  return (
    <form onSubmit={handleFormSubmit} className="chat-form">
      <input ref={inputRef} placeholder="Message..." className="message-input" required />
      <button type="submit" id="send-message" >
       Enviar
      </button>
    </form>
  );
};
export default ChatForm;

