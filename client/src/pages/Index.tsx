
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";

const socket = io("http://192.168.1.34:3001");

const Index = () => {
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [timer, setTimer] = useState(15);
  const [endTime, setEndTime] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const { toast } = useToast();
  const TIMER = 30;

  // Met à jour le timer quand un nouveau endTime est reçu
  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const timeLeft = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setTimer(timeLeft);

      if (timeLeft === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  // Écoute les événements Socket.io
  useEffect(() => {
    socket.on("newQuestion", (data) => {
      setQuestion(data);
      setAnswer("");
      setWinner(null);
      setErrorMessage("");
      setEndTime(data.endTime);
    });

    socket.on("playerUpdate", setPlayers);

    socket.on("winner", (data) => {
      setPlayers(data.score) ;
      setWinner(data.winner);
      setTimer(0);
      toast({
        title: "Nous avons un gagnant!",
        description: `🎉 ${data.winner} a gagné cette manche!`,
      });
    });

    socket.on("reponseIncorrecte", ({ id }) => {
      setErrorMessage(id === socket.id ? "❌ Mauvaise réponse !" : "");
    });

    socket.on("gameOver", (data) => {
      toast({
        title: "Partie terminée",
        description: data.message,
        variant: "destructive",
      });
      setGameStarted(false);
      setQuestion(null);
      setWinner(null);
      setTimer(15);
    });

    return () => {
      socket.off("newQuestion");
      socket.off("playerUpdate");
      socket.off("winner");
      socket.off("reponseIncorrecte");
      socket.off("gameOver");
    };
  }, [toast]);

  // Basculer l'état de préparation du joueur
  const toggleReady = () => {
    socket.emit(isReady ? "unready" : "ready");
    setIsReady(!isReady);
    socket.emit("startGame");
    setGameStarted(true);
  };

  // Soumettre une réponse
  const submitAnswer = () => {
    if (answer) {
      socket.emit("answer", { answer });
    }
  };

  // Gérer la soumission avec touche Entrée
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      submitAnswer();
    }
  };

  // Envoyer le nom du joueur au serveur
  const handleSetName = () => {
    if (playerName.trim()) {
      socket.emit("setName", playerName);
      toast({
        title: "Nom confirmé",
        description: `Vous jouez maintenant sous le nom: ${playerName}`,
      });
    }
  };

  // Calculate timer percentage for progress bar
  const timerPercentage = (timer / TIMER) * 100;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-secondary p-4 sm:p-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold text-center">Jeu de Division</h1>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Player name input */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Entrez votre nom"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base"
                onKeyDown={(e) => e.key === "Enter" && handleSetName()}
              />
              <button 
                onClick={handleSetName}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm sm:text-base"
              >
                Confirmer
              </button>
            </div>
            
            {/* Ready button */}
            <button 
              onClick={toggleReady}
              className={`w-full py-2 sm:py-3 rounded-md text-white transition-colors text-sm sm:text-base ${
                isReady 
                  ? "bg-destructive hover:bg-destructive/90" 
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isReady ? "❌ Pas prêt" : "✅ Je suis prêt"}
            </button>
          </div>

          {/* Game content */}
          {gameStarted && (
            <div className="space-y-4 sm:space-y-6">
              {/* Question */}
              {question && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-muted p-3 sm:p-6 rounded-xl text-center">
                    <h2 className="text-2xl sm:text-4xl font-bold mb-2">
                      {question.a} ÷ {question.b} = ?
                    </h2>
                    
                    {/* Timer */}
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-medium">
                        ⏳ Temps restant : {timer} secondes
                      </h3>
                      <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5">
                        <div 
                          className={`h-2 sm:h-2.5 rounded-full ${
                            timer > 10 
                              ? "bg-green-500" 
                              : timer > 5 
                              ? "bg-yellow-500" 
                              : "bg-red-500"
                          }`}
                          style={{ width: `${timerPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Answer input */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      value={answer} 
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-lg"
                      placeholder="Votre réponse..."
                    />
                    <button 
                      onClick={submitAnswer}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors font-medium text-sm sm:text-base"
                    >
                      Envoyer
                    </button>
                  </div>
                  
                  {/* Error message */}
                  {errorMessage && (
                    <p className="text-destructive text-center font-medium text-sm sm:text-lg animate-pulse">
                      {errorMessage}
                    </p>
                  )}
                </div>
              )}
              
              {/* Winner announcement */}
              {winner && (
                <div className="bg-yellow-100 border-2 border-yellow-300 p-3 sm:p-4 rounded-xl text-center">
                  <h2 className="text-lg sm:text-xl font-bold text-yellow-800">
                    🎉 Le gagnant est : {winner} ! Félicitations !
                  </h2>
                </div>
              )}
              
              {/* Players list */}
              <div className="bg-muted rounded-xl p-3 sm:p-4">
                <h3 className="font-semibold mb-2 text-base sm:text-lg">Joueurs</h3>
                <ul className="space-y-2">
                  {players.map((p) => (
                    <li 
                      key={p.id}
                      className="flex items-center justify-between bg-white p-2 sm:p-3 rounded-lg shadow-sm"
                    >
                      <span className="font-medium text-sm sm:text-base">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-primary text-white py-1 px-2 rounded-md text-xs sm:text-sm">
                          {p.score} pts
                        </span>
                        <span>{p.isReady ? "✅" : "❌"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Waiting screen */}
          {!gameStarted && (
            <div className="text-center text-gray-500 py-4 sm:py-6">
              <p className="text-base sm:text-lg">En attente du début de la partie...</p>
              <p className="text-sm sm:text-base">Entrez votre nom et cliquez sur "Je suis prêt" pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
