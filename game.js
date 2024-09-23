const readline = require('readline');
require('colors');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// maps each card rank to it's value
const cardValues = {'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 0,'8': 8, '9': 9, '10': 10, 'J': -1, 'Q': 12, 'K': 13};

const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// generates the standard 52 card deck 
function createDeck() {
    const deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

// shuffles the deck randomly using Fisher-Yates algorithm
function shuffleTheDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// gets the players names
function promptForName(playerNumber, callback) {
    function askName() {
      rl.question(`Enter name for Player ${playerNumber}: `, (name) => {
        if (name.trim() === '') {
          console.log("Name cannot be empty. Please enter a valid name.");
          askName(); // ask the user to enter a name again
        } else {
          callback({ name: name.trim(), hand: [] });
        }
      });
    }
    
    askName(); 
  }
  
function getPlayerNames(callback) {
    const players = [];
    
    promptForName(1, (player1) => {
      players.push(player1);
      
      promptForName(2, (player2) => {
        players.push(player2);
        callback(players);
      });
    });
  }

// deals the card giving each player 4 face down cards
function dealCards(deck, players) {
    players.forEach(player => {
        for (let i = 0; i < 4; i++) {
            player.hand.push({card: deck.pop(),faceUp: false});
        }
    });
}

// displays the current board of the game
function displayBoard(players, discardPile) {
    console.log("\n---- Current Board ----".yellow.bold);
    players.forEach(player => {
        console.log(`\n${player.name}'s Hand:`);
        player.hand.forEach((card, index) => {
            const cardDisplay = card.faceUp ? `${card.rank} ${card.suit}`.green : 'Face Down'.red;
            process.stdout.write(`Card ${index + 1}: ${cardDisplay}  `);
        });
    });
    const topDiscard = discardPile[discardPile.length - 1];
    const discardDisplay = topDiscard ? `${topDiscard.rank} ${topDiscard.suit}`.yellow : 'Empty'.red;
    console.log('\n');
    console.log(`Discard Pile: ${discardDisplay}`);
    console.log("-----------------------\n".yellow.bold);
}

// Reshuffles the discard pile into the deck when the deck is empty
function reshuffleDeck(deck, discardPile) {
    if (deck.length === 0) {
        if (discardPile.length <= 1) {
            console.log("No more cards to draw.".red);
            return;
        }
        const topDiscard = discardPile.pop();
        deck.push(...discardPile);
        discardPile.length = 0; // Clear discard pile
        discardPile.push(topDiscard); // Keep the top discard
        shuffleTheDeck(deck); // Shuffle the deck after reshuffling
        console.log("Reshuffled the discard pile into the deck.".green);
    }
}

// asks the user to choose an action and handles it accordingly
function promptAction(player, deck, discardPile, callback) {
    console.log(`${player.name}'s Turn`.cyan.bold);
    rl.question(`Choose an action:\n1. Draw from Deck\n2. Take from Discard Pile\nEnter 1 or 2: `, (choice) => {
        if (choice === '1') {
            if (deck.length === 0) {
                console.log("Deck is empty! Cannot draw from deck.".red);
                callback();
                return;
            }
            const drawnCard = deck.pop();
            console.log(`\nYou drew: ${drawnCard.rank}${drawnCard.suit}`.blue);
            handleDrawnCard(player, drawnCard, deck, discardPile, callback);
        } else if (choice === '2') {
            if (discardPile.length === 0) {
                console.log("Discard pile is empty! Cannot take from discard.".red);
                callback();
                return;
            }
            const drawnCard = discardPile.pop();
            console.log(`\nYou took from discard pile: ${drawnCard.rank}${drawnCard.suit}`.blue);
            handleDrawnCard(player, drawnCard, deck, discardPile, callback, true);
        } else {
            console.log("Invalid choice. Please enter 1 or 2.".red);
            promptAction(player, deck, discardPile, callback);
        }
    });
}

// handles the option choosed by the player
function handleDrawnCard(player, drawnCard, deck, discardPile, callback, isFromDiscard = false) {
    if (isFromDiscard) {
        replaceCard(player, drawnCard, discardPile, callback);
        return;
    }

    rl.question(`Choose an option:\n1. Replace a facedown card\n2. Discard the drawn card\nEnter 1 or 2: `, (option) => {
        switch (option) {
            case '1':
                replaceCard(player, drawnCard, discardPile, callback);
                break;
            case '2':
                discardPile.push(drawnCard);
                console.log(`Discarded: ${drawnCard.rank} ${drawnCard.suit}`.magenta);
                callback();
                break;
            default:
                console.log("Invalid option. Please enter 1 or 2.".red);
                handleDrawnCard(player, drawnCard, deck, discardPile, callback, isFromDiscard);
                break;
        }
    });
}

// replaces the card choosen by the playes
function replaceCard(player, drawnCard, discardPile, callback) {
    displayBoard([player], discardPile);
    rl.question(`Select a facedown card to replace (1-4): `, (index) => {
        const cardIndex = parseInt(index) - 1;
        if (isNaN(cardIndex) || cardIndex < 0 || cardIndex > 3) {
            console.log("Invalid card number. Please enter a number between 1 and 4.".red);
            replaceCard(player, drawnCard, discardPile, callback);
            return;
        }
        const selectedCard = player.hand[cardIndex];
        if (selectedCard.faceUp) {
            console.log("Selected card is already face up. Choose a different card.".red);
            replaceCard(player, drawnCard, discardPile, callback);
            return;
        }

        discardPile.push(selectedCard.card); 
        selectedCard.faceUp = true; 
        player.hand[cardIndex] = { ...drawnCard, faceUp: true }; 

        console.log(`Replaced Card ${index + 1} with ${drawnCard.rank} ${drawnCard.suit}`.magenta);
        callback();
    });
}

// checks if the game ended if a player has all cards face up
function checkGameEnd(players) {
    return players.some(player => player.hand.every(card => card.faceUp));
}

// calculates the score recursively based on the cards values
function calculateScore(hand, index = 0, total = 0) {
    if (index >= hand.length) {
        return total;
    }
    const card = hand[index];
    return calculateScore(hand, index + 1, total + cardValues[card.rank]);
}

// adjusts the score so that a pair of cards of any kind that is not 7 or jack, is  = 0
function adjustForPairs(hand) {
    const rankCounts = {};
    hand.forEach(card => {
        if (card.rank !== '7' && card.rank !== 'J') {
            rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
        }
    });
    let adjustment = 0;
    for (let rank in rankCounts) {
        if (rankCounts[rank] > 1) {
            adjustment += cardValues[rank] * rankCounts[rank];
        }
    }
    return adjustment;
}

// calculates the final score
function calculateFinalScores(players) {
    const scores = {};
    players.forEach(player => {
        let score = calculateScore(player.hand);
        score -= adjustForPairs(player.hand);
        scores[player.name] = score;
    });
    return scores;
}

// determines the winner by checking which player has the lower score 
function determineWinner(scores) {
    const playerNames = Object.keys(scores);
    if (scores[playerNames[0]] < scores[playerNames[1]]) {
        console.log(`\n ${playerNames[0]} wins with ${scores[playerNames[0]]} points! `.green.bold);
    } else if (scores[playerNames[1]] < scores[playerNames[0]]) {
        console.log(`\n ${playerNames[1]} wins with ${scores[playerNames[1]]} points! `.green.bold);
    } else {
        console.log(`\nIt's a tie! Both players have ${scores[playerNames[0]]} points.`.yellow.bold);
    }
}


// starts the game 
function startGame() {
    let deck = createDeck();
    shuffleTheDeck(deck);

    const discardPile = [deck.pop()];

    getPlayerNames((players) => {
        dealCards(deck, players);

        let currentPlayerIndex = Math.floor(Math.random() * 2);
        console.log(`\n${players[currentPlayerIndex].name} will start first.`.cyan.bold);

        gameLoop(players, deck, discardPile, currentPlayerIndex, () => {
            players.forEach(player => {
                player.hand.forEach(card => {
                    card.faceUp = true;
                });
            });

            displayBoard(players, discardPile);

            const finalScores = calculateFinalScores(players);
            console.log("\n---- Final Scores ----".magenta.bold);
            for (let player in finalScores) {
                console.log(`${player}: ${finalScores[player]} points`);
            }

            determineWinner(finalScores);

            rl.question('\nDo you want to play again? (yes/no): ', (answer) => {
                if (answer.trim().toLowerCase() === 'yes' || answer.trim().toLowerCase() === 'y') {
                    startGame();
                } else {
                    console.log("Thanks for playing!".blue);
                    rl.close();
                }
            });
        });
    });
}

function gameLoop(players, deck, discardPile, currentPlayerIndex, onEnd) {
    displayBoard(players, discardPile);

    const currentPlayer = players[currentPlayerIndex];

    promptAction(currentPlayer, deck, discardPile, () => {
        if (checkGameEnd(players)) {
            onEnd();
        } else {
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            gameLoop(players, deck, discardPile, nextPlayerIndex, onEnd);
        }
    });
}

startGame();