import React, { useState } from 'react';
import './App.css';
import VideoConference from './components/VideoConference';

interface JoinFormData {
  roomId: string;
  userName: string;
  language: string;
}

const App: React.FC = () => {
  const [joined, setJoined] = useState(false);
  const [formData, setFormData] = useState<JoinFormData>({
    roomId: '',
    userName: '',
    language: 'pt'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roomId.trim() && formData.userName.trim()) {
      setJoined(true);
    }
  };

  const handleLeave = () => {
    setJoined(false);
    setFormData({
      roomId: '',
      userName: '',
      language: 'pt'
    });
  };

  if (joined) {
    return (
      <VideoConference
        roomId={formData.roomId}
        userName={formData.userName}
        userLanguage={formData.language}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div className="App">
      <div className="join-container">
        <div className="join-card">
          <div className="logo">
            <h1>🌐 Meetrans</h1>
            <p>Videoconferência com Tradução em Tempo Real</p>
          </div>

          <form onSubmit={handleJoin} className="join-form">
            <div className="form-group">
              <label htmlFor="userName">Seu Nome</label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="Digite seu nome"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="roomId">ID da Sala</label>
              <input
                type="text"
                id="roomId"
                name="roomId"
                value={formData.roomId}
                onChange={handleInputChange}
                placeholder="Digite o ID da sala"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="language">Seu Idioma</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                required
              >
                <option value="pt">🇧🇷 Português</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Español</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="it">🇮🇹 Italiano</option>
              </select>
            </div>

            <button type="submit" className="join-button">
              Entrar na Sala
            </button>
          </form>

          <div className="features">
            <div className="feature">
              <span>🎥</span>
              <p>Vídeo HD</p>
            </div>
            <div className="feature">
              <span>🎤</span>
              <p>Áudio Claro</p>
            </div>
            <div className="feature">
              <span>🌍</span>
              <p>Tradução 6 Idiomas</p>
            </div>
            <div className="feature">
              <span>👥</span>
              <p>Até 5 Pessoas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
