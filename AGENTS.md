# Yu-Gi-Oh! Life Tracker

## Sobre o app

Aplicação web para acompanhar uma partida local de Yu-Gi-Oh! entre dois jogadores. Exibe os pontos de vida, permite aplicar dano e cura, reiniciar a partida, desfazer a última alteração e lançar moeda ou dado. A tela é usada em celular compartilhado, com os jogadores em lados opostos e olhando um para o outro.

## Como trabalhar neste projeto

- Use Bun para instalar dependências e executar os scripts do `package.json` (`bun install`, `bun run dev`, `bun run build`).
- Mantenha TypeScript estrito e prefira componentes e tipos explícitos; evite adicionar dependências para necessidades simples.
- Preserve o modo de duelo frente a frente: a orientação invertida do jogador de cima no celular é intencional.
- Mantenha regras de pontos, histórico/desfazer e persistência em `localStorage` consistentes entre os dois jogadores. Ao mudar o formato persistido, considere dados já gravados no navegador.
- Deixe a lógica de jogo separada da apresentação visual. Mantenha estilos próximos ao componente correspondente e evite regras globais sem necessidade.
- Contadores visuais ficam em `src/components/LifeCounter/skins/<tema>` e recebem `CounterSkinProps`. Registre cada novo tema no mapa de skins em `LifeCounter/index.tsx`; skins exibem os dados recebidos e não acessam contexto nem implementam regras de jogo.
- Priorize correções funcionais e de experiência de jogo. Revisar acessibilidade fica para a etapa final, conforme combinado.
- Antes de concluir mudanças, execute `bun run build` quando o ambiente permitir e informe o resultado. Não publique/deploy sem pedido explícito.
