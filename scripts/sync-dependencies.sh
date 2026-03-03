#!/bin/bash
# Sincroniza as dependências removendo lock file e reinstalando

echo "Removendo arquivos de lock..."
rm -f package-lock.json bun.lockb yarn.lock

echo "Limpando npm cache..."
npm cache clean --force

echo "Reinstalando dependências..."
npm install

echo "Sincronização completa!"
