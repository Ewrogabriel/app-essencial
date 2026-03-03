#!/usr/bin/env python3
import subprocess
import os

os.chdir('/vercel/share/v0-project')

# Configure git
subprocess.run(['git', 'config', 'user.name', 'v0-deployment'], check=False)
subprocess.run(['git', 'config', 'user.email', 'v0@vercel.dev'], check=False)

# Add all changes
print("Adicionando todas as alterações...")
subprocess.run(['git', 'add', '.'], check=True)

# Commit
print("Fazendo commit das alterações...")
commit_msg = """Implementação completa de funcionalidades - Sistema de Agendamentos v2

Implementações:
- Corrigidas telas de Avaliação/Anamnese e Novo Pagamento
- Sistema completo de Matrículas com descontos e pagamentos
- Check-in de profissional com lista de pacientes do dia
- Página Meus Planos para clientes com consultas disponíveis
- Sistema de Produtos com venda e reserva
- Componentes de Pagamento PIX, WhatsApp e Instagram
- Componente de Reagendamento com grade de horários
- Histórico de Sessões com filtro mensal
- Aniversariantes do Mês
- Dashboard de Indicadores de Negócio (MRR, taxa ocupação, ticket médio)
- Dicas Diárias geradas por IA
- 24 migrations do banco de dados executadas
- Menu de navegação atualizado com todas as novas funcionalidades
- Correção de bugs críticos (agendamentos não apareciam, CEP, hora no dashboard)

Todas as funcionalidades foram integradas com o Supabase e estão prontas para uso."""

subprocess.run(['git', 'commit', '-m', commit_msg], check=True)

# Push to GitHub
print("Enviando alterações para GitHub...")
subprocess.run(['git', 'push', '-u', 'origin', 'sistema-de-agendamento-aprimorado'], check=True)

print("✅ Todas as alterações foram enviadas com sucesso para GitHub!")
