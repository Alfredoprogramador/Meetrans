#!/bin/bash

echo "============================================"
echo "  Meetrans - Iniciando Aplicação"
echo "============================================"
echo ""

echo "Iniciando Backend (porta 5000)..."
gnome-terminal -- bash -c "npm start; exec bash" 2>/dev/null || \
xterm -e "npm start" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm start"' 2>/dev/null &

sleep 3

echo "Iniciando Frontend (porta 3000)..."
gnome-terminal -- bash -c "cd client && npm start; exec bash" 2>/dev/null || \
xterm -e "cd client && npm start" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)'/client && npm start"' 2>/dev/null &

echo ""
echo "============================================"
echo "  Meetrans Iniciado!"
echo "============================================"
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Dois terminais foram abertos."
echo "Aguarde o navegador abrir automaticamente..."
echo ""
echo "Para parar a aplicação, feche ambos os terminais."
echo ""
