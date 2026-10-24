# Verdejar

Jogo web de sustentabilidade em pixel art, visto de cima. Você cria seu personagem e devolve a cor à Vila Verdejar: recolhe e separa o lixo, planta árvores, conserta vazamentos, apaga lâmpadas acesas de dia e instala painéis solares. A cada tarefa, a vila sai do cinza e fica verde de verdade: grama, rio, árvores, telhados com painéis, flores e borboletas.

Feito primeiro para celular, em pé ou deitado. Funciona também no computador.

## Criação de personagem

- Prévia que muda na hora, com giro em 4 direções (botões ou arrastando) e opção "Andar".
- Abas: Visuais, Estilos, Corpo e rosto, Cabelos, Roupas, Calçados, Acessórios e Cores. Nenhuma opção é separada por gênero: qualquer peça combina com qualquer outra.
- **Visuais**: 15 personagens completos e variados (Skate, Horta, Trilha, Praia, Cidade, Neon, Esporte, Arte, Leitura, Música, Inverno, Roça, Colheita, Curral, Feira) para começar rápido e depois mudar o que quiser.
- Dois botões com figuras (sem texto) no canto da prévia trocam rapidamente entre um corpo de ombros largos e um corpo com curvas.
- 10 tons de pele, 3 formatos de corpo (reto, ombros largos, com curvas), 5 formatos de rosto, 5 tipos de olhos, detalhes (sardas, pinta, barba, bigode…), 20 cortes de cabelo (incluindo social e degradê), 16 cores de cabelo, 15 partes de cima (incluindo camisa de flanela, macacão de trabalho e avental de roça), 7 de baixo, 6 calçados (com bota de cano alto), acessórios de cabeça (chapéu de vaqueiro, chapéu de palha, lenço…), rosto, pescoço e costas (cesto de colheita…), 9 estampas (com chita) e 6 materiais (algodão orgânico, jeans reciclado, PET reciclado, cânhamo, retalhos, tecido tech).
- Botões: Aleatório, Restaurar (com Desfazer), Salvar e Confirmar → "Este é você?" com Voltar e editar ou Começar.
- Tudo fica salvo no aparelho (localStorage). O rascunho também, caso a página feche no meio.
- A aparência é a do sprite usado no jogo. Dá para trocar de visual no Brechó Circular, no provador (o espelho reflete o personagem) ou pelo menu de pausa.

## Controles

| Ação | Celular | Computador |
|---|---|---|
| Andar | arrastar no cenário (controle aparece sob o dedo) ou tocar num lugar | WASD ou setas |
| Interagir | botão amarelo, ou tocar direto no objeto | E, Espaço ou Enter |
| Missões | botão de lista | J |
| Pausa | botão de pausa | Esc ou P |
| Tela cheia | botão de tela cheia | F |

Nas Opções: sensibilidade do controle, tamanho dos botões, botão de ação à direita ou à esquerda, qualidade gráfica (automática por padrão), vibração, volumes e contador de FPS.

## Tela cheia

O botão pede tela cheia ao navegador **sem travar a orientação**: em pé continua em pé. O jogo se reorganiza ao entrar, sair ou girar o aparelho. Onde a página não pode ocupar a tela toda (Safari do iPhone), o botão liga um modo ampliado e explica como adicionar o Verdejar à Tela de Início, onde ele abre como aplicativo, sem barras.

## Rodar

Usa módulos JavaScript, então precisa de um servidor simples:

```bash
cd verdejar
python3 -m http.server 8790
```

Abra `http://127.0.0.1:8790/`. Para publicar, qualquer hospedagem estática serve (GitHub Pages, Netlify…).

`ferramentas/galeria.html` mostra os sprites gerados (`?modo=cabelos&grade=1`, `?modo=cima&grade=1`, `?modo=estilos&grade=1`, `?modo=visuais&grade=1`, `?modo=corpos&grade=1`).

## Organização

```
index.html           telas e camadas da interface
css/estilo.css       interface mobile-first
src/main.js          início, telas, HUD, opções e laço
src/jogo.js          câmera, mundo, moradores, missões, desenho
src/mundo.js         mapa e arte do cenário (versões poluída e viva)
src/personagem.js    catálogo de aparência e gerador de sprites 24x32
src/editor.js        tela de personalização
src/triagem.js       minijogo de separar o lixo
src/entrada.js       teclado, joystick flutuante e toque
src/telacheia.js     tela cheia e alternativas
src/audio.js         música e efeitos sintetizados
sw.js, manifest      funciona offline e pode ser instalado
```

Toda a arte e todo o som são gerados por código: não há imagens nem áudios para baixar além do ícone e da fonte (Pixelify Sans).
