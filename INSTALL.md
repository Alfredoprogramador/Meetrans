# 🚀 Guia Rápido de Instalação

## Para Windows

### 1. Instalar Node.js
- Baixe em: https://nodejs.org/
- Versão recomendada: LTS (Long Term Support)

### 2. Verificar Instalação
Abra o PowerShell e execute:
```powershell
node --version
npm --version
```

### 3. Executar o Projeto

#### Abrir dois terminais PowerShell

**Terminal 1 - Backend:**
```powershell
cd C:\Users\Usuário\source\repos\Meetrans
npm install
npm start
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\Usuário\source\repos\Meetrans\client
npm install
npm start
```

### 4. Acessar
Abra o navegador em: http://localhost:3000

---

## Para Linux/Mac

### 1. Instalar Node.js

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nodejs npm
```

**Mac (usando Homebrew):**
```bash
brew install node
```

### 2. Verificar Instalação
```bash
node --version
npm --version
```

### 3. Executar o Projeto

**Terminal 1 - Backend:**
```bash
cd ~/Meetrans
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd ~/Meetrans/client
npm install
npm start
```

### 4. Acessar
Abra o navegador em: http://localhost:3000

---

## 🎯 Teste Rápido

1. Abra duas janelas do navegador
2. Em ambas, acesse http://localhost:3000
3. Use o mesmo **ID de Sala** (ex: "sala123")
4. Use nomes diferentes
5. Selecione idiomas diferentes
6. Clique em "Entrar na Sala"
7. Fale em um e ouça a tradução no outro!

---

## ⚠️ Problemas Comuns

### "npm: comando não encontrado"
- Node.js não está instalado corretamente
- Reinicie o terminal após instalar

### "Porta 5000 já em uso"
- Outra aplicação está usando a porta
- Mude a porta em `server/server.js`

### "EACCES: permission denied"
- Linux/Mac: use `sudo` antes dos comandos npm
- Ou configure permissões: `sudo chown -R $USER /usr/local/lib/node_modules`

### Câmera não funciona
- Permita acesso à câmera no navegador
- Use HTTPS ou localhost (requisito WebRTC)
