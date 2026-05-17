#!/bin/bash

echo "============================================"
echo "  Meetrans - Inicialização Completa"
echo "============================================"
echo ""

echo "[1/4] Verificando Node.js..."
if ! command -v node &> /dev/null; then
	echo "ERRO: Node.js não encontrado!"
	echo "Por favor, instale Node.js em: https://nodejs.org/"
	exit 1
fi
node --version
npm --version
echo ""

echo "[2/4] Instalando dependências do backend..."
npm install
if [ $? -ne 0 ]; then
	echo "ERRO: Falha ao instalar dependências do backend"
	exit 1
fi
echo ""

echo "[3/4] Instalando dependências do frontend..."
cd client
npm install
if [ $? -ne 0 ]; then
	echo "ERRO: Falha ao instalar dependências do frontend"
	exit 1
fi
cd ..
echo ""

echo "[4/4] Tudo pronto!"
echo ""
echo "============================================"
echo "  Instalação Concluída com Sucesso!"
echo "============================================"
echo ""
echo "Para iniciar a aplicação, execute:"
echo "  - Backend:  npm start"
echo "  - Frontend: cd client && npm start"
echo ""
echo "Ou execute ./start.sh para iniciar ambos automaticamente"
echo ""
